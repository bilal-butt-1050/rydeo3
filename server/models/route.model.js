import mongoose from "mongoose";

const routeSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  code: { type: String },
  stops: [{ type: mongoose.Schema.Types.ObjectId, ref: "Stop" }],
  startStop: { type: mongoose.Schema.Types.ObjectId, ref: "Stop" },
  endStop: { type: mongoose.Schema.Types.ObjectId, ref: "Stop" },
  assignedDriver: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
  isActive: { type: Boolean, default: true },
}, { timestamps: true });

// Automatically set start/end stop based on the array
routeSchema.pre("save", function(next) {
  if (this.stops && this.stops.length > 0) {
    this.startStop = this.stops[0];
    this.endStop = this.stops[this.stops.length - 1];
  } else {
    this.startStop = null;
    this.endStop = null;
  }
  next();
});

export default mongoose.model("Route", routeSchema);