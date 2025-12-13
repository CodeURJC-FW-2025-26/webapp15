import express from 'express';
import * as db from './database.js';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs/promises'; 
import e from 'express';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const uploadDir = path.join(__dirname, '..', 'uploads');

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + '_' + file.originalname);
    }
});

const upload = multer({ storage: storage });

async function validateTripForm(formData, tripToExclude = null) {
    const errors = [];
    // Validation logic here...
    if (!formData.name) errors.push('Name is required.');
    if (!formData.description) errors.push('Description is required.');
    if (!formData.duration) errors.push('Duration is required.');
    if (!formData.price) errors.push('Price is required.');
    if (!formData.t_trip) errors.push('Type of trip is required.');
    if (!formData.max_travellers) errors.push('Max travellers is required.');

    if (formData.name && !/^[A-Z]/.test(formData.name)) {
        errors.push('The name must start with capital letters.');
    }
    if (formData.name && formData.name.trim().length < 3) {
        errors.push('The name must contain at least 3 valid characters.');
    }
    if (formData.description && (formData.description.length < 10 || formData.description.length > 200)) {
        errors.push('The description must be between 10 and 200 characters.');
    }
    if (formData.duration && (parseInt(formData.duration, 10) < 1 || parseInt(formData.duration, 10) > 100)) {
        errors.push('The duration must be between 1 and 100 days.');
    }
    if (formData.price && parseInt(formData.price, 10) < 0) {
        errors.push('The price must be positive.');
    }
    if (formData.max_travellers && parseInt(formData.max_travellers, 10) < 1) {
        errors.push('There must be at least 1 person.');
    }

    if (formData.name) {
        try {
            const existingTrip = await db.getTripByName(formData.name);
            if (existingTrip) {
                if (!tripToExclude || existingTrip._id.toString() !== tripToExclude) {
                    errors.push('There is already a trip with this name.');
                }
            }
        } catch (dbError) {
            errors.push('Database error checking name.');
        }
    }
    return errors;
}
async function deleteImageFile(imageName) {
    if (imageName && imageName !== 'default.jpg') {
        const imagePath = path.join(uploadDir, imageName);
        try {
            await fs.unlink(imagePath);
        } catch (err) {
            console.error("Error deleting image file:", err);
        }   
    }
}

export const router = express.Router();

// --- API Routes ---
router.get('/api/check-trip-name', async (req, res) => {
    try {
        const { name, excludeId } = req.query;
        if (!name) return res.json({ exists: false });

        const trip = await db.getTripByName(name);
        
        if (trip) {
            if (excludeId && trip._id.toString() === excludeId) {
                return res.json({ exists: false });
            }
            return res.json({ exists: true });
        }
        
        res.json({ exists: false });
    } catch (error) {
        res.status(500).json({ error: 'Server error checking name' });
    }
});

router.get('/api/trips', async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = 6; 
        const skip = (page - 1) * limit;

        const searchTerm = req.query.searchQuery || '';
        const category = req.query.category || '';

        let filtro = {};
        if (searchTerm) {
            filtro.name = { $regex: new RegExp(searchTerm, 'i') };
        }
        if (category) {
            filtro.t_trip = category; 
        }

        const viajes = await db.getTrips(filtro, skip, limit);
        const totalItems = await db.countTrips(filtro);
        const totalPages = Math.ceil(totalItems / limit);
        
        res.json({
            trips: viajes,
            hasMore: page < totalPages
        });

    } catch (error) {
        console.error("Error loading API trips:", error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// --- Page Routes ---

// Main Page
router.get('/', async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = 6;
        const skip = (page - 1) * limit;

        const searchTerm = req.query.searchQuery || '';
        const category = req.query.category || '';

        let filtro = {};
        if (searchTerm) {
            filtro.name = { $regex: new RegExp(searchTerm, 'i') };
        }
        if (category) {
            filtro.t_trip = category; 
        }
        
        const viajes = await db.getTrips(filtro, skip, limit);
        
        const isCategoryActive = {
            Adventure: category === 'Adventure',
            Culture: category === 'Culture',
            Relax: category === 'Relax'
        };

        const pagination = {
            isCategoryActive: isCategoryActive
        };

        res.render('main', {
            pageTitle: 'Home',
            trips: viajes,
            pagination: pagination,
            searchTerm: searchTerm,
            category: category
        });

    } catch (error) {
        console.error("Fail in loading the main page:", error);
        res.status(500).render('confirmation_page', {
            pageTitle: 'Error',
            message: 'Internal error loading the main page.',
            ifError: true
        });
    }
});

// New Trip Form
router.get('/new', (req, res) => {
    res.render('new_travel', {
        pageTitle: 'Add New Trip',
        isEditing: false,
        formData: {
            name: '', description: '', duration: '', price: '', max_travellers: '',
            flight: false, national: false
        },
        errors: [] 
    });
});

