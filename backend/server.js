import dotenv from "dotenv";
import express from "express";
import cors from "cors";
import session from "express-session";
import pgSession from "connect-pg-simple";
import path from "path";
import { fileURLToPath } from "url";
import { initDb, pool } from "./db.js";

// Import Routes
import authRouter from "./routes/auth.js";
import usersRouter from "./routes/users.js";
import inventoryRouter from "./routes/inventory.js";
import billsRouter, { printRouter as billPrintRouter } from "./routes/bills.js";
import salesRouter from "./routes/sales.js";
import dashboardRouter from "./routes/dashboard.js";
import catalogRouter from "./routes/catalog.js";
import adminRouter from "./routes/admin.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, "..", ".env") });
dotenv.config();

// Initialize Database before anything else
try {
  await initDb();
  console.log("✅ Database initialized successfully.");
} catch (err) {
  console.error("❌ Database initialization failed:", err);
  process.exit(1);
}

const app = express();
const PORT = process.env.PORT || 3000;
const PgSession = pgSession(session);

// Trust proxy for secure sessions behind reverse proxies
app.set("trust proxy", 1);

// Middleware
app.use(
  cors({
    origin: true,
    credentials: true,
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "public")));

app.use(
  session({
    store: new PgSession({
      pool: pool,
      tableName: "session",
      createTableIfMissing: true
    }),
    secret: process.env.SESSION_SECRET || "invento-pro-dev-secret",
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 1000 * 60 * 60 * 24
    }
  })
);

// Global context middleware
app.use((req, res, next) => {
  res.locals.currentUser = req.session.user || null;
  next();
});

// API Routes
app.use("/api/auth", authRouter);
app.use("/api/users", usersRouter);
app.use("/api/inventory", inventoryRouter);
app.use("/api/items", inventoryRouter); // Alias for items
app.use("/api/bills", billsRouter);
app.use("/api/billing", billsRouter); // Alias for billing
app.use("/api/sales", salesRouter);
app.use("/api/dashboard", dashboardRouter);
app.use("/api/catalog", catalogRouter);
app.use("/api/admin", adminRouter);

// Printing routes
app.use("/print", billPrintRouter);

// Landing page redirect
app.get("/", (_req, res) => {
  res.redirect("/dashboard");
});

// Production Frontend Serving
if (process.env.NODE_ENV === "production") {
  const distPath = path.resolve(__dirname, "../frontend/unified-inventory-hub-main/dist");
  app.use(express.static(distPath));
  app.get("*", (req, res) => {
    if (req.path.startsWith("/api/")) {
      return res.status(404).json({ error: "API route not found" });
    }
    res.sendFile(path.join(distPath, "index.html"));
  });
}

app.listen(PORT, () => {
  console.log(`✅ Invento Pro running on port ${PORT}`);
  console.log(`🌐 API Base: http://localhost:${PORT}/api`);
});