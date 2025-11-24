import {  Driver } from "../models/user.model.js";

export const updateLocation = async (req, res) => {
  try {
    const driverId = req.user?.id || req.body.driverId;

    if (!driverId) {
      return res.status(400).json({ message: "Driver ID missing" });
    }

    const { lat, lng } = req.body;

    if (lat == null || lng == null) {
      return res.status(400).json({ message: "Coordinates missing" });
    }

    await Driver.findByIdAndUpdate(driverId, {
      location: { lat, lng }
    });

    return res.json({ message: "Location updated" });
  } catch (err) {
    console.error("Location error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

export const toggleSharing = async (req, res) => {
  try {
    const driverId = req.user?.id || req.body.driverId;

    if (!driverId) {
      return res.status(400).json({ message: "Driver ID missing" });
    }

    const { state } = req.body;

    if (typeof state !== "boolean") {
      return res.status(400).json({ message: "Sharing state must be boolean" });
    }

    await Driver.findByIdAndUpdate(driverId, {
      isSharingLocation: state
    });

    return res.json({
      message: `Sharing turned ${state ? "on" : "off"}`
    });
  } catch (err) {
    console.error("Sharing error:", err);
    res.status(500).json({ message: "Server error" });
  }
};
