import express from 'express';
import http from 'http';
import { Server as SocketIOServer } from 'socket.io';
import cors from 'cors';
import dotenv from 'dotenv';
import disasterRoutes from './routes/disasterRoutes';
import socialMediaRoutes from './routes/socialMediaRoutes';
import geocodeRoutes from './routes/geocodeRoutes';
import resourceRoutes from './routes/resourceRoutes';
import officialUpdatesRoutes from './routes/officialUpdatesRoutes';
import imageVerificationRoutes from './routes/imageVerificationRoutes';
import externalResourceRoutes from './routes/externalResourceRoutes';
import authRoutes from './routes/authRoutes';
import reportRoutes from './routes/reportRoutes';
import { setIO } from './utils/socket';

// Load environment variables
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

app.use(cors());
app.use(express.json());

// Disaster CRUD routes
app.use('/disasters', disasterRoutes);
app.use('/disasters', socialMediaRoutes);
app.use('/disasters', resourceRoutes);
app.use('/disasters', officialUpdatesRoutes);
app.use('/disasters', imageVerificationRoutes);
app.use('/disasters', externalResourceRoutes);
app.use('/disasters', reportRoutes);
app.use('/geocode', geocodeRoutes);
app.use('/auth', authRoutes);

// Basic health check route
app.get('/', (req, res) => {
  res.send('Disaster Response Coordination Platform backend running.');
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
