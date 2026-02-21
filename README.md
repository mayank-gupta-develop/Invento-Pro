# Invento Pro

Invento Pro is a full-stack inventory, catalog, and billing management web application designed for small businesses.  
It helps manage products, stock, GST-based billing, and sales reports through a clean, modern interface.

---

## 🚀 Features

- 🔐 User authentication (Login / Signup)
- 📦 Inventory management with quantity tracking
- 🗂 Product catalog with image support
- 🧾 Billing system with GST calculation
- 📉 Automatic stock deduction on billing
- 📊 Sales & reports view
- 🌗 Light / Dark theme toggle
- 📤 Export inventory as CSV
- 💻 Fully responsive UI

---

## 🛠 Tech Stack

- **Backend:** Node.js, Express.js  
- **Frontend:** EJS, Vanilla JavaScript, CSS  
- **Storage:** JSON files (no database)  
- **Session Management:** express-session  

---

## 📁 Project Structure

InventoPro/
├── server.js
├── package.json
├── nodemon.json
├── public/
│   ├── style.css
│   ├── theme.js
│   └── images/
│       ├── logo.png
│       └── warehouse-bg.jpg
├── views/
│   ├── login.ejs
│   ├── signup.ejs
│   ├── inventory.ejs
│   ├── catalog.ejs
│   ├── billing.ejs
│   ├── bills.ejs
│   └── sales.ejs
├── data/            # ignored in GitHub (runtime data)
└── README.md

---

## ▶️ How to Run Locally

### 1️⃣ Install dependencies
```bash
npm install

2️⃣ Start the server

node server.js

or (recommended during development)

npx nodemon server.js

3️⃣ Open in browser

http://localhost:3000


⸻

🔒 Important Notes
	•	This project uses JSON files instead of a database
	•	Passwords are currently stored in plain text (learning/demo purpose only)
	•	data/*.json files are ignored in GitHub to prevent leaking user data

⸻

📌 Future Improvements
	•	Password hashing (bcrypt)
	•	Database integration (PostgreSQL / MongoDB)
	•	Role-based access (Admin / Staff)
	•	PDF invoice generation
	•	Analytics dashboard
	•	Cloud deployment

⸻

📄 License

This project is for educational and portfolio purposes.

⸻

👤 Author

Built by Mayank Gupta, Kunal Jain
GitHub: https://github.com/mayank-gupta-develop

---