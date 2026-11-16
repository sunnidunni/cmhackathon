import type { ActScenario } from "../types";
import { scenario as bill } from "./bill";
import { scenario as calendar } from "./calendar";
import { scenario as delay } from "./delay";
import { scenario as flightStatus } from "./flightStatus";
import { scenario as pizza } from "./pizza";

export const DEMO_ACTS: ActScenario[] = [pizza, flightStatus, delay, bill, calendar];
