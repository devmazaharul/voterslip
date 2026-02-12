
import mongoose, { Schema, Document, Model } from "mongoose";


export interface IVoter extends Document {
  name: string;
  dateOfBirth: Date;
  serialNumber: number;
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
      required: true
    },
  },
  {
    timestamps: true, 
  }
);

// 3️⃣ Model
const Voter: Model<IVoter> =
  mongoose.models.Voter || mongoose.model<IVoter>("Voter", VoterSchema);

export default Voter;
