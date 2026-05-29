# Dairy Flat Air Booking System

Next.js and MongoDB Atlas implementation for 159.352 Assignment 2.

## Local setup

1. Install dependencies:

   ```bash
   npm install
   ```

2. Create `.env.local` from `.env.example` and set `MONGODB_URI`.

3. Seed MongoDB Atlas with scheduled flights and sample bookings:

   ```bash
   npm run seed
   ```

4. Start the app:

   ```bash
   npm run dev
   ```

## API endpoints

- `GET /api/airports`
- `GET /api/schedules?date1=2026-06-10&date2=2026-06-30&orig=NZNE&dest=YSSY`
- `POST /api/bookings`
- `GET /api/bookings?email=passenger@example.com`
- `GET /api/bookings/{bookingRef}`
- `DELETE /api/bookings/{bookingRef}`

## Deployment notes

Set the same environment variables in Vercel:

- `MONGODB_URI`
- `MONGODB_DB`

Run `npm run seed` locally before deployment, or add a controlled admin seed flow if fresh deployment data is needed.
