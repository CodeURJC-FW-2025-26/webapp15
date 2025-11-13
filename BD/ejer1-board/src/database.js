import { MongoClient, ObjectId } from 'mongodb';

// Connection URL
const url = 'mongodb://localhost:27017';
const client = new MongoClient(url);

// Database and Collection names
const dbName = 'gotravel';
const tripsCollectionName = 'trips';
const activitiesCollectionName = 'activities';

// Folder constants
export const UPLOADS_FOLDER = '../uploads';
export const DATA_FOLDER = '../data';

let db;
let trips;
let activities;

// --- Initialization & Connection ---

async function initDatabase() {
    try {
        await client.connect();
        console.log('Successfully connected to MongoDB');

        db = client.db(dbName);
        trips = db.collection(tripsCollectionName);
        activities = db.collection(activitiesCollectionName);

        // Check if DB is empty to insert seed data [cite: 323]
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

// Call initialization immediately
await initDatabase();


// --- Seed Data Function (Ejemplos) ---
async function seedDatabase() {
    const exampleTrips = [
        { name: "Paris Getaway", description: "A romantic weekend in Paris.", price: 1200, image: "paris.jpg" },
        { name: "Safari in Kenya", description: "Experience the wild nature.", price: 3500, image: "safari.jpg" },
        { name: "Tokyo Adventure", description: "Discover the technology and tradition.", price: 2500, image: "tokyo.jpg" },
        { name: "New York City", description: "The city that never sleeps.", price: 1800, image: "nyc.jpg" },
        { name: "Rome History", description: "Walk through ancient history.", price: 1100, image: "rome.jpg" },
        { name: "Bali Relax", description: "Peace and beaches.", price: 1500, image: "bali.jpg" },
        { name: "Swiss Alps", description: "Skiing and snow.", price: 2000, image: "alps.jpg" } // 7 items to test pagination (limit 6)
    ];

    const result = await trips.insertMany(exampleTrips);
    
    // Insert an example activity for the first trip
    const firstTripId = result.insertedIds[0];
    await activities.insertOne({
        tripId: firstTripId.toString(), // Link to the parent entity
        name: "Visit Eiffel Tower",
        description: "Guided tour to the top.",
        price: 50
    });
    
    console.log('Example data inserted successfully.');
}


// --- TRIPS Functions (Main Entity) ---

/**
 * Get the total count of trips matching a query.
 * Used for pagination calculation.
 */
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
    // Optional: Delete associated activities when a trip is deleted
    await activities.deleteMany({ tripId: id });
    return result;
}


// --- ACTIVITIES Functions (Secondary Entity) ---

/**
 * Get all activities associated with a specific trip ID.
 */
export async function getActivitiesByTripId(tripId) {
    // tripId is stored as a string in activities to link them
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
    // Ensure the activity has a tripId before calling this
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