import dotenv from "dotenv";
dotenv.config();  // Load .env file FIRST

import app from "./app";

const PORT = process.env.PORT || 2000;

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});