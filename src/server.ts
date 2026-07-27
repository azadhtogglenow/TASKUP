import dotenv from 'dotenv';
dotenv.config();

import app from './app';
import { pool } from './config/database';

const PORT = process.env.PORT || 3000;

pool.query('SELECT NOW()')
  .then(() => console.log('Database connected'))
  .catch((err) => console.error(' Database connection failed:', err.message));

app.listen(PORT, () => {
  console.log(`Server running on port http://localhost:${PORT}`);
});