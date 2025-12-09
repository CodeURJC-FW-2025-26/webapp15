import express from 'express';
import * as db from './database.js';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs/promises'; 

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

export const router = express.Router();

//API Routes
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


// infinite scroll
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



router.get('/', async (req, res) => {
    try {
        // first paint of six elements
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
        
        // filtering of the buttons
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


router.post('/new', upload.single('image'), async (req, res) => {
   
    const formData = req.body;
    const errors = [];

    if (!formData.name) errors.push('The name (Main city) is obligatory.');
    if (!formData.description) errors.push('The description is obligatory.');
    if (!formData.duration) errors.push('The duration is obligatory.');
    if (!formData.price) errors.push('The price is obligatory.');
    if (!formData.t_trip) errors.push('The type of trip is obligatory');
    if (!formData.max_travellers) errors.push('The number of people is obligatory.');
    
    if (formData.name && !/^[A-Z]/.test(formData.name)) {
        errors.push('The name may start whith capital leters.');
    }
    if (formData.name && formData.name.trim().length < 3) {
        errors.push('The name must contain at least 3 valid characters.');
    }
    
    if (formData.name) {
        try {
            const existingTrip = await db.getTripByName(formData.name);
            if (existingTrip) {
                console.log(`⚠️ VALIDACIÓN FALLIDA: Ya existe un viaje llamado "${formData.name}"`);
                errors.push('There is a trip with the same name.');
            }
        } catch (dbError) {
            console.error("🔴 Error consultando la base de datos:", dbError);
            errors.push('Database error checking name.');
        }
    }

    if (formData.description && (formData.description.length < 10 || formData.description.length > 200)) {
        errors.push('The description might be between 10 and 200 characters.');
    }

    if (formData.duration && (parseInt(formData.duration, 10) < 1 || parseInt(formData.duration, 10) > 100)) {
        errors.push('The duration might be between 1 y 100 days.');
    }
    
    if (formData.price && parseInt(formData.price, 10) < 0) {
        errors.push('The price might be positive.');
    }
    
    if (formData.max_travellers && parseInt(formData.max_travellers, 10) < 1) {
        errors.push('There may at least 1 person.');
    }

    if (errors.length > 0) {
        console.log("❌ SE ENCONTRARON ERRORES DE VALIDACIÓN:");
        console.log(errors);
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

            console.log("💾 Guardando en base de datos el objeto:", newTrip);
            const result = await db.addTrip(newTrip);
            console.log("✅ VIAJE CREADO CON ÉXITO. ID:", result.insertedId);
            
            res.json({ 
                success: true, 
                redirectUrl: `/trip/${result.insertedId}` 
            });

        } catch (error) {
            console.error("🔴 ERROR CRÍTICO AL GUARDAR (CATCH):", error);
            res.status(500).json({ success: false, errors: ['Internal Server Error saving trip: ' + error.message] });
        }
    }
});


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
            message: 'Fail loading the deail page.',
            ifError: true
        });
    }
});


// delete trip 
router.post('/delete/trip/:id', async (req, res) => {
    try {
        const tripId = req.params.id;

        const trip = await db.getTrip(tripId); 

        if (trip && trip.image && trip.image !== 'default.jpg') {
            const imagePath = path.join(uploadDir, trip.image);
            
            try {
                await fs.unlink(imagePath);
                console.log("Image deleted: ", imagePath);
            } catch (err) {
                console.error("Error deleting image file:", err);
            }
        }
        
        await db.deleteTrip(tripId); 

        
        res.render('confirmation_page', { 
            pageTitle: 'Trip Deleted',
            message : `The trip ${trip.name} has been deleted successfully.`,
            returnLink: '/',
        });

    } catch (error) {
        console.error("Fail deleting the trip:", error);
        res.status(500).render('confirmation_page', {
            pageTitle: 'Error',
            message: 'Internal error loading the trip.',
            ifError: true
        });
    }
});

