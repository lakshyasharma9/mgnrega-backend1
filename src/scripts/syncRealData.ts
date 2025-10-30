import dotenv from 'dotenv';
import mgnregaService from '../services/mgnregaService';

// Load environment variables
dotenv.config();

async function syncRealData() {
  try {
    console.log('Starting real MGNREGA data sync...');
    
    // Sync data from official MGNREGA API
    await mgnregaService.syncDistrictData();
    
    console.log('Real MGNREGA data sync completed successfully');
    process.exit(0);
  } catch (error) {
    console.error('Failed to sync real MGNREGA data:', error);
    console.log('Please check your API configuration and network connection');
    process.exit(1);
  }
}

syncRealData();