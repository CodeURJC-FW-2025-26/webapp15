import { MongoClient, ObjectId } from "mongodb";
import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";


const url = "mongodb://localhost:27017";
const client = new MongoClient(url);

const dbName = "gotravel";
const tripsCollectionName = "trips";
const activitiesCollectionName = "activities";


export const UPLOADS_FOLDER = "../uploads";
export const DATA_FOLDER = "../data";


let db;
let trips;
let activities;


async function initDatabase() {
    try {
        await client.connect();
        console.log("Successfully connected to MongoDB");

        db = client.db(dbName);
        trips = db.collection(tripsCollectionName);
        activities = db.collection(activitiesCollectionName);

        
        const count = await trips.countDocuments();
        if (count === 0) {
            console.log("Database is empty. Inserting example data…");
            await seedDatabase();
        }

    } catch (e) {
        console.error("Error connecting to MongoDB:", e);
        process.exit(1);
    }
}


await initDatabase();

async function seedDatabase() {
    const exampleTrips = [
        { name: "Peru", description: "A romantic weekend in Paris.",duration:3, price: 1200, image: "peru.webp",max_travellers:3, flight: true,national:false,t_trip: "Culture" },
        { name: "Austria", description: "Experience the wild nature.",duration:2, price: 3500, image: "austria.webp",max_travellers:2,flight: true,national:true, t_trip: "Adventure" },
        { name: "Germany", description: "Discover the technology and tradition.",duration:4, price: 2500, image: "alemania.webp",max_travellers:5,flight: false,national:false, t_trip: "Culture" },
        { name: "China", description: "The city that never sleeps.", duration: 5 ,price: 1800, image: "china.jpg",max_travellers:9,flight: true, t_trip: "Culture" },
        { name: "Georgia", description: "Walk through ancient history.",duration: 4 ,price: 1100, image: "georgia.jpeg", max_travellers: 7,flight: false,national:false,t_trip: "Culture" },
        { name: "Madagascar", description: "Peace and beaches.",duration: 2 ,price: 1500, image: "madagascar.jpeg", max_travellers:3,flight: true,national:false, t_trip: "Relax" },
        { name: "New York", description: "Skiing and snow.",duration: 5, price: 2000, image: "eeuu.jpeg", max_travellers:4,flight: false,national:true, t_trip: "Adventure" },
        { name: "Portugal", description: "Skiing and snow.",duration: 5 ,price: 2000, image: "portugal.jpg", max_travellers: 5,flight: true,national:false, t_trip: "Relax" },
        { name: "London", description: "Skiing and snow.",duration:8, price: 2000, image: "towerbridge.jpeg", max_travellers:7,flight: false,national:true, t_trip: "Culture" }
    ];

    const result = await trips.insertMany(exampleTrips);

    // Create 1 example activity for each trip
    const newTripsIds = Object.values(result.insertedIds);
    const activitiesToInsert = newTripsIds.map((tripId, index) => {
        const tripName = exampleTrips[index].name;

        return {
            tripId: tripId.toString(),
            name: `Main tour in ${tripName}`,
            duration: 1 + index,
            description: `A guided tour of ${tripName}'s highlights.`,
            price: (index + 1) * 50,
            guide_travel: index % 2 === 0 ? 'YES' : 'NO'
        };
    });
    await activities.insertMany(activitiesToInsert);
    console.log(`${activitiesToInsert.length} example activities inserted.`);

    const __filename = fileURLToPath(import.meta.url);
    const __dirname = path.dirname(__filename);
    const uploadsPath = path.join(__dirname, '..', 'uploads');
    const dataImagesPath = path.join(__dirname, '..', 'data', "images");

    await fs.rm(uploadsPath, { recursive: true, force: true });
    await fs.mkdir(uploadsPath);

    await fs.cp(dataImagesPath, uploadsPath, { recursive: true });
    console.log('Example images copied to uploads folder.');

    console.log("Example data inserted successfully.");
}

// ======================================================================
//   TRIP FUNCTIONS
// ======================================================================

// Count all trips or filtered ones
export async function countTrips(query = {}) {
    return await trips.countDocuments(query);
}

// Get all trips or paginated subset
export async function getTrips(query = {}, skip = 0, limit = 0) {
    let cursor = trips.find(query);

    if (limit > 0) {
        cursor = cursor.skip(skip).limit(limit);
    }
    return await cursor.toArray();
}

// Get a single trip by ID
export async function getTrip(id) {
    try {
        return await trips.findOne({ _id: new ObjectId(id) });
    } catch (e) {
        return null;
    }
}

// Check if a trip with a given name exists
export async function getTripByName(name) {
    try {
        return await trips.findOne({ name });
    } catch (e) {
        return null;
    }
}

// Insert new trip
export async function addTrip(trip) {
    return await trips.insertOne(trip);
}

// Update a trip by ID
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

// Delete a trip and its activities
export async function deleteTrip(id) {
    const result = await trips.deleteOne({ _id: new ObjectId(id) });
    await activities.deleteMany({ tripId: id });
    return result;
}

// ======================================================================
//   ACTIVITY FUNCTIONS
// ======================================================================

// Get all activities for one trip
export async function getActivitiesByTripId(tripId) {
    return await activities.find({ tripId }).toArray();
}

// Get one activity
export async function getActivity(id) {
    try {
        return await activities.findOne({ _id: new ObjectId(id) });
    } catch (e) {
        return null;
    }
}

// Add new activity
export async function addActivity(activity) {
    return await activities.insertOne(activity);
}

// Update activity
export async function updateActivity(id, updatedFields) {
    return await activities.updateOne(
        { _id: new ObjectId(id) },
        { $set: updatedFields }
    );
}

// Delete activity
export async function deleteActivity(id) {
    return await activities.deleteOne({ _id: new ObjectId(id) });
}
