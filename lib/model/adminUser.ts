import mongoose, { Schema, model, models } from "mongoose";

const AdminUserSchema = new Schema(
  {
    username: { type: String, required: true, unique: true },
    password: { type: String, required: true },
  },
  {
    timestamps: true, // createdAt, updatedAt অটোমেটিক আসবে
  }
);

const AdminUser =
  (models.AdminUser as mongoose.Model<any>) ||
  model("AdminUser", AdminUserSchema);

export default AdminUser;