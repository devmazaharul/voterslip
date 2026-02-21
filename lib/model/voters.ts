import mongoose, { Schema, Document, Model } from "mongoose";

// ইন্টারফেসে টাইপগুলো আরও স্পেসিফিক করা হয়েছে
export interface IVoter extends Document {
  userId: string; 
  name: string;
  dateOfBirth: Date;
  serialNumber: number;
  voterNumber: string;        // voterNo এর বদলে voterNumber (serialNumber এর সাথে সামঞ্জস্যপূর্ণ)
  village: string;            // villageName এর বদলে শুধু village 
  motherName: string;         // mother এর বদলে motherName
  fatherOrHusbandName: string;// husbandFather এর বদলে fatherOrHusbandName (স্ট্যান্ডার্ড ফরম্যাট)
  pollingCenter: string;      // centerName এর বদলে pollingCenter (ভোটকেন্দ্রের সঠিক ইংরেজি)
  addedBy: "system" | "self"; // Enum এর টাইপ সরাসরি এখানে ডিক্লেয়ার করা ভালো
  createdAt?:Date
}

const VoterSchema: Schema<IVoter> = new Schema(
  {
    userId: {
      type: String,
      required: true,
      unique: true,
      index: true, // এটি দিয়ে দ্রুত ইউজার খোঁজা যাবে
    },
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
    voterNumber: {
      type: String,
      required: true,
    },
    village: {
      type: String,
      required: true,
      trim: true,
    },
    motherName: {
      type: String,
      default: "Unknown",
      trim: true,
    },
    fatherOrHusbandName: {
      type: String,
      default: "Unknown",
      trim: true,
    },
    pollingCenter: {
      type: String,
      required: true,
      trim: true,
    },
    addedBy: {
      type: String,
      enum: ["system", "self"],
      default: "system",
    },
  },
  {
    timestamps: true,
  }
);

// ডুপ্লিকেট চেক দ্রুত করতে Compound Index
VoterSchema.index({ serialNumber: 1, village: 1 }, { unique: true });

// মডেলের নাম VoterUser থেকে শুধু Voter করা হলো
const Voter: Model<IVoter> =
  mongoose.models.Voter || mongoose.model<IVoter>("Voter", VoterSchema);

export default Voter;