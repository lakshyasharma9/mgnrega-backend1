import { Router } from 'express';
import { districtController } from '../controllers/districtController';
import { rateLimiter } from '../middleware/rateLimiter';
import mgnregaService from '../services/mgnregaService';

const router = Router();

router.get('/districts', rateLimiter, districtController.getAllDistricts);
router.get('/districts/state/:state', rateLimiter, districtController.getDistrictsByState);
router.get('/districts/:district', rateLimiter, districtController.getDistrictData);
router.get('/districts/:district/chart', rateLimiter, districtController.getChartData);
router.get('/states', rateLimiter, districtController.getAllStates);
router.post('/location/detect', rateLimiter, districtController.detectLocation);
router.get('/location/test', async (req, res) => {
  try {
    const { testLocationDetection } = await import('../utils/locationTest');
    await testLocationDetection();
    res.json({ message: 'Location detection test completed. Check server logs for results.' });
  } catch (error: any) {
    res.status(500).json({ error: 'Test failed', message: error.message });
  }
});

router.get('/location/debug/:lat/:lng', async (req, res) => {
  try {
    const { lat, lng } = req.params;
    const latitude = parseFloat(lat);
    const longitude = parseFloat(lng);
    
    if (isNaN(latitude) || isNaN(longitude)) {
      return res.status(400).json({ error: 'Invalid coordinates' });
    }
    
    const { debugLocationDetection } = await import('../utils/locationDebug');
    await debugLocationDetection(latitude, longitude);
    res.json({ message: `Location debug completed for ${latitude}, ${longitude}. Check server logs for detailed results.` });
  } catch (error: any) {
    res.status(500).json({ error: 'Debug failed', message: error.message });
  }
});

// Sync routes to manually trigger data synchronization
router.post('/sync', async (req, res) => {
  try {
    await mgnregaService.syncDistrictData();
    res.json({ message: 'Data synchronization completed successfully' });
  } catch (error: any) {
    console.error('Sync error:', error);
    res.status(500).json({ error: 'Data synchronization failed', message: error.message });
  }
});

router.get('/sync-data', async (req, res) => {
  try {
    await mgnregaService.syncDistrictData();
    res.json({ message: 'Data synchronization completed successfully' });
  } catch (error: any) {
    console.error('Sync error:', error);
    res.status(500).json({ error: 'Data synchronization failed', message: error.message });
  }
});

export default router;