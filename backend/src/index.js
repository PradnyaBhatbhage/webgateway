import "dotenv/config";
import express from "express";
import cors from "cors";
import { initDb } from "./db.js";
import { seedIfEmpty } from "./seed.js";
import { auth } from "./auth.js";
import { authRouter } from "./routes/auth.js";
import { customersRouter } from "./routes/customers.js";
import { catalogRouter } from "./routes/catalog.js";
import { purchasesRouter } from "./routes/purchases.js";
import { quotesRouter } from "./routes/quotes.js";
import { salesRouter } from "./routes/sales.js";
import { jobsRouter } from "./routes/jobs.js";
import { amcRouter } from "./routes/amc.js";
import { rentalsRouter } from "./routes/rentals.js";
import { reportsRouter } from "./routes/reports.js";

const app = express();
app.use(cors());
app.use(express.json({ limit: "2mb" }));

app.get("/api/health", (_req, res) => {
  res.json({ ok: true, db: "mysql", name: "WebGateway Business System" });
});

app.use("/api/auth", authRouter);
app.use("/api", auth);
app.use("/api/customers", customersRouter);
app.use("/api/catalog", catalogRouter);
app.use("/api/purchases", purchasesRouter);
app.use("/api/quotes", quotesRouter);
app.use("/api/sales", salesRouter);
app.use("/api/jobs", jobsRouter);
app.use("/api/amc", amcRouter);
app.use("/api/rentals", rentalsRouter);
app.use("/api/reports", reportsRouter);

app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ error: err.message || "Server error" });
});

const port = Number(process.env.PORT || 4000);

initDb()
  .then(() => seedIfEmpty())
  .then(() => {
    app.listen(port, () => {
      console.log(`WebGateway API on http://localhost:${port} (MySQL)`);
    });
  })
  .catch((err) => {
    console.error("MySQL startup failed:", err.message);
    process.exit(1);
  });
