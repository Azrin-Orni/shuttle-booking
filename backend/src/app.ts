import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { env } from './config/env';
import { errorHandler } from './middleware/errorHandler';
import authRoutes from './routes/auth.routes';
import routeRoutes from './routes/route.routes';
import locationRoutes from './routes/location.routes';
import scheduleRoutes from './routes/schedule.routes';
import seatRoutes from './routes/seat.routes';

const app = express();

app.use(cors({
  origin: env.clientUrl,
  credentials: true, // required for cookies to be sent cross-origin
}));

app.use(express.json());
app.use(cookieParser());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/routes', routeRoutes);
app.use('/api/locations', locationRoutes);
app.use('/api/schedules', scheduleRoutes);
app.use('/api/seats', seatRoutes);

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok' });
});

// Must be last
app.use(errorHandler);

export default app;