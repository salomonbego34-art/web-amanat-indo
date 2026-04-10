module.exports = {
  apps: [
    {
      name: "community-news-hub",
      script: "dist/index.cjs",
      instances: 1,
      exec_mode: "fork",
      env: {
        NODE_ENV: "production",
        PORT: 5000,
      },
    },
  ],
};
