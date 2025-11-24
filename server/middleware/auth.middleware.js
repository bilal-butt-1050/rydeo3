// middleware/auth.middleware.js
import jwt from "jsonwebtoken";
import { User } from "../models/user.model.js";

export const protect = (allowedRoles = []) => {
  return async (req, res, next) => {
    try {
      // 1: Validate JWT
      const token = req.cookies.token;
      if (!token) {
        return res.status(401).json({ message: "Not authorized. No token." });
      }

      let decoded;
      try {
        decoded = jwt.verify(token, process.env.JWT_SECRET);
      } catch (err) {
        return res.status(401).json({ message: "Invalid or expired token." });
      }

      // 2: Fetch actual user
      const user = await User.findById(decoded.id).populate("route");
      if (!user) {
        return res.status(401).json({ message: "User no longer exists." });
      }

      // 3: Compare actual DB role
      // (token.role is ignored for safety)
      if (allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
        return res.status(403).json({ message: "Forbidden." });
      }

      // 4: Attach user to req
      req.user = user;

      next();
    } catch (err) {
      console.error("AUTH ERROR:", err);
      res.status(500).json({ message: "Server authentication error." });
    }
  };
};
