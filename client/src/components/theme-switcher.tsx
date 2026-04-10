import { useTheme } from "next-themes";
import { amanatThemes, type AmanatTheme } from "@/lib/amanat";

export function ThemeSwitcher({ compact = false }: { compact?: boolean }) {
  const { theme, setTheme } = useTheme();

  return (
    <div className={compact ? "space-y-2" : "space-y-3"}>
      {amanatThemes.map((item) => {
        const active = theme === item.value;
        return (
          <button
            key={item.value}
            type="button"
            className={`w-full rounded-2xl border border-border transition-all duration-200 px-4 py-3 text-left ${
              active
                ? "border-[hsl(var(--primary))] bg-[hsl(var(--primary)_/_0.12)]"
                : "bg-background/60 hover:border-[hsl(var(--primary)_/_0.4)]"
            }`}
            onClick={() => setTheme(item.value as AmanatTheme)}
          >
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm font-semibold">{item.label}</p>
              <span
                className={`h-4 w-11 rounded-full border border-white/10 inline-flex ${item.value}`}
                style={{
                  background:
                    item.value === "amanat"
                      ? "linear-gradient(90deg, #022c22, #16a34a 70%, #bef264)"
                      : item.value === "ide"
                        ? "linear-gradient(90deg, #0d1117, #1f2937 48%, #58a6ff 82%, #f2cc60)"
                        : item.value === "classic"
                          ? "linear-gradient(90deg, #f2e8d5, #c97316)"
                          : item.value === "gold"
                            ? "linear-gradient(90deg, #0a0a0a, #FFD700 40%, #22c55e 70%, #C9A227)"
                            : "linear-gradient(90deg, #ff0000, #ffff00 33%, #0066ff 66%, #ff0000)",
                }}
                aria-hidden="true"
              />
            </div>
            {!compact ? <p className="mt-1 text-sm text-muted-foreground">{item.description}</p> : null}
          </button>
        );
      })}
    </div>
  );
}
