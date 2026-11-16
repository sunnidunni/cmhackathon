// Scripted: every status update below is fixture data on a timer; the real integration would poll a flight-status API (e.g. FlightAware AeroAPI) for the flight read off the screenshot.
import type { ActScenario } from "../types";
import { scenario as delay } from "./delay";
import { FLIGHT_LATE_IMAGE } from "./images";

export const EU261_CLAIM_ACT_ID = "flight-eu261";

export const FLIGHT = {
  number: "NW 88",
  airline: "Northwind",
  from: { code: "LIS", city: "Lisbon" },
  to: { code: "SFO", city: "San Francisco" },
  scheduled: "11:05 AM",
  scheduledArrival: "2:40 PM",
} as const;

export type FlightUpdate = { delay: string; departs: string; arrives: string; gate: string; note: string };

export const FLIGHT_UPDATES: FlightUpdate[] = [
  { delay: "45 min", departs: "11:50 AM", arrives: "3:25 PM", gate: "14", note: "Late inbound aircraft" },
  { delay: "2 h 10 min", departs: "1:15 PM", arrives: "4:50 PM", gate: "14", note: "Crew delayed on the inbound flight" },
  { delay: "4 h", departs: "3:05 PM", arrives: "6:40 PM", gate: "22", note: "Gate changed from 14 to 22" },
  { delay: "6 h", departs: "5:05 PM", arrives: "8:45 PM", gate: "22", note: "Replacement crew on the way" },
];

export const UPDATE_EVERY_MS = 2600;

export const scenario: ActScenario = {
  id: "flight-status",
  keeper: "tock",
  source: { image: FLIGHT_LATE_IMAGE, title: "Boarding pass", at: "9:02 AM" },
  noticed: `${FLIGHT.number} to San Francisco is running late.`,
  why: `Your boarding pass says ${FLIGHT.from.city} to ${FLIGHT.to.city}, leaving ${FLIGHT.scheduled}, gate 14.`,
  ready: "Tock is watching the live status for you.",
  cta: "Review live flight status",
  steps: [{ kind: "calendar", title: `${FLIGHT.number} ${FLIGHT.from.city} to ${FLIGHT.to.city}`, when: FLIGHT.scheduled }],
  confirm: { title: "Flight status", lines: [], button: "Done" },
  done: delay.done,
};
