import type { User, UpsertUser } from "@shared/models/auth";
import { sqlite } from "../db";
const sqlClient = sqlite as any;

const userIdColumnType = String(
  sqlClient.prepare("PRAGMA table_info(users)").all().find((column: any) => column.name === "id")?.type ?? "TEXT",
).toUpperCase();
const usersUseIntegerIds = userIdColumnType.includes("INT");

export interface IAuthStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByLogin(login: string): Promise<User | undefined>;
  getUsers(): Promise<User[]>;
  upsertUser(user: UpsertUser): Promise<User>;
  createUser(user: UpsertUser): Promise<User>;
  approveUser(id: string): Promise<User>;
  updateRole(id: string, role: string): Promise<User>;
  updateAccessLevel(id: string, accessLevel: "pending" | "active" | "moderator" | "admin"): Promise<User>;
  updateProfile(
    id: string,
    profile: {
      name?: string;
      nama?: string;
      bio?: string;
      accountStatus?: "pending" | "active" | "banned";
      achievements?: string;
      interests?: string;
      firstName?: string;
      lastName?: string;
      location?: string;
      profileImageUrl?: string | null;
      birthDate?: string;
      aimsNumber?: string;
      wasiyatNumber?: string;
      waisiyatNumber?: string;
      waqfNumber?: string;
      hizebStatus?: "Jamiah Student" | "Mubaligh";
    },
  ): Promise<User>;
  banUser(id: string): Promise<User>;
  unbanUser(id: string): Promise<User>;
  deleteUser(id: string): Promise<boolean>;
  updateUserByAdmin(
    id: string,
    updates: {
      firstName?: string;
      lastName?: string;
      bio?: string;
      role?: string;
      isApproved?: boolean;
    },
  ): Promise<User>;
}

function parseDate(value: unknown): Date | null {
  if (value === null || value === undefined || value === "") {
    return null;
  }

  if (typeof value === "number") {
    return new Date(value);
  }

  return new Date(String(value));
}

function normalizeText(value: unknown): string | undefined {
  if (value === null || value === undefined) {
    return undefined;
  }

  const text = String(value).trim();
  return text ? text : undefined;
}

function joinNames(firstName: unknown, lastName: unknown): string | undefined {
  const joined = [normalizeText(firstName), normalizeText(lastName)].filter(Boolean).join(" ").trim();
  return joined || undefined;
}

function mapUser(row: Record<string, any> | undefined): User | undefined {
  if (!row) {
    return undefined;
  }

  const fullName = joinNames(row.first_name, row.last_name);

  return {
    id: String(row.id),
    name: row.name ?? row.nama ?? fullName ?? row.username ?? null,
    username: row.username ?? "",
    password: row.password ?? "",
    email: row.email ?? null,
    nama: row.nama ?? row.name ?? fullName ?? row.username ?? null,
    firstName: row.first_name ?? row.nama ?? null,
    lastName: row.last_name ?? null,
    profileImageUrl: row.profile_image_url ?? row.profile_picture ?? null,
    profilePicture: row.profile_picture ?? row.profile_image_url ?? null,
    location: row.location ?? null,
    bio: row.bio ?? null,
    accountStatus: (row.status as any) ?? "pending",
    status: (row.status as any) ?? "pending",
    achievements: row.achievements ?? null,
    interests: row.interests ?? null,
    birthDate: row.birth_date ? String(row.birth_date) : null,
    aimsNumber: row.aims_number ?? null,
    wasiyatNumber: row.waisiyat_number ?? row.wasiyat_number ?? null,
    waisiyatNumber: row.waisiyat_number ?? row.wasiyat_number ?? null,
    waqfNumber: row.waqf_number ?? null,
    hizebStatus: (row.registration_status as any) ?? null,
    rank: row.rank ?? null,
    totalPost: Number(row.total_post ?? 0),
    totalUpvote: Number(row.total_upvote ?? 0),
    role: row.role ?? "user",
    isBanned: Boolean(row.is_banned ?? 0),
    isApproved: row.status === 'active' || row.is_approved === 1,
    createdAt: parseDate(row.created_at),
    updatedAt: parseDate(row.updated_at ?? row.created_at),
  };
}

