import subprocess
import sys
import time
import os

def main():
    base_dir = os.path.dirname(os.path.abspath(__file__))
    backend_dir = os.path.join(base_dir, "backend")
    frontend_dir = os.path.join(base_dir, "frontend")

    print("=" * 65)
    print("🚀 Starting Telegram Omni Bot & Admin Dashboard System")
    print("=" * 65)

    # 1. Start FastAPI Backend (Port 8000)
    print("\n📦 Starting FastAPI Backend Server on http://127.0.0.1:8000 ...")
    backend_proc = subprocess.Popen(
        [sys.executable, "-m", "uvicorn", "app.main:app", "--host", "127.0.0.1", "--port", "8000", "--reload"],
        cwd=backend_dir
    )

    time.sleep(2)

    # 2. Start Vite Frontend (Port 5173)
    print("\n💻 Starting React Admin Dashboard on http://localhost:5173 ...")
    # Windows shell True for npm
    frontend_proc = subprocess.Popen(
        "npm run dev",
        cwd=frontend_dir,
        shell=True
    )

    print("\n" + "=" * 65)
    print("✅ System is running!")
    print("🌐 Admin Dashboard: http://localhost:5173")
    print("📡 Backend API:     http://127.0.0.1:8000/docs")
    print("=" * 65)
    print("Press Ctrl+C to terminate all services.\n")

    try:
        while True:
            time.sleep(1)
    except KeyboardInterrupt:
        print("\n🛑 Shutting down services...")
        backend_proc.terminate()
        frontend_proc.terminate()
        print("Done. Goodbye!")

if __name__ == "__main__":
    main()
