"""Start both development servers: python scripts/dev.py (Ctrl+C stops both)."""

import argparse
import os
import shutil
import subprocess
import sys
import time
from pathlib import Path
from urllib.error import URLError
from urllib.request import urlopen

ROOT = Path(__file__).resolve().parents[1]


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "--check", action="store_true", help="Verify startup and stop both servers"
    )
    args = parser.parse_args()
    python = (
        ROOT / ".venv" / ("Scripts/python.exe" if os.name == "nt" else "bin/python")
    )
    vite = ROOT / "frontend/node_modules/vite/bin/vite.js"
    node = shutil.which("node")
    if not python.exists() or not vite.exists() or not node:
        print(
            "Install dependencies first; see README.md. Python .venv and Node.js are required."
        )
        return 1
    processes: list[subprocess.Popen[bytes]] = []
    flags = subprocess.CREATE_NO_WINDOW if os.name == "nt" else 0
    try:
        processes.append(
            subprocess.Popen(
                [
                    str(python),
                    "-m",
                    "uvicorn",
                    "app.main:app",
                    "--host",
                    "127.0.0.1",
                    "--port",
                    "8000",
                ],
                cwd=ROOT / "backend",
                creationflags=flags,
            )
        )
        processes.append(
            subprocess.Popen(
                [
                    node,
                    str(vite),
                    "--host",
                    "127.0.0.1",
                    "--port",
                    "5173",
                    "--strictPort",
                ],
                cwd=ROOT / "frontend",
                creationflags=flags,
            )
        )
        print(
            "CardMatch: http://127.0.0.1:5173\nAPI docs: http://127.0.0.1:8000/docs\nCtrl+C stops both servers.",
            flush=True,
        )
        started = time.monotonic()
        while all(process.poll() is None for process in processes):
            if args.check:
                try:
                    with urlopen(
                        "http://127.0.0.1:5173/api/v1/health", timeout=2
                    ) as response:
                        healthy = response.status == 200 and b'"ok"' in response.read()
                    with urlopen("http://127.0.0.1:5173/", timeout=2) as response:
                        frontend_ready = (
                            response.status == 200 and b"CardMatch" in response.read()
                        )
                    if healthy and frontend_ready:
                        print("Frontend, API, and development proxy are ready.")
                        return 0
                except (OSError, URLError):
                    pass
                if time.monotonic() - started > 25:
                    print("Startup check timed out.")
                    return 1
            time.sleep(0.5)
        print(
            "A server stopped. Check the output above (ports 5173 and 8000 must be available)."
        )
        return 1
    except KeyboardInterrupt:
        return 0
    finally:
        for process in processes:
            if process.poll() is None:
                process.terminate()
        for process in processes:
            try:
                process.wait(timeout=5)
            except subprocess.TimeoutExpired:
                process.kill()
                process.wait()


if __name__ == "__main__":
    sys.exit(main())
