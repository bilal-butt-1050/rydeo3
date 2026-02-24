import { Driver,Student } from "../models/user.model.js";
import Route from "../models/route.model.js";
import Stop from "../models/stop.model.js";

// Simplified Toggle - only use REST for the "Master Switch"
export const toggleSharing = async (req, res) => {
  try {
    const { state } = req.body;
    const driver = await Driver.findByIdAndUpdate(
      req.user._id, 
      { isSharingLocation: state }, 
      { new: true }
    );

    return res.json({
      success: true,
      message: `Bus is now ${state ? "Online" : "Offline"}`,
      isSharingLocation: driver.isSharingLocation
    });
  } catch (err) {
    res.status(500).json({ success: false, message: "Server error" });
  }
};

export const getAssignedRoute = async (req, res) => {
  try {
    // 1. Find the route assigned to this driver
    const route = await Route.findById(req.user.route)
      .populate({
        path: "stops",
        options: { sort: { order: 1 } } // Ensure stops are in chronological order
      });

    if (!route) {
      return res.status(404).json({ success: false, message: "No route assigned" });
    }

    // 2. Find all students assigned to this route
    // We populate their preferredStop so the driver knows where to pick them up
    const students = await Student.find({ route: route._id })
      .select("name loginID preferredStop")
      .populate("preferredStop", "name");

    return res.json({
      success: true,
      data: {
        route,
        students
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};
