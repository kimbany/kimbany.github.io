import type { Variants } from "framer-motion";
import { EASE, DURATION } from "./easings";

/** text blooms from blur — the signature reveal */
export const revealVariants: Variants = {
  hidden: { opacity: 0, filter: "blur(14px)", letterSpacing: "0.10em", y: 8 },
  shown: {
    opacity: 1,
    filter: "blur(0px)",
    letterSpacing: "-0.012em",
    y: 0,
    transition: { duration: DURATION.reveal, ease: EASE.breathIn },
  },
  exiting: {
    opacity: 0,
    filter: "blur(8px)",
    transition: { duration: DURATION.exit, ease: EASE.breathOut },
  },
};

/** cinematic page dissolve (used by app/template.tsx) */
export const pageVariants: Variants = {
  initial: { opacity: 0, filter: "blur(8px)" },
  enter: {
    opacity: 1,
    filter: "blur(0px)",
    transition: { duration: DURATION.page, ease: EASE.breathIn },
  },
  exit: {
    opacity: 0,
    filter: "blur(8px)",
    transition: { duration: DURATION.page, ease: EASE.breathOut },
  },
};

/** memory fragments and cards settle in with a faint overshoot */
export const settleVariants: Variants = {
  hidden: { opacity: 0, y: 16 },
  shown: {
    opacity: 1,
    y: 0,
    transition: { duration: DURATION.settle, ease: EASE.settle },
  },
};

/** stagger children like a slow exhale */
export const staggerParent: Variants = {
  shown: { transition: { staggerChildren: 0.22, delayChildren: 0.2 } },
};
