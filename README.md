📦 Invento Pro

Invento Pro is a full-stack inventory, catalog, billing, and sales management web application built for small businesses and retail workflows.

It focuses on backend correctness, data integrity, and real-world business logic, while delivering a clean, responsive UI with GST-compliant billing, stock tracking, and print-ready invoices.

Built as a production-style full-stack project using JavaScript end-to-end.

⸻

✨ Why This Project Exists

Most inventory apps hide complexity behind frameworks.
Invento Pro intentionally builds core systems from first principles:
	•	Explicit session handling
	•	Manual SQL queries
	•	Deterministic stock accounting
	•	Server-side rendering
	•	Print-safe invoice generation

This makes the project an excellent demonstration of backend engineering fundamentals rather than just UI composition.

⸻

🚀 Key Features

🔐 Authentication & Authorization
	•	Secure login & signup
	•	Password hashing with bcrypt
	•	Session-based authentication
	•	Role-based access control (Admin / User)
	•	Server-enforced authorization (not UI-only)

⸻

📦 Inventory Management
	•	SKU + Category based item identification
	•	Batch-based stock accounting
	•	Accurate quantity aggregation across batches
	•	Automatic stock deduction on billing
	•	Profit calculation per item
	•	Catalog visibility toggle

⸻

🗂 Product Catalog
	•	Customer-facing catalog view
	•	Product image uploads (Cloudinary)
	•	Image processing before storage (Sharp)
	•	Clean separation between inventory & catalog

⸻

🧾 Billing & Invoicing
	•	GST-aware billing logic
	•	Discount support per line item
	•	CGST / SGST split (India-compliant)
	•	Year-based auto invoice numbering
	•	A4 / A5 invoice auto-selection
	•	Print-optimized layouts (no browser hacks)

⸻

📊 Sales & Reports
	•	Bill history
	•	Sales summary with filters
	•	CSV exports (sales, users, inventory)
	•	Admin-only reporting & printing

⸻

🌗 UI & Experience
	•	Light / Dark theme toggle
	•	Responsive layouts
	•	Dedicated print stylesheets
	•	Minimal JS — logic lives where it belongs (server)

⸻

🛠 Tech Stack & Engineering Choices

Language

JavaScript
Used across frontend and backend for:
	•	Faster context switching
	•	Shared data models
	•	Consistent mental model
	•	Production relevance

⸻

Backend

🟢 Node.js
Chosen for:
	•	Non-blocking I/O (ideal for DB + file uploads)
	•	Event-driven architecture
	•	Mature ecosystem for web infrastructure
	•	First-class JavaScript support

🟢 Express.js
Used instead of heavy frameworks because:
	•	Explicit routing = better control
	•	Middleware-driven design
	•	Easy to reason about request lifecycle
	•	Industry-standard for backend interviews

⸻

Database

🟢 PostgreSQL (Render)
Chosen over SQLite for:
	•	ACID compliance
	•	Concurrent writes
	•	Production realism
	•	Better data integrity guarantees

Used with:
	•	Manual SQL queries (no ORM abstraction)
	•	Explicit joins and aggregates
	•	Server-side validation

⸻

Sessions

🟢 express-session + connect-pg-simple
	•	Sessions stored in PostgreSQL
	•	Stateless server restarts
	•	Production-safe authentication
	•	No JWT misuse for session problems

⸻

Image Storage

🟢 Cloudinary + Sharp
Why not local storage?
	•	Render filesystem is ephemeral
	•	Cloudinary provides CDN + persistence
	•	Sharp ensures optimized image size
	•	URLs stored in DB → scalable & portable

⸻

Frontend Rendering

🟢 EJS (Instead of Static HTML or SPA)
Why EJS?
	•	Server-side rendering
	•	Faster first paint
	•	SEO-friendly
	•	No client hydration complexity
	•	Ideal for data-driven dashboards
	•	Clean separation of logic & presentation

This mirrors how many internal tools and enterprise dashboards are built, even today.

⸻

📁 Project Structure

InventoPro/
├── server.js              # Express server & routes
├── db.js                  # PostgreSQL init & queries
├── cloudinary.js          # Cloudinary configuration
│
├── public/
│   ├── css/               # Modular stylesheets
│   ├── js/                # Page-specific frontend logic
│   └── images/            # Static assets
│
├── views/                 # EJS templates
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
├── .env                   # Environment variables
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

☁️ Deployment (Render)
	•	Render Web Service (Node)
	•	Render PostgreSQL
	•	Cloudinary for image storage
	•	Environment variables configured in Render dashboard

⚠️ No reliance on local filesystem persistence.

⸻

🔒 Security Considerations
	•	Password hashing with bcrypt
	•	Parameterized SQL queries
	•	Server-side authorization checks
	•	Session cookies with proper flags
	•	Admin routes protected at middleware level

⸻

📌 Future Enhancements
	•	PDF invoice generation
	•	Analytics dashboard
	•	Multi-store support
	•	Role-based permissions
	•	API rate limiting
	•	Dockerized deployment
	•	Automated tests

⸻

👤 Author

Mayank Gupta
GitHub: https://github.com/mayank-gupta-develop

⸻

📄 License

Educational & portfolio use only.

⸻
