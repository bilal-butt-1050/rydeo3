import { User } from "../models/user.model.js";
import { generateToken } from "../utils/jwt.js";

/* ---------------- RESPONSE HELPERS ---------------- */
const success = (res, data = {}, message = "Success", code = 200) => {
  return res.status(code).json({
    success: true,
    message,
    ...data, // Flatten data into response
    error: null
  });
};

const fail = (res, message = "Error", code = 400) => {
  return res.status(code).json({
    success: false,
    message,
    error: message
  });
};

/* ---------------- LOGIN ---------------- */
export const login = async (req, res) => {
  const { loginID, password } = req.body;

  try {
    // Validate input
    if (!loginID || !password) {
      return fail(res, "Login ID and password are required", 400);
    }

    const user = await User.findOne({ loginID }).populate("route");
    if (!user) return fail(res, "Invalid credentials", 401);

    const validPassword = await user.matchPassword(password);
    if (!validPassword) return fail(res, "Invalid credentials", 401);

    // Check if user is active
    if (!user.isActive) {
      return fail(res, "Account is deactivated", 403);
    }

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
        role: user.role,
        route: user.route || null,
        phone: user.phone || null,
        preferredStop: user.preferredStop || null
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
      phone: u.phone || null,
      preferredStop: u.preferredStop || null,
      route: u.route || null
    });

  } catch (error) {
    console.error("GET ME ERROR:", error);
    return fail(res, "Server error", 500);
  }
};

/* ---------------- CHANGE PASSWORD ---------------- */
export const changePassword = async (req, res) => {
  const { currentPassword, newPassword } = req.body;

  try {
    // 1. Basic Validation
    if (!currentPassword || !newPassword) {
      return fail(res, "Both current and new passwords are required", 400);
    }

    // 2. Find user (req.user is populated by your protect middleware)
    const user = await User.findById(req.user._id);
    if (!user) return fail(res, "User not found", 404);

    // 3. Verify current password
    const isMatch = await user.matchPassword(currentPassword);
    if (!isMatch) {
      return fail(res, "Incorrect current password", 401);
    }

    // 4. Check if new password is same as old
    if (currentPassword === newPassword) {
      return fail(res, "New password cannot be the same as the current one", 400);
    }

    // 5. Update and Save
    // The pre-save hook in your user.model.js will automatically hash this
    user.password = newPassword;
    await user.save();

    return success(res, {}, "Password updated successfully");

  } catch (error) {
    console.error("CHANGE PASSWORD ERROR:", error);
    return fail(res, "Server error during password update", 500);
  }
};