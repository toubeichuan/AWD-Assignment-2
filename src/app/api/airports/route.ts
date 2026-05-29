import { NextResponse } from "next/server";
import { AIRPORTS } from "@/lib/airline";

export async function GET() {
  return NextResponse.json({ airports: Object.values(AIRPORTS) });
}
