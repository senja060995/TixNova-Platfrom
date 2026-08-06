import { forwardRef, HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: "primary" | "success" | "warning" | "danger" | "info" | "default";
  size?: "sm" | "md" | "lg";
  dot?: boolean;
}

export const Badge = forwardRef<HTMLSpanElement, BadgeProps>(
  ({ className, variant = "default", size = "md", dot = false, children, ...props }, ref) => {
    const variants = {
      default: "bg-bg-elevated text-text-secondary border border-bg-border",
      primary: "bg-primary/20 text-primary border border-primary/30",
      success: "bg-success/20 text-success border border-success/30",
      warning: "bg-warning/20 text-warning border border-warning/30",
      danger: "bg-danger/20 text-danger border border-danger/30",
      info: "bg-info/20 text-info border border-info/30",
    };

    const sizes = {
      sm: "px-2 py-0.5 text-xs",
      md: "px-2.5 py-1 text-sm",
      lg: "px-3 py-1.5 text-base",
    };

    return (
      <span
        ref={ref}
        className={cn(
          "inline-flex items-center gap-1.5 font-medium rounded-full border",
          variants[variant],
          sizes[size],
          className
        )}
        {...props}
      >
        {dot && <span className="w-1.5 h-1.5 rounded-full bg-current" />}
        {children}
      </span>
    );
  }
);

Badge.displayName = "Badge";