// Create New Trip
router.post('/new', upload.single('image'), async (req, res) => {
    const formData = req.body;
    const errors = await validateTripForm(formData);
    if (errors.length > 0) {
        return res.status(400).json({ success: false, errors: errors });
    } else {
        try {
            const imageName = req.file ? req.file.filename : 'default.jpg';

            const newTrip = {
                name: formData.name,
                description: formData.description,
                duration: parseInt(formData.duration, 10),
                image: imageName,
                price: parseFloat(formData.price),
                t_trip: formData.t_trip,
                flight: formData.flight === 'on',
                national: formData.national === 'on',
                max_travellers: parseInt(formData.max_travellers, 10)
            };

            const result = await db.addTrip(newTrip);
            
            res.json({ 
                success: true, 
                redirectUrl: `/trip/${result.insertedId}` 
            });

        } catch (error) {
            console.error("Error saving trip:", error);
            res.status(500).json({ success: false, errors: ['Internal Server Error saving trip: ' + error.message] });
        }
    }
});

// Trip Details
router.get('/trip/:id', async (req, res) => {
    try {
        const tripId = req.params.id;
        const viaje = await db.getTrip(tripId);
        const actividades = await db.getActivitiesByTripId(tripId);

        if (!viaje) {
            res.status(404).send('Trip not found');
            return;
        }
        res.render('detalle', {
            pageTitle: viaje.name,
            trip: viaje,
            activities: actividades
        });
    } catch (error) {
        console.error("Fail loading the detail page:", error);
        res.status(500).render('confirmation_page', {
            pageTitle: 'Error',
            message: 'Fail loading the detail page.',
            ifError: true
        });
    }
});

router.delete('/delete/trip/:id', async (req, res) => {
    try {
        const tripId = req.params.id;
        const trip = await db.getTrip(tripId); 

       
        if (!trip) {
            return res.status(404).json({
                success: false,
                message: 'Trip not found.' 
            });
        }
        await deleteImageFile(trip.image);
        await db.deleteTrip(tripId); 

        res.json({ 
            success: true, 
            
            message: `The trip ${trip.name} has been deleted successfully.`
        });

    } catch (error) {
        console.error("Fail deleting the trip:", error);
        res.status(500).json({
            success: false,
         
            message: 'Internal error deleting the trip.'
        });
    }
});
// Edit Trip (GET)
router.get('/edit/trip/:id', async (req, res) => {
    try {
        const tripId = req.params.id;
        const viaje = await db.getTrip(tripId);

        if (!viaje) {
            res.status(404).send('Trip not found');
            return;
        }

        const t_trip_select = {
            culture : viaje.t_trip === 'Culture',
            adventure : viaje.t_trip === 'Adventure',
            relax : viaje.t_trip === 'Relax'
        };
        res.render('new_travel', {
            pageTitle: 'Edit Trip',
            isEditing: true,
            tripId: tripId,
            formData: viaje,
            t_trip: t_trip_select,
            errors: []
        });
    } catch (error) {
        res.status(500).render('confirmation_page', {
            pageTitle: 'Error',
            message: 'Internal error loading edit trip page.',
            ifError: true
        });
    }
});

// Edit Trip (POST)
router.post('/edit/trip/:id', upload.single('image'), async (req, res) => {
    const tripId = req.params.id;
    const formData = req.body;
    const errors = await validateTripForm(formData, tripId);
    if (errors.length > 0) {
        return res.status(400).json({ success: false, errors: errors });
    } else {
        try {
            const oldTrip = await db.getTrip(tripId);
            if (!oldTrip) {
                return res.status(404).json({ success: false, errors: ['Trip not found'] });
            }

            let imageName = oldTrip.image; 
            const isReplacing = !!req.file;
            const isRemoving = formData.remove_image === 'true';

            if ((isReplacing || isRemoving) && oldTrip.image && oldTrip.image !== 'default.jpg') {
                const oldImagePath = path.join(uploadDir, oldTrip.image);
                try {
                    await fs.unlink(oldImagePath);
                } catch (err) {}
            }

            if (isReplacing) {
                imageName = req.file.filename;
            } else if (isRemoving) {
                imageName = 'default.jpg';
            }

            const updatedTrip = {
                name: formData.name,
                description: formData.description,
                duration: parseInt(formData.duration, 10),
                image: imageName,
                price: parseFloat(formData.price),
                t_trip: formData.t_trip,
                flight: formData.flight === 'on',
                national: formData.national === 'on',
                max_travellers: parseInt(formData.max_travellers, 10)
            };

            await db.updateTrip(tripId, updatedTrip);
            
            res.json({ 
                success: true, 
                redirectUrl: `/trip/${tripId}` 
            });

        } catch (error) {
            res.status(500).json({ success: false, errors: ['Internal error updating trip'] });
        }
    }
});

