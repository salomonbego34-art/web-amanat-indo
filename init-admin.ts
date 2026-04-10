import { authStorage } from "./server/auth/storage.js";
import { hashPassword } from "./server/auth/security.js";
import { randomUUID } from "node:crypto";

async function initSuperAdmin() {
  try {
    // Check if superadmin already exists
    const existing = await authStorage.getUserByLogin("superadmin");
    if (existing) {
      console.log("✅ Superadmin already exists:", existing.username);
      process.exit(0);
    }

    // Check if any users exist
    const users = await authStorage.getUsers();
    console.log(`📊 Current users in database: ${users.length}`);

    if (users.length === 0) {
      console.log("📝 Creating superadmin (first user)...");
      const user = await authStorage.createUser({
        id: randomUUID(),
        name: "Super Admin",
        username: "superadmin",
        password: hashPassword("superadmin"),
        email: null,
        bio: "Administrator account",
        accountStatus: "active",
        role: "superadmin",
        aimsNumber: "ADMIN001",
      });
      console.log("✅ Superadmin created successfully!");
      console.log("   Username: superadmin");
      console.log("   Password: superadmin");
      console.log("   Role: superadmin");
    } else {
      console.log("⚠️  Database already has users, cannot create superadmin");
      console.log("To create a superadmin, delete the database and restart");
    }
  } catch (error) {
    console.error("❌ Error:", error);
    process.exit(1);
  }
}

initSuperAdmin().then(() => process.exit(0));
