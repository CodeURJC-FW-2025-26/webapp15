import { MongoClient, ObjectId } from 'mongodb';
import fs from 'node:fs/promises';

// --- Configuración de Conexión a MongoDB ---
const client = new MongoClient('mongodb://localhost:27017');

try {
    await client.connect();
    console.log('Connecting to  MongoDB');
} catch (e) {
    console.error('Could not connect to MongoDB. Make sure it is running.', e);
    process.exit(1);
}

// --- Colecciones y Constantes ---
const db = client.db('gotravel');
const trips = db.collection('trips');

export const UPLOADS_FOLDER = './uploads'
export const DATA_FOLDER = './data';

// --- Funciones de Consulta (Lectura) ---

/**
 * Obtiene el total de documentos que coinciden con un query (para calcular la paginación).
 * @param {Object} query - Objeto de consulta de MongoDB para filtrar documentos.
 * @returns {Promise<number>} - Número total de documentos que coinciden.
 */
export async function countTrips(query = {}) {
    return await trips.countDocuments(query);
}

/**
 * Obtiene los viajes aplicando filtros y paginación.
 * @param {Object} query - Objeto de consulta de MongoDB para filtrar documentos.
 * @param {number} skip - Número de documentos a omitir (para la paginación).
 * @param {number} limit - Número máximo de documentos a devolver (tamaño de página).
 * @returns {Promise<Array>} - Array de documentos de viaje.
 */
export async function getTrips(query = {}, skip = 0, limit = 0) {
    let cursor = trips.find(query);
    
    // Aplicar paginación si 'limit' es un valor positivo
    if (limit > 0) {
        cursor = cursor.skip(skip).limit(limit);
    }

    return await cursor.toArray();
}

export async function getTrip(id) {
    return await trips.findOne({ _id: new ObjectId(id) });
}

// --- Funciones de Escritura y Eliminación ---

export async function addTrip(trip) {
    // MongoDB inserta el _id automáticamente
    await trips.insertOne(trip);
}

export async function deleteTrip(id) {
    // Usamos findOneAndDelete para devolver el documento eliminado.
    const result = await trips.findOneAndDelete({ _id: new ObjectId(id) });
    return result;
}