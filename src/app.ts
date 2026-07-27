import express from 'express';
import authRouter from './routers/auth-Router';
import documentRouter from './routers/document-Router';
import chunkRouter from './routers/chunk-Router';
import jobRouter from './routers/job-Router';
import helmet from "helmet";
import cors from 'cors';

const app = express();

app.use(express.json());
app.use(helmet());
app.use(cors({
  origin: 'http://localhost:4000', // Replace with your frontend URL
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));
app.use('/api/auth', authRouter);
app.use('/api/documents', documentRouter);
app.use('/api/chunks', chunkRouter);
app.use('/api/jobs', jobRouter);

app.get('/health', (_req, res) => {
  res.json({ status: 'ok' });
});

export default app;