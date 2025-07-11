# 💼 Credit Project

A full system for managing credit reports, automatically generating dispute letters, and providing an internal team dashboard.

## 📁 Project Structure

```
credit-project/
├── backend/          ← API server (Node.js)
├── bot_service/      ← Bot processing service (Python)
├── credit-dashboard/ ← Frontend dashboard (React)
```

## 🚀 How to run each part

### ✅ Backend (Node.js)

API server that manages customer data, communicates with the bot, and updates statuses in MongoDB.

#### Commands

```bash
cd backend
npm install
npm start
```

### ✅ Bot Service (Python)

Service that receives credit report URLs, processes them, generates letters, uploads them to storage, and sends back links to the backend.

#### Install dependencies

```bash
cd bot_service
python -m venv venv
venv\Scripts\activate      # Windows
# or
source venv/bin/activate   # macOS/Linux

pip install -r requirements.txt
```

#### Run the server

```bash
python app.py
```

> 💬 *Note: Make sure your main Python file is named `app.py`. If it has a different name, update the command accordingly.*

### ✅ Frontend (React)

Internal dashboard for the team to manage customers, view letters, update statuses, and send files.

#### Commands

```bash
cd credit-dashboard
npm install
npm start
```

## ⚙️ Environment variables

### Backend

- `MONGO_URI` — your MongoDB connection string.
- Storage variables (e.g., AWS S3 keys) if needed.

### Bot

- `.env` file if using API keys (e.g., OpenAI).

## 📄 Recommended start order

1️⃣ Start the **bot service** (Python) first — so the backend can communicate with it.  
2️⃣ Start the **backend** (Node.js).  
3️⃣ Start the **frontend** (React).

## 🔗 Flow diagram

```
[Frontend] → [Backend] → [Bot Service] → [Storage]
     ↑                          ↓
     ←-------- Results ---------
```

## ✅ Testing

- Make sure all three servers run without errors.
- Open the frontend at `http://localhost:3000` and confirm everything loads.
- Optionally, use Postman to test API endpoints.

## 💬 Questions?

Feel free to open an issue or contact us! 🚀
