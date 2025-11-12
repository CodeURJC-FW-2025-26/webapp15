import express from 'express';
import { MongoClient } from 'mongodb';

const router = express.Router();
export default router;

const client = new MongoClient('mongodb://localhost:27017');

const db = client.db('cinema');
const moviesCollection = db.collection('movies');

router.get('/', async (req, res) => {

    let movies = await moviesCollection.find().toArray();

    res.render('index', { movies });
});

async function loadMovies() {

    const movies = [
        {
            "title": "The Godfather",
            "year": 1972,
            "genre": ["Crime", "Drama"],
            "actors": ["Marlon Brando", "Al Pacino", "James Caan"]
        },
        {
            "title": "Citizen Kane",
            "year": 1941,
            "genre": ["Drama", "Mystery"],
            "actors": ["Orson Welles", "Joseph Cotten", "Dorothy Comingore"]
        },
        {
            "title": "Casablanca",
            "year": 1942,
            "genre": ["Romance", "Drama", "War"],
            "actors": ["Humphrey Bogart", "Ingrid Bergman", "Paul Henreid"]
        },
        {
            "title": "Schindler's List",
            "year": 1993,
            "genre": ["Biography", "Drama", "History"],
            "actors": ["Liam Neeson", "Ben Kingsley", "Ralph Fiennes"]
        },
    ];
    
    await moviesCollection.deleteMany();
    await moviesCollection.insertMany(movies);
}

await loadMovies();