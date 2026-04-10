import { sql } from "drizzle-orm";
import { index, integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

// Session storage table.
export const sessions = sqliteTable(
  "sessions",
  {
    sid: text("sid").primaryKey(),
    sess: text("sess").notNull(),
    expire: integer("expire", { mode: "timestamp_ms" }).notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)]
);

// User storage table.
// Roles:
// - user: Regular user
// - moderator: Can delete posts/comments and manage reports
// - admin: Can manage users, moderators, and content
// - superadmin: Full system access, can manage admins
export const users = sqliteTable("users", {
  id: text("id").primaryKey().notNull(),
  name: text("name"),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  email: text("email").unique(),
  nama: text("nama"), // maps to 'name' in UI
  firstName: text("first_name"),
  lastName: text("last_name"),
  profileImageUrl: text("profile_image_url"),
  profilePicture: text("profile_picture"),
  location: text("location"),
  bio: text("bio"),
  accountStatus: text("status").$type<"pending" | "active" | "banned">().default("pending"),
  achievements: text("achievements"),
  interests: text("interests"),
  birthDate: text("birth_date"),
  aimsNumber: text("aims_number"),
  wasiyatNumber: text("waisiyat_number"),
  waqfNumber: text("waqf_number"),
  hizebStatus: text("registration_status").$type<"Jamiah Student" | "Mubaligh">(),
  rank: text("rank"),
  totalPost: integer("total_post").notNull().default(0),
  totalUpvote: integer("total_upvote").notNull().default(0),
  role: text("role").notNull().default("user").$type<"user" | "moderator" | "admin" | "superadmin">(), 
  isBanned: integer("is_banned", { mode: "boolean" }).notNull().default(false),
  isApproved: integer("is_approved", { mode: "boolean" }).notNull().default(false),
  createdAt: integer("created_at", { mode: "timestamp_ms" }).default(sql`(unixepoch() * 1000)`),
  updatedAt: integer("updated_at", { mode: "timestamp_ms" }).default(sql`(unixepoch() * 1000)`),
});

export type UpsertUser = typeof users.$inferInsert & {
  waisiyatNumber?: string | null;
};
export type User = typeof users.$inferSelect & {
  status?: "pending" | "active" | "banned";
  waisiyatNumber?: string | null;
};
