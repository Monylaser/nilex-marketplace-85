import { Badge } from "@/components/ui/badge";
import { ShieldCheck, BadgeCheck, Crown, Building2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  level: number | null | undefined;
  size?: "sm" | "md";
  className?: string;
}

const META: Record<number, { label: string; icon: any; classes: string }> = {
  1: {
    label: "موثق",
    icon: ShieldCheck,
    classes: "bg-secondary text-secondary-foreground border-border",
  },
  2: {
    label: "موثق رسمياً",
    icon: BadgeCheck,
    classes: "bg-primary/10 text-primary border-primary/30",
  },
  3: {
    label: "موثق VIP",
    icon: Crown,
    classes: "bg-gold/15 text-gold border-gold/40",
  },
  4: {
    label: "شركة موثقة",
    icon: Building2,
    classes: "bg-accent/15 text-accent-foreground border-accent/40",
  },
};

const VerificationBadge = ({ level, size = "sm", className }: Props) => {
  if (!level || level < 1) return null;
  const meta = META[level];
  if (!meta) return null;
  const Icon = meta.icon;
  return (
    <Badge
      variant="outline"
      className={cn(
        "gap-1 font-medium border",
        meta.classes,
        size === "sm" ? "text-[10px] px-1.5 py-0.5" : "text-xs px-2 py-1",
        className,
      )}
    >
      <Icon className={size === "sm" ? "h-3 w-3" : "h-3.5 w-3.5"} />
      {meta.label}
    </Badge>
  );
};

export default VerificationBadge;
