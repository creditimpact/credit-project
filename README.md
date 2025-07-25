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

The backend exposes a `/health` route that returns `OK`. Use it for container health checks in production.
All server logs are written in structured form to stdout/stderr so they can be collected by container platforms.

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
python main.py
```

The bot service also provides a `/health` route for health checks.

### ✅ Frontend (React)

Internal dashboard for the team to manage customers, view letters, update statuses, and send files.

#### Commands

```bash
cd credit-dashboard
npm install
npm start
```

## ⚙️ Environment variables

Each service contains a `.env.example` file. Copy it to `.env` and adjust the
values for your setup.

### Backend

- `MONGO_URI` — MongoDB connection string
- `PORT` — port for the Node server (default 5000)
- `ALLOWED_ORIGIN` — origin allowed for CORS requests
- `BOT_PROCESS_URL` — bot endpoint for processing requests
- `BOT_START_URL` — optional URL the backend pings on startup to wake the bot
- `APP_MODE` — "real" or "testing" to control how the bot generates letters
- `AWS_REGION`, `AWS_S3_BUCKET`, `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY` — storage credentials
- `AWS_SECRET_NAME` (or `AWS_SECRETS_NAME`) — name of the AWS Secrets Manager secret to load
- `JWT_SECRET` — secret key for signing JSON Web Tokens
- `ADMIN_USER` — default admin username
- `ADMIN_PASS_HASH` — scrypt hash of the admin password in the form `salt$hash`
- `ENABLE_CRON` — set to `true` to run the optional scheduled job. Enable this on only one backend instance or use a locking mechanism to avoid duplicate runs.

### Bot

- `BACKEND_URL` — URL to the backend callback endpoint
 - `BOT_TOKEN` — shared secret used when the bot service calls `/api/bot/*`
- The same AWS variables as above if uploading to the same bucket
- `AWS_SECRET_NAME` (or `AWS_SECRETS_NAME`) — name of the AWS Secrets Manager secret to load
- Any additional API keys (e.g., OpenAI) placed in `.env`

### Frontend

- `REACT_APP_BACKEND_URL` — base URL for the backend API (leave empty for same-origin)

### AWS Secrets Manager

Both services can optionally load secrets from AWS Secrets Manager. Set `AWS_SECRET_NAME` (or `AWS_SECRETS_NAME`) to the name of the secret containing key/value pairs. Any variables not already set in the environment will be loaded from the secret. When the secret cannot be fetched, the services continue using values from `.env` files and `os.environ`.

## 📂 Uploads structure

Uploaded files are stored under the `backend/uploads` folder when running
locally so that both services reference the same directory.

- Credit reports → `backend/uploads/reports/<clientId>/`
- Generated letters → `backend/uploads/letters/<clientId>/`

Folders are created automatically if they do not exist.

Uploads are limited to **10MB** and must be PDF files. Any other type or larger
file will be rejected with a `400` error.

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

## 🐳 Docker Compose

A `docker-compose.yml` file is included for a quick local setup. It starts
MongoDB, the backend API, the bot service and the frontend in one command:

```bash
docker-compose up --build
```

Edit the environment variables in the compose file if you need to adjust
connections or credentials.

When running the stack without Amazon S3 you must make sure that the
`backend/uploads` directory is shared between the backend and bot service so
that uploaded files are accessible to both containers. Either configure the AWS
S3 variables in `.env` or mount the folder as a volume as shown in the compose
file.

## ✅ Testing

- Make sure all three servers run without errors.
- Open the frontend at `http://localhost:3000` and confirm everything loads.
- Optionally, use Postman to test API endpoints.

## ☁️ AWS deployment

1. **Build and push images** to [Amazon ECR](https://aws.amazon.com/ecr/):

   ```bash
   docker build -t my-backend ./backend
   docker build -t my-bot ./bot_service
   docker tag my-backend <account>.dkr.ecr.<region>.amazonaws.com/my-backend
   docker tag my-bot <account>.dkr.ecr.<region>.amazonaws.com/my-bot
   docker push <account>.dkr.ecr.<region>.amazonaws.com/my-backend
   docker push <account>.dkr.ecr.<region>.amazonaws.com/my-bot
   ```

2. **Create an ECS service or Elastic Beanstalk environment** using the pushed
   images. Set the same environment variables shown in `docker-compose.yml`.
   MongoDB can be provided by an Atlas cluster or a self‑hosted container.
   When running containers, use internal URLs such as `http://backend:5000` for
   `BACKEND_URL` and `http://bot:6000` for the bot service endpoints.

3. **Deploy updates** by rebuilding the images, pushing them to ECR and
   redeploying the service.

## 💬 Questions?

Feel free to open an issue or contact us! 🚀
