import cors from 'cors';

export const corsOptions = {
  origin: [
    'http://localhost:3000', 
    'http://localhost:5173',
    'https://mgnrega-frontend-9zlb.onrender.com',
    /\.onrender\.com$/
  ],
  credentials: true,
  optionsSuccessStatus: 200
};

export const corsMiddleware = cors(corsOptions);