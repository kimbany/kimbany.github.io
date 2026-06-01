"use client";

import { motion } from "framer-motion";
import { pageVariants } from "@/motion/variants";

/**
 * Every route transition is a cinematic dissolve, never a cut.
 * template.tsx remounts on navigation, so this wraps each page
 * in a blur → clear breath.
 */
export default function Template({ children }: { children: React.ReactNode }) {
  return (
    <motion.div variants={pageVariants} initial="initial" animate="enter">
      {children}
    </motion.div>
  );
}