class AuthStorage implements IAuthStorage {
  async getUser(id: string): Promise<User | undefined> {
    const row = sqlClient
      .prepare(
        `SELECT
           id, name, username, nama, email, password, bio, profile_picture, role,
           first_name, last_name, profile_image_url, location, status,
           achievements, interests, birth_date, aims_number, waisiyat_number,
           waqf_number, registration_status, is_approved, is_banned, created_at, updated_at
         FROM users
         WHERE id = ?`,
      )
      .get(id) as Record<string, any> | undefined;

    return mapUser(row);
  }

  async getUsers(): Promise<User[]> {
    const rows = sqlClient
      .prepare(
        `SELECT
           id, name, username, nama, email, password, bio, profile_picture, role,
           first_name, last_name, profile_image_url, location, status,
           achievements, interests, birth_date, aims_number, waisiyat_number,
           waqf_number, registration_status, is_approved, is_banned, created_at, updated_at, total_post, total_upvote
         FROM users
         ORDER BY id ASC`,
      )
      .all() as Record<string, any>[];

    return rows.map((row) => mapUser(row)!).filter(Boolean);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const row = sqlClient
      .prepare(
        `SELECT
           id, name, username, nama, email, password, bio, profile_picture, role,
           first_name, last_name, profile_image_url, location, status,
           achievements, interests, birth_date, aims_number, waisiyat_number,
           waqf_number, registration_status, is_approved, is_banned, created_at, updated_at, total_post, total_upvote
         FROM users
         WHERE lower(username) = lower(?)`,
      )
      .get(username) as Record<string, any> | undefined;

    return mapUser(row);
  }

  async getUserByLogin(login: string): Promise<User | undefined> {
    const normalizedLogin = String(login).trim();
    if (!normalizedLogin) {
      return undefined;
    }

    const row = sqlClient
      .prepare(
        `SELECT
           id, name, username, nama, email, password, bio, profile_picture, role,
           first_name, last_name, profile_image_url, location, status,
           achievements, interests, birth_date, aims_number, waisiyat_number,
           waqf_number, registration_status, is_approved, is_banned, created_at, updated_at, total_post, total_upvote
         FROM users
         WHERE lower(username) = lower(?)
            OR lower(email) = lower(?)
         LIMIT 1`,
      )
      .get(normalizedLogin, normalizedLogin) as Record<string, any> | undefined;

    return mapUser(row);
  }

