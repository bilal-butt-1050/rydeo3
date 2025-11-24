import mongoose from "mongoose";

const routeSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, unique: true },
    code: { type: String, default: null }, // optional short code
    stops: [{ type: mongoose.Schema.Types.ObjectId, ref: "Stop" }], // ordered list
    startStop: { type: mongoose.Schema.Types.ObjectId, ref: "Stop", default: null },
    endStop: { type: mongoose.Schema.Types.ObjectId, ref: "Stop", default: null },

    // assigned driver (one driver per route)
    assignedDriver: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    students: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }], 

    // meta
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

const Route = mongoose.model("Route", routeSchema);
export default Route;
