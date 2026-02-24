import { Driver } from "../../models/user.model.js";
import Route from "../../models/route.model.js";

export const createDriver = async (req, res) => {
  try {
    const { name, loginID, password, phone, route } = req.body;

    // 1. Check uniqueness across all users
    const existing = await Driver.findOne({ loginID });
    if (existing) return res.status(400).json({ message: "LoginID already taken" });

    // 2. Validate Route & Availability
    const routeObj = await Route.findById(route);
    if (!routeObj) return res.status(404).json({ message: "Route not found" });
    if (routeObj.assignedDriver) return res.status(400).json({ message: "Route already assigned to another driver" });

    // 3. Create Driver (Role is forced to 'driver' via discriminator/logic)
    const driver = await Driver.create({ name, loginID, password, phone, route, role: "driver" });

    // 4. Update Route reference
    routeObj.assignedDriver = driver._id;
    await routeObj.save();

    res.status(201).json({ success: true, driver });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

export const deleteDriver = async (req, res) => {
  try {
    const driver = await Driver.findById(req.params.id);
    if (!driver) return res.status(404).json({ message: "Driver not found" });

    // CRITICAL: Clear the driver from the route before deleting the driver
    await Route.updateOne({ _id: driver.route }, { $unset: { assignedDriver: "" } });
    
    await driver.deleteOne();
    res.json({ message: "Driver deleted and route unassigned" });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};

export const updateDriver = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const driver = await Driver.findById(id);
    if (!driver) {
      return res.status(404).json({ message: "Driver not found" });
    }

    Object.assign(driver, updates);
    await driver.save();

    res.json({ message: "Driver updated successfully" });
  } catch (err) {
    console.error("UPDATE DRIVER ERROR:", err);
    res.status(500).json({ message: "Server error" });
  }
};


export const listDrivers = async (req, res) => {
  try {
    const drivers = await Driver.find()
      .populate("route")
      .select("-password");

    res.json(drivers);
  } catch (err) {
    console.error("LIST DRIVERS ERROR:", err);
    res.status(500).json({ message: "Server error" });
  }
};

export const getDriver = async (req, res) => {
  try {
    const driver = await Driver.findById(req.params.id).populate("route").select("-password");
    if (!driver) {
      return res.status(404).json({ message: "Driver not found" });
    }

    res.json(driver);
  } catch (err) {
    console.error("GET DRIVER ERROR:", err);
    res.status(500).json({ message: "Server error" });
  }
};
