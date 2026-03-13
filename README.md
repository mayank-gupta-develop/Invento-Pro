📦 Invento Pro

🚀 Live Application:
https://invento-pro-2mfi.onrender.com

Invento Pro is a full-stack inventory, catalog, billing, and sales management web application built for small businesses and retail workflows.

It focuses on backend correctness, data integrity, and real-world business logic, while delivering a clean, responsive UI with GST-compliant billing, stock tracking, and print-ready invoices.

Built as a production-style full-stack project using JavaScript end-to-end.

⸻

✨ Why This Project Exists

Most inventory apps hide complexity behind frameworks. Invento Pro intentionally builds core systems from first principles:

• Explicit session handling
• Manual SQL queries
• Deterministic stock accounting
• Server-side rendering
• Print-safe invoice generation

This makes the project an excellent demonstration of backend engineering fundamentals rather than just UI composition.

⸻

🚀 Key Features

🔐 Authentication & Authorization

• Secure login & signup
• Password hashing with bcrypt
• Session-based authentication
• Role-based access control (Admin / User)
• Server-enforced authorization (not UI-only)

⸻

📦 Inventory Management

• SKU + Category based item identification
• Batch-based stock accounting
• Accurate quantity aggregation across batches
• Automatic stock deduction on billing
• Profit calculation per item
• Catalog visibility toggle

⸻

🗂 Product Catalog

• Customer-facing catalog view
• Product image uploads (Cloudinary)
• Image processing before storage (Sharp)
• Clean separation between inventory & catalog

⸻

🧾 Billing & Invoicing

• GST-aware billing logic
• Discount support per line item
• CGST / SGST split (India-compliant)
• Year-based auto invoice numbering
• A4 / A5 invoice auto-selection
• Print-optimized layouts

⸻

📊 Sales & Reports

• Bill history
• Sales summary with filters
• CSV exports (sales, users, inventory)
• Admin-only reporting & printing

⸻

🌗 UI & Experience

• Light / Dark theme toggle
• Responsive layouts
• Dedicated print stylesheets
• Minimal JavaScript — logic handled server-side

⸻

🛠 Tech Stack & Engineering Choices

Language

JavaScript

Used across frontend and backend for:
• Faster context switching
• Shared data models
• Consistent mental model
• Production relevance

⸻

Backend

Node.js
• Non-blocking I/O
• Event-driven architecture
• Production-ready ecosystem

Express.js
• Explicit routing
• Middleware architecture
• Full control over request lifecycle

⸻

Database

PostgreSQL (Neon)

Chosen for:
• ACID compliance
• Concurrent writes
• Production realism
• Strong data integrity

Used with:
• Manual SQL queries
• Explicit joins and aggregates
• Server-side validation

⸻

Sessions

express-session + connect-pg-simple

• Sessions stored in PostgreSQL
• Stateless server restarts
• Secure authentication handling

⸻

Image Storage

Cloudinary + Sharp

• Persistent cloud storage
• Automatic CDN delivery
• Optimized image processing
• Portable database-stored URLs

⸻

Frontend Rendering

EJS (Server-Side Rendering)

Why EJS:

• Faster first paint
• SEO friendly
• Minimal client JS
• Ideal for data-heavy dashboards
• Clear separation of logic and presentation

⸻

📁 Project Structure

InventoPro/
├── server.js
├── db.js
├── cloudinary.js
│
├── public/
│   ├── css/
│   ├── js/
│   └── images/
│
├── views/
│   ├── inventory.ejs
│   ├── catalog.ejs
│   ├── billing.ejs
│   ├── bills.ejs
│   ├── sales.ejs
│   ├── admin.ejs
│   ├── login.ejs
│   ├── signup.ejs
│   ├── bill-print-a4.ejs
│   └── bill-print-a5.ejs
│
├── .env
├── package.json
├── README.md
└── nodemon.json


⸻

▶️ Running Locally

npm install
npm run dev

App runs at:

http://localhost:3000


⸻

☁️ Deployment

• Render (Node Web Service)
• Neon PostgreSQL
• Cloudinary image storage
• Environment variables managed in Render dashboard

No reliance on local filesystem persistence.

⸻

🔒 Security Considerations

• Password hashing with bcrypt
• Parameterized SQL queries
• Server-side authorization checks
• Secure session cookies
• Middleware-protected admin routes

⸻

📌 Future Enhancements

• PDF invoice generation
• Analytics dashboard
• Multi-store support
• Role-based permissions
• API rate limiting
• Dockerized deployment
• Automated tests

⸻

👤 Author

Mayank Gupta
GitHub: https://github.com/mayank-gupta-develop

⸻

📄 License

Educational & portfolio use only.
⸻
