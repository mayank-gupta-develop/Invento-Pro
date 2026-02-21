import express from "express";
import session from "express-session";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs/promises";
import crypto from "crypto";

// ---------------------------------------------------------
// Setup
// ---------------------------------------------------------
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;
const APP_NAME = "Invento Pro";

// ---------------------------------------------------------
// Paths
// ---------------------------------------------------------
const publicDir = path.join(__dirname, "public");
const imagesDir = path.join(publicDir, "images");
const dataDir = path.join(__dirname, "data");

const ITEMS_FILE = path.join(dataDir, "items.json");
const CATALOG_FILE = path.join(dataDir, "catalog.json");
const BILLS_FILE = path.join(dataDir, "bills.json");
const USERS_FILE = path.join(dataDir, "users.json");

// Ensure dirs exist
await fs.mkdir(dataDir, { recursive: true }).catch(() => {});
await fs.mkdir(imagesDir, { recursive: true }).catch(() => {});

// ---------------------------------------------------------
// Helpers
// ---------------------------------------------------------
async function readJson(filePath, fallback) {
  try {
    return JSON.parse(await fs.readFile(filePath, "utf-8"));
  } catch {
    return fallback;
  }
}

async function writeJson(filePath, data) {
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  await fs.writeFile(filePath, JSON.stringify(data, null, 2));
}

const makeId = () =>
  crypto.randomUUID?.() ?? crypto.randomBytes(16).toString("hex");

// ---------------------------------------------------------
// Express config
// ---------------------------------------------------------
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

//  STATIC FILES 
app.use(express.static(publicDir));
app.use("/images", express.static(imagesDir)); // ✅ HARD FIX

app.use(
  session({
    secret: "invento-pro-secret-key",
    resave: false,
    saveUninitialized: false,
  })
);

// Globals
app.use((req, res, next) => {
  res.locals.appName = APP_NAME;
  res.locals.currentUser = req.session.user || null;
  next();
});

// Auth guard
const requireAuth = (req, res, next) =>
  req.session.user ? next() : res.redirect("/login");

// ---------------------------------------------------------
// AUTH
// ---------------------------------------------------------
app.get("/login", (req, res) => {
  res.render("login", {
    appName: APP_NAME,
    error: null,
    registered: req.query.registered === "1",
  });
});

app.post("/login", async (req, res) => {
  const users = await readJson(USERS_FILE, []);
  const user = users.find(
    u =>
      u.username === req.body.identifier ||
      u.email === req.body.identifier ||
      u.phone === req.body.identifier
  );

  if (!user || user.password !== req.body.password) {
    return res.render("login", {
      appName: APP_NAME,
      error: "Invalid credentials",
      registered: false,
    });
  }

  req.session.user = user;
  res.redirect("/inventory");
});

app.get("/signup", (req, res) => {
  res.render("signup", { appName: APP_NAME, errors: {}, old: {} });
});

app.post("/signup", async (req, res) => {
  const users = await readJson(USERS_FILE, []);
  users.push({ id: makeId(), ...req.body });
  await writeJson(USERS_FILE, users);
  res.redirect("/login?registered=1");
});

app.post("/logout", (req, res) => {
  req.session.destroy(() => res.redirect("/login"));
});

// ---------------------------------------------------------
// PAGES
// ---------------------------------------------------------
app.get("/", (req, res) =>
  req.session.user ? res.redirect("/inventory") : res.redirect("/login")
);

app.get("/inventory", requireAuth, (req, res) =>
  res.render("inventory", { appName: APP_NAME })
);

// ---------------------------------------------------------
// START
// ---------------------------------------------------------
app.listen(PORT, () =>
  console.log(`✅ ${APP_NAME} running → http://localhost:${PORT}`)
);