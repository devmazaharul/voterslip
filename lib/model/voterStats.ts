import mongoose, { Schema, Document, Model } from 'mongoose';

// ═══════════════════════════════════════════
// ১. VoterStats — প্রতি গ্রামের summary
//    (তোমার existing, একটু upgrade)
// ═══════════════════════════════════════════
export interface IVoterStats extends Document {
  village: string;
  totalChecks: number;         // মোট কতবার সার্চ হয়েছে
  totalResultsServed: number;  // ✅ মোট কতজন ভোটার দেখানো হয়েছে
  fromDB: number;              // ✅ কতবার DB থেকে দিয়েছে
  fromAPI: number;             // ✅ কতবার External API কল হয়েছে
  lastCheckedAt: Date;
}

const VoterStatsSchema: Schema<IVoterStats> = new Schema(
  {
    village: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    totalChecks: {
      type: Number,
      default: 0,
    },
    totalResultsServed: {
      type: Number,
      default: 0,
    },
    fromDB: {
      type: Number,
      default: 0,
    },
    fromAPI: {
      type: Number,
      default: 0,
    },
    lastCheckedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

VoterStatsSchema.index({ village: 1 });

const VoterStats: Model<IVoterStats> =
  mongoose.models.VoterStats ||
  mongoose.model<IVoterStats>('VoterStats', VoterStatsSchema);

export default VoterStats;