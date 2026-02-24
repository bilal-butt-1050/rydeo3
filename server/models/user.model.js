import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const options = { discriminatorKey: "role", timestamps: true };

const userSchema = new mongoose.Schema({
    name: { type: String, required: true },
    loginID: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    isActive: { type: Boolean, default: true },
    lastLogin: { type: Date, default: null },
    role: { 
      type: String, 
      required: true, 
      enum: ["admin", "student", "driver"]
    }
}, options);

userSchema.pre("save", async function (next) {
    if (!this.isModified("password")) return next();
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
});

userSchema.methods.matchPassword = async function (enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password);
};

export const User = mongoose.model("User", userSchema);

// STUDENT - Note: Added ref to 'Stop' and 'Route'
export const Student = User.discriminator("student", new mongoose.Schema({
    preferredStop: { type: mongoose.Schema.Types.ObjectId, ref: "Stop" },
    route: { type: mongoose.Schema.Types.ObjectId, ref: "Route" },
}));

// DRIVER
export const Driver = User.discriminator("driver", new mongoose.Schema({
    phone: { type: String, required: true },
    route: { type: mongoose.Schema.Types.ObjectId, ref: "Route" },
    location: {
        lat: { type: Number, default: null },
        lng: { type: Number, default: null },
    },
    isSharingLocation: { type: Boolean, default: false },
}));

// ADMIN
export const Admin = User.discriminator("admin", new mongoose.Schema({
    permissions: [{ type: String, default: ["manage_all"] }],
}));