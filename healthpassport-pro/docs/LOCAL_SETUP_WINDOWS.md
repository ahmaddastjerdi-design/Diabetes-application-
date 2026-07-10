# Running HealthPassport Pro on Windows — beginner guide

This guide assumes **no programming experience**. Follow it top to bottom.
Every command is copy‑paste. If a step doesn't match what you see on screen,
stop and read the **Troubleshooting** section at the bottom — don't guess.

There are two ways to run the app:

- **Option A — Docker (recommended, easiest).** One command. Docker runs the
  database and the app together. Start here.
- **Option B — Manual (no Docker).** More steps; you install Node.js and
  PostgreSQL yourself. Only use this if you can't use Docker.

---

## Before you start — quick facts

| Thing | Value |
| --- | --- |
| Folder to open in VS Code | **`healthpassport-pro`** (the sub‑folder, not the top repo folder) |
| Node.js version (Option B) | **Node 20 LTS** |
| Package manager | **npm** |
| Database | **PostgreSQL** (Docker provides it in Option A) |
| Address to open in browser | **http://localhost:3000** |
| Demo login | **demo@healthpassport.local** / **Demo!12345** |

---

## Option A — Run with Docker (recommended)

### A1. Install the tools (one time)

1. **Git** — download from <https://git-scm.com/download/win>, run the installer,
   click *Next* on every screen (defaults are fine).
2. **Docker Desktop** — download from <https://www.docker.com/products/docker-desktop/>,
   install, then **open Docker Desktop and wait** until the whale icon in the
   bottom bar stops animating and says *Engine running*. Docker **must be open
   and running** the whole time.
3. **VS Code** — download from <https://code.visualstudio.com/>.

### A2. Get the code

1. Open **VS Code**.
2. Open a terminal inside VS Code: top menu → **Terminal → New Terminal**.
   A panel opens at the bottom. This is where you type commands.
3. Copy‑paste this and press **Enter**:

   ```powershell
   git clone -b claude/healthpassport-pro-architecture-h6jnf7 https://github.com/ahmaddastjerdi-design/diabetes-application-.git
   ```

   > `-b claude/healthpassport-pro-architecture-h6jnf7` picks the correct
   > branch. This matters — the app is on that branch.

4. Move into the app folder:

   ```powershell
   cd diabetes-application-/healthpassport-pro
   ```

### A3. Start the app

Copy‑paste this and press **Enter**:

```powershell
docker compose up --build
```

- The **first time**, this downloads and builds everything. It can take
  **5–10 minutes**. Lots of text will scroll — that's normal.
- **Wait** until the scrolling slows and you see lines like:

  ```
  → Applying database migrations (prisma migrate deploy)…
  → Seeding a synthetic demo patient (SEED_DEMO=true)…
  → Starting HealthPassport Pro on http://0.0.0.0:3000
  ✓ Ready
  ```

  When you see **`✓ Ready`**, the app is running. **Leave this terminal open** —
  closing it stops the app.

### A4. Open it in your browser

1. Open Chrome / Edge / Firefox.
2. In the address bar type exactly this and press Enter (use `http://`, **not**
   `https://`):

   ```
   http://localhost:3000
   ```

3. Sign in:
   - **Email:** `demo@healthpassport.local`
   - **Password:** `Demo!12345`

You're in. 🎉 Try **Vitals → add a reading** like `185/125` and watch the safety
alert appear on the dashboard.

### A5. Stop / start again

- **Stop:** click the terminal, press `Ctrl` + `C`. Then optionally:
  ```powershell
  docker compose down
  ```
- **Start again later** (fast — no rebuild):
  ```powershell
  docker compose up
  ```
- **Erase all data and start fresh:**
  ```powershell
  docker compose down -v
  ```

That's the whole thing. **You can ignore Option B below.**

---

## Option B — Run manually (no Docker)

Only do this if you cannot use Docker. It requires installing PostgreSQL.

### B1. Install the tools (one time)

1. **Node.js 20 LTS** — download the **LTS** version from
   <https://nodejs.org/>, install with defaults. Check it worked:

   ```powershell
   node --version
   ```

   You should see something starting with `v20.` (or newer).

2. **PostgreSQL** — download from
   <https://www.postgresql.org/download/windows/>, install. During setup it
   asks for a **password for the `postgres` user** — remember it. Keep the
   default port **5432**.

