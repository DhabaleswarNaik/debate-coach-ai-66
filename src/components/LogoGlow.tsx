import logo from "@/assets/logo.png";
import { cn } from "@/lib/utils";

interface LogoGlowProps {
  size?: "sm" | "md" | "lg";
  className?: string;
}

const sizeMap = {
  sm: { wrapper: "w-10 h-10", img: "w-10 h-10", blur: "blur-xl" },
  md: { wrapper: "w-14 h-14", img: "w-14 h-14", blur: "blur-xl" },
  lg: { wrapper: "w-24 h-24", img: "w-24 h-24", blur: "blur-2xl" },
};

export const LogoGlow = ({ size = "md", className }: LogoGlowProps) => {
  const s = sizeMap[size];
  return (
    <div className={cn("relative group cursor-pointer", s.wrapper, className)}>
      <div className={cn(
        "absolute inset-0 bg-gradient-to-br from-primary/30 to-accent/30 rounded-full opacity-60 group-hover:opacity-100 transition-all duration-500 animate-pulse",
        s.blur,
        "group-hover:scale-125"
      )} />
      <img
        src={logo}
        alt="AI Debate Partner"
        className={cn(
          "relative object-contain drop-shadow-lg transition-all duration-500 group-hover:scale-110 group-hover:rotate-3 group-hover:drop-shadow-2xl",
          s.img
        )}
      />
    </div>
  );
};
