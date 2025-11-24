import { Driver, User } from "../../models/user.model.js";
import Route from "../../models/route.model.js";

export const createDriver = async (req, res) => {
  try {
    const { name, loginID, password, phone, route } = req.body;

    const existing = await Driver.findOne({ loginID });
    if (existing) {
      return res.status(400).json({ message: "Driver already exists" });
    }

    const routeObj = await Route.findById(route);
    if (!routeObj) {
      return res.status(400).json({ message: "Route not found" });
    }

    if (routeObj.assignedDriver) {
      return res.status(400).json({
        message: "Route already has a driver assigned"
      });
    }

    const driver = await Driver.create({
      name,
      loginID,
      password,
      role: "driver",
      phone,
      route
    });

    routeObj.assignedDriver = driver._id;
    await routeObj.save();

    res.status(201).json({
      message: "Driver created successfully",
      driver: {
        id: driver._id,
        name: driver.name,
        loginID: driver.loginID,
        phone: driver.phone,
        route: driver.route
      }
    });
  } catch (err) {
    console.error("CREATE DRIVER ERROR:", err);
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

export const deleteDriver = async (req, res) => {
  try {
    const driver = await Driver.findByIdAndDelete(req.params.id);
    if (!driver) {
      return res.status(404).json({ message: "Driver not found" });
    }

    res.json({ message: "Driver deleted successfully" });
  } catch (err) {
    console.error("DELETE DRIVER ERROR:", err);
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
    const driver = await Driver.findById(req.params.id).select("-password");
    if (!driver) {
      return res.status(404).json({ message: "Driver not found" });
    }

    res.json(driver);
  } catch (err) {
    console.error("GET DRIVER ERROR:", err);
    res.status(500).json({ message: "Server error" });
  }
};
