import { httpRouter } from "convex/server";
import { auth } from "./auth";
import { done as whopDone, webhook as whopWebhook } from "./whop";

import { ask as siriAsk } from "./siri";

const http = httpRouter();

auth.addHttpRoutes(http);
http.route({ path: "/whop", method: "POST", handler: whopWebhook });
http.route({ path: "/whop/done", method: "GET", handler: whopDone });

http.route({ path: "/siri/ask", method: "GET", handler: siriAsk });
http.route({ path: "/siri/ask", method: "POST", handler: siriAsk });

export default http;
