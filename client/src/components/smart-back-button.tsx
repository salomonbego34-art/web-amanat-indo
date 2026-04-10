import type { ComponentProps } from "react";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useSmartBack } from "@/hooks/use-smart-back";
import { cn } from "@/lib/utils";

type SmartBackButtonProps = {
  fallback?: string;
  label?: string;
  className?: string;
} & Pick<ComponentProps<typeof Button>, "size" | "variant">;

export function SmartBackButton({
  fallback = "/feed",
  label = "Kembali",
  className,
  size = "sm",
  variant = "ghost",
}: SmartBackButtonProps) {
  const { goBack } = useSmartBack(fallback);

  return (
    <Button
      type="button"
      size={size}
      variant={variant}
      className={cn("gap-2", className)}
      onClick={() => goBack(fallback)}
    >
      <ArrowLeft className="h-4 w-4" />
      {label}
    </Button>
  );
}
