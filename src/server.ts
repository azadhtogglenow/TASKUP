import createApp from "./config/app";

const PORT = process.env.PORT || 9000;

createApp().then((app) => {
  app.listen(PORT, () => {
    console.log(` Server running on http://localhost:${PORT}`);
  });
})