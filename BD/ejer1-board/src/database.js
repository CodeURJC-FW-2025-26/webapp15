import { MongoClient, ObjectId } from 'mongodb';

const url = 'mongodb://localhost:27017';
const client = new MongoClient(url);

const dbName = 'gotravel';
const tripsCollectionName = 'trips';
const activitiesCollectionName = 'activities';

export const UPLOADS_FOLDER = '../uploads';
export const DATA_FOLDER = '../data';

let db;
let trips;
let activities;

async function initDatabase() {
    try {
        await client.connect();
        console.log('Successfully connected to MongoDB');

        db = client.db(dbName);
        trips = db.collection(tripsCollectionName);
        activities = db.collection(activitiesCollectionName);

        
        const count = await trips.countDocuments();
        if (count === 0) {
            console.log('Database is empty. Inserting example data...');
            await seedDatabase();
        }

    } catch (e) {
        console.error('Error connecting to MongoDB:', e);
        process.exit(1);
    }
}

await initDatabase();



async function seedDatabase() {
    const exampleTrips = [
        { name: "Peru", description: "A romantic weekend in Paris.", price: 1200, image: "peru.webp", t_trip: "Culture" },
        { name: "Austria", description: "Experience the wild nature.", price: 3500, image: "austria.webp", t_trip: "Adventure" },
        { name: "Germany", description: "Discover the technology and tradition.", price: 2500, image: "alemania.webp", t_trip: "Culture" },
        { name: "China", description: "The city that never sleeps.", price: 1800, image: "china.jpg", t_trip: "Culture" },
        { name: "Georgia", description: "Walk through ancient history.", price: 1100, image: "georgia.jpeg", t_trip: "Culture" },
        { name: "Madagascar", description: "Peace and beaches.", price: 1500, image: "madagascar.jpeg", t_trip: "Relax" },
        { name: "New York", description: "Skiing and snow.", price: 2000, image: "eeuu.jpeg", t_trip: "Adventure" },
        { name: "Portugal", description: "Skiing and snow.", price: 2000, image: "portugal.jpg", t_trip: "Relax" }, 
        { name: "London", description: "Skiing and snow.", price: 2000, image: "towerbridge.jpeg", t_trip: "Culture" }
    ];

    const result = await trips.insertMany(exampleTrips);
    
    
    const firstTripId = result.insertedIds[0];
    await activities.insertOne({
        tripId: firstTripId.toString(), 
        name: "Visit Eiffel Tower",
        description: "Guided tour to the top.",
        price: 50
    });
    
    console.log('Example data inserted successfully.');
}

// ------------------------------------
// --- El resto del archivo (intacto) ---
// ------------------------------------

export async function countTrips(query = {}) {
    return await trips.countDocuments(query);
}

/**
 * Get a list of trips with pagination.
 * @param {Object} query - Filter query
 * @param {number} skip - Documents to skip
 * @param {number} limit - Max documents to return
 */
export async function getTrips(query = {}, skip = 0, limit = 0) {
    let cursor = trips.find(query);
    
    if (limit > 0) {
        cursor = cursor.skip(skip).limit(limit);
    }
    
    return await cursor.toArray();
}

/**
 * Get a single trip by ID.
 */
export async function getTrip(id) {
    try {
        return await trips.findOne({ _id: new ObjectId(id) });
    } catch (e) {
        return null;
    }
}

/**
 * Create a new trip.
 */
export async function addTrip(trip) {
    await trips.insertOne(trip);
}

/**
 * Update an existing trip.
 * Uses $set to update only the specified fields.
 */
export async function updateTrip(id, updatedFields) {
    try {
        const result = await trips.updateOne(
            { _id: new ObjectId(id) },
            { $set: updatedFields }
        );
        return result;
    } catch (e) {
        console.error("Error updating trip", e);
        throw e;
    }
}

/**
 * Delete a trip by ID.
 */
export async function deleteTrip(id) {
    const result = await trips.deleteOne({ _id: new ObjectId(id) });

    await activities.deleteMany({ tripId: id });
    return result;
}

/**
 * Get all activities associated with a specific trip ID.
 */
export async function getActivitiesByTripId(tripId) {
    
    return await activities.find({ tripId: tripId }).toArray();
}

/**
 * Get a single activity by ID (for editing).
 */
export async function getActivity(id) {
    try {
        return await activities.findOne({ _id: new ObjectId(id) });
    } catch (e) {
        return null;
    }
}

/**
 * Create a new activity linked to a trip.
 */
export async function addActivity(activity) {
    
    await activities.insertOne(activity);
}

/**
 * Update an existing activity.
 */
export async function updateActivity(id, updatedFields) {
    const result = await activities.updateOne(
        { _id: new ObjectId(id) },
        { $set: updatedFields }
    );
    return result;
}

/**
 * Delete an activity by ID.
 */
export async function deleteActivity(id) {
    return await activities.deleteOne({ _id: new ObjectId(id) });
}