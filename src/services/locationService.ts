import axios from 'axios';

interface LocationResult {
  district: string;
  state: string;
  formatted_address: string;
}

interface LocationCache {
  [key: string]: {
    result: LocationResult;
    timestamp: number;
  };
}

class LocationService {
  private cache: LocationCache = {};
  private cacheTimeout = 300000; // 5 minutes

  private getCacheKey(lat: number, lng: number): string {
    return `${lat.toFixed(3)}_${lng.toFixed(3)}`;
  }

  private getCachedResult(lat: number, lng: number): LocationResult | null {
    const key = this.getCacheKey(lat, lng);
    const cached = this.cache[key];
    
    if (cached && (Date.now() - cached.timestamp) < this.cacheTimeout) {
      return cached.result;
    }
    
    return null;
  }

  private setCachedResult(lat: number, lng: number, result: LocationResult): void {
    const key = this.getCacheKey(lat, lng);
    this.cache[key] = {
      result,
      timestamp: Date.now()
    };
  }

  private getFallbackLocation(lat: number, lng: number): LocationResult | null {
    console.warn(`Using fallback location detection for coordinates: ${lat}, ${lng}`);
    
    // Enhanced coordinate-based detection for Indian locations
    if (lat >= 6.0 && lat <= 37.0 && lng >= 68.0 && lng <= 97.0) {
      const locations = [
        // Major metros
        { bounds: [28.40, 28.88, 76.84, 77.34], state: 'Delhi', district: 'Central Delhi' },
        { bounds: [19.01, 19.27, 72.77, 73.01], state: 'Maharashtra', district: 'Mumbai Suburban' },
        { bounds: [12.83, 13.14, 77.46, 77.78], state: 'Karnataka', district: 'Bengaluru Urban' },
        { bounds: [12.91, 13.23, 80.12, 80.32], state: 'Tamil Nadu', district: 'Chennai' },
        { bounds: [22.46, 22.65, 88.26, 88.42], state: 'West Bengal', district: 'Kolkata' },
        { bounds: [17.27, 17.56, 78.25, 78.61], state: 'Telangana', district: 'Hyderabad' },
        
        // State capitals
        { bounds: [26.81, 27.03, 75.68, 75.93], state: 'Rajasthan', district: 'Jaipur' },
        { bounds: [22.96, 23.15, 72.46, 72.68], state: 'Gujarat', district: 'Ahmedabad' },
        { bounds: [18.43, 18.64, 73.73, 73.95], state: 'Maharashtra', district: 'Pune' },
        { bounds: [15.29, 15.60, 73.76, 74.14], state: 'Goa', district: 'North Goa' },
        { bounds: [25.29, 25.47, 82.93, 83.03], state: 'Uttar Pradesh', district: 'Varanasi' },
        { bounds: [26.44, 26.55, 80.29, 80.41], state: 'Uttar Pradesh', district: 'Kanpur Nagar' },
        { bounds: [28.58, 28.75, 77.05, 77.28], state: 'Uttar Pradesh', district: 'Ghaziabad' },
        
        // Additional major cities
        { bounds: [23.00, 23.30, 72.50, 72.70], state: 'Gujarat', district: 'Ahmedabad' },
        { bounds: [21.10, 21.20, 79.05, 79.15], state: 'Maharashtra', district: 'Nagpur' },
        { bounds: [13.00, 13.10, 77.55, 77.65], state: 'Karnataka', district: 'Bengaluru Rural' },
        { bounds: [11.00, 11.10, 76.95, 77.05], state: 'Tamil Nadu', district: 'Coimbatore' },
        { bounds: [26.15, 26.25, 91.73, 91.83], state: 'Assam', district: 'Kamrup Metropolitan' }
      ];
      
      for (const location of locations) {
        const [minLat, maxLat, minLng, maxLng] = location.bounds;
        if (lat >= minLat && lat <= maxLat && lng >= minLng && lng <= maxLng) {
          return {
            district: location.district,
            state: location.state,
            formatted_address: `${location.district}, ${location.state}, India`
          };
        }
      }
      
      // Broad state-level fallback for unmapped coordinates
      const stateRegions = [
        { bounds: [8.0, 13.0, 74.0, 78.0], state: 'Karnataka', district: 'Bengaluru Urban' },
        { bounds: [11.0, 14.0, 78.0, 81.0], state: 'Tamil Nadu', district: 'Chennai' },
        { bounds: [15.0, 20.0, 73.0, 81.0], state: 'Maharashtra', district: 'Mumbai Suburban' },
        { bounds: [20.0, 25.0, 68.0, 75.0], state: 'Gujarat', district: 'Ahmedabad' },
        { bounds: [24.0, 31.0, 68.0, 78.0], state: 'Rajasthan', district: 'Jaipur' },
        { bounds: [24.0, 31.0, 77.0, 85.0], state: 'Uttar Pradesh', district: 'Lucknow' },
        { bounds: [21.0, 28.0, 85.0, 89.0], state: 'West Bengal', district: 'Kolkata' }
      ];
      
      for (const region of stateRegions) {
        const [minLat, maxLat, minLng, maxLng] = region.bounds;
        if (lat >= minLat && lat <= maxLat && lng >= minLng && lng <= maxLng) {
          return {
            district: region.district,
            state: region.state,
            formatted_address: `${region.district}, ${region.state}, India`
          };
        }
      }
      
      console.warn(`Coordinates ${lat}, ${lng} in India but not in known regions`);
      return null;
    }
    
    console.warn(`Coordinates ${lat}, ${lng} outside India bounds`);
    return null;
  }

