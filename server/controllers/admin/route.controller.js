import Route from "../../models/route.model.js";
import Stop from "../../models/stop.model.js";
import { User } from "../../models/user.model.js";

export const createRoute = async (req, res) => {
  try {
    const { name, code, stops = [] } = req.body;

    const exists = await Route.findOne({ name });
    if (exists) {
      return res.status(400).json({
        message: "Route with this name already exists"
      });
    }

    const route = await Route.create({
      name,
      code,
      assignedDriver: null
    });

    if (stops.length > 0) {
      const createdStops = await Promise.all(
        stops.map(s => Stop.create({ ...s, route: route._id }))
      );

      route.stops = createdStops.map(s => s._id);
      route.startStop = route.stops[0] || null;
      route.endStop = route.stops.at(-1) || null;
      await route.save();
    }

    const populated = await Route.findById(route._id)
      .populate("stops");

    res.status(201).json(populated);
  } catch (err) {
    console.error("CREATE ROUTE ERROR:", err);
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

export const deleteRoute = async (req, res) => {
  try {
    const route = await Route.findById(req.params.id);
    if (!route) {
      return res.status(404).json({ message: "Route not found" });
    }

    const studentsAssigned = await User.findOne({
      role: "student",
      route: route._id
    });

    if (studentsAssigned) {
      return res.status(400).json({
        message: "Cannot delete route: students are still assigned"
      });
    }

    if (route.assignedDriver) {
      return res.status(400).json({
        message: "Cannot delete route: driver assigned"
      });
    }

    await Stop.deleteMany({ route: route._id });
    await route.remove();

    res.json({ message: "Route deleted successfully" });
  } catch (err) {
    console.error("DELETE ROUTE ERROR:", err);
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
