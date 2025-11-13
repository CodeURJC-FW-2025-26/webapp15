import fs from 'node:fs/promises';
import * as db from './database.js'; 

(async () => {
    try {
        console.log('Checking data base "gotravel"...');
        let currentTrips = await db.getTrips(); 
        if (currentTrips.length === 0) {
            console.log('Empty database. Loading sample data...');
            
            const dataFile = `${db.DATA_FOLDER}/data.json`;
            const dataString = await fs.readFile(dataFile, 'utf8');

            const tripsToLoad = JSON.parse(dataString);

            for (const trip of tripsToLoad) {
                await db.addTrip(trip);
            }
            console.log(`${tripsToLoad.length} loaded trips into MongoDB.`);

            await fs.rm(db.UPLOADS_FOLDER, { recursive: true, force: true });
            await fs.mkdir(db.UPLOADS_FOLDER);
            await fs.cp(`${db.DATA_FOLDER}/images`, db.UPLOADS_FOLDER, { recursive: true });
            
            console.log('Example images copied to ./uploads');

        } else {
            console.log('The database already contains data. No examples are loaded.');
        }

    } catch (error) {
        console.error('Error al inicializar la base de datos:', error);
    }
})();