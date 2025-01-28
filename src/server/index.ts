import express from 'express';
import cors from 'cors';
import http from 'http';
import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';

// Initialize environment variables first
dotenv.config();

// Initialize database client
const prisma = new PrismaClient();

// Create Express app and HTTP server
const app = express();
const server = http.createServer(app);

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}));
app.use(express.json());

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Basic route example
app.get('/api/test', (req, res) => {
  res.json({ message: 'API is working!' });
});

// Start server
const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV}`);
});

export default server;