  async getDistrictFromCoordinates(lat: number, lng: number): Promise<LocationResult | null> {
    console.log(`Getting location for coordinates: ${lat}, ${lng}`);
    
    // Check cache first
    const cached = this.getCachedResult(lat, lng);
    if (cached) {
      console.log('Returning cached location result:', cached);
      return cached;
    }

    // Validate coordinates are within India
    if (lat < 6.0 || lat > 37.0 || lng < 68.0 || lng > 97.0) {
      console.warn(`Coordinates ${lat}, ${lng} are outside India bounds`);
      return null;
    }

    try {
      // Try multiple geocoding services for better accuracy
      let locationResult = await this.tryOpenStreetMap(lat, lng);
      
      if (!locationResult) {
        console.log('OpenStreetMap failed, trying coordinate-based detection');
        locationResult = this.getFallbackLocation(lat, lng);
      }
      
      if (locationResult) {
        // Validate and clean the result
        locationResult = this.validateAndCleanLocation(locationResult);
        this.setCachedResult(lat, lng, locationResult);
        console.log('Final location result:', locationResult);
        return locationResult;
      }
      
      return null;
    } catch (error) {
      console.error('Error getting location from coordinates:', error);
      const fallback = this.getFallbackLocation(lat, lng);
      if (fallback) {
        const cleanedFallback = this.validateAndCleanLocation(fallback);
        this.setCachedResult(lat, lng, cleanedFallback);
        return cleanedFallback;
      }
      return null;
    }
  }

  private async tryOpenStreetMap(lat: number, lng: number): Promise<LocationResult | null> {
    try {
      const response = await axios.get('https://nominatim.openstreetmap.org/reverse', {
        params: {
          lat: lat,
          lon: lng,
          format: 'json',
          addressdetails: 1,
          zoom: 8, // Reduced zoom for better district-level results
          'accept-language': 'en'
        },
        timeout: 15000,
        headers: {
          'User-Agent': 'MGNREGA-Dashboard/1.0 (Contact: admin@example.com)'
        }
      });

      if (response.data && response.data.address) {
        const address = response.data.address;
        console.log('OpenStreetMap address data:', address);
        
        // Try multiple fields for district detection
        let district = address.state_district || 
                      address.county || 
                      address.city || 
                      address.town || 
                      address.municipality ||
                      address.village;
        
        let state = address.state;
        
        if (district && state) {
          // Clean district name
          district = district.replace(/\s+(District|district)$/i, '').trim();
          
          return {
            district: district,
            state: state,
            formatted_address: response.data.display_name || `${district}, ${state}, India`
          };
        }
      }
      
      return null;
    } catch (error) {
      console.error('OpenStreetMap API error:', error);
      return null;
    }
  }

  private validateAndCleanLocation(location: LocationResult): LocationResult {
    // Clean district name
    let district = location.district.trim();
    district = district.replace(/\s+(District|district|Zilla)$/i, '');
    district = district.replace(/^(District|district)\s+/i, '');
    
    // Clean state name
    let state = location.state.trim();
    
    return {
      ...location,
      district: district,
      state: state
    };
  }



  async findNearestDistrict(lat: number, lng: number): Promise<string | null> {
    try {
      const locationResult = await this.getDistrictFromCoordinates(lat, lng);
      return locationResult ? locationResult.district : null;
    } catch (error) {
      console.error('Error finding nearest district:', error);
      return null;
    }
  }

  clearCache(): void {
    this.cache = {};
  }
}

export default new LocationService();
export { LocationResult };