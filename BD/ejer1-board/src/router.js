import express from 'express';
import multer from 'multer';

import * as db from './database.js'; // Asegúrate de que las nuevas funciones se importen

const router = express.Router();
const upload = multer({ dest: db.UPLOADS_FOLDER });


// NUEVO ENDPOINT PARA LA PAGINACIÓN Y FILTRADO (CONSUMIDO POR script.js)

router.get('/api/trips', async (req, res) => {
    // 1. Obtener y sanitizar los parámetros de la URL
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 6; // Usamos 6 por defecto
    const search = req.query.search || '';
    const category = req.query.category || '';

    const skip = (page - 1) * limit;

    // 2. Construir el objeto de consulta para MongoDB
    let query = {};

    // Filtro de Búsqueda por Main_city
    if (search) {
        // La búsqueda no es sensible a mayúsculas/minúsculas y busca coincidencias parciales
        query.Main_city = { $regex: search, $options: 'i' }; 
    }

    // Filtro por Categoría (t_trip)
    if (category) {
        query.t_trip = category; 
    }
    
    try {
        // 3. Obtener los resultados paginados y el conteo total
        const trips = await db.getTrips(query, skip, limit);
        const totalItems = await db.countTrips(query);
        const totalPages = Math.ceil(totalItems / limit);

        // 4. Responder al frontend con los datos
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



// RUTA PRINCIPAL

// Esta ruta renderiza la vista principal (main.html, que carga script.js)
router.get('/', (req, res) => {
    // La página se llenará con los datos a través de la llamada AJAX de script.js a /api/trips
    res.render('main', {}); 
});

// Ruta para servir las imágenes de los viajes
router.get('/trip/:id/image', async (req, res) => {
    let trip = await db.getTrip(req.params.id);

    if (trip && trip.image) {
    
        // las imagenes las tomo de la carpeta public
        res.download(db.PUBLIC_FOLDER + '/' + trip.image);
    } else {
        res.status(404).send('Image not found');
    }
});

export default router;