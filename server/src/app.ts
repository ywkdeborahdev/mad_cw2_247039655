const express = require('express');
import { Request, Response } from 'express';
import cors from 'cors';
import userRoutes from './routes/userRoutes';
import habitRoutes from './routes/habitRoutes';

const app = express();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());

// Routes setting
app.use('/users', userRoutes);
app.use('/habit', habitRoutes);
// Routes
app.get('/', (req: Request, res: Response) => {
    res.status(200).json({
        message: 'Hello World',
        timestamp: new Date().toISOString()
    });
});

app.get('/health', (req: Request, res: Response) => {
    res.status(200).json({ status: 'OK' });
});

export default app;
