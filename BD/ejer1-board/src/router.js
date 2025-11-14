import express from 'express';
import * as db from './database.js';

const router = express.Router();

// RUTA PRINCIPAL (GET /)
// Esta ruta ahora también calcula la paginación para la carga inicial
router.get('/', async (req, res) => {
    
    try {
        const query = {};
        const page = 1;
        const limit = 6;
        const skip = 0;

        // 1. Obtener los primeros 6 viajes
        const trips = await db.getTrips(query, skip, limit);
        // 2. Obtener el conteo total
        const totalItems = await db.countTrips(query);
        const totalPages = Math.ceil(totalItems / limit);

        // 3. Renderizar 'main' pasándole los viajes Y los datos de paginación
        res.render('main', { 
            pageTitle: 'Home',
            trips: trips,
            // ¡NUEVO! Pasamos estos datos para el script.js
            totalPages: totalPages,
            currentPage: page
        }); 

    } catch (error) {
        console.error("Error fetching trips for render:", error);
        res.status(500).send('Error loading page');
    }
});

// RUTA DE LA API (GET /api/trips)
// Esta ruta es llamada por el 'script.js' para filtros y paginación
router.get('/api/trips', async (req, res) => {
    
    // 1. Obtener y sanitizar los parámetros de la URL
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 6; 
    const search = req.query.search || '';
    const category = req.query.category || '';
    const skip = (page - 1) * limit;

    // 2. Construir el objeto de consulta para MongoDB
    let query = {};
    if (search) {
        query.Main_city = { $regex: search, $options: 'i' }; 
    }
    if (category) {
        query.t_trip = category; 
    }
    
    try {
        // 3. Obtener los resultados paginados y el conteo total
        const trips = await db.getTrips(query, skip, limit);
        const totalItems = await db.countTrips(query);
        const totalPages = Math.ceil(totalItems / limit);

        // 4. Responder al frontend con JSON
        res.json({
            trips: trips,
            totalPages: totalPages,
            currentPage: page
        });

    } catch (error) {
        console.error("Error fetching trips from MongoDB:", error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

router.get('/new', (req, res) => {
    
    res.render('new_travel', {
        pageTitle: 'Add New Trip'
    });
});
export default router;