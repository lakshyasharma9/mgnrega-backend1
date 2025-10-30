import { Request, Response } from 'express';
import mgnregaService from '../services/mgnregaService';
import locationService from '../services/locationService';
import District from '../models/District';

export const districtController = {
  async getDistrictData(req: Request, res: Response) {
    try {
      const { district } = req.params;
      const data = await District.findOne({ name: district });
      
      if (!data) {
        return res.status(404).json({ 
          error: 'District not found', 
          message: 'Please ensure MGNREGA API data has been synced. Run the sync script or check API connectivity.' 
        });
      }
      
      res.json(data);
    } catch (error) {
      console.error('Error fetching district data:', error);
      res.status(500).json({ error: 'Failed to fetch district data' });
    }
  },

  async getChartData(req: Request, res: Response) {
    try {
      const { district } = req.params;
      const districtData = await District.findOne({ name: district });
      if (!districtData) {
        return res.status(404).json({ error: 'District not found' });
      }
      const data = districtData.monthlyData || [];
      res.json(data);
    } catch (error) {
      console.error('Error fetching chart data:', error);
      res.status(500).json({ error: 'Failed to fetch chart data' });
    }
  },

  async getAllDistricts(req: Request, res: Response) {
    try {
      const districts = await District.find({}, 'name').sort({ name: 1 });
      if (districts.length === 0) {
        return res.status(404).json({ 
          error: 'No districts found', 
          message: 'Please sync MGNREGA API data first. Run: npm run sync-data' 
        });
      }
      const districtNames = districts.map(d => d.name);
      res.json(districtNames);
    } catch (error) {
      console.error('Error fetching districts:', error);
      res.status(500).json({ error: 'Failed to fetch districts' });
    }
  },

  async getDistrictsByState(req: Request, res: Response) {
    try {
      const { state } = req.params;
      const districts = await District.find({ state }, 'name').sort({ name: 1 });
      if (districts.length === 0) {
        return res.status(404).json({ 
          error: `No districts found for state: ${state}`, 
          message: 'Please sync MGNREGA API data first or check if the state name is correct.' 
        });
      }
      const districtNames = districts.map(d => d.name);
      res.json(districtNames);
    } catch (error) {
      console.error('Error fetching districts by state:', error);
      res.status(500).json({ error: 'Failed to fetch districts by state' });
    }
  },

  async getAllStates(req: Request, res: Response) {
    try {
      const states = await District.distinct('state');
      if (states.length === 0) {
        return res.status(404).json({ 
          error: 'No states found', 
          message: 'Please sync MGNREGA API data first. Run: npm run sync-data' 
        });
      }
      res.json(states.sort());
    } catch (error) {
      console.error('Error fetching states:', error);
      res.status(500).json({ error: 'Failed to fetch states' });
    }
  },

  async detectLocation(req: Request, res: Response) {
    try {
      const { latitude, longitude } = req.body;
      
      if (!latitude || !longitude) {
        return res.status(400).json({ error: 'Latitude and longitude are required' });
      }

      const locationResult = await locationService.getDistrictFromCoordinates(latitude, longitude);
      
      if (!locationResult) {
        return res.status(404).json({ error: 'Could not determine district from coordinates' });
      }

      // Try multiple matching strategies for better accuracy
      let matchedDistrict = null;
      
      // 1. Exact name match
      matchedDistrict = await District.findOne({ 
        name: { $regex: new RegExp(`^${locationResult.district}$`, 'i') }
      });
      
      // 2. Partial name match within same state
      if (!matchedDistrict) {
        matchedDistrict = await District.findOne({ 
          name: { $regex: new RegExp(locationResult.district, 'i') },
          state: { $regex: new RegExp(locationResult.state, 'i') }
        });
      }
      
      // 3. Try common district name variations
      if (!matchedDistrict) {
        const variations = [
          locationResult.district.replace(' Urban', ''),
          locationResult.district.replace(' Rural', ''),
          locationResult.district.replace(' District', ''),
          locationResult.district + ' Urban',
          locationResult.district + ' Rural'
        ];
        
        for (const variation of variations) {
          matchedDistrict = await District.findOne({ 
            name: { $regex: new RegExp(`^${variation}$`, 'i') },
            state: { $regex: new RegExp(locationResult.state, 'i') }
          });
          if (matchedDistrict) break;
        }
      }
      
      // 4. Last resort: find any district in the detected state
      if (!matchedDistrict) {
        const stateDistricts = await District.find({ 
          state: { $regex: new RegExp(locationResult.state, 'i') }
        }).limit(3);
        
        if (stateDistricts.length > 0) {
          // Prefer districts with similar names
          matchedDistrict = stateDistricts.find(d => 
            d.name.toLowerCase().includes(locationResult.district.toLowerCase())
          ) || stateDistricts[0];
        }
      }

      const response = {
        ...locationResult,
        district: matchedDistrict ? matchedDistrict.name : locationResult.district,
        state: matchedDistrict ? matchedDistrict.state : locationResult.state,
        available: !!matchedDistrict,
        coordinates: { latitude, longitude },
        detectedDistrict: locationResult.district, // Original detected name
        matchedDistrict: matchedDistrict?.name || null // Actual matched name
      };

      res.json(response);
    } catch (error) {
      console.error('Error detecting location:', error);
      res.status(500).json({ error: 'Failed to detect location' });
    }
  }
};