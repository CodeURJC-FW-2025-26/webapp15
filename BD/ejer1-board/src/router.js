import express from 'express';
import * as db from './database.js';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs'; 

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
        const totalItems = await db.countTrips(filtro);
        const totalPages = Math.ceil(totalItems / limit);

        let pages = []; 
        for (let i = 1; i <= totalPages; i++) {
            pages.push({
                number: i,
                isCurrent: i === page
            });
        }
        
        const hasPrev = page > 1;
        const prevPage = page - 1;
        const hasNext = page < totalPages;
        const nextPage = page + 1;

        const isCategoryActive = {
            Adventure: category === 'Adventure',
            Culture: category === 'Culture',
            Relax: category === 'Relax'
        };

        const pagination = {
            pages: pages,
            hasPrev: hasPrev,
            prevPage: prevPage,
            hasNext: hasNext,
            nextPage: nextPage,
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
        console.error("Error al cargar la página principal:", error);
        res.status(500).render('error_page', {
            pageTitle: 'Error',
            errorMsg: 'Error interno al cargar la página principal.'
        });
    }
});


router.get('/new', (req, res) => {
    res.render('new_travel', {
        pageTitle: 'Add New Trip',
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

    
    if (!formData.name) errors.push('El nombre (Main city) es obligatorio.');
    if (!formData.description) errors.push('La descripción es obligatoria.');
    if (!formData.duration) errors.push('La duración es obligatoria.');
    if (!formData.price) errors.push('El precio es obligatorio.');
    if (!formData.t_trip) errors.push('El tipo de viaje es obligatorio.');
    if (!formData.max_travellers) errors.push('El número de personas es obligatorio.');
    
    if (formData.name && !/^[A-Z]/.test(formData.name)) {
        errors.push('El nombre debe comenzar con una letra mayúscula.');
    }
    
    
    if (formData.name) {
        const existingTrip = await db.getTripByName(formData.name);
        if (existingTrip) {
            errors.push('Ya existe un viaje con ese nombre.');
        }
    }

    if (formData.description && (formData.description.length < 10 || formData.description.length > 200)) {
        errors.push('La descripción debe tener entre 10 y 200 caracteres.');
    }

    if (formData.duration && (parseInt(formData.duration, 10) < 1 || parseInt(formData.duration, 10) > 100)) {
        errors.push('La duración debe estar entre 1 y 100 días.');
    }
    if (formData.price && parseInt(formData.price, 10) < 0) {
        errors.push('El precio no puede ser negativo.');
    }
    if (formData.max_travellers && parseInt(formData.max_travellers, 10) < 1) {
        errors.push('Debe viajar al menos 1 persona.');
    }

    
    if (errors.length > 0) {
        
        const t_trip_select = {
            family: formData.t_trip === 'family',
            leisure: formData.t_trip === 'leisure',
            cultural: formData.t_trip === 'cultural'
        };

        res.render('new_travel', { 
            pageTitle: 'Add New Trip',
            errors: errors,
            formData: {
                name: formData.name || '',
                description: formData.description || '',
                duration: formData.duration || '',
                price: formData.price || '',
                t_trip: t_trip_select, 
                
                flight: formData.flight === 'on',
                national: formData.national === 'on',
                max_travellers: formData.max_travellers || ''
            }
        });
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
            
            res.render('created_trip', { 
                pageTitle: 'Trip Created!',
                name: newTrip.name,
                newId: result.insertedId
            });

        } catch (error) {
            console.error("Error al guardar el viaje:", error);
            res.status(500).render('error_page', {
                pageTitle: 'Error',
                errorMsg: 'Error interno al guardar el viaje.'
            });
        }
    }
});


router.get('/trip/:id', async (req, res) => {
    try {
        const tripId = req.params.id;
        const viaje = await db.getTrip(tripId);
        const actividades = await db.getActivitiesByTripId(tripId);

        if (!viaje) {
            res.status(404).send('Viaje no encontrado');
            return;
        }
        res.render('detalle', {
            pageTitle: viaje.name,
            trip: viaje,
            activities: actividades
        });
    } catch (error) {
        console.error("Error al cargar la página de detalle:", error);
        res.status(500).render('error_page', {
            pageTitle: 'Error',
            errorMsg: 'Error interno al cargar la página de detalle.'
        });
    }
});



router.post('/delete/trip/:id', async (req, res) => {
    try {
        const tripId = req.params.id;

        const trip = await db.getTrip(tripId); 

        if (trip && trip.image && trip.image !== 'default.jpg') {
            const imagePath = path.join(uploadDir, trip.image);
            
            fs.unlink(imagePath, (err) => {
                if (err) {
                    console.error("No se pudo borrar la imagen del disco:", err);
                } else {
                    console.log("Imagen borrada exitosamente:", imagePath);
                }
            });
        }
        
        await db.deleteTrip(tripId); 

        res.render('deleted_trip', { 
            pageTitle: 'Trip Deleted',
            tripName: trip.name 
        });

    } catch (error) {
        console.error("Error al borrar el viaje:", error);
        res.status(500).render('error_page', {
             pageTitle: 'Error',
             errorMsg: 'Error interno al borrar el viaje.'
        });
    }
});


export default router;