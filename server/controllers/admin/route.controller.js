import Route from "../../models/route.model.js";
import Stop from "../../models/stop.model.js";
import { User } from "../../models/user.model.js";

export const createRoute = async (req, res) => {
  try {
    const { name, code, stops = [] } = req.body;

    const exists = await Route.findOne({ name });
    if (exists) return res.status(400).json({ message: "Route exists" });

    // Create route first
    const route = new Route({ name, code });

    if (stops.length > 0) {
      // Create stops and link them
      const createdStops = await Stop.insertMany(
        stops.map(s => ({ ...s, route: route._id }))
      );
      route.stops = createdStops.map(s => s._id);
    }

    await route.save();
    res.status(201).json(await route.populate("stops"));
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};

export const deleteRoute = async (req, res) => {
  try {
    const route = await Route.findById(req.params.id);
    if (!route) return res.status(404).json({ message: "Route not found" });

    // Check if anyone is using this route
    const userInRoute = await User.findOne({ route: route._id });
    if (userInRoute) return res.status(400).json({ message: "Route is in use by Driver or Students" });

    await Stop.deleteMany({ route: route._id });
    await route.deleteOne(); // Use deleteOne, not remove()

    res.json({ message: "Route and its stops deleted" });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};

export const updateRoute = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const route = await Route.findById(id);
    if (!route) {
      return res.status(404).json({ message: "Route not found" });
    }

    if (updates.assignedDriver) {
      const driver = await User.findById(updates.assignedDriver);
      if (!driver || driver.role !== "driver") {
        return res.status(400).json({ message: "Invalid driver" });
      }

      const otherRoute = await Route.findOne({
        assignedDriver: driver._id
      });

      if (otherRoute && otherRoute._id.toString() !== id) {
        return res.status(400).json({
          message: "Driver already assigned to another route"
        });
      }
    }

    Object.assign(route, updates);
    await route.save();

    const populated = await Route.findById(id)
      .populate("stops")
      .populate("assignedDriver", "name loginID");

    res.json(populated);
  } catch (err) {
    console.error("UPDATE ROUTE ERROR:", err);
    res.status(500).json({ message: "Server error" });
  }
};

export const listRoutes = async (req, res) => {
  try {
    const routes = await Route.find()
      .populate("stops")
      .populate("assignedDriver", "name loginID");

    res.json(routes);
  } catch (err) {
    console.error("LIST ROUTES ERROR:", err);
    res.status(500).json({ message: "Server error" });
  }
};

export const getRoute = async (req, res) => {
  try {
    const route = await Route.findById(req.params.id)
      .populate("stops")
      .populate("assignedDriver", "name loginID");

    if (!route) {
      return res.status(404).json({ message: "Route not found" });
    }

    res.json(route);
  } catch (err) {
    console.error("GET ROUTE ERROR:", err);
    res.status(500).json({ message: "Server error" });
  }
};
