import createApp from "./app";

const PORT = process.env.PORT || 9000;

// Resolve the factory promise and boot the server
createApp()
  .then((app) => {
    const server = app.listen(PORT, () => {
      console.log(` Server running on http://localhost:${PORT}`);
    });

    // Handle runtime errors (e.g., port collisions)
    server.on("error", (error: Error) => {
      console.error("Server runtime error:", error);
      process.exit(1);
    });
  })
  .catch((error: Error) => {
    console.error("Critical failure during server startup:", error);
    process.exit(1);
  });