3. **Git** and **VS Code** — same as Option A.

### B2. Get the code and install packages

```powershell
git clone -b claude/healthpassport-pro-architecture-h6jnf7 https://github.com/ahmaddastjerdi-design/diabetes-application-.git
cd diabetes-application-/healthpassport-pro
npm install
```

`npm install` downloads the app's building blocks. Wait for it to finish.

### B3. Create the database

Open **pgAdmin** (installed with PostgreSQL) or the **SQL Shell (psql)**, connect
with your `postgres` password, and create a database named `healthpassport`.
In SQL Shell you can just run:

```sql
CREATE DATABASE healthpassport;
```

### B4. Create your `.env` file

1. In VS Code's file list, find **`.env.example`** inside `healthpassport-pro`.
2. Make a copy named **`.env`** (in the terminal):

   ```powershell
   Copy-Item .env.example .env
   ```

3. Open `.env` and set the two database lines to use **your** postgres password
   (replace `YOURPASSWORD`):

   ```
   DATABASE_URL="postgresql://postgres:YOURPASSWORD@localhost:5432/healthpassport?schema=public"
   DIRECT_URL="postgresql://postgres:YOURPASSWORD@localhost:5432/healthpassport?schema=public"
   ```

4. Set a secret (any long random text is fine for local):

   ```
   AUTH_SECRET="my-very-long-random-local-secret-1234567890"
   ```

   Leave `AUTH_URL`, `AUTH_TRUST_HOST`, and `NODE_ENV` as they are.

### B5. Set up the database tables and start the app

```powershell
npx prisma generate
npx prisma migrate deploy
npm run dev
```

- `prisma generate` prepares the database client.
- `prisma migrate deploy` creates all the tables.
- `npm run dev` starts the app. Wait for a line that says **`Ready`** and shows
  `http://localhost:3000`.

*(Optional)* to load the synthetic demo patient:

```powershell
node prisma/demo-seed.mjs
```

### B6. Open it

Go to **http://localhost:3000**. If you seeded the demo, sign in with
`demo@healthpassport.local` / `Demo!12345`. Otherwise click **Register** and
create your own account.

Stop the app with `Ctrl` + `C` in the terminal.

---

## Troubleshooting

**Browser says "This site can't be reached" / "connection refused".**
The app isn't ready yet, or you used the wrong address.
1. Check the terminal — did you see **`✓ Ready`** (Docker) or **`Ready`**
   (manual)? If not, it's still starting; wait and refresh.
2. Make sure you typed **`http://localhost:3000`** — with `http://`, not
   `https://`. Browsers sometimes force `https`, which will not work here.
3. Try **`http://127.0.0.1:3000`** instead.

**"docker: command not found" or "Cannot connect to the Docker daemon".**
Docker Desktop isn't running. Open the Docker Desktop app and wait for
*Engine running*, then run the command again. (After installing Docker you may
need to close and reopen VS Code.)

**Port 3000 is already in use.**
Something else is using that port. Easiest fix: open `docker-compose.yml`,
change `'3000:3000'` to `'3001:3000'`, save, run `docker compose up` again, and
open **http://localhost:3001**.

**The build seems stuck on `npm ci` / `npm install`.**
It's downloading — this is slow on the first run. Give it several minutes. As
long as text appears occasionally, it's working.

**`npx prisma migrate deploy` says it can't reach the database (Option B).**
PostgreSQL isn't running, or the password/port in `.env` is wrong. Confirm the
Postgres service is running and that `DATABASE_URL` uses your real password and
port `5432`.

**I closed the terminal and the app stopped.**
That's expected — the terminal *is* the app. Start it again with
`docker compose up` (Option A) or `npm run dev` (Option B).

**Something else / an error message I don't understand.**
Copy the **last 15 lines** from the terminal and share them — that text says
exactly what went wrong.

---

## What you should see when it works

A blue **HealthPassport Pro** sign‑in page at `http://localhost:3000`. After
signing in with the demo account, the dashboard shows a flagged blood‑pressure
reading (185/125), trend charts, conditions, medications, reminders, and an
activity feed — all from a real database running on your machine. No real
patient data is ever used; the demo patient is entirely synthetic.
