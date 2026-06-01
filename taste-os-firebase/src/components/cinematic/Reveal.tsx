"use client";

import { motion } from "framer-motion";
import type { ReactNode } from "react";
import { useReveal } from "@/motion/useReveal";
import { revealVariants } from "@/motion/variants";

interface RevealProps {
  children: ReactNode;
  delay?: number;
  className?: string;
  as?: "div" | "p" | "h1" | "h2" | "span" | "section";
}

/**
 * Text that blooms from blur on arrival. The signature reveal —
 * used for every headline, narration, and quiet line.
 */
export function Reveal({ children, delay = 0, className, as = "div" }: RevealProps) {
  const { ref, revealed } = useReveal<HTMLDivElement>();
  const MotionTag = motion[as];
  return (
    <MotionTag
      ref={ref}
      className={className}
      variants={revealVariants}
      initial="hidden"
      animate={revealed ? "shown" : "hidden"}
      transition={{ delay: delay / 1000 }}
    >
      {children}
    </MotionTag>
  );
}
