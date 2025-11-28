import { MongoClient } from 'mongodb';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

// 1. Configuración de rutas y conexión
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Rutas a los archivos (saliendo de src hacia la raíz)
const jsonFilePath = path.join(__dirname, '..', 'data', 'data.json');
const imagesSourceDir = path.join(__dirname, '..', 'data', 'images');
const uploadsDir = path.join(__dirname, '..', 'uploads');

const url = "mongodb://127.0.0.1:27017";
const client = new MongoClient(url);
const dbName = "gotravel";

async function loadData() {
    try {
        console.log("--- INICIANDO CARGA DE DATOS ---");

        // 2. Verificar que existe el JSON antes de hacer nada
        try {
            await fs.access(jsonFilePath);
        } catch (error) {
            throw new Error(`No se encuentra el archivo en: ${jsonFilePath}`);
        }

        // 3. Conectar a la base de datos
        await client.connect();
        console.log("Conectado a MongoDB.");
        
        const db = client.db(dbName);
        const tripsCollection = db.collection('trips');
        const activitiesCollection = db.collection('activities');

        // 4. Limpiar datos antiguos
        await tripsCollection.deleteMany({});
        await activitiesCollection.deleteMany({});
        console.log("Base de datos limpiada.");

        // 5. Leer y procesar el JSON
        const fileContent = await fs.readFile(jsonFilePath, 'utf-8');
        const data = JSON.parse(fileContent);

        // 6. Insertar viajes y actividades
        for (const item of data) {
            // Separamos las actividades del resto de datos del viaje
            const { activities, ...tripData } = item;

            // Insertar Viaje
            const result = await tripsCollection.insertOne(tripData);
            const newTripId = result.insertedId;

            // Insertar Actividades (si tiene) vinculadas al ID del viaje
            if (activities && activities.length > 0) {
                const activitiesWithId = activities.map(act => ({
                    ...act,
                    tripId: newTripId.toString()
                }));
                await activitiesCollection.insertMany(activitiesWithId);
            }
        }
        console.log(`Datos insertados: ${data.length} viajes completados.`);

        // 7. Mover las imágenes
        try {
            // Borra la carpeta uploads vieja y crea una nueva
            await fs.rm(uploadsDir, { recursive: true, force: true });
            await fs.mkdir(uploadsDir);

            // Copia las imágenes desde data/images
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

// Ejecutar la función
loadData();