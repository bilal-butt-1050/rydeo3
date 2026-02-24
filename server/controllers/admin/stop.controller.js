import Stop from "../../models/stop.model.js";
import Route from "../../models/route.model.js";
import { User } from "../../models/user.model.js";

export const addStop = async (req, res) => {
  try {
    const { routeId } = req.params;
    const { name, coordinates, order } = req.body;

    const stop = await Stop.create({ name, coordinates, order, route: routeId });

    // Push to route array and save (the model hook handles start/end)
    await Route.findByIdAndUpdate(routeId, { 
      $push: { stops: stop._id } 
    }, { new: true });

    res.status(201).json(stop);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};

export const deleteStop = async (req, res) => {
  try {
    const stop = await Stop.findById(req.params.id);
    if (!stop) return res.status(404).json({ message: "Stop not found" });

    // Check if students are using it
    const studentUsing = await User.findOne({ preferredStop: stop._id });
    if (studentUsing) return res.status(400).json({ message: "Stop is assigned to students" });

    // Remove stop ID from Route's array
    await Route.findByIdAndUpdate(stop.route, { $pull: { stops: stop._id } });
    
    await stop.deleteOne();
    res.json({ message: "Stop deleted" });
  } catch (err) {
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
