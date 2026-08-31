module.exports = {
  apps: [
    {
      name: "s-bot-backend",
      script: "venv/bin/uvicorn",
      args: "app.main:app --host 127.0.0.1 --port 8000",
      cwd: "./backend",
      interpreter: "none",
      restart_delay: 3000,
      autorestart: true,
      env: {
        PYTHONUNBUFFERED: "1"
      }
    }
  ]
};
