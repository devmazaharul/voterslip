
import mongoose, { Schema, Document, Model } from "mongoose";


export interface IVoter extends Document {
  name: string;
  dateOfBirth: Date;
  serialNumber: number;
  villageName:string
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
    villageName: {
      type: String,
      required: true
    }
  },
  {
    timestamps: true, 
  }
);

// 3️⃣ Model
const VoterUser: Model<IVoter> =
  mongoose.models.VoterUser || mongoose.model<IVoter>("VoterUser", VoterSchema);

export default VoterUser;
