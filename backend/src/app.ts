import express from 'express';
import cors from 'cors';
import { errorHandler } from './utils/errorHandler';
import linkRoutes from './routes/linkRoutes';
import { linkController } from './controllers/linkController';

const app = express();

app.use(cors({ origin: process.env.FRONTEND_URL || '*' }));
app.use(express.json());

// Main API routes
app.use('/api/links', linkRoutes);

// Redirect endpoint (matches short links)
app.get('/r/:slug', linkController.redirect.bind(linkController));

// Centralized error handling
app.use(errorHandler);

export default app;
