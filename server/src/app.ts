import cors from "cors";
import express from "express";
import { rateLimit } from "express-rate-limit";
import helmet from "helmet";
import { env } from "./config.js";
import { requireAuth, type AuthRequest } from "./middleware/auth.js";
import { practiceRouter } from "./routes/practice.js";
import { toolsRouter } from "./routes/tools.js";

export const app = express();

app.disable("x-powered-by");
app.use(helmet());
app.use(cors({ origin: env.CLIENT_ORIGIN, allowedHeaders: ["Authorization", "Content-Type"] }));
app.use(express.json({ limit: "32kb" }));
app.use(
  "/api/v1",
  rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 120,
    standardHeaders: "draft-7",
    legacyHeaders: false,
  }),
);

app.get("/api/v1/health", (_request, response) => {
  response.json({ data: { status: "ok", service: "prepforge-api" } });
});

app.get("/api/v1/session", requireAuth, (request: AuthRequest, response) => {
  response.json({ data: { user: request.auth } });
});

app.use("/api/v1/practice", practiceRouter);
app.use("/api/v1/tools", toolsRouter);

app.use((_request, response) => {
  response.status(404).json({
    error: { code: "NOT_FOUND", message: "The requested resource was not found." },
  });
});

app.use(
  (
    error: unknown,
    _request: express.Request,
    response: express.Response,
    _next: express.NextFunction,
  ) => {
    console.error("Unhandled API error:", error);
    response.status(500).json({
      error: { code: "INTERNAL_ERROR", message: "Something went wrong. Please try again." },
    });
  },
);
