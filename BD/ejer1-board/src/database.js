import e from 'express';
import { MongoClient, ObjectId } from 'mongodb';
import fs from 'node:fs/promises';

const client = new MongoClient('mongodb://localhost:27017');

try {
    await client.connect();
    console.log('Conectado a MongoDB');
} catch (e) {
    console.error('No se pudo conectar a MongoDB. Asegúrate de que está arrancado.', e);
    process.exit(1); // Cierra la aplicación si no puede conectar
}

const db = client.db('gotravel');
const trips = db.collection('trips');

export const UPLOADS_FOLDER = './uploads'
export const DATA_FOLDER = './data';

export async function getTrips() {
    return await trips.find().toArray();
}

export async function getTrip(id) {
    return await trips.findOne({ _id: new ObjectId(id) });
}

export async function addTrip(trip) {
    await trips.insertOne(trip);
}

export async function deleteTrip(id) {
    const result = await trips.findOneAndDelete({ _id: new ObjectId(id) });
    return result;
}

