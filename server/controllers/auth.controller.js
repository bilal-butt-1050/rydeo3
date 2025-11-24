import { User } from "../models/user.model.js";
import { generateToken } from "../utils/jwt.js";

/* ---------------- RESPONSE HELPERS ---------------- */
const success = (res, data = {}, message = "Success", code = 200) => {
  return res.status(code).json({
    success: true,
    message,
    data,
    error: null
  });
};

const fail = (res, message = "Error", code = 400) => {
  return res.status(code).json({
    success: false,
    message,
    data: null,
    error: message
  });
};


/* ---------------- LOGIN ---------------- */
export const login = async (req, res) => {
  const { loginID, password } = req.body;

  try {
    const user = await User.findOne({ loginID });
    if (!user) return fail(res, "Invalid credentials", 401);

    const validPassword = await user.matchPassword(password);
    if (!validPassword) return fail(res, "Invalid credentials", 401);

    user.lastLogin = new Date();
    await user.save();

    const token = generateToken(user._id);

    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 7 * 24 * 60 * 60 * 1000
    });

    return success(
      res,
      {
        id: user._id,
        name: user.name,
        role: user.role
      },
      "Logged in successfully"
    );

  } catch (error) {
    console.error("LOGIN ERROR:", error);
    return fail(res, "Server error", 500);
  }
};


/* ---------------- LOGOUT ---------------- */
export const logout = (req, res) => {
  res.cookie("token", "", { maxAge: 0 });
  return success(res, {}, "Logged out successfully");
};


/* ---------------- GET ME ---------------- */
export const getMe = async (req, res) => {
  try {
    const u = req.user;

    return success(res, {
      id: u._id,
      name: u.name,
      role: u.role,

      // only present for driver
      phone: u.phone || null,

      // only present for student
      preferredStop: u.preferredStop || null,

      // student or driver
      route: u.route || null
    });

  } catch (error) {
    console.error("GET ME ERROR:", error);
    return fail(res, "Server error", 500);
  }
};
