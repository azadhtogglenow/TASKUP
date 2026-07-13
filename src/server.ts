import createApp from "./config/app";

const PORT = process.env.PORT || 9000;

createApp().then((app) => {
  const server = app.listen(PORT, () => {
    console.log(` Server running on http://localhost:${PORT}`);
  });
 server.on("error", (error) => {
      console.error("Server runtime error:", error);
      process.exit(1);
    });
  })
 .catch((error) => {
    console.error("Error starting server:", error);
    process.exit(1);
  
});