# Deployment

This repository is prepared for local development and conventional Node/Python hosting.
No external deployment has been created.

## Backend

Use Python 3.12 or newer. From the repository root:

```sh
python -m pip install -c backend/constraints.txt ./backend
uvicorn app.main:app --host 0.0.0.0 --port 8000
```

Set `CORS_ORIGINS` to a JSON array containing the exact frontend origin if hosting
the frontend separately. The canonical dataset is packaged with the backend; no
external card service is contacted at request time. Restart after changing data.

## Frontend

```sh
cd frontend
npm ci
npm run build
```

Serve `frontend/dist` with a static web server. Rewrite frontend routes such as
`/guided`, `/results`, and `/cards/savor` to `index.html`. Reverse-proxy `/api/` to
FastAPI. The app intentionally uses relative API URLs; no secrets or backend keys
belong in frontend environment variables. Vite's development proxy is not a
production reverse proxy.

Example nginx routing (adjust paths and upstream to your host):

```nginx
location /api/ {
    proxy_pass http://127.0.0.1:8000;
    proxy_read_timeout 40s;
}
location / {
    try_files $uri $uri/ /index.html;
}
```

Keep AI disabled until its optional backend dependency and server-only configuration
are present. Before exposing paid AI parsing publicly, configure host-level rate
limits, concurrency limits, and provider spending limits. The local portfolio app
does not include user accounts or distributed quota enforcement.

The app logs route templates, status codes, recommendation counts, algorithm version,
and AI success/failure. It does not log preference bodies, full prompts, or API keys.
Use HTTPS and your host's secret storage for production configuration.
