import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils/cn";

const badgeVariants = cva("inline-flex items-center gap-1 rounded-md border px-1.5 py-0.5 text-[11px] font-medium whitespace-nowrap [&_svg]:size-3", {
  variants: {
    variant: {
      default: "border-transparent bg-secondary text-secondary-foreground",
      outline: "bg-card text-muted-foreground",
      blue: "border-transparent bg-accent text-accent-foreground",
      positive: "border-transparent bg-positive-soft text-positive",
      warning: "border-transparent bg-warning-soft text-warning",
      negative: "border-transparent bg-negative-soft text-negative",
    },
  },
  defaultVariants: { variant: "default" },
});

export function Badge({ className, variant, ...props }: React.ComponentProps<"span"> & VariantProps<typeof badgeVariants>) {
  return <span className={cn(badgeVariants({ variant }), className)} {...props} />;
}
