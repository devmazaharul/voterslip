import mongoose, { Schema, model, models } from "mongoose";

// ─── Device Log Sub-Schema ───
const DeviceLogSchema = new Schema({
  deviceName: { type: String, default: "Unknown Device" },
  browser: { type: String, default: "Unknown" },
  os: { type: String, default: "Unknown" },
  ip: { type: String, default: "" },
  loginAt: { type: Date, default: Date.now },
  lastActiveAt: { type: Date, default: Date.now },
  isActive: { type: Boolean, default: true },
  userAgent: { type: String, default: "" },
  location: { type: String, default: "" },
  sessionToken: { type: String, default: "" },
});

// ─── Admin User Schema ───
const AdminUserSchema = new Schema(
  {
    name: { type: String, default: "" },
    phoneNumber: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    lastLogin: { type: Date, default: null },
    deviceLogs: { type: [DeviceLogSchema], default: [] },
    passwordResetToken: { type: String, default: null },
    passwordResetExpires: { type: Date, default: null },
  },
  {
    timestamps: true,
  }
);

const AdminUser =
  (models.AdminUser as mongoose.Model<any>) ||
  model("AdminUser", AdminUserSchema);

export default AdminUser;