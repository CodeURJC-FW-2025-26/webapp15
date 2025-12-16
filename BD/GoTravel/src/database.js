import { MongoClient, ObjectId } from "mongodb";
import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const jsonFilePath = path.join(__dirname, '..', 'data', 'data.json');
const imagesSourceDir = path.join(__dirname, '..', 'data', 'images');
const uploadsDir = path.join(__dirname, '..', 'uploads');


const url = "mongodb://127.0.0.1:27017";
const client = new MongoClient(url);

const dbName = "gotravel";
const tripsCollectionName = "trips";
const activitiesCollectionName = "activities";

let db;
let trips;
let activities;


async function initDatabase() {
    try {
        await client.connect();
        console.log(" Conecting with MongoDB");

        db = client.db(dbName);
        trips = db.collection(tripsCollectionName);
        activities = db.collection(activitiesCollectionName);


        const count = await trips.countDocuments();
        
        if (count === 0) {
            console.log("Empty data base. Loading from data.json...");
            await seedDatabase(); 
        } else {
            console.log(" Initialicing server...");
        }

    } catch (e) {
        console.error(" Fail conecting with MongoDB:", e);
        process.exit(1);
    }
}


await initDatabase();



async function seedDatabase() {
    try {
        
        const data = JSON.parse(await fs.readFile(jsonFilePath, 'utf-8'));

        
        for (const item of data) {
            const { activities: tripActivities, _id, ...tripData } = item; 

            
            const result = await trips.insertOne(tripData);
            const newTripId = result.insertedId;

            
            if (tripActivities && tripActivities.length > 0) {
                const activitiesWithId = tripActivities.map(act => ({
                    ...act,
                    tripId: newTripId.toString()
                }));
                await activities.insertMany(activitiesWithId);
            }
        }
        console.log(`Info loaded: ${data.length} viajes.`);

        
        try {
            await fs.mkdir(uploadsDir, { recursive: true });
            await fs.cp(imagesSourceDir, uploadsDir, { recursive: true });
            console.log("Images uploaded.");
        } catch (error) {
            console.warn("Images not uploaded , fail.");
        }

    } catch (error) {
        console.error("Fail loading the example info:", error);
    }
}


export async function addTrip(trip) {
    const result = await trips.insertOne(trip);
    return result;
}

export async function addActivity(activity) {
    const result = await activities.insertOne(activity);
    return result;
}

export async function updateTrip(id, updatedFields) { 
    const result = await trips.updateOne({ _id: new ObjectId(id) }, { $set: updatedFields });
    return result;
}

export async function deleteTrip(id) {
    const result = await trips.deleteOne({ _id: new ObjectId(id) });
    await activities.deleteMany({ tripId: id });
    return result;
}

export async function updateActivity(id, updatedFields) { 
    const result = await activities.updateOne({ _id: new ObjectId(id) }, { $set: updatedFields });
    return result;
}

export async function deleteActivity(id) { 
    const result = await activities.deleteOne({ _id: new ObjectId(id) });
    return result;
}


export async function getActivityByName(name) { try { return await activities.findOne({ name }); } catch (error) { return null; } }
export async function countTrips(query = {}) { return await trips.countDocuments(query); }
export async function getTrips(query = {}, skip = 0, limit = 0) {
    let cursor = trips.find(query);
    if (limit > 0) cursor = cursor.skip(skip).limit(limit);
    return await cursor.toArray();
}
export async function getTrip(id) { try { return await trips.findOne({ _id: new ObjectId(id) }); } catch (e) { return null; } }
export async function getTripByName(name) { try { return await trips.findOne({ name }); } catch (e) { return null; } }
export async function getActivitiesByTripId(tripId) { return await activities.find({ tripId }).toArray(); }
export async function getActivity(id) { try { return await activities.findOne({ _id: new ObjectId(id) }); } catch (e) { return null; } }