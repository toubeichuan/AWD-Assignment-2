import { z } from "zod";

export const passengerSchema = z.object({
  title: z.string().trim().min(1).max(12),
  firstName: z.string().trim().min(1).max(60),
  lastName: z.string().trim().min(1).max(60),
  gender: z.string().trim().max(20).optional(),
  email: z.string().trim().email().transform((email) => email.toLowerCase()),
});

export const createBookingSchema = z.object({
  scheduleId: z.string().trim().min(1),
  passenger: passengerSchema,
});

export function createBookingReference(): string {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let value = "DF";

  for (let index = 0; index < 6; index += 1) {
    value += alphabet[Math.floor(Math.random() * alphabet.length)];
  }

  return value;
}
