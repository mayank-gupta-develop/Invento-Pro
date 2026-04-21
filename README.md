# Invento Pro

> **Enterprise-grade Inventory Management, Cataloging & Billing POS Platform**  
> Built for small to medium businesses that demand accuracy, speed, and scale.

---

## 🚀 Live Application

👉 https://invento-pro-p0pm.onrender.com

---

## Overview

**Invento Pro** is a modern, full-stack Point-of-Sale and Inventory Management suite that unifies product cataloging, batch-wise stock valuation, margin tracking, GST-compliant billing, and A4 invoice generation into a single high-performance web application.

What sets Invento Pro apart is its **Dual-Environment Architecture** — a *write once, deploy anywhere* philosophy. In development, it binds to local PostgreSQL and processes assets locally for zero internet dependency. In production, it seamlessly auto-connects to **Neon Serverless PostgreSQL** and streams media assets to **Cloudinary CDN** — all without a single line of code change.

---

## Features

### Inventory Management
- Batch-wise stock tracking — restock the same item at different purchase prices
- Real-time stock level aggregation across all batches
- Average purchase cost calculation for true profit margin analysis
- Low-stock alerts and live stock validation
- CSV export for Microsoft Excel analytics

### Billing & Invoicing
- GST-compliant invoicing with variable tax matrices (CGST + SGST)
- Line-item discount support with dynamic subtotal isolation
- Auto-incrementing sequential invoice numbers tied to Financial Year (`INV-2023-2024-001`)
- Print-optimized A4 layout via native `window.print()` — no external PDF library needed
- Full billing history with reprint support

### POS Catalog Engine
- Drag-and-drop cart drafting from the product catalog
- Animated floating cart with `framer-motion` presence transitions
- One-click checkout that routes cart state directly into the billing workflow
- Catalog visibility toggle per product — publish or unpublish instantly

### Customer Management
- Customer details (name, phone, GST number, address) captured per invoice
- Full billing history per customer
- Customer search across sales records

### Sales Reporting
- Date-range filtered revenue reports
- Total GST collected, subtotal, and net revenue summaries
- CSV export for external financial analysis

### Security & Auth
- Bcrypt salted password hashing — raw passwords never persisted
- Server-side session storage backed by PostgreSQL (`connect-pg-simple`) — no memory leaks in production
- Multi-tenant architecture — every query strictly scoped to `WHERE user_id = $x`
- Role-based access control — Admin and standard user separation
- Parameterized SQL queries throughout — zero SQL injection surface

---

## Architecture

Invento Pro is structured as a **Monorepo** separating the frontend SPA from the backend Express API:

```
InventoPro/
├── backend/                        # Node.js / Express.js API server
│   ├── server.js                   # Entry point, session config, route mounting
│   ├── db.js                       # Auto-migration database initializer
│   ├── routes/
│   │   ├── auth.js                 # Register, login, logout
│   │   ├── inventory.js            # Items, stock batches, image handling
│   │   ├── billing.js              # Invoice generation, bill items
│   │   ├── sales.js                # Reporting, CSV export
│   │   ├── catalog.js              # Public catalog visibility
│   │   └── admin.js                # User management
│   └── public/uploads/             # Local media storage (dev only)
│
└── frontend/
    └── unified-inventory-hub-main/ # Vite + React 18 (TypeScript) SPA
        ├── src/
        │   ├── pages/
        │   │   ├── Inventory.tsx
        │   │   ├── Billing.tsx
        │   │   ├── Catalog.tsx
        │   │   ├── Sales.tsx
        │   │   └── Admin.tsx
        │   ├── components/         # Shadcn UI + Radix UI primitives
        │   └── lib/api.ts          # Axios instance with credentials
        └── vite.config.ts
```

---

## Tech Stack

### Frontend
| Technology | Purpose |
|---|---|
| React 18 + TypeScript | UI framework |
| Vite | Build tool & dev server |
| Tailwind CSS | Utility-first styling |
| Shadcn UI + Radix UI | Accessible component primitives |
| Framer Motion | Layout transitions & micro-interactions |
| React Router DOM | Client-side routing with state propagation |
| Axios | HTTP client with secure credential handling |
| Lucide React | Standardized icon vectors |

### Backend
| Technology | Purpose |
|---|---|
| Node.js + Express.js | Server framework |
| PostgreSQL (`pg`) | Relational database with connection pooling |
| express-session + connect-pg-simple | DB-backed session storage |
| bcrypt | Salted password hashing |
| multer | Multipart file upload interception |
| sharp | EXIF stripping, image optimization & compression |
| dotenvx | Environment variable management |

### Cloud (Production)
| Service | Purpose |
|---|---|
| Neon Serverless PostgreSQL | Production database |
| Cloudinary CDN | Optimized media asset delivery |

