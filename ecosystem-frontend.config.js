module.exports = {
  apps: [
    {
      name: "tixnova-web",
      cwd: "/var/www/TixNova-Platfrom/tixnova-web",
      script: "node_modules/next/dist/bin/next",
      args: "start -p 3100 -H 127.0.0.1",
      instances: 1,
      autorestart: true,
      max_restarts: 10,
      min_uptime: 5000,
      env: {
        NODE_ENV: "production",
        PORT: "3100",
      },
    },
  ],
};
