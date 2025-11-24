import { Admin } from "../models/user.model.js";

const seedAdmin = async () => {
  try {
    const existingAdmin = await Admin.findOne({ role: "admin" });
    if (!existingAdmin) {

      const admin = new Admin({
        name: process.env.ADMIN_NAME,
        loginID: process.env.ADMIN_LOGINID,
        password: process.env.ADMIN_PASSWORD, 
        permissions: ["manage_users"],
      });

      await admin.save();
      console.log("✅ Default admin created");
    } else {
      console.log("✅ Admin already exists");
    }
  } catch (err) {
    console.error("❌ Error seeding admin:", err);
  }
};

export default seedAdmin;
