// Scripted: every status update below is fixture data on a timer; the real integration would poll a flight-status API (e.g. FlightAware AeroAPI) for the flight read off the screenshot.
import type { ActScenario } from "../types";
import { scenario as delay } from "./delay";
import { FLIGHT_DELAY_IMAGE } from "./images";

export const EU261_CLAIM_ACT_ID = "flight-delay";

export const FLIGHT = {
  number: "PS 418",
  from: { code: "LIS", city: "Lisbon" },
  to: { code: "SFO", city: "San Francisco" },
  scheduled: "10:35 AM",
  scheduledArrival: "2:10 PM",
} as const;

export type FlightUpdate = { delay: string; departs: string; arrives: string; gate: string; note: string };

export const FLIGHT_UPDATES: FlightUpdate[] = [
  { delay: "45 min", departs: "11:20 AM", arrives: "2:55 PM", gate: "14", note: "Late inbound aircraft" },
  { delay: "2 h 10 min", departs: "12:45 PM", arrives: "4:20 PM", gate: "14", note: "Crew delayed on the inbound flight" },
  { delay: "4 h", departs: "2:35 PM", arrives: "6:10 PM", gate: "22", note: "Gate changed from 14 to 22" },
  { delay: "6 h", departs: "4:35 PM", arrives: "8:10 PM", gate: "22", note: "Replacement crew on the way" },
];

export const UPDATE_EVERY_MS = 2600;

export const scenario: ActScenario = {
  id: "flight-status",
  keeper: "tock",
  source: { image: FLIGHT_DELAY_IMAGE, title: "Boarding pass", at: "9:02 AM" },
  noticed: `${FLIGHT.number} to San Francisco is running late.`,
  why: `Your boarding pass says ${FLIGHT.from.city} to ${FLIGHT.to.city}, leaving ${FLIGHT.scheduled}, gate 14.`,
  ready: "Tock is watching the live status for you.",
  cta: "Review live flight status",
  steps: [{ kind: "calendar", title: `${FLIGHT.number} ${FLIGHT.from.city} to ${FLIGHT.to.city}`, when: `Today, ${FLIGHT.scheduled}` }],
  confirm: { title: "Flight status", lines: [], button: "Done" },
  done: delay.done,
};
