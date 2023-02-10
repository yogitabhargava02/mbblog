import { MongoClient } from 'mongodb';

let db;

async function connectToDb(cb) {
    // const client = new MongoClient(`mongodb+srv://${process.env.MONGO_USERNAME}:${process.env.MONGO_PASSWORD}@cluster0.sdxuqbn.mongodb.net/?retryWrites=true&w=majority`);
    const client = new MongoClient(`mongodb+srv://node-server:6ol2vfaAbhfaQRXp@cluster0.sdxuqbn.mongodb.net/?retryWrites=true&w=majority`);
    await client.connect();
    db = client.db('react-blog-db');
    cb();
}

export {
    db,
    connectToDb,
};
