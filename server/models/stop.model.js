import mongoose from "mongoose";

const stopSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    coordinates: {
      lat: { type: Number, required: true },
      lng: { type: Number, required: true },
    },
    order: { type: Number, default: 0 }, // position in route stops
    route: { type: mongoose.Schema.Types.ObjectId, ref: "Route", required: true },
  },
  { timestamps: true }
);

const Stop = mongoose.model("Stop", stopSchema);
export default Stop;
