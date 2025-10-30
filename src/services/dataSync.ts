import cron from 'node-cron';
import mgnregaService from './mgnregaService';

class DataSyncService {
  startScheduledSync(): void {
    // Run every day at 6 AM
    cron.schedule('0 6 * * *', async () => {
      console.log('Starting scheduled MGNREGA data sync...');
      try {
        await mgnregaService.syncDistrictData();
        console.log('Scheduled sync completed successfully');
      } catch (error) {
        console.error('Scheduled sync failed:', error);
      }
    });

    // Run every 6 hours as backup
    cron.schedule('0 */6 * * *', async () => {
      console.log('Starting backup MGNREGA data sync...');
      try {
        await mgnregaService.syncDistrictData();
        console.log('Backup sync completed successfully');
      } catch (error) {
        console.error('Backup sync failed:', error);
      }
    });

    console.log('Data sync scheduler started');
  }

  async manualSync(): Promise<void> {
    console.log('Starting manual MGNREGA data sync...');
    try {
      await mgnregaService.syncDistrictData();
      console.log('Manual sync completed successfully');
    } catch (error) {
      console.error('Manual sync failed:', error);
      throw error;
    }
  }
}

export default new DataSyncService();