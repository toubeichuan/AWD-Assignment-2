"use client";

import {
  CalendarDays,
  CheckCircle2,
  CircleDollarSign,
  ExternalLink,
  MapPin,
  Plane,
  Search,
  Ticket,
  Trash2,
  UserRoundSearch,
} from "lucide-react";
import Image from "next/image";
import { FormEvent, useEffect, useMemo, useState } from "react";
import type { Airport, ScheduleSummary } from "@/lib/types";

type BookingResponse = {
  booking: {
    bookingRef: string;
    passenger: {
      title: string;
      firstName: string;
      lastName: string;
      email: string;
    };
    status: "confirmed" | "cancelled";
  };
  schedule: ScheduleSummary;
};

const today = new Date();
const todayInput = today.toISOString().slice(0, 10);
const nextMonthInput = new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000)
  .toISOString()
  .slice(0, 10);
const gcmapSource =
  "http://www.gcmap.com/map?P=NZNE-YSSY,NZNE-NZRO,NZNE-NZGB,NZNE-NZCI,NZNE-NZTL&MS=wls&MR=540&MX=720x360&PM=b:disc7%2b%25t&PC=red&PW=3";

const routeNetwork = [
  {
    code: "YSSY",
    city: "Sydney",
    country: "Australia",
    aircraft: "SyberJet SJ30i",
    frequency: "Weekly prestige service",
    gcmap: "http://www.gcmap.com/mapui?P=NZNE-YSSY",
  },
  {
    code: "NZRO",
    city: "Rotorua",
    country: "New Zealand",
    aircraft: "Cirrus SF50",
    frequency: "Twice every weekday",
    gcmap: "http://www.gcmap.com/mapui?P=NZNE-NZRO",
  },
  {
    code: "NZGB",
    city: "Great Barrier",
    country: "New Zealand",
    aircraft: "Cirrus SF50",
    frequency: "Three times weekly",
    gcmap: "http://www.gcmap.com/mapui?P=NZNE-NZGB",
  },
  {
    code: "NZCI",
    city: "Chatham Islands",
    country: "New Zealand",
    aircraft: "HondaJet Elite",
    frequency: "Twice weekly",
    gcmap: "http://www.gcmap.com/mapui?P=NZNE-NZCI",
  },
  {
    code: "NZTL",
    city: "Lake Tekapo",
    country: "New Zealand",
    aircraft: "HondaJet Elite",
    frequency: "Weekly South Island service",
    gcmap: "http://www.gcmap.com/mapui?P=NZNE-NZTL",
  },
];