---

## How the Dual-Environment System Works

```
                        ┌─────────────────────────────────────────────────────────┐
                        │                    npm run dev                          │
                        │              NODE_ENV = development                     │
                        │                                                         │
                        │  PostgreSQL (local) ◄──► Express API ◄──► Vite SPA      │
                        │  Images → /backend/public/uploads (local filesystem)    │
                        │  Sessions → Local PostgreSQL session table              │
                        └─────────────────────────────────────────────────────────┘

                        ┌─────────────────────────────────────────────────────────┐
                        │                    npm start                            │
                        │               NODE_ENV = production                     │
                        │                                                         │
                        │  Neon PostgreSQL ◄──► Express API ◄──► React SPA        │
                        │  Images → Cloudinary CDN (auto-streamed)                │
                        │  Sessions → Neon PostgreSQL session table               │
                        └─────────────────────────────────────────────────────────┘
```

Zero code changes required between environments. The backend detects `NODE_ENV` and auto-routes all database connections and media uploads accordingly.

---

## Database — Zero Setup Required

On every boot, `initDb()` runs automatically and:

1. Validates `DATABASE_URL` (Neon) or falls back to local `PGDATABASE`
2. Creates the `invento` database if the environment is fresh
3. Runs schema migrations — checks and creates all tables and column constraints automatically
4. Wires all `FOREIGN KEY` relationships scoped to the authenticated user context

**You never need to run a SQL migration script manually.**

---

## Getting Started

### Prerequisites
- Node.js v18+
- PostgreSQL (local development)
- npm

### 1. Clone the repository
```bash
git clone https://github.com/mayank-gupta-develop/invento-pro.git
cd invento-pro
```

### 2. Install dependencies
```bash
npm install
npm --prefix backend install
npm --prefix frontend/unified-inventory-hub-main install
```

### 3. Configure environment variables

Create `backend/.env`:
```env
NODE_ENV=development
PGDATABASE=inventopro
PGUSER=postgres
PGPASSWORD=your_password
PGHOST=localhost
PGPORT=5432
SESSION_SECRET=your_session_secret
```

For production, add:
```env
NODE_ENV=production
DATABASE_URL=your_neon_connection_string
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

### 4. Start PostgreSQL (macOS)
```bash
brew services start postgresql@18
```

### 5. Run the application
```bash
npm run dev
```

| Service | URL |
|---|---|
| Backend API | http://localhost:3000 |
| Frontend SPA | http://localhost:8080 |

---

## Key Design Decisions

**Why batch-based stock instead of a single quantity field?**  
Physical supply chains don't work with a single number. Invento Pro models each restock as a separate batch with its own purchase price, allowing the system to calculate true average cost and real profit margins — not just stock count.

**Why PostgreSQL-backed sessions instead of in-memory?**  
Memory-based sessions crash under load and are wiped on server restart. By storing sessions in the same PostgreSQL instance, Invento Pro supports clustering, zero-downtime deploys, and horizontal scaling without session loss.

**Why client-side billing math?**  
GST calculations, discount deductions, and subtotal isolation all run on the browser. This keeps server load minimal and ensures the UI is fully responsive and interactive without round-trip latency on every keystroke.

**Why `sharp` before storage?**  
Every uploaded product image is automatically stripped of EXIF metadata, resized, and compressed before it ever touches the filesystem or Cloudinary. This protects user privacy, reduces storage costs, and ensures consistent image dimensions across the catalog.

---

## API Reference

### Auth
| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/auth/register` | Register new user |
| POST | `/api/auth/login` | Login |
| POST | `/api/auth/logout` | Logout and destroy session |

### Inventory
| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/inventory/items` | Get all items with stock totals |
| POST | `/api/inventory/items` | Add new item with optional image |
| PUT | `/api/inventory/items/:id` | Update item details |
| DELETE | `/api/inventory/items/:id` | Delete item |
| POST | `/api/inventory/items/:id/stock` | Add stock batch |

### Billing
| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/billing/bills` | Create invoice and deduct stock |
| GET | `/api/billing/bills` | Get all bills |
| GET | `/api/billing/bills/:id` | Get single bill with line items |

### Sales
| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/sales/report` | Sales report with date filter |
| GET | `/api/sales/export` | CSV export |

### Catalog
| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/catalog` | Get all catalog-visible items |
| PUT | `/api/catalog/:id/toggle` | Toggle catalog visibility |

---

## License

MIT License — see [LICENSE](LICENSE) for details.

---

## Author

**Mayank Gupta**  
BBA-IT — St. Joseph's Degree & PG College, Hyderabad  
H.T. No: 121423408005

---

*Invento Pro — Built for businesses that can't afford to get inventory wrong.*
