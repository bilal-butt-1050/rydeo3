import { Student } from "../../models/user.model.js";
import Stop from "../../models/stop.model.js";

export const createStudent = async (req, res) => {
  try {
    const { name, loginID, password, route, preferredStop } = req.body;

    // 1. Validate Input
    if (!route || !loginID) return res.status(400).json({ message: "Missing required fields" });

    // 2. Check for duplicate LoginID
    const existing = await Student.findOne({ loginID });
    if (existing) return res.status(400).json({ message: "Student LoginID already exists" });

    // 3. Validate Stop belongs to Route
    if (preferredStop) {
      const stopExists = await Stop.findOne({ _id: preferredStop, route: route });
      if (!stopExists) return res.status(400).json({ message: "Stop does not belong to this route" });
    }

    const student = await Student.create({
      name, loginID, password, route, preferredStop, role: "student"
    });

    res.status(201).json({ success: true, student });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

export const updateStudent = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const student = await Student.findById(id);
    if (!student) return res.status(404).json({ message: "Student not found" });

    Object.assign(student, updates);
    await student.save();

    res.json({ message: "Student updated successfully" });
  } catch (err) {
    console.error("UPDATE STUDENT ERROR:", err);
    res.status(500).json({ message: "Server error" });
  }
};

export const deleteStudent = async (req, res) => {
  try {
    const student = await Student.findByIdAndDelete(req.params.id);
    if (!student) return res.status(404).json({ message: "Student not found" });

    res.json({ message: "Student deleted successfully" });
  } catch (err) {
    console.error("DELETE STUDENT ERROR:", err);
    res.status(500).json({ message: "Server error" });
  }
};

export const listStudents = async (req, res) => {
  try {
    const students = await Student.find()
      .populate("route preferredStop")
      .select("-password");

    res.json(students);
  } catch (err) {
    console.error("LIST STUDENTS ERROR:", err);
    res.status(500).json({ message: "Server error" });
  }
};

export const getStudent = async (req, res) => {
  try {
    const student = await Student.findById(req.params.id).populate("route preferredStop").select("-password");
    if (!student) return res.status(404).json({ message: "Student not found" });

    res.json(student);
  } catch (err) {
    console.error("GET STUDENT ERROR:", err);
    res.status(500).json({ message: "Server error" });
  }
};
