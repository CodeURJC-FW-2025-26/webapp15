import express from 'express';
import * as db from './database.js';

const router = express.Router();


router.get('/', async (req, res) => {
    
    try {
        const trips = await db.getTrips({}, 0, 6);

        
        res.render('main', { 
            pageTitle: 'Home',
            trips: trips
        }); 

    } catch (error) {
        console.error("Error fetching trips for render:", error);
        res.status(500).send('Error loading page');
    }
});

export default router;