// Edit trip routes 
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
        console.error("Error loading edit trip page:", error);
        res.status(500).render('confirmation_page', {
            pageTitle: 'Error',
            message: 'Internal error loading edit trip page.',
            ifError: true
        });
    }
});
router.post('/edit/trip/:id', upload.single('image'), async (req, res) => {
    const tripId = req.params.id;

    const formData = req.body;
    const errors = [];

    if (!formData.name) errors.push('The name (Main city) is required.');
    if (!formData.description) errors.push('The description is required.');
    if (!formData.duration) errors.push('The duration is required.');
    if (!formData.price) errors.push('The price is required.');
    if (!formData.t_trip) errors.push('The type of trip is required.');
    if (!formData.max_travellers) errors.push('The amount of travellers is required.');

    if (formData.name && !/^[A-Z]/.test(formData.name)) {
        errors.push('The name may start with capital letters');
    }
    if (formData.name && formData.name.trim().length < 3) {
        errors.push('The name must contain at least 3 valid characters.');
    }

    if (formData.name) {
        try {
            const existingTrip = await db.getTripByName(formData.name);
            if (existingTrip && existingTrip._id.toString() !== tripId) {
                console.log(`⚠️ Conflicto: Ya existe otro viaje llamado "${formData.name}"`);
                errors.push('There is a trip with the same name.');
            }
        } catch (dbError) {
            console.error("🔴 Error DB al comprobar nombre:", dbError);
        }
    }

    if (formData.description && (formData.description.length < 10 || formData.description.length > 200)) {
        errors.push('The description might be between 10 and 200 characters.');
    }
    if (formData.duration && (parseInt(formData.duration, 10) < 1 || parseInt(formData.duration, 10) > 100)) {
        errors.push('The duration may be between 1 and 100 days.');
    }
    if (formData.price && parseInt(formData.price, 10) < 0) {
        errors.push('The price cant be negative.');
    }
    if (formData.max_travellers && parseInt(formData.max_travellers, 10) < 1) {
        errors.push('It may be at least 1 person.');
    }

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
                } catch (err) {
                }
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
            console.log("✅ VIAJE ACTUALIZADO CORRECTAMENTE");

            res.json({ 
                success: true, 
                redirectUrl: `/trip/${tripId}` 
            });

        } catch (error) {
            console.error("🔴 Error crítico editando viaje:", error);
            res.status(500).json({ success: false, errors: ['Internal error updating trip'] });
        }
    }
});

// add activity
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
            console.error("Error checking existing activity:", error);
        }

        if (errors.length > 0) {
            try {
                const viaje = await db.getTrip(tripId);
                const actividades = await db.getActivitiesByTripId(tripId);

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
        console.error("Fail at adding activity:", error);
        res.status(500).render('confirmation_page', {
            pageTitle: 'Error',
            message: 'Fail at adding activity.',
            ifError: true
        });
    }
});

// eliminate activity
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
        console.error("Error deleting activity:", error);
        res.status(500).render('confirmation_page', {
            pageTitle: 'Error',
            message: 'Internal error deleting activity.',
            ifError: true
        });
    }
});

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
router.post('/edit/activity/:id', async (req, res) => {
    const activityId = req.params.id;
    const formData = req.body;
    const errors = [];

    if (!formData.name || formData.name.trim() === '') {
        errors.push('The name of the activity is required.');
    }
    if (!formData.duration) {
        errors.push('The duration of the activity is required.');
    }
    if (!formData.price) {
        errors.push('The price of the activity is required.');
    }
    if (!formData.description || formData.description.trim() === '') {
        errors.push('The description of the activity is required.');
    }

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
            return res.status(500).render('confirmation_page', { pageTitle: 'Error', message: 'Internal error loading activity edit page.', ifError: true } );
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
                    console.error("Error sending image file:", err.message);
                    res.status(404).send('Image not found on disk');
                }
            });
        } else {
            res.status(404).send('Image not found on the database');
        }
    } catch (error) {
        console.error("Error retrieving trip image:", error);
        res.status(500).send('Internal server error');
    }
});

export default router;