  async createUser(userData: UpsertUser): Promise<User> {
    const firstName = userData.firstName ?? null;
    const lastName = userData.lastName ?? null;
    const derivedFullName = joinNames(firstName, lastName);
    const name = normalizeText(userData.name) ?? derivedFullName ?? normalizeText(userData.username) ?? "User";
    const nama = normalizeText(userData.nama) ?? name ?? derivedFullName ?? normalizeText(userData.username) ?? "User";

    if (usersUseIntegerIds) {
      const result = sqlClient
        .prepare(
          `INSERT INTO users (
             name, username, nama, email, password, bio, profile_picture, role, rank,
             total_post, total_upvote, first_name, last_name, profile_image_url,
             location, status, achievements, interests, birth_date, aims_number,
             waisiyat_number, waqf_number, registration_status, is_approved, updated_at
           ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        )
        .run(
          name,
          userData.username,
          nama,
          userData.email ?? null,
          userData.password,
          userData.bio ?? null,
          userData.profileImageUrl ?? null,
          userData.role ?? "user",
          userData.role === "admin" || userData.role === "superadmin" ? "S++" : "C",
          0,
          0,
          firstName,
          lastName,
          userData.profileImageUrl ?? null,
          userData.location ?? null,
          userData.accountStatus ?? "pending",
          userData.achievements ?? null,
          userData.interests ?? null,
          userData.birthDate ?? null,
          userData.aimsNumber ?? null,
          userData.wasiyatNumber ?? userData.waisiyatNumber ?? null,
          userData.waqfNumber ?? null,
          userData.hizebStatus ?? null,
          (userData.isApproved || userData.accountStatus === "active") ? 1 : 0,
          Date.now(),
        );

      return (await this.getUser(String(result.lastInsertRowid)))!;
    }

    sqlClient
      .prepare(
        `INSERT INTO users (
           id, name, username, nama, email, password, bio, profile_picture, role, rank,
           total_post, total_upvote, first_name, last_name, profile_image_url,
           location, status, achievements, interests, birth_date, aims_number,
           waisiyat_number, waqf_number, registration_status, is_approved, updated_at
         ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      )
      .run(
        userData.id,
        name,
        userData.username,
        nama,
        userData.email ?? null,
        userData.password,
        userData.bio ?? null,
        userData.profileImageUrl ?? null,
        userData.role ?? "user",
        userData.role === "admin" || userData.role === "superadmin" ? "S++" : "C",
        0,
        0,
        firstName,
        lastName,
        userData.profileImageUrl ?? null,
        userData.location ?? null,
        userData.accountStatus ?? "pending",
        userData.achievements ?? null,
        userData.interests ?? null,
        userData.birthDate ?? null,
        userData.aimsNumber ?? null,
        userData.wasiyatNumber ?? userData.waisiyatNumber ?? null,
        userData.waqfNumber ?? null,
        userData.hizebStatus ?? null,
        (userData.isApproved || userData.accountStatus === "active") ? 1 : 0,
        Date.now(),
      );

    return (await this.getUser(String(userData.id)))!;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    if (userData.id) {
      const existing = await this.getUser(String(userData.id));
      if (existing) {
        const merged = {
          ...existing,
          ...userData,
          profileImageUrl: userData.profileImageUrl ?? existing.profileImageUrl,
          firstName: userData.firstName ?? existing.firstName,
          lastName: userData.lastName ?? existing.lastName,
        };

        const derivedFullName = joinNames(merged.firstName, merged.lastName);
        const name = normalizeText(userData.name) ?? normalizeText(merged.name) ?? derivedFullName ?? normalizeText(merged.username) ?? "User";
        const nama =
          normalizeText(userData.nama) ??
          normalizeText(userData.name) ??
          normalizeText(merged.nama) ??
          name;

        sqlClient
          .prepare(
            `UPDATE users
             SET name = ?, username = ?, nama = ?, email = ?, password = ?, bio = ?, profile_picture = ?,
                 role = ?, first_name = ?, last_name = ?, profile_image_url = ?, location = ?,
                 status = ?, achievements = ?, is_approved = ?, updated_at = ?
             WHERE id = ?`,
          )
          .run(
            name,
            merged.username,
            nama,
            merged.email ?? null,
            merged.password,
            merged.bio ?? null,
            merged.profileImageUrl ?? null,
            merged.role ?? "user",
            merged.firstName ?? null,
            merged.lastName ?? null,
            merged.profileImageUrl ?? null,
            merged.location ?? null,
            merged.accountStatus ?? "pending",
            merged.achievements ?? null,
            (merged.isApproved || merged.accountStatus === "active") ? 1 : 0,
            Date.now(),
            existing.id,
          );

        return (await this.getUser(existing.id))!;
      }
    }

    const existingByUsername = await this.getUserByUsername(userData.username);
    if (existingByUsername) {
      return this.upsertUser({ ...userData, id: existingByUsername.id });
    }

    return this.createUser(userData);
  }

  async approveUser(id: string): Promise<User> {
    sqlClient
      .prepare("UPDATE users SET status = 'active', is_approved = 1, updated_at = ? WHERE id = ?")
      .run(Date.now(), id);

    return (await this.getUser(id))!;
  }

  async updateRole(id: string, role: string): Promise<User> {
    sqlClient
      .prepare(
        "UPDATE users SET role = ?, rank = CASE WHEN ? = 'admin' THEN 'S++' ELSE rank END, updated_at = ? WHERE id = ?",
      )
      .run(role, role, Date.now(), id);

    return (await this.getUser(id))!;
  }

  async updateAccessLevel(id: string, accessLevel: "pending" | "active" | "moderator" | "admin"): Promise<User> {
    const existing = await this.getUser(id);
    if (!existing) {
      throw new Error("User not found");
    }

    const nextRole =
      accessLevel === "moderator"
        ? "moderator"
        : accessLevel === "admin"
          ? "admin"
          : "user";
    const nextStatus = accessLevel === "pending" ? "pending" : "active";
    const nextRank =
      accessLevel === "admin"
        ? "S++"
        : accessLevel === "moderator"
          ? "B"
          : "C";

    sqlClient
      .prepare(
        `UPDATE users
         SET status = ?, role = ?, is_approved = ?, is_banned = 0, rank = ?, updated_at = ?
         WHERE id = ?`,
      )
      .run(
        nextStatus,
        nextRole,
        nextStatus === "active" ? 1 : 0,
        nextRank,
        Date.now(),
        id,
      );

    return (await this.getUser(id))!;
  }

  async updateProfile(
    id: string,
    profile: {
      name?: string;
      nama?: string;
      bio?: string;
      accountStatus?: "pending" | "active" | "banned";
      achievements?: string;
      interests?: string;
      firstName?: string;
      lastName?: string;
      location?: string;
      profileImageUrl?: string | null;
      birthDate?: string;
      aimsNumber?: string;
      wasiyatNumber?: string;
      waisiyatNumber?: string;
      waqfNumber?: string;
      hizebStatus?: "Jamiah Student" | "Mubaligh";
    },
  ): Promise<User> {
    const existing = await this.getUser(id);
    if (!existing) {
      throw new Error("User not found");
    }

    const firstName = profile.firstName ?? existing.firstName;
    const lastName = profile.lastName ?? existing.lastName;
    const derivedFullName = joinNames(firstName, lastName);
    const name =
      normalizeText(profile.name) ??
      normalizeText(profile.nama) ??
      normalizeText(existing.name) ??
      derivedFullName ??
      normalizeText(existing.username) ??
      "User";
    const fallbackNama =
      name ??
      derivedFullName ??
      normalizeText(existing.nama) ??
      normalizeText(existing.username) ??
      "User";
    const nama = normalizeText(profile.nama) ?? fallbackNama;

    sqlClient
      .prepare(
        `UPDATE users
         SET name = ?, nama = ?, bio = ?, profile_picture = ?, first_name = ?, last_name = ?,
             profile_image_url = ?, location = ?, status = ?, achievements = ?, interests = ?,
             birth_date = ?, aims_number = ?, waisiyat_number = ?, waqf_number = ?,
             registration_status = ?, updated_at = ?
         WHERE id = ?`,
      )
      .run(
        name,
        nama,
        profile.bio ?? existing.bio ?? null,
        profile.profileImageUrl ?? existing.profileImageUrl ?? null,
        firstName ?? null,
        lastName ?? null,
        profile.profileImageUrl ?? existing.profileImageUrl ?? null,
        profile.location ?? existing.location ?? null,
        profile.accountStatus ?? existing.accountStatus ?? "pending",
        profile.achievements ?? existing.achievements ?? null,
        profile.interests ?? existing.interests ?? null,
        profile.birthDate ?? existing.birthDate ?? null,
        profile.aimsNumber ?? existing.aimsNumber ?? null,
        profile.wasiyatNumber ?? profile.waisiyatNumber ?? existing.wasiyatNumber ?? existing.waisiyatNumber ?? null,
        profile.waqfNumber ?? existing.waqfNumber ?? null,
        profile.hizebStatus ?? existing.hizebStatus ?? null,
        Date.now(),
        id,
      );

    return (await this.getUser(id))!;
  }

  // Admin operations
  async banUser(id: string): Promise<User> {
    sqlClient
      .prepare("UPDATE users SET is_banned = 1, status = 'banned', updated_at = ? WHERE id = ?")
      .run(Date.now(), id);
    return (await this.getUser(id))!;
  }

  async unbanUser(id: string): Promise<User> {
    sqlClient
      .prepare("UPDATE users SET is_banned = 0, status = 'active', is_approved = 1, updated_at = ? WHERE id = ?")
      .run(Date.now(), id);
    return (await this.getUser(id))!;
  }

  async deleteUser(id: string): Promise<boolean> {
    const numericId = Number(id);
    const articleRows = sqlClient
      .prepare("SELECT id FROM articles WHERE author_id = ?")
      .all(id) as Array<{ id: number }>;
    const articleIds = articleRows.map((row) => row.id);

    const removeUser = sqlClient.transaction((targetId: string, legacyId: number, authoredArticleIds: number[]) => {
      if (authoredArticleIds.length > 0) {
        const placeholders = authoredArticleIds.map(() => "?").join(", ");
        sqlClient.prepare(`DELETE FROM upvotes WHERE article_id IN (${placeholders})`).run(...authoredArticleIds);
        sqlClient.prepare(`DELETE FROM comments WHERE article_id IN (${placeholders})`).run(...authoredArticleIds);
        sqlClient.prepare(`DELETE FROM notifications WHERE article_id IN (${placeholders})`).run(...authoredArticleIds);
        sqlClient.prepare(`DELETE FROM articles WHERE id IN (${placeholders})`).run(...authoredArticleIds);
      }

      sqlClient.prepare("DELETE FROM upvotes WHERE user_id = ?").run(targetId);
      sqlClient.prepare("DELETE FROM comments WHERE user_id = ?").run(targetId);
      sqlClient.prepare("DELETE FROM notifications WHERE user_id = ? OR actor_id = ?").run(targetId, targetId);
      sqlClient.prepare("DELETE FROM reports WHERE reporter_id = ? OR resolved_by = ?").run(targetId, targetId);
      sqlClient.prepare("DELETE FROM direct_messages WHERE sender_id = ? OR receiver_id = ?").run(targetId, targetId);

      if (Number.isFinite(legacyId)) {
        sqlClient.prepare("DELETE FROM messages WHERE sender_id = ? OR receiver_id = ?").run(legacyId, legacyId);
      }

      sqlClient.prepare("DELETE FROM users WHERE id = ?").run(targetId);
    });

    removeUser(id, numericId, articleIds);
    return true;
  }

  async updateUserByAdmin(
    id: string,
    updates: {
      firstName?: string;
      lastName?: string;
      bio?: string;
      role?: string;
      isApproved?: boolean;
    },
  ): Promise<User> {
    const existing = await this.getUser(id);
    if (!existing) throw new Error("User not found");

    const firstName = updates.firstName ?? existing.firstName;
    const lastName = updates.lastName ?? existing.lastName;
    const nama = [firstName, lastName].filter(Boolean).join(" ").trim() || existing.username;

    sqlClient
      .prepare(
        `UPDATE users
         SET nama = ?, bio = ?, first_name = ?, last_name = ?,
             role = ?, is_approved = ?, updated_at = ?
         WHERE id = ?`,
      )
      .run(
        nama,
        updates.bio ?? existing.bio ?? null,
        firstName ?? null,
        lastName ?? null,
        updates.role ?? existing.role,
        updates.isApproved !== undefined ? (updates.isApproved ? 1 : 0) : (existing.isApproved ? 1 : 0),
        Date.now(),
        id,
      );

    return (await this.getUser(id))!;
  }
}

export const authStorage = new AuthStorage();
