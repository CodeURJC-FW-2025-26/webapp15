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


// --- API ROUTES ---

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


// --- VISTAS PRINCIPALES ---

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


// --- CREAR VIAJE (NEW) ---

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

// Ruta POST /new corregida para devolver siempre JSON
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
        const existingTrip = await db.getTripByName(formData.name);
        if (existingTrip) {
            errors.push('There is a trip with the same name.');
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
        // Return JSON error
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
            
            // Return JSON success
            res.json({ 
                success: true, 
                redirectUrl: `/trip/${result.insertedId}` 
            });

        } catch (error) {
            console.error("Fail saving the trip:", error);
            res.status(500).json({ success: false, errors: ['Internal Server Error saving trip'] });
        }
    }
});


// --- DETALLES Y BORRADO ---

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
        console.error("Fail loading the deail page:", error);
        res.status(500).render('confirmation_page', {
            pageTitle: 'Error',
            message: 'Fail loading the deail page.',
            ifError: true
        });
    }
});

router.post('/delete/trip/:id', async (req, res) => {
    try {
        const tripId = req.params.id;
        const trip = await db.getTrip(tripId); 

        if (trip && trip.image && trip.image !== 'default.jpg') {
            const imagePath = path.join(uploadDir, trip.image);
            try {
                await fs.unlink(imagePath);
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


// --- EDITAR VIAJE (EDIT) ---

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

// Ruta POST /edit corregida para manejar borrado de imagen y respuesta JSON
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
    if (formData.name) {
        const existingTrip = await db.getTripByName(formData.name);
        if (existingTrip && existingTrip._id.toString() !== tripId ) {
            errors.push('There is a trip with the same name.');
        }
    }
    if (formData.name && formData.name.trim().length < 3) {
        errors.push('The name must contain at least 3 valid characters.');
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
            let imageName = oldTrip.image;

            const isReplacing = !!req.file;
            const isRemoving = formData.remove_image === 'true';

            // Borrar imagen antigua del disco si se reemplaza o se elimina
            if ((isReplacing || isRemoving) && oldTrip.image && oldTrip.image !== 'default.jpg') {
                const oldImagePath = path.join(uploadDir, oldTrip.image);
                try {
                    await fs.unlink(oldImagePath);
                } catch (err) {
                    console.error("Warning: Could not delete old image file:", err);
                }
            }

            // Asignar nuevo nombre
            if (isReplacing) {
                imageName = req.file.filename;
            } else if (isRemoving) {
                imageName = 'default.jpg';
            } 
            // Si no, se mantiene la imagen original

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
            console.error("Error updating trip:", error);
            res.status(500).json({ success: false, errors: ['Internal error updating trip'] });
        }
    }
});


// --- ACTIVIDADES ---

router.post('/add-activity/:tripId', async (req, res) => {
        const tripId = req.params.tripId;
        const formData = req.body;

        // Nota: Esta ruta es POST standard (no AJAX en tu código original), 
        // por lo que renderiza confirmation_page
        
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
                message : `Activity added.`,
                returnLink: `/trip/${tripId}`
            });
        } catch(e) { res.status(500).send("Error"); }
});

router.post('/delete/activity/:id', async (req, res) => {
    try {
        const activityId = req.params.id;
        const activity = await db.getActivity(activityId);
        await db.deleteActivity(activityId);
        res.render('confirmation_page', { pageTitle: 'Deleted', message: 'Deleted', returnLink: `/trip/${activity.tripId}`});
    } catch (e) { res.status(500).send("Error deleting activity"); }
});

router.get('/edit/activity/:id', async (req, res) => {
    try {
        const activity = await db.getActivity(req.params.id);
        activity.isGuideYes = (activity.guide_travel === 'YES');
        activity.isGuideNo = (activity.guide_travel === 'NO');
        res.render('edit_activity', { pageTitle: 'Edit', formData: activity });
    } catch (e) { res.status(500).send("Error loading activity"); }
});

router.post('/edit/activity/:id', async (req, res) => {
     try {
        const activityId = req.params.id;
        const formData = req.body;
        const activity = await db.getActivity(activityId);
        await db.updateActivity(activityId, { name: formData.name, price: parseFloat(formData.price) });
        res.render('confirmation_page', { pageTitle: 'Updated', message: 'Updated', returnLink: `/trip/${activity.tripId}`});
     } catch (e) { res.status(500).send("Error updating activity"); }
});


// --- IMAGENES ---

router.get('/trip/:id/image', async (req, res) => {
    try {
        const trip = await db.getTrip(req.params.id);
        if (trip && trip.image) {
            const imagePath = path.join(uploadDir, trip.image);
            res.sendFile(imagePath, (err) => {
                if (err) res.status(404).send('Image not found on disk');
            });
        } else {
            res.status(404).send('Image not found on the database');
        }
    } catch (error) {
        res.status(500).send('Internal server error');
    }
});

export default router;