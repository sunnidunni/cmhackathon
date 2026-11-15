import { httpRouter } from "convex/server";
import { auth } from "./auth";
import { webhook as whopWebhook } from "./whop";

const http = httpRouter();

auth.addHttpRoutes(http);
http.route({ path: "/whop", method: "POST", handler: whopWebhook });

export default http;
