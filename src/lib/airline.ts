import type { Airport, AirportCode, Schedule, ScheduleSummary } from "./types";
import { addMinutes, formatDateTime, localDateTimeToUtc, toDateInputValue } from "./time";

type RouteTemplate = {
  routeKey: string;
  flightNo: string;
  origin: AirportCode;
  destination: AirportCode;
  days: number[];
  departureTime: string;
  durationMinutes: number;
  aircraft: string;
  capacity: number;
  price: number;
};

export const AIRPORTS: Record<AirportCode, Airport> = {
  NZNE: {
    code: "NZNE",
    name: "Dairy Flat Airport",
    city: "Dairy Flat",
    country: "New Zealand",
    timezone: "Pacific/Auckland",
  },
  YSSY: {
    code: "YSSY",
    name: "Sydney Kingsford Smith Airport",
    city: "Sydney",
    country: "Australia",
    timezone: "Australia/Sydney",
  },
  NZRO: {
    code: "NZRO",
    name: "Rotorua Airport",
    city: "Rotorua",
    country: "New Zealand",
    timezone: "Pacific/Auckland",
  },
  NZGB: {
    code: "NZGB",
    name: "Claris Airport",
    city: "Great Barrier Island",
    country: "New Zealand",
    timezone: "Pacific/Auckland",
  },
  NZCI: {
    code: "NZCI",
    name: "Tuuta Airport",
    city: "Chatham Islands",
    country: "New Zealand",
    timezone: "Pacific/Chatham",
  },
  NZTL: {
    code: "NZTL",
    name: "Lake Tekapo Airport",
    city: "Lake Tekapo",
    country: "New Zealand",
    timezone: "Pacific/Auckland",
  },
};

export const ROUTES: RouteTemplate[] = [
  {
    routeKey: "NZNE-YSSY-FRI",
    flightNo: "DF101",
    origin: "NZNE",
    destination: "YSSY",
    days: [5],
    departureTime: "10:30",
    durationMinutes: 220,
    aircraft: "SyberJet SJ30i",
    capacity: 6,
    price: 1290,
  },
  {
    routeKey: "YSSY-NZNE-SUN",
    flightNo: "DF102",
    origin: "YSSY",
    destination: "NZNE",
    days: [0],
    departureTime: "15:00",
    durationMinutes: 190,
    aircraft: "SyberJet SJ30i",
    capacity: 6,
    price: 1190,
  },
  {
    routeKey: "NZNE-NZRO-AM",
    flightNo: "DF201",
    origin: "NZNE",
    destination: "NZRO",
    days: [1, 2, 3, 4, 5],
    departureTime: "06:45",
    durationMinutes: 35,
    aircraft: "Cirrus SF50 Vision Jet",
    capacity: 4,
    price: 240,
  },
  {
    routeKey: "NZRO-NZNE-AM",
    flightNo: "DF202",
    origin: "NZRO",
    destination: "NZNE",
    days: [1, 2, 3, 4, 5],
    departureTime: "07:45",
    durationMinutes: 35,
    aircraft: "Cirrus SF50 Vision Jet",
    capacity: 4,
    price: 240,
  },
  {
    routeKey: "NZNE-NZRO-PM",
    flightNo: "DF203",
    origin: "NZNE",
    destination: "NZRO",
    days: [1, 2, 3, 4, 5],
    departureTime: "16:45",
    durationMinutes: 35,
    aircraft: "Cirrus SF50 Vision Jet",
    capacity: 4,
    price: 260,
  },
  {
    routeKey: "NZRO-NZNE-PM",
    flightNo: "DF204",
    origin: "NZRO",
    destination: "NZNE",
    days: [1, 2, 3, 4, 5],
    departureTime: "18:00",
    durationMinutes: 35,
    aircraft: "Cirrus SF50 Vision Jet",
    capacity: 4,
    price: 260,
  },
  {
    routeKey: "NZNE-NZGB-MWF",
    flightNo: "DF301",
    origin: "NZNE",
    destination: "NZGB",
    days: [1, 3, 5],
    departureTime: "09:00",
    durationMinutes: 30,
    aircraft: "Cirrus SF50 Vision Jet",
    capacity: 4,
    price: 210,
  },
  {
    routeKey: "NZGB-NZNE-TTS",
    flightNo: "DF302",
    origin: "NZGB",
    destination: "NZNE",
    days: [2, 4, 6],
    departureTime: "09:30",
    durationMinutes: 30,
    aircraft: "Cirrus SF50 Vision Jet",
    capacity: 4,
    price: 210,
  },
  {
    routeKey: "NZNE-NZCI-TF",
    flightNo: "DF401",
    origin: "NZNE",
    destination: "NZCI",
    days: [2, 5],
    departureTime: "10:00",
    durationMinutes: 150,
    aircraft: "HondaJet Elite",
    capacity: 5,
    price: 690,
  },
  {
    routeKey: "NZCI-NZNE-WS",
    flightNo: "DF402",
    origin: "NZCI",
    destination: "NZNE",
    days: [3, 6],
    departureTime: "10:30",
    durationMinutes: 170,
    aircraft: "HondaJet Elite",
    capacity: 5,
    price: 720,
  },
  {
    routeKey: "NZNE-NZTL-MON",
    flightNo: "DF501",
    origin: "NZNE",
    destination: "NZTL",
    days: [1],
    departureTime: "12:00",
    durationMinutes: 110,
    aircraft: "HondaJet Elite",
    capacity: 5,
    price: 520,
  },
  {
    routeKey: "NZTL-NZNE-TUE",
    flightNo: "DF502",
    origin: "NZTL",
    destination: "NZNE",
    days: [2],
    departureTime: "11:00",
    durationMinutes: 125,
    aircraft: "HondaJet Elite",
    capacity: 5,
    price: 540,
  },
];

