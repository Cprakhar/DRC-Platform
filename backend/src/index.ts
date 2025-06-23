import express, { Request, Response } from 'express';
import http from 'http';
import { Server as SocketIOServer } from 'socket.io';
import cors from 'cors';
import dotenv from 'dotenv';
import disasterRoutes from './routes/disasterRoutes';
import resourceRoutes from './routes/resourceRoutes';
import officialUpdatesRoutes from './routes/officialUpdatesRoutes';
import authRoutes from './routes/authRoutes';
import { setIO } from './utils/socket';
import { cleanupPendingDisasters } from '../scripts/cleanup_pending_disasters';

// Load
dotenv.config();

const app = express();
const server = http.createServer(app);
const io = new SocketIOServer(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

setIO(io);

// CORS best practices: allow credentials, restrict origins in production
const allowedOrigins = process.env.CORS_ORIGINS ? process.env.CORS_ORIGINS.split(',') : ['http://localhost:3000'];

app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin) || allowedOrigins.includes('*')) {
      return callback(null, true);
    }
    return callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());

// Disaster CRUD routes
app.use('/disasters', officialUpdatesRoutes);
app.use('/disasters', disasterRoutes);
app.use('/auth', authRoutes);
// Mount resource routes at /resources (global and disaster-specific)
app.use('/resources', resourceRoutes);

// Basic health check route
app.get('/', (req, res) => {
  res.send('Disaster Response Coordination Platform backend running.');
});

// Secure cleanup endpoint for Cloud Scheduler
app.post('/internal/cleanup-pending-disasters', async (req: Request, res: Response): Promise<void> => {
  if (req.headers['x-cron-secret'] !== process.env.CRON_SECRET) {
    res.status(403).send('Forbidden');
    return;
  }
  try {
    await cleanupPendingDisasters();
    res.send('Cleanup complete');
  } catch (e) {
    res.status(500).send('Cleanup failed');
  }
});

// Socket.IO connection
io.on('connection', (socket) => {
  console.log('A user connected:', socket.id);
  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

const PORT = process.env.PORT || 4000;
server.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
