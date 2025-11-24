import Stop from "../../models/stop.model.js";
import Route from "../../models/route.model.js";
import { User } from "../../models/user.model.js";

export const addStop = async (req, res) => {
  try {
    const { routeId } = req.params;
    const { name, coordinates, order } = req.body;

    const route = await Route.findById(routeId);
    if (!route) return res.status(404).json({ message: "Route not found" });

    const stop = await Stop.create({
      name,
      coordinates,
      order: order || 0,
      route: routeId
    });

    route.stops.push(stop._id);

    const stops = await Stop.find({ route: routeId }).sort({
      order: 1,
      createdAt: 1
    });

    route.startStop = stops[0]?._id || null;
    route.endStop = stops.at(-1)?._id || null;

    await route.save();

    res.status(201).json(stop);
  } catch (err) {
    console.error("ADD STOP ERROR:", err);
    res.status(500).json({ message: "Server error" });
  }
};

export const updateStop = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const stop = await Stop.findById(id);
    if (!stop) return res.status(404).json({ message: "Stop not found" });

    Object.assign(stop, updates);
    await stop.save();

    const stops = await Stop.find({ route: stop.route }).sort({
      order: 1,
      createdAt: 1
    });

    const route = await Route.findById(stop.route);
    route.startStop = stops[0]?._id || null;
    route.endStop = stops.at(-1)?._id || null;

    await route.save();

    res.json(stop);
  } catch (err) {
    console.error("UPDATE STOP ERROR:", err);
    res.status(500).json({ message: "Server error" });
  }
};

export const deleteStop = async (req, res) => {
  try {
    const { id } = req.params;

    const stop = await Stop.findById(id);
    if (!stop) return res.status(404).json({ message: "Stop not found" });

    const studentUsing = await User.findOne({
      role: "student",
      preferredStop: stop._id
    });

    if (studentUsing) {
      return res.status(400).json({
        message: "Cannot delete stop: used by students"
      });
    }

    const route = await Route.findById(stop.route);
    if (route) {
      route.stops = route.stops.filter(
        sid => sid.toString() !== stop._id.toString()
      );

      const remaining = await Stop.find({ route: route._id }).sort({
        order: 1,
        createdAt: 1
      });

      route.startStop = remaining[0]?._id || null;
      route.endStop = remaining.at(-1)?._id || null;

      await route.save();
    }

    await stop.remove();

    res.json({ message: "Stop deleted" });
  } catch (err) {
    console.error("DELETE STOP ERROR:", err);
    res.status(500).json({ message: "Server error" });
  }
};

export const getStopsByRoute = async (req, res) => {
  try {
    const stops = await Stop.find({
      route: req.params.routeId
    })
      .populate("route")
      .select("name order");

    res.json(stops);
  } catch (err) {
    console.error("GET STOPS ERROR:", err);
    res.status(500).json({ message: "Server error" });
  }
};
