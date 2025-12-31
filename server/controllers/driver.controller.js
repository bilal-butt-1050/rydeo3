import { Driver } from "../models/user.model.js";

export const updateLocation = async (req, res) => {
  try {
    // Get driver ID from authenticated user
    const driverId = req.user?._id;

    if (!driverId) {
      return res.status(401).json({ 
        success: false,
        message: "Unauthorized" 
      });
    }

    const { lat, lng } = req.body;

    // Validate coordinates
    if (lat == null || lng == null) {
      return res.status(400).json({ 
        success: false,
        message: "Coordinates are required" 
      });
    }

    const latNum = Number(lat);
    const lngNum = Number(lng);

    if (!Number.isFinite(latNum) || !Number.isFinite(lngNum)) {
      return res.status(400).json({ 
        success: false,
        message: "Invalid coordinates" 
      });
    }

    await Driver.findByIdAndUpdate(driverId, {
      location: { lat: latNum, lng: lngNum }
    });

    return res.json({ 
      success: true,
      message: "Location updated" 
    });
  } catch (err) {
    console.error("Location update error:", err);
    res.status(500).json({ 
      success: false,
      message: "Server error" 
    });
  }
};

export const toggleSharing = async (req, res) => {
  try {
    // Get driver ID from authenticated user
    const driverId = req.user?._id;

    if (!driverId) {
      return res.status(401).json({ 
        success: false,
        message: "Unauthorized" 
      });
    }

    const { state } = req.body;

    if (typeof state !== "boolean") {
      return res.status(400).json({ 
        success: false,
        message: "Sharing state must be boolean" 
      });
    }

    await Driver.findByIdAndUpdate(driverId, {
      isSharingLocation: state
    });

    return res.json({
      success: true,
      message: `Sharing turned ${state ? "on" : "off"}`
    });
  } catch (err) {
    console.error("Toggle sharing error:", err);
    res.status(500).json({ 
      success: false,
      message: "Server error" 
    });
  }
};