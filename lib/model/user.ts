import mongoose, { Schema, model, models } from "mongoose";

const SearchLogSchema = new Schema(
  {
    // ১. ইউজার যে ডাটা দিয়ে সার্চ করেছে
    searchCriteria: {
      dob: { type: String, required: true },    // জন্ম তারিখ
      ward: { type: String, required: true },   // ওয়ার্ড / গ্রাম
    },

    // ২. ইউজারের ডিভাইসের বিস্তারিত তথ্য
    deviceInfo: {
      browser: { type: String },     // যেমন: Chrome, Firefox
      os: { type: String },          // যেমন: Windows, Android, iOS
      deviceType: { type: String },  // যেমন: Mobile, Tablet, Desktop
      vendor: { type: String },      // যেমন: Samsung, Apple
      model: { type: String },       // যেমন: Galaxy S21, iPhone 13
    },

    // ৩. নেটওয়ার্ক এবং লোকেশন তথ্য
    network: {
      ip: { type: String, required: true },
      city: { type: String },
      region: { type: String },
      country: { type: String },
      isp: { type: String },         // ইন্টারনেট প্রোভাইডার (যেমন: Amber IT, Grameenphone)
      timezone: { type: String },
    },

    // ৪. সার্চ রেজাল্ট (প্রথম ম্যাচড ভোটারের সারসংক্ষেপ)
    result: {
      name:        { type: String },
      father_name: { type: String },
      sereal_no:   { type: String },
    },

    // ৫. টাইমস্ট্যাম্প (কখন সার্চ করা হয়েছে)
    createdAt: { type: Date, default: Date.now },
  },
  {
    // এটি যোগ করলে অটোমেটিক updatedAt এবং createdAt হ্যান্ডেল হয়
    timestamps: true,
  }
);

// মডেল এক্সপোর্ট (Next.js এর জন্য এই চেকটি জরুরি)
const SearchLog =
  (models.SearchLog as mongoose.Model<any>) || model("SearchLog", SearchLogSchema);

export default SearchLog;