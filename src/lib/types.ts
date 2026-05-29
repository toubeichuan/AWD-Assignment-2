import type { ObjectId } from "mongodb";

export type AirportCode = "NZNE" | "YSSY" | "NZRO" | "NZGB" | "NZCI" | "NZTL";

export type Airport = {
  code: AirportCode;
  name: string;
  city: string;
  country: string;
  timezone: string;
};

export type BookingStatus = "confirmed" | "cancelled";

export type Passenger = {
  title: string;
  firstName: string;
  lastName: string;
  gender?: string;
  email: string;
};

export type Booking = {
  bookingRef: string;
  passenger: Passenger;
  status: BookingStatus;
  bookedAt: Date;
  cancelledAt?: Date;
};

export type Schedule = {
  _id?: ObjectId;
  scheduleKey: string;
  routeKey: string;
  flightNo: string;
  aircraft: string;
  capacity: number;
  origin: AirportCode;
  destination: AirportCode;
  departure: Date;
  arrival: Date;
  price: number;
  bookings: Booking[];
  createdAt: Date;
  updatedAt: Date;
};

export type ScheduleSummary = Omit<Schedule, "_id" | "bookings"> & {
  _id: string;
  bookings: Booking[];
  activeBookings: number;
  seatsLeft: number;
  originAirport: Airport;
  destinationAirport: Airport;
  departureDisplay: string;
  arrivalDisplay: string;
};
