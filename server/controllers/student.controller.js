import Route from "../models/route.model.js";
import { Driver } from "../models/user.model.js";

export const getStudentRouteInfo = async (req, res) => {
  try {
    const student = req.user; // From protect middleware

    if (!student.route) {
      return res.status(404).json({ success: false, message: "No route assigned to you yet." });
    }

    // 1. Get Route and its Stops
    const route = await Route.findById(student.route).populate({
      path: "stops",
      options: { sort: { order: 1 } }
    });

    // 2. Get Assigned Driver info (if any)
    const driver = await Driver.findOne({ route: student.route })
      .select("name phone isSharingLocation");

    return res.json({
      success: true,
      data: {
        route,
        driver,
        preferredStopId: student.preferredStop
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Server error fetching route info" });
  }
};