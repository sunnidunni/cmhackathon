import { httpRouter } from "convex/server";
import { auth } from "./auth";
import { done as whopDone, webhook as whopWebhook } from "./whop";

const http = httpRouter();

auth.addHttpRoutes(http);
http.route({ path: "/whop", method: "POST", handler: whopWebhook });
http.route({ path: "/whop/done", method: "GET", handler: whopDone });

export default http;