export function generateSchedules(options?: {
  startDate?: Date;
  weeks?: number;
}): Schedule[] {
  const today = options?.startDate ?? new Date();
  const weeks = options?.weeks ?? 16;
  const start = startOfWeek(addDays(stripTime(today), -7));
  const end = addDays(start, weeks * 7);
  const schedules: Schedule[] = [];
  const now = new Date();

  for (let day = new Date(start); day < end; day = addDays(day, 1)) {
    const weekday = day.getUTCDay();
    const date = toDateInputValue(day);

    for (const route of ROUTES) {
      if (!route.days.includes(weekday)) {
        continue;
      }

      const originAirport = AIRPORTS[route.origin];
      const departure = localDateTimeToUtc(date, route.departureTime, originAirport.timezone);
      const arrival = addMinutes(departure, route.durationMinutes);

      schedules.push({
        scheduleKey: `${route.routeKey}-${date}`,
        routeKey: route.routeKey,
        flightNo: route.flightNo,
        aircraft: route.aircraft,
        capacity: route.capacity,
        origin: route.origin,
        destination: route.destination,
        departure,
        arrival,
        price: route.price,
        bookings: [],
        createdAt: now,
        updatedAt: now,
      });
    }
  }

  return schedules;
}

export function summarizeSchedule(schedule: Schedule & { _id: unknown }): ScheduleSummary {
  const originAirport = AIRPORTS[schedule.origin];
  const destinationAirport = AIRPORTS[schedule.destination];
  const activeBookings = schedule.bookings.filter((booking) => booking.status === "confirmed").length;

  return {
    ...schedule,
    _id: String(schedule._id),
    activeBookings,
    seatsLeft: Math.max(schedule.capacity - activeBookings, 0),
    originAirport,
    destinationAirport,
    departureDisplay: formatDateTime(schedule.departure, originAirport.timezone),
    arrivalDisplay: formatDateTime(schedule.arrival, destinationAirport.timezone),
  };
}

export function routeLabel(origin: AirportCode, destination: AirportCode): string {
  return `${AIRPORTS[origin].city} to ${AIRPORTS[destination].city}`;
}

function stripTime(date: Date): Date {
  return new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
}

function startOfWeek(date: Date): Date {
  const result = new Date(date);
  result.setUTCDate(result.getUTCDate() - result.getUTCDay());
  return result;
}

function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setUTCDate(result.getUTCDate() + days);
  return result;
}
