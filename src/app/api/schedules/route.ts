import { NextResponse } from "next/server";
import { AIRPORTS, summarizeSchedule } from "@/lib/airline";
import { getDb } from "@/lib/mongodb";
import { localDateTimeToUtc } from "@/lib/time";
import type { AirportCode, Schedule } from "@/lib/types";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const origin = searchParams.get("orig") as AirportCode | null;
  const destination = searchParams.get("dest") as AirportCode | null;
  const date1 = searchParams.get("date1");
  const date2 = searchParams.get("date2");

  if (!origin || !destination || !date1 || !date2) {
    return NextResponse.json(
      { error: "orig, dest, date1 and date2 are required" },
      { status: 400 },
    );
  }

  if (!AIRPORTS[origin] || !AIRPORTS[destination]) {
    return NextResponse.json({ error: "Unknown airport code" }, { status: 400 });
  }

  const originTimezone = AIRPORTS[origin].timezone;
  const start = localDateTimeToUtc(date1, "00:00", originTimezone);
  const end = localDateTimeToUtc(date2, "23:59", originTimezone);

  const db = await getDb();
  const schedules = await db
    .collection<Schedule>("schedules")
    .find({
      origin,
      destination,
      departure: { $gte: start, $lte: end },
    })
    .sort({ departure: 1 })
    .toArray();

  return NextResponse.json({ schedules: schedules.map(summarizeSchedule) });
}
