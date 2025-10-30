import dotenv from 'dotenv';
import { initApp } from './app'; // import the initializer from app.ts

// Load environment variables
dotenv.config();

const PORT = process.env.PORT || 5001;

async function startServer() {
  try {
    const app = await initApp(); // initializes DB + data sync + express app

    app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

startServer();
