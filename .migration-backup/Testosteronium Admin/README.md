# Testosteronium — Asset Tracker

A mini asset tracker with three views:
- **Tracked Assets** — devices reporting in live through a lightweight agent
- **Manual Assets** — records added by hand or imported from Excel/CSV
- **Fetching Assets** — devices seen on the network/Wi-Fi that aren't in either list yet

This guide takes a **brand new device** from zero to a fully running app.

---

## 0. What you need installed first

| Tool | Check with | Get it from |
|---|---|---|
| Git | `git --version` | https://git-scm.com |
| Python 3.9+ | `python3 --version` | https://python.org |
| Node.js 18+ & npm | `node -v` && `npm -v` | https://nodejs.org |
| MySQL Server 8+ | `mysql --version` | https://dev.mysql.com/downloads |

On Linux you can usually get everything except Node from your package manager:
```bash
sudo apt update
sudo apt install git python3 python3-venv python3-pip mysql-server
```
For Node, use [nvm](https://github.com/nvm-sh/nvm) rather than the distro package (it's usually outdated):
```bash
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.1/install.sh | bash
nvm install --lts
```

---

## 1. Get the code onto the device

```bash
git clone https://github.com/syrma-it/Testoteronium.git testosteronium_app
cd testosteronium_app
```

Expected layout once everything below is in place:
```
testosteronium_app/
├── backend/
│   ├── app.py
│   ├── db.py
│   ├── netscan.py
│   ├── schema.sql
│   ├── .env               (you create this — never commit it)
│   ├── requirements.txt
│   └── routes/
│       ├── __init__.py
│       ├── tracked.py
│       ├── manual.py
│       ├── fetching.py
│       └── summary.py
├── frontend/
│   └── src/
│       ├── App.js
│       ├── index.css
│       └── components/
│           ├── Home.js
│           ├── Home.css
│           ├── NextPage.js
│           ├── NextPage.css
│           └── components/
│               ├── TrackedAssets.js
│               ├── ManualAssets.js
│               ├── FetchingAssets.js
│               └── AssetTable.css
├── agent/
│   ├── agent.py
│   └── requirements.txt
├── .gitignore
└── README.md
```

---

## 2. MySQL — create the database

Start MySQL if it isn't already running:
```bash
sudo systemctl start mysql        # Linux
# macOS (Homebrew): brew services start mysql
# Windows: start it from Services, or MySQL Workbench
```

Log in and run the schema:
```bash
mysql -u root -p < backend/schema.sql
```
This creates the `testosteronium` database with three tables: `tracked_assets`, `manual_assets`, `fetching_assets`.

---

## 3. Backend setup

```bash
cd backend

# create and enter a virtual environment
python3 -m venv venv
source venv/bin/activate          # Windows: venv\Scripts\activate

# install dependencies using the active interpreter directly
# (safer than bare `pip` if venv paths ever get confused after moving folders)
python -m pip install -r requirements.txt

# configure your database connection
cp .env.example .env
nano .env        # fill in MYSQL_HOST / MYSQL_USER / MYSQL_PASSWORD
```

Your `.env` should look like:
```
MYSQL_HOST=localhost
MYSQL_PORT=3306
MYSQL_USER=root
MYSQL_PASSWORD=your_real_password
MYSQL_DB=testosteronium
SCAN_SUBNET=
```

Run it:
```bash
python app.py
```

You should see:
```
 * Running on http://127.0.0.1:5000
```

Sanity check in another terminal:
```bash
curl http://localhost:5000/api/health
curl http://localhost:5000/api/assets/summary
```
The second should return `{"tracked": 0, "manual": 0, "fetching": 0}` on a fresh install.

**Leave this terminal running** — the backend needs to stay up.

---

## 4. Frontend setup

Open a **new terminal** (keep the backend running in the other one):

```bash
cd testosteronium_app/frontend
npm install
npm start
```

This opens `http://localhost:3000` automatically. Click through to `/next` — the three cards should show `0` for each count and a small notice only if the backend isn't reachable.

---

## 5. Agent setup (populates Tracked Assets)

The agent runs on **any machine you want to appear as a tracked device** — could be this same device, or a different one on the network.

```bash
cd testosteronium_app/agent
python3 -m venv venv
source venv/bin/activate          # Windows: venv\Scripts\activate
python -m pip install -r requirements.txt

# point it at your backend (use the backend machine's real IP if running
# the agent from a different device)
export TESTO_BACKEND_URL=http://localhost:5000     # Windows: set TESTO_BACKEND_URL=...
python agent.py
```

It checks in immediately, then every 5 minutes. Confirm it worked:
```bash
curl http://localhost:5000/api/assets/tracked
```

To flip devices to "offline" after they stop checking in, call this periodically (e.g. via cron every 5 minutes):
```bash
curl -X POST "http://localhost:5000/api/assets/tracked/mark-offline?minutes=10"
```

---

## 6. Populate Manual Assets

Add one by hand:
```bash
curl -X POST http://localhost:5000/api/assets/manual \
  -H "Content-Type: application/json" \
  -d '{"name":"Conference Room Projector","type":"Projector","owner":"Facilities","location":"3rd Floor"}'
```

Or bulk-import an Excel/CSV file (columns: `name, type, owner, location, serial, notes`):
```bash
curl -X POST http://localhost:5000/api/assets/manual/import \
  -F "file=@/path/to/assets.xlsx"
```

---

## 7. Populate Fetching Assets

Trigger a network scan (pings your whole subnet, takes a few seconds):
```bash
curl -X POST http://localhost:5000/api/assets/fetching/scan
```
Then:
```bash
curl http://localhost:5000/api/assets/fetching
```
Anything already claimed in Tracked Assets is automatically excluded.

---

## 8. Day-to-day: starting the app again later

Once everything above is done once, starting the app again on the same device is just:

**Terminal 1 — backend:**
```bash
cd testosteronium_app/backend
source venv/bin/activate
python app.py
```

**Terminal 2 — frontend:**
```bash
cd testosteronium_app/frontend
npm start
```

**Optional — agent, if you want live check-ins:**
```bash
cd testosteronium_app/agent
source venv/bin/activate
python agent.py
```

---

## Troubleshooting

**`bad interpreter: No such file or directory` when running pip/python in a venv**
Your project folder was moved after the venv was created — venv scripts hardcode an absolute path. Delete and recreate it:
```bash
rm -rf venv
python3 -m venv venv
source venv/bin/activate
python -m pip install -r requirements.txt
```

**`ModuleNotFoundError` right after activating a venv**
Usually means the `pip install` before it silently failed (often the same bad-interpreter issue above). Re-run the install and check for errors before moving on — don't skip past a failed install.

**Frontend shows the "backend not reachable" notice on `/next`**
Backend isn't running, isn't on port 5000, or CORS is blocked. Confirm with `curl http://localhost:5000/api/health` first.

**Network scan (`/api/assets/fetching/scan`) finds nothing**
Some routers isolate wireless clients from each other ("AP/client isolation" or "guest network" settings) — ARP replies won't reach the scanning machine in that case. Also confirm the backend machine and target devices are on the same subnet.