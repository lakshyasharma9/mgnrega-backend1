import locationService from '../services/locationService';
import District from '../models/District';

export async function debugLocationDetection(lat: number, lng: number): Promise<void> {
  console.log(`🔍 Debugging location detection for coordinates: ${lat}, ${lng}\n`);
  
  try {
    // Test the location service
    console.log('1. Testing location service...');
    const locationResult = await locationService.getDistrictFromCoordinates(lat, lng);
    
    if (locationResult) {
      console.log(`✅ Location Service Result:`);
      console.log(`   District: ${locationResult.district}`);
      console.log(`   State: ${locationResult.state}`);
      console.log(`   Address: ${locationResult.formatted_address}\n`);
      
      // Test database matching
      console.log('2. Testing database matching...');
      
      // Exact match
      const exactMatch = await District.findOne({ 
        name: { $regex: new RegExp(`^${locationResult.district}$`, 'i') }
      });
      console.log(`   Exact match: ${exactMatch ? exactMatch.name : 'None'}`);
      
      // Partial match in same state
      const partialMatch = await District.findOne({ 
        name: { $regex: new RegExp(locationResult.district, 'i') },
        state: { $regex: new RegExp(locationResult.state, 'i') }
      });
      console.log(`   Partial match in state: ${partialMatch ? partialMatch.name : 'None'}`);
      
      // All districts in state
      const stateDistricts = await District.find({ 
        state: { $regex: new RegExp(locationResult.state, 'i') }
      }).limit(5);
      console.log(`   Districts in ${locationResult.state}: ${stateDistricts.map(d => d.name).join(', ')}`);
      
    } else {
      console.log('❌ Location service returned no result');
    }
    
  } catch (error) {
    console.error('❌ Error during location detection:', error);
  }
}

// Test with common coordinates
export async function runLocationTests(): Promise<void> {
  const testCoords = [
    { name: 'Delhi', lat: 28.6139, lng: 77.2090 },
    { name: 'Mumbai', lat: 19.0760, lng: 72.8777 },
    { name: 'Bangalore', lat: 12.9716, lng: 77.5946 }
  ];
  
  for (const coord of testCoords) {
    console.log(`\n${'='.repeat(50)}`);
    console.log(`Testing ${coord.name}`);
    console.log(`${'='.repeat(50)}`);
    await debugLocationDetection(coord.lat, coord.lng);
  }
}