import jwt from "jsonwebtoken";
import { User } from "../models/user.model.js";

export const protect = (roles = []) => {
    // Ensure roles is always an array even if a single string is passed
    const allowedRoles = typeof roles === 'string' ? [roles] : roles;

    return async (req, res, next) => {
        try {
            let token = req.cookies.token;
            if (!token && req.headers.authorization?.startsWith("Bearer")) {
                token = req.headers.authorization.split(" ")[1];
            }

            if (!token) return res.status(401).json({ success: false, message: "No token provided" });

            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            
            // Use .select("-password") for security - don't carry the hash in req.user
            const user = await User.findById(decoded.id).select("-password");

            if (!user || !user.isActive) {
                return res.status(401).json({ success: false, message: "User unauthorized" });
            }

            // Strict Role Check
            if (allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
                return res.status(403).json({ 
                    success: false, 
                    message: `Access denied. Role ${user.role} is not authorized.` 
                });
            }

            req.user = user;
            next();
        } catch (err) {
            return res.status(401).json({ success: false, message: "Token invalid or expired" });
        }
    };
};