import { defineConfig } from "vitest/config";
import path from "path";
import dotenv from "dotenv";
dotenv.config({ path: path.resolve(__dirname, "./.env") });

export default defineConfig({
  test: {
    environment: "node",
    globals: true, 
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
    include: ["src/tests/**/*.{test,spec}.ts"],
  },
});


