import mongoose, { Document, Schema } from 'mongoose';

export interface IDistrict extends Document {
  name: string;
  state: string;
  code: string;
  totalWorkers: number;
  totalWages: number;
  households: number;
  employmentDays: number;
  workCompleted: number;
  budgetUtilization: number;
  lastUpdated: Date;
  monthlyData: Array<{
    month: string;
    year: number;
    workers: number;
    wages: number;
    households: number;
    employmentDays: number;
  }>;
}

const DistrictSchema: Schema = new Schema({
  name: { type: String, required: true, index: true },
  state: { type: String, required: true, index: true },
  code: { type: String, required: true, unique: true },
  totalWorkers: { type: Number, default: 0 },
  totalWages: { type: Number, default: 0 },
  households: { type: Number, default: 0 },
  employmentDays: { type: Number, default: 0 },
  workCompleted: { type: Number, default: 0 },
  budgetUtilization: { type: Number, default: 0 },
  lastUpdated: { type: Date, default: Date.now },
  monthlyData: [{
    month: String,
    year: Number,
    workers: Number,
    wages: Number,
    households: Number,
    employmentDays: Number
  }]
}, {
  timestamps: true
});

export default mongoose.model<IDistrict>('District', DistrictSchema);