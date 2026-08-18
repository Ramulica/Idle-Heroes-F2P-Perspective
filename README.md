# Idle Heroes F2P Perspective

A community helper for Idle Heroes: **CSG Calculator**, Mysterious Sale **floor planner**, and per-account **cases**. Create an account to save calculator settings, ratings, and cases.

Local app: [http://127.0.0.1:8001](http://127.0.0.1:8001)

## Stack

- Django API and app server
- React (Vite) frontend, served from `frontend/dist`
- SQLite database (`db.sqlite3`, not committed)

## Run locally

Needs **Python 3.11+** and **Node.js 18+**.

On Windows, from this folder:

```powershell
.\start.ps1
```

That installs Python deps, builds the frontend, migrates, seeds Mysterious Sale data, and starts the server on port **8001**.

Or step by step:

```powershell
python -m pip install -r requirements.txt
cd frontend
npm install
npm run build
cd ..
python manage.py migrate
python manage.py seed_data
python manage.py runserver 8001
```

After frontend edits, run `npm run build` in `frontend/` again (Django serves the built files).

## Tools

- **CSG Calculator** — Contract Starry Gem income from Void Corruption, awakens, Soul Gala, and extra sources. 17 event weeks = 1 year for case estimates.
- **Mysterious Sale** — 13-floor completion options (shared) and cases (per user).

## Notes

- Completions are shared community routes. Cases belong to your account.
- Re-seed community floors/options with `python manage.py seed_data`. Use `--reset` only if you want to wipe that seed data.
- Completions are shared community routes. Cases belong to your account.
- Re-seed community floors/options with `python manage.py seed_data`. Use `--reset` only if you want to wipe that seed data.

## Render

Use a **Python 3** web service on the **Free** instance.

- Root Directory: empty
- Build Command: `bash build.sh`
- Start Command: `gunicorn ih_f2p.wsgi:application --bind 0.0.0.0:$PORT --workers 1`
- Environment: `DEBUG=False` and a generated `SECRET_KEY`

Free instances sleep when idle. SQLite data on Render is wiped on each deploy.
