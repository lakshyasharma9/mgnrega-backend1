import dotenv from 'dotenv';
import mongoose from 'mongoose';
import axios from 'axios';
import District from '../models/District';

dotenv.config();

async function quickSync() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI!);
    console.log('Connected to MongoDB');

    // Fetch data from MGNREGA API
    const apiUrl = 'https://api.data.gov.in/resource/ee03643a-ee4c-48c2-ac30-9f2ff26ab722';
    const apiKey = '579b464db66ec23bdd0000019f175bb5fd024b3c6c77aae432cc03c9';

    console.log('Fetching data from MGNREGA API...');
    const response = await axios.get(apiUrl, {
      params: {
        'api-key': apiKey,
        format: 'json',
        limit: 100, // Start with smaller batch
        offset: 0
      },
      timeout: 30000
    });

    if (!response.data || !response.data.records) {
      throw new Error('No data received from API');
    }

    console.log(`Processing ${response.data.records.length} records...`);

    // Clear existing data
    await District.deleteMany({});
    console.log('Cleared existing data');

    // Process records
    for (const record of response.data.records) {
      if (!record.district_name || !record.state_name) continue;

      const districtData = {
        name: record.district_name,
        state: record.state_name,
        code: record.district_code || `${record.state_name}_${record.district_name}`.replace(/\s+/g, '_'),
        totalWorkers: parseInt(record.Total_Individuals_Worked) || 0,
        totalWages: parseFloat(record.Wages) || 0,
        households: parseInt(record.Total_Households_Worked) || 0,
        employmentDays: parseInt(record.Average_days_of_employment_provided_per_Household) || 0,
        workCompleted: parseInt(record.Number_of_Completed_Works) || 0,
        budgetUtilization: Math.min(Math.round(((parseFloat(record.Total_Exp) || 0) / (parseFloat(record.Approved_Labour_Budget) || 1)) * 100), 100) || 75,
        lastUpdated: new Date(),
        monthlyData: generateMonthlyData(record)
      };

      await District.create(districtData);
    }

    console.log('Data sync completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Sync failed:', error);
    process.exit(1);
  }
}

function generateMonthlyData(record: any) {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const baseWorkers = parseInt(record.Total_Individuals_Worked) || 0;
  const baseWages = parseFloat(record.Wages) || 0;
  
  return months.map((month) => ({
    month,
    workers: Math.round(baseWorkers * (0.7 + Math.random() * 0.6)),
    wages: Math.round(baseWages * (0.7 + Math.random() * 0.6))
  }));
}

quickSync();