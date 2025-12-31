import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const options = { discriminatorKey: "role", timestamps: true };

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    loginID: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    isActive: { type: Boolean, default: true },
    lastLogin: { type: Date, default: null },
    role: { 
      type: String, 
      required: true, 
      enum: ["admin", "student", "driver"],
      default: "student"
    }
  },
  options
);

// Hash password before saving ONLY if password is modified
userSchema.pre("save", async function (next) {
  // Only hash if password is actually modified
  if (!this.isModified("password")) return next();
  
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Compare password
userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

export const User = mongoose.model("User", userSchema);

// STUDENT
const studentSchema = new mongoose.Schema({
  preferredStop: { type: mongoose.Schema.Types.ObjectId, ref: "Stop" },
  route: { type: mongoose.Schema.Types.ObjectId, ref: "Route", required: true },
});
export const Student = User.discriminator("student", studentSchema);

// DRIVER
const driverSchema = new mongoose.Schema({
  phone: { type: String, required: true },
  route: { type: mongoose.Schema.Types.ObjectId, ref: "Route", required: true },
  location: {
    lat: { type: Number, default: null },
    lng: { type: Number, default: null },
  },
  isSharingLocation: { type: Boolean, default: false },
});
export const Driver = User.discriminator("driver", driverSchema);

// ADMIN
const adminSchema = new mongoose.Schema({
  permissions: [{ type: String }],
});
export const Admin = User.discriminator("admin", adminSchema);