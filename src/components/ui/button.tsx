import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

/**
 * House `cva` button pattern (FavFan `components/ui/button.tsx`), restyled for LLD:
 * sentence case, gold on obsidian. No glows, no gradients.
 */
const buttonVariants = cva(
  "inline-flex select-none items-center justify-center gap-3 whitespace-nowrap rounded-sm font-sans font-medium tracking-[0.01em] transition-[background-color,color,border-color,transform] duration-300 ease-out-quint disabled:pointer-events-none disabled:opacity-50 active:translate-y-px",
  {
    variants: {
      variant: {
        /** Solid gold. The one primary action per view. */
        primary: "bg-gold text-obsidian hover:bg-gilt",
        /** Gold hairline outline on dark. */
        outline: "border border-gold/70 text-gold hover:border-gilt hover:bg-gold/10 hover:text-gilt",
        /** Text link with an animated underline. */
        link: "relative px-0 text-gold after:absolute after:inset-x-0 after:-bottom-1 after:h-px after:origin-left after:scale-x-100 after:bg-current after:transition-transform after:duration-300 hover:text-gilt hover:after:scale-x-0",
        /** Solid ink, for use on parchment. */
        ink: "bg-ink text-parchment hover:bg-gold-deep",
        /** Ink hairline outline, for use on parchment. */
        "ink-outline": "border border-ink/60 text-ink hover:border-ink hover:bg-ink/5",
      },
      size: {
        sm: "h-9 px-4 text-[0.875rem]",
        md: "h-11 px-6 text-[0.9375rem]",
        lg: "h-[3.25rem] px-8 text-base",
      },
    },
    compoundVariants: [{ variant: "link", className: "h-auto px-0" }],
    defaultVariants: { variant: "primary", size: "md" },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  /** Render the child element (e.g. a Next.js Link) with button styles. */
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />;
  },
);
Button.displayName = "Button";

export { Button, buttonVariants };