// Add Activity
router.post('/add-activity/:tripId', async (req, res) => {
        const tripId = req.params.tripId;
        const formData = req.body;
        const errors = [];
        
        if (!formData.name || formData.name.trim() === '') {
            errors.push('The name of the activity is required.');
        }
        if (!formData.description || formData.description.trim() === '') {
            errors.push('The description of the activity is required.');
        }
        if (!formData.price) {
            errors.push('The price of the activity is required.');
        }
        if (!formData.duration) {
            errors.push('The duration of the activity is required.');
        }
        try {
            if (formData.name) {
                const existingActivity = await db.getActivityByName(formData.name);
                if (existingActivity) {
                    errors.push('An activity with that name already exists.');
                }
            }
        } catch (error) {
            errors.push('Error checking existing activity.');
        }

        if (errors.length > 0) {
            try {
                res.render('confirmation_page', {
                    pageTitle: 'Validation Errors',
                    message: errors.join('. '),
                    ifError: true
                });
                    return;
            } catch (error) {
                return res.status(500).render('confirmation_page', { pageTitle: 'Error', message: 'Internal error loading trip detail page.', ifError: true } );
            }
        }
        try {
        const newActivity = {
            tripId: tripId,
            name: formData.name,
            description: formData.description || '',
            duration: parseInt(formData.duration) || 0,
            price: parseFloat(formData.price),
            guide_travel: formData.guide_travel
        };

        await db.addActivity(newActivity);

        res.render('confirmation_page', {
            pageTitle: 'Activity Added!',
            message : `The activity "${newActivity.name}" has been added successfully.`,
            returnLink: `/trip/${tripId}`
        });

    } catch (error) {
        res.status(500).render('confirmation_page', {
            pageTitle: 'Error',
            message: 'Fail at adding activity.',
            ifError: true
        });
    }
});

// Delete Activity
router.post('/delete/activity/:id', async (req, res) => {
    try {
        const activityId = req.params.id;
        const activity = await db.getActivity(activityId);
        if (!activity) {
            return res.status(404).render('confirmation_page', { pageTitle: 'Error', message: 'Activity not found', ifError: true });
        }
        await db.deleteActivity(activityId);

        res.render('confirmation_page', {
            pageTitle: 'Activity Deleted',
            message : `The activity "${activity.name}" has been deleted successfully.`,
            returnLink: `/trip/${activity.tripId}`
        });
    } catch (error) {
        res.status(500).render('confirmation_page', {
            pageTitle: 'Error',
            message: 'Internal error deleting activity.',
            ifError: true
        });
    }
});

// Edit Activity (GET)
router.get('/edit/activity/:id', async (req, res) => {
    try {
        const activity = await db.getActivity(req.params.id);
        if (!activity) {
            return res.status(404).render('confirmation_page', { pageTitle: 'Error', message: 'Activity not found', ifError: true });
        }

        activity.isGuideYes = (activity.guide_travel === 'YES');
        activity.isGuideNo = (activity.guide_travel === 'NO');

        res.render('edit_activity', {
            pageTitle: `Edit Activity: ${activity.name}`,
            formData: activity
        });
    } catch (error) {
        res.status(500).render('confirmation_page', { pageTitle: 'Error', message: 'Internal error loading activity edit page.', ifError: true });
    }
});

// Edit Activity (POST)
router.post('/edit/activity/:id', async (req, res) => {
    const activityId = req.params.id;
    const formData = req.body;
    const errors = [];

    if (!formData.name || formData.name.trim() === '') errors.push('The name is required.');
    if (!formData.duration) errors.push('The duration is required.');
    if (!formData.price) errors.push('The price is required.');
    if (!formData.description || formData.description.trim() === '') errors.push('The description is required.');

    if (errors.length > 0) {
        try {
            const activity = await db.getActivity(activityId);
            activity.isGuideYes = (formData.guide_travel === 'YES');
            activity.isGuideNo = (formData.guide_travel === 'NO');
            const formWithErrors = { ...activity, ...formData };

            return res.render('edit_activity', {
                pageTitle: `Edit Activity: ${activity.name}`,
                formData: formWithErrors,
                errors: errors
            });
        } catch (error) {
            return res.status(500).render('confirmation_page', { pageTitle: 'Error', message: 'Internal error loading edit page.', ifError: true } );
        }
    }

    try {
        const updatedFields = {
            name: formData.name,
            description: formData.description,
            duration: parseInt(formData.duration) || 0,
            price: parseFloat(formData.price),
            guide_travel: formData.guide_travel
        };

        const activity = await db.getActivity(activityId);
        await db.updateActivity(activityId, updatedFields);

        res.render('confirmation_page', {
            pageTitle: 'Activity Updated!',
            message : `The activity "${updatedFields.name}" has been updated successfully.`,
            returnLink: `/trip/${activity.tripId}`
        });
    } catch (error) {
        res.status(500).render('confirmation_page', { pageTitle: 'Error', message: 'Internal error updating activity.', ifError: true } );
    }
});

router.get('/trip/:id/image', async (req, res) => {
    try {
        const trip = await db.getTrip(req.params.id);
        if (trip && trip.image) {
            const imagePath = path.join(uploadDir, trip.image);
            res.sendFile(imagePath, (err) => {
                if (err) {
                    res.status(404).send('Image not found on disk');
                }
            });
        } else {
            res.status(404).send('Image not found on database');
        }
    } catch (error) {
        res.status(500).send('Internal server error');
    }
});

export default router;