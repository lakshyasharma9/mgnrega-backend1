import locationService from '../services/locationService';

export async function testLocationDetection() {
  console.log('🧪 Testing Location Detection Service...\n');
  
  // Test coordinates for major Indian cities
  const testCoordinates = [
    { name: 'Delhi', lat: 28.6139, lng: 77.2090 },
    { name: 'Mumbai', lat: 19.0760, lng: 72.8777 },
    { name: 'Bangalore', lat: 12.9716, lng: 77.5946 },
    { name: 'Chennai', lat: 13.0827, lng: 80.2707 },
    { name: 'Kolkata', lat: 22.5726, lng: 88.3639 },
    { name: 'Hyderabad', lat: 17.3850, lng: 78.4867 }
  ];

  for (const coord of testCoordinates) {
    try {
      console.log(`📍 Testing ${coord.name} (${coord.lat}, ${coord.lng}):`);
      const result = await locationService.getDistrictFromCoordinates(coord.lat, coord.lng);
      
      if (result) {
        console.log(`   ✅ District: ${result.district}`);
        console.log(`   ✅ State: ${result.state}`);
        console.log(`   ✅ Address: ${result.formatted_address}`);
      } else {
        console.log(`   ❌ No result found`);
      }
      console.log('');
    } catch (error: any) {
      console.log(`   ❌ Error: ${error.message}`);
      console.log('');
    }
  }
  
  console.log('🏁 Location detection test completed!');
}