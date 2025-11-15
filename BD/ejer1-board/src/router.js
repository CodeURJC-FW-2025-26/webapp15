import express from 'express';
import * as db from './database.js';

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
        res.status(500).send('Error interno del servidor');
    }
});

router.get('/new', (req, res) => {
    res.render('new', {
        pageTitle: 'Add New Trip'
    });
});

// --- RUTA DE DETALLE AÑADIDA ---
router.get('/trip/:id', async (req, res) => {
    try {
        const tripId = req.params.id;
        const viaje = await db.getTrip(tripId);
        const actividades = await db.getActivitiesByTripId(tripId);

        if (!viaje) {
            res.status(404).send('Viaje no encontrado');
            return;
        }

        res.render('detail', {
            pageTitle: viaje.name,
            trip: viaje,
            activities: actividades
        });

    } catch (error) {
        console.error("Error al cargar la página de detalle:", error);
        res.status(500).send('Error interno del servidor');
    }
});

export default router;
