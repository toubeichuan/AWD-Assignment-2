import { NextResponse } from "next/server";
import { summarizeSchedule } from "@/lib/airline";
import { getDb } from "@/lib/mongodb";
import type { Schedule } from "@/lib/types";

type Params = {
  params: Promise<{ ref: string }>;
};

export async function GET(_request: Request, { params }: Params) {
  const { ref } = await params;
  const bookingRef = ref.trim().toUpperCase();
  const db = await getDb();
  const schedule = await db
    .collection<Schedule>("schedules")
    .findOne({ "bookings.bookingRef": bookingRef });

  if (!schedule) {
    return NextResponse.json({ error: "Booking was not found" }, { status: 404 });
  }

  const booking = schedule.bookings.find((item) => item.bookingRef === bookingRef);
  return NextResponse.json({ booking, schedule: summarizeSchedule(schedule) });
}

export async function DELETE(_request: Request, { params }: Params) {
  const { ref } = await params;
  const bookingRef = ref.trim().toUpperCase();
  const db = await getDb();
  const schedules = db.collection<Schedule>("schedules");
  const schedule = await schedules.findOne({
    bookings: { $elemMatch: { bookingRef, status: "confirmed" } },
  });

  if (!schedule) {
    return NextResponse.json(
      { error: "Confirmed booking was not found" },
      { status: 404 },
    );
  }

  const now = new Date();
  await schedules.updateOne(
    {
      _id: schedule._id,
    },
    {
      $set: {
        "bookings.$[booking].status": "cancelled",
        "bookings.$[booking].cancelledAt": now,
        updatedAt: now,
      },
    },
    {
      arrayFilters: [
        {
          "booking.bookingRef": bookingRef,
          "booking.status": "confirmed",
        },
      ],
    },
  );

  const updatedSchedule = await schedules.findOne({ _id: schedule._id });
  const booking = updatedSchedule?.bookings.find((item) => item.bookingRef === bookingRef);

  return NextResponse.json({
    booking,
    schedule: updatedSchedule ? summarizeSchedule(updatedSchedule) : null,
  });
}
