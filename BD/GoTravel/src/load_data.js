import { MongoClient } from 'mongodb';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const jsonFilePath = path.join(__dirname, '..', 'data', 'data.json');
const imagesSourceDir = path.join(__dirname, '..', 'data', 'images');
const uploadsDir = path.join(__dirname, '..', 'uploads');

const url = "mongodb://127.0.0.1:27017";
const client = new MongoClient(url);
const dbName = "gotravel";

async function loadData() {
    try {
        console.log("--- INICIANDO CARGA DE DATOS ---");

        try {
            await fs.access(jsonFilePath);
        } catch (error) {
            throw new Error(`No se encuentra el archivo en: ${jsonFilePath}`);
        }

        await client.connect();
        console.log("Conectado a MongoDB.");
        
        const db = client.db(dbName);
        const tripsCollection = db.collection('trips');
        const activitiesCollection = db.collection('activities');

        await tripsCollection.deleteMany({});
        await activitiesCollection.deleteMany({});
        console.log("Base de datos limpiada.");

        const fileContent = await fs.readFile(jsonFilePath, 'utf-8');
        const data = JSON.parse(fileContent);

        for (const item of data) {
            const { activities, ...tripData } = item;



            const result = await tripsCollection.insertOne(tripData);
            const newTripId = result.insertedId;

            if (activities && activities.length > 0) {
                const activitiesWithId = activities.map(act => ({
                    ...act,
                    _id: new ObjectId(act._id),
                    tripId: newTripId.toString()
                }));
                await activitiesCollection.insertMany(activitiesWithId);
            }
        }
        console.log(`Datos insertados: ${data.length} viajes completados.`);

        try {
            await fs.rm(uploadsDir, { recursive: true, force: true });
            await fs.mkdir(uploadsDir);

            await fs.cp(imagesSourceDir, uploadsDir, { recursive: true });
            console.log("Imágenes copiadas a la carpeta uploads.");
        } catch (err) {
            console.log("Aviso: No se pudieron copiar las imágenes (¿Existe la carpeta data/images?).");
        }

    } catch (error) {
        console.error("ERROR:", error.message);
    } finally {
        await client.close();
        console.log("--- FIN ---");
        process.exit();
    }
}

loadData();