export default function Home() {
  const [airports, setAirports] = useState<Airport[]>([]);
  const [origin, setOrigin] = useState("NZNE");
  const [destination, setDestination] = useState("YSSY");
  const [date1, setDate1] = useState(todayInput);
  const [date2, setDate2] = useState(nextMonthInput);
  const [schedules, setSchedules] = useState<ScheduleSummary[]>([]);
  const [selectedSchedule, setSelectedSchedule] = useState<ScheduleSummary | null>(null);
  const [invoice, setInvoice] = useState<BookingResponse | null>(null);
  const [itinerary, setItinerary] = useState<ScheduleSummary[]>([]);
  const [searchStatus, setSearchStatus] = useState("");
  const [bookingStatus, setBookingStatus] = useState("");
  const [cancelStatus, setCancelStatus] = useState("");
  const [itineraryStatus, setItineraryStatus] = useState("");

  useEffect(() => {
    fetch("/api/airports")
      .then((response) => response.json())
      .then((data) => setAirports(data.airports ?? []))
      .catch(() => setSearchStatus("Airports could not be loaded."));
  }, []);

  const destinationOptions = useMemo(
    () => airports.filter((airport) => airport.code !== origin),
    [airports, origin],
  );

  async function searchFlights(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSearchStatus("Searching scheduled flights...");
    setInvoice(null);
    setSelectedSchedule(null);

    const query = new URLSearchParams({
      orig: origin,
      dest: destination,
      date1,
      date2,
    });
    try {
      const response = await fetch(`/api/schedules?${query.toString()}`);
      const data = await response.json();

      if (!response.ok) {
        setSearchStatus(data.error ?? "Search failed.");
        setSchedules([]);
        return;
      }

      setSchedules(data.schedules ?? []);
      setSearchStatus(
        data.schedules?.length
          ? `${data.schedules.length} scheduled flight${data.schedules.length === 1 ? "" : "s"} found.`
          : "No scheduled flights match those dates.",
      );
    } catch {
      setSearchStatus("Search failed because the API is unavailable.");
      setSchedules([]);
    }
  }

  async function bookFlight(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!selectedSchedule) {
      return;
    }

    setBookingStatus("Creating booking...");
    const form = new FormData(event.currentTarget);
    const payload = {
      scheduleId: selectedSchedule._id,
      passenger: {
        title: String(form.get("title")),
        firstName: String(form.get("firstName")),
        lastName: String(form.get("lastName")),
        gender: String(form.get("gender")),
        email: String(form.get("email")),
      },
    };
    try {
      const response = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await response.json();

      if (!response.ok) {
        setBookingStatus(data.error ?? "Booking failed.");
        return;
      }

      setInvoice(data);
      setBookingStatus("Booking confirmed.");
      setSchedules((current) =>
        current.map((schedule) =>
          schedule._id === data.schedule._id ? data.schedule : schedule,
        ),
      );
      setSelectedSchedule(data.schedule);
    } catch {
      setBookingStatus("Booking failed because the API is unavailable.");
    }
  }

  async function cancelBooking(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const bookingRef = String(form.get("bookingRef")).trim().toUpperCase();
    setCancelStatus("Cancelling booking...");

    try {
      const response = await fetch(`/api/bookings/${bookingRef}`, { method: "DELETE" });
      const data = await response.json();

      if (!response.ok) {
        setCancelStatus(data.error ?? "Cancellation failed.");
        return;
      }

      setCancelStatus(`Booking ${bookingRef} is cancelled.`);
      setInvoice(data);
    } catch {
      setCancelStatus("Cancellation failed because the API is unavailable.");
    }
  }

  async function findItinerary(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const email = String(form.get("email")).trim().toLowerCase();
    setItineraryStatus("Fetching passenger flights...");

    try {
      const response = await fetch(`/api/bookings?email=${encodeURIComponent(email)}`);
      const data = await response.json();

      if (!response.ok) {
        setItineraryStatus(data.error ?? "Passenger search failed.");
        setItinerary([]);
        return;
      }

      setItinerary(data.schedules ?? []);
      setItineraryStatus(
        data.schedules?.length
          ? `${data.schedules.length} confirmed flight${data.schedules.length === 1 ? "" : "s"} found.`
          : "No confirmed flights found for that email.",
      );
    } catch {
      setItineraryStatus("Passenger search failed because the API is unavailable.");
      setItinerary([]);
    }
  }

  return (
    <main>
      <section className="hero">
        <nav className="topbar" aria-label="Main">
          <div className="brand">
            <Plane aria-hidden />
            <span>Dairy Flat Air</span>
          </div>
          <div className="topbarMeta">
            <span>NZNE Hub</span>
            <span>Light Jet Network</span>
          </div>
        </nav>

        <div className="heroGrid">
          <div className="heroCopy">
            <p className="eyebrow">Dairy Flat Airport</p>
            <h1>Point-to-point jet bookings from Auckland&apos;s north.</h1>
            <p>
              Luxury light jet service to Sydney, Rotorua, Great Barrier,
              the Chathams, and Lake Tekapo.
            </p>
          </div>

          <form className="searchPanel" onSubmit={searchFlights}>
            <div className="panelTitle">
              <Search aria-hidden />
              <h2>Flight Search</h2>
            </div>
            <div className="fieldGrid">
              <label>
                From
                <select
                  value={origin}
                  onChange={(event) => {
                    setOrigin(event.target.value);
                    if (event.target.value === destination) {
                      setDestination("YSSY");
                    }
                  }}
                >
                  {airports.map((airport) => (
                    <option key={airport.code} value={airport.code}>
                      {airport.city} ({airport.code})
                    </option>
                  ))}
                </select>
              </label>
              <label>
                To
                <select
                  value={destination}
                  onChange={(event) => setDestination(event.target.value)}
                >
                  {destinationOptions.map((airport) => (
                    <option key={airport.code} value={airport.code}>
                      {airport.city} ({airport.code})
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Date from
                <input
                  type="date"
                  value={date1}
                  onChange={(event) => setDate1(event.target.value)}
                />
              </label>
              <label>
                Date to
                <input
                  type="date"
                  value={date2}
                  onChange={(event) => setDate2(event.target.value)}
                />
              </label>
            </div>
            <button className="primaryButton" type="submit">
              <Search aria-hidden />
              Search
            </button>
            <p className="status">{searchStatus}</p>
          </form>
        </div>
      </section>

      <section className="routeNetwork" aria-labelledby="route-network-title">
        <div className="routeNetworkInner">
          <div className="sectionHeading">
            <MapPin aria-hidden />
            <h2 id="route-network-title">Route Network</h2>
          </div>
          <div className="routeNetworkGrid">
            <div className="networkMap" aria-label="Dairy Flat Air route map">
              <Image
                alt="Great Circle Mapper route map from Dairy Flat Airport to Sydney, Rotorua, Great Barrier, Chatham Islands, and Lake Tekapo"
                className="gcmapImage"
                height={360}
                src="/dairy-flat-gcmap.gif"
                unoptimized
                width={720}
              />
              <p className="mapAttribution">
                Map generated by{" "}
                <a href={gcmapSource} target="_blank" rel="noreferrer">
                  Great Circle Mapper
                </a>
                .
              </p>
            </div>

            <div className="routeList">
              {routeNetwork.map((route) => (
                <article className="routeItem" key={route.code}>
                  <div>
                    <span>{route.code}</span>
                    <h3>{route.city}</h3>
                    <p>
                      {route.country} · {route.frequency} · {route.aircraft}
                    </p>
                  </div>
                  <a href={route.gcmap} target="_blank" rel="noreferrer">
                    <ExternalLink aria-hidden />
                    GCMap
                  </a>
                </article>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="contentGrid" aria-label="Booking workspace">
        <div className="resultsColumn">
          <div className="sectionHeading">
            <CalendarDays aria-hidden />
            <h2>Scheduled Flights</h2>
          </div>
          <div className="resultsList">
            {schedules.map((schedule) => (
              <article
                className={`flightCard ${
                  selectedSchedule?._id === schedule._id ? "selected" : ""
                }`}
                key={schedule._id}
              >
                <div className="flightHeader">
                  <div>
                    <p className="flightNo">{schedule.flightNo}</p>
                    <h3>
                      {schedule.originAirport.city} to {schedule.destinationAirport.city}
                    </h3>
                  </div>
                  <span className="price">${schedule.price}</span>
                </div>
                <div className="timeGrid">
                  <div>
                    <span>Depart</span>
                    <strong>{schedule.departureDisplay}</strong>
                  </div>
                  <div>
                    <span>Arrive</span>
                    <strong>{schedule.arrivalDisplay}</strong>
                  </div>
                </div>
                <div className="flightFooter">
                  <span>{schedule.aircraft}</span>
                  <span>
                    {schedule.seatsLeft} / {schedule.capacity} seats left
                  </span>
                </div>
                <button
                  className="secondaryButton"
                  type="button"
                  disabled={schedule.seatsLeft === 0}
                  onClick={() => setSelectedSchedule(schedule)}
                >
                  <Ticket aria-hidden />
                  {schedule.seatsLeft === 0 ? "Full" : "Select"}
                </button>
              </article>
            ))}
          </div>
        </div>

        <aside className="bookingColumn">
          <section className="toolPanel">
            <div className="panelTitle">
              <Ticket aria-hidden />
              <h2>Book Seat</h2>
            </div>
            {selectedSchedule ? (
              <>
                <div className="selectedFlight">
                  <span>{selectedSchedule.flightNo}</span>
                  <strong>
                    {selectedSchedule.originAirport.city} to{" "}
                    {selectedSchedule.destinationAirport.city}
                  </strong>
                  <small>{selectedSchedule.departureDisplay}</small>
                </div>
                <form onSubmit={bookFlight} className="stackedForm">
                  <div className="twoColumn">
                    <label>
                      Title
                      <select name="title" defaultValue="Mr">
                        <option>Mr</option>
                        <option>Mrs</option>
                        <option>Ms</option>
                        <option>Miss</option>
                        <option>Dr</option>
                      </select>
                    </label>
                    <label>
                      Gender
                      <select name="gender" defaultValue="">
                        <option value="">Unspecified</option>
                        <option value="f">Female</option>
                        <option value="m">Male</option>
                      </select>
                    </label>
                  </div>
                  <label>
                    First name
                    <input name="firstName" required />
                  </label>
                  <label>
                    Last name
                    <input name="lastName" required />
                  </label>
                  <label>
                    Email
                    <input name="email" type="email" required />
                  </label>
                  <button className="primaryButton" type="submit">
                    <CheckCircle2 aria-hidden />
                    Confirm Booking
                  </button>
                  <p className="status">{bookingStatus}</p>
                </form>
              </>
            ) : (
              <p className="emptyState">Select an available scheduled flight.</p>
            )}
          </section>

          {invoice && (
            <section className="invoicePanel">
              <div className="panelTitle">
                <CircleDollarSign aria-hidden />
                <h2>Invoice</h2>
              </div>
              <dl>
                <div>
                  <dt>Booking reference</dt>
                  <dd>{invoice.booking.bookingRef}</dd>
                </div>
                <div>
                  <dt>Status</dt>
                  <dd>{invoice.booking.status}</dd>
                </div>
                <div>
                  <dt>Passenger</dt>
                  <dd>
                    {invoice.booking.passenger.title} {invoice.booking.passenger.firstName}{" "}
                    {invoice.booking.passenger.lastName}
                  </dd>
                </div>
                <div>
                  <dt>Flight</dt>
                  <dd>{invoice.schedule.flightNo}</dd>
                </div>
                <div>
                  <dt>Departure</dt>
                  <dd>{invoice.schedule.departureDisplay}</dd>
                </div>
                <div>
                  <dt>Arrival</dt>
                  <dd>{invoice.schedule.arrivalDisplay}</dd>
                </div>
                <div>
                  <dt>Total</dt>
                  <dd>${invoice.schedule.price}</dd>
                </div>
              </dl>
            </section>
          )}
        </aside>
      </section>

      <section className="actionsBand">
        <form className="toolPanel compact" onSubmit={cancelBooking}>
          <div className="panelTitle">
            <Trash2 aria-hidden />
            <h2>Cancel Booking</h2>
          </div>
          <label>
            Booking reference
            <input name="bookingRef" placeholder="DFABC123" required />
          </label>
          <button className="secondaryButton danger" type="submit">
            <Trash2 aria-hidden />
            Cancel
          </button>
          <p className="status">{cancelStatus}</p>
        </form>

        <form className="toolPanel compact" onSubmit={findItinerary}>
          <div className="panelTitle">
            <UserRoundSearch aria-hidden />
            <h2>Passenger Flights</h2>
          </div>
          <label>
            Passenger email
            <input name="email" type="email" placeholder="name@example.com" required />
          </label>
          <button className="secondaryButton" type="submit">
            <UserRoundSearch aria-hidden />
            Find Flights
          </button>
          <p className="status">{itineraryStatus}</p>
        </form>
      </section>

      {itinerary.length > 0 && (
        <section className="itineraryBand">
          <div className="sectionHeading">
            <Plane aria-hidden />
            <h2>Passenger Itinerary</h2>
          </div>
          <div className="itineraryList">
            {itinerary.map((schedule) => (
              <article className="itineraryItem" key={schedule._id}>
                <strong>
                  {schedule.flightNo}: {schedule.originAirport.city} to{" "}
                  {schedule.destinationAirport.city}
                </strong>
                <span>{schedule.departureDisplay}</span>
                <span>{schedule.bookings[0]?.bookingRef}</span>
              </article>
            ))}
          </div>
        </section>
      )}
    </main>
  );
}
