import { MongoClient, type Db } from "mongodb";

const uri = process.env.MONGODB_URI;
const dbName = process.env.MONGODB_DB ?? "airline_booking";

if (!uri) {
  throw new Error("Missing MONGODB_URI environment variable");
}

const globalForMongo = globalThis as typeof globalThis & {
  _mongoClientPromise?: Promise<MongoClient>;
};

const clientPromise =
  globalForMongo._mongoClientPromise ??
  new MongoClient(uri).connect().then(async (client) => {
    const db = client.db(dbName);
    await ensureIndexes(db);
    return client;
  });

if (process.env.NODE_ENV !== "production") {
  globalForMongo._mongoClientPromise = clientPromise;
}

export async function getDb(): Promise<Db> {
  const client = await clientPromise;
  return client.db(dbName);
}

async function ensureIndexes(db: Db): Promise<void> {
  await Promise.all([
    db.collection("schedules").createIndex({ scheduleKey: 1 }, { unique: true }),
    db.collection("schedules").createIndex({ origin: 1, destination: 1, departure: 1 }),
    db.collection("schedules").createIndex({ "bookings.bookingRef": 1 }),
    db.collection("schedules").createIndex({ "bookings.passenger.email": 1 }),
    db.collection("passengers").createIndex({ email: 1 }, { unique: true }),
  ]);
}
