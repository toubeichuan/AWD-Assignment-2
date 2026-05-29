import fs from "node:fs/promises";
import path from "node:path";
import { loadEnvConfig } from "@next/env";
import { MongoClient } from "mongodb";
import { generateSchedules } from "../src/lib/airline";
import type { Booking, Passenger, Schedule } from "../src/lib/types";

loadEnvConfig(process.cwd());

const uri = process.env.MONGODB_URI;
const dbName = process.env.MONGODB_DB ?? "airline_booking";

if (!uri) {
  throw new Error("MONGODB_URI is required. Copy .env.example to .env.local first.");
}

const mongoUri = uri;

async function main() {
  const client = new MongoClient(mongoUri);
  await client.connect();
  const db = client.db(dbName);
  const schedulesCollection = db.collection<Schedule>("schedules");
  const passengersCollection = db.collection("passengers");

  const schedules = generateSchedules({ weeks: 18 });
  const passengers = await readPassengers();
  addSampleBookings(schedules, passengers.slice(0, 80));

  await schedulesCollection.deleteMany({});
  await passengersCollection.deleteMany({});
  await schedulesCollection.insertMany(schedules);

  const passengerDocs = new Map<string, Passenger & { bookingRefs: string[]; createdAt: Date; updatedAt: Date }>();
  for (const schedule of schedules) {
    for (const booking of schedule.bookings) {
      const existing = passengerDocs.get(booking.passenger.email);
      if (existing) {
        existing.bookingRefs.push(booking.bookingRef);
      } else {
        passengerDocs.set(booking.passenger.email, {
          ...booking.passenger,
          bookingRefs: [booking.bookingRef],
          createdAt: booking.bookedAt,
          updatedAt: booking.bookedAt,
        });
      }
    }
  }

  if (passengerDocs.size > 0) {
    await passengersCollection.insertMany([...passengerDocs.values()]);
  }

  await Promise.all([
    schedulesCollection.createIndex({ scheduleKey: 1 }, { unique: true }),
    schedulesCollection.createIndex({ origin: 1, destination: 1, departure: 1 }),
    schedulesCollection.createIndex({ "bookings.bookingRef": 1 }),
    schedulesCollection.createIndex({ "bookings.passenger.email": 1 }),
    passengersCollection.createIndex({ email: 1 }, { unique: true }),
  ]);

  console.log(`Seeded ${schedules.length} scheduled flights.`);
  console.log(`Seeded ${passengerDocs.size} sample passengers/bookings.`);
  await client.close();
}

async function readPassengers(): Promise<Passenger[]> {
  const csvPath = path.join(process.cwd(), "randomnames.csv");
  const csv = await fs.readFile(csvPath, "utf8");
  return csv
    .split(/\r?\n/)
    .filter(Boolean)
    .map((line) => {
      const [, title, firstName, lastName, gender, email] = line.split(",");
      return {
        title,
        firstName,
        lastName,
        gender,
        email: email.toLowerCase(),
      };
    });
}

function addSampleBookings(schedules: Schedule[], passengers: Passenger[]) {
  const now = new Date();
  let passengerIndex = 0;

  for (const schedule of schedules) {
    const seatsToFill = Math.min(
      Math.floor(Math.random() * Math.max(schedule.capacity - 1, 1)),
      passengers.length - passengerIndex,
    );

    for (let seat = 0; seat < seatsToFill; seat += 1) {
      const passenger = passengers[passengerIndex];
      passengerIndex += 1;
      const booking: Booking = {
        bookingRef: `DF${String(passengerIndex).padStart(6, "0")}`,
        passenger,
        status: "confirmed",
        bookedAt: now,
      };
      schedule.bookings.push(booking);
    }

    if (passengerIndex >= passengers.length) {
      return;
    }
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
