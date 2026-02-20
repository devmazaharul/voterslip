// models/VoterUser.ts

import mongoose, { Schema, Document, Model } from "mongoose";

export interface IVoter extends Document {
  name: string;
  dateOfBirth: Date;
  serialNumber: number;
  villageName: string;
  mother: string;
  husband_father: string;
  addedBy:string
}

const VoterSchema: Schema<IVoter> = new Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    dateOfBirth: {
      type: Date,
      required: true,
    },
    serialNumber: {
      type: Number,
      required: true,
    },
    villageName: {
      type: String,
      required: true,
    },
    mother: {
      type: String,
      default:"unknown"
    },
    husband_father: {
      type: String,
       default:"unknown"
    },
    addedBy: {
    type: String,
    enum: ["system", "self"], 
    default:"system"
  }
  },
  {
    timestamps: true,
  }
);

// ডুপ্লিকেট চেক দ্রুত করতে compound index
VoterSchema.index({ serialNumber: 1, villageName: 1 }, { unique: true });

const VoterUser: Model<IVoter> =
  mongoose.models.VoterUser || mongoose.model<IVoter>("VoterUser", VoterSchema);

export default VoterUser;