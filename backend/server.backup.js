import dotenv from "dotenv";
import express from "express";
import cors from "cors";
import session from "express-session";
import path from "path";
import { fileURLToPath } from "url";

import { initDb, pool } from "./db.js";
import usersRouter, { printRouter as userPrintRouter } from "./routes/users.js";
import itemsRouter from "./routes/inventory.js";
import billsRouter, { printRouter as billPrintRouter } from "./routes/bills.js";
import salesRouter from "./routes/sales.js";
import dashboardRouter from "./routes/dashboard.js";
import catalogRouter from "./routes/catalog.js";
import adminRouter from "./routes/admin.js";
import authRouter from "./routes/auth.js";
import { requireAdmin, requireAuth } from "./middleware/auth.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, "..", ".env") });
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.set("trust proxy", 1);

app.use(express.static(path.join(__dirname, "public")));
app.use(
  cors({
    origin: process.env.CORS_ORIGIN?.split(",") || ["http://localhost:8080"],
    credentials: true,
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(
  session({
    secret: process.env.SESSION_SECRET || "dev-secret",
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 1000 * 60 * 60 * 24
    }
  })
);

app.use((req, res, next) => {
  res.locals.currentUser = req.session.user || null;
  next();
});

app.use("/api/auth", authRouter);
app.use("/api/users", usersRouter);
app.use("/api/inventory", itemsRouter);
app.use("/api/items", itemsRouter);
app.use("/api/bills", billsRouter);
app.use("/api/sales", salesRouter);
app.use("/api/dashboard", dashboardRouter);
app.use("/api/catalog", catalogRouter);
app.use("/api/admin", adminRouter);

app.get("/admin*", requireAuth, requireAdmin, (_req, _res, next) => next());

app.use("/print", userPrintRouter);
app.use("/print", billPrintRouter);

app.use(
  express.static(path.resolve(__dirname, "../frontend/unified-inventory-hub-main/dist"))
);

app.get("*", (_req, res) => {
  res.sendFile(
    path.resolve(__dirname, "../frontend/unified-inventory-hub-main/dist/index.html")
  );
});

(async () => {
  try {
    await initDb();
    app.listen(PORT, () => {
      const host =
        process.env.NODE_ENV === "production"
          ? "https://your-render-app.onrender.com"
          : `http://localhost:${PORT}`;
      console.log(`✅ Invento Pro running`);
      console.log(`🌐 App URL: ${host}`);
    });
  } catch (err) {
    console.error("❌ Startup failed:", err);
    process.exit(1);
  }
})();
