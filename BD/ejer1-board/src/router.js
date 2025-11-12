import express from 'express';
import multer from 'multer';

import * as db from './database.js';

const router = express.Router();
const upload = multer({ dest: db.UPLOADS_FOLDER });

export default router;

router.get('/', async (req, res) => {
    let trips = await db.getTrips();
    res.render('main', { trips: trips });
});

router.get('/trip/:id/image', (req, res) => {
    let trip = await db.getTrip(req.params.id);

    if (trip && trip.image) {
        res.download(db.UPLOADS_FOLDER);
    } else {
        res.status(404).send('Image not found');
    }
});