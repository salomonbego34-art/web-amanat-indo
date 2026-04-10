import type { User } from "@shared/models/auth";

export type AmanatTheme = "amanat" | "ide" | "classic" | "gold" | "comic";

export const USER_STATUS = {
  PENDING: "pending" as const,
  ACTIVE: "active" as const,
  BANNED: "banned" as const,
} as const;

export type UserStatus = typeof USER_STATUS[keyof typeof USER_STATUS];

export const amanatThemes: Array<{ value: AmanatTheme; label: string; description: string }> = [
  { value: "amanat", label: "Amanat Dark", description: "Hijau gelap yang tenang, fokus, dan nyaman dipakai lama." },
  { value: "ide", label: "IDE Mode", description: "Nuansa editor kode bergaya VSCode dengan fokus struktur diskusi." },
  { value: "classic", label: "Classic Forum", description: "Flat forum style ala komunitas lama yang padat teks." },
  { value: "gold", label: "AMANAT Gold", description: "Hitam pekat, aksen emas, dan nuansa premium eksklusif." },
  { value: "comic", label: "Comic Theme", description: "🎭 Warna cerah, border tebal, nuansa buku komik yang fun!" },
];

export function getDisplayName(user: Partial<User> | { name?: string | null; nama?: string | null; username?: string | null; firstName?: string | null; lastName?: string | null }) {
  const full = [user.firstName, user.lastName].filter(Boolean).join(" ").trim();
  return user.name || user.nama || full || user.username || "Anggota";
}

export function getRankFromStats(input: {
  role?: string | null;
  rank?: string | null;
  totalPost?: number | null;
  totalUpvote?: number | null;
  score?: number | null;
}) {
  if (input.role === "admin") return "S++";
  if (input.rank) return input.rank;
  const score = input.score ?? ((Number(input.totalPost ?? 0) * 5) + Number(input.totalUpvote ?? 0));
  if (score <= 20) return "C";
  if (score <= 50) return "B";
  if (score <= 100) return "A";
  return "S";
}

export function getRankBadgeClass(rank: string) {
  const base = "border-yellow-500/30 bg-yellow-500/10 shadow-lg font-semibold text-xs uppercase tracking-wide";
  switch (rank) {
    case "S++":
      return `${base} text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-yellow-600 drop-shadow-[0_0_10px_rgba(255,215,0,0.7)]`;
    case "S":
      return `${base} text-yellow-300 drop-shadow-[0_0_8px_rgba(255,215,0,0.5)]`;
    case "A":
      return `${base} text-yellow-200 drop-shadow-[0_0_6px_rgba(255,215,0,0.4)]`;
    case "B":
      return `${base} text-amber-300 drop-shadow-[0_0_4px_rgba(255,215,0,0.3)]`;
    default:
      return `${base} text-zinc-300`;
  }
}
