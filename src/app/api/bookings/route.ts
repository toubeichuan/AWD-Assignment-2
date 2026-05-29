import { ObjectId } from "mongodb";
import { NextResponse } from "next/server";
import { createBookingReference, createBookingSchema } from "@/lib/booking";
import { summarizeSchedule } from "@/lib/airline";
import { getDb } from "@/lib/mongodb";
import type { Booking, Schedule } from "@/lib/types";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const email = searchParams.get("email")?.trim().toLowerCase();

  if (!email) {
    return NextResponse.json({ error: "email is required" }, { status: 400 });
  }

  const db = await getDb();
  const schedules = await db
    .collection<Schedule>("schedules")
    .find({
      bookings: {
        $elemMatch: {
          "passenger.email": email,
          status: "confirmed",
        },
      },
    })
    .sort({ departure: 1 })
    .toArray();

  return NextResponse.json({
    schedules: schedules.map((schedule) => {
      const summary = summarizeSchedule(schedule);
      return {
        ...summary,
        bookings: summary.bookings.filter(
          (booking) =>
            booking.status === "confirmed" && booking.passenger.email === email,
        ),
      };
    }),
  });
}

export async function POST(request: Request) {
  const payload = createBookingSchema.safeParse(await request.json());

  if (!payload.success) {
    return NextResponse.json(
      { error: "Invalid booking details", issues: payload.error.issues },
      { status: 400 },
    );
  }

  if (!ObjectId.isValid(payload.data.scheduleId)) {
    return NextResponse.json({ error: "Invalid schedule id" }, { status: 400 });
  }

  const db = await getDb();
  const schedules = db.collection<Schedule>("schedules");
  const scheduleId = new ObjectId(payload.data.scheduleId);
  const email = payload.data.passenger.email;

  for (let attempt = 0; attempt < 5; attempt += 1) {
    const bookingRef = createBookingReference();
    const now = new Date();
    const booking: Booking = {
      bookingRef,
      passenger: payload.data.passenger,
      status: "confirmed",
      bookedAt: now,
    };

    const result = await schedules.updateOne(
      {
        _id: scheduleId,
        bookings: {
          $not: {
            $elemMatch: {
              "passenger.email": email,
              status: "confirmed",
            },
          },
        },
        "bookings.bookingRef": { $ne: bookingRef },
        $expr: {
          $lt: [
            {
              $size: {
                $filter: {
                  input: { $ifNull: ["$bookings", []] },
                  as: "booking",
                  cond: { $eq: ["$$booking.status", "confirmed"] },
                },
              },
            },
            "$capacity",
          ],
        },
      },
      {
        $push: { bookings: booking },
        $set: { updatedAt: now },
      },
    );

    if (result.modifiedCount === 1) {
      await db.collection("passengers").updateOne(
        { email },
        {
          $set: {
            ...payload.data.passenger,
            updatedAt: now,
          },
          $setOnInsert: { createdAt: now },
          $addToSet: { bookingRefs: bookingRef },
        },
        { upsert: true },
      );

      const schedule = await schedules.findOne({ _id: scheduleId });
      return NextResponse.json(
        {
          booking,
          schedule: schedule ? summarizeSchedule(schedule) : null,
        },
        { status: 201 },
      );
    }
  }

  const schedule = await schedules.findOne({ _id: scheduleId });

  if (!schedule) {
    return NextResponse.json({ error: "Scheduled flight was not found" }, { status: 404 });
  }

  const duplicate = schedule.bookings.some(
    (booking) =>
      booking.status === "confirmed" && booking.passenger.email === email,
  );

  if (duplicate) {
    return NextResponse.json(
      { error: "This passenger is already booked on that scheduled flight" },
      { status: 409 },
    );
  }

  return NextResponse.json({ error: "This scheduled flight is full" }, { status: 409 });
}
