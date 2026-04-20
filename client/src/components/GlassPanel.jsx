import { motion } from "framer-motion";
import { panelVariants } from "../animations/variants";

export const GlassPanel = ({ title, subtitle, children, className = "" }) => (
  <motion.section
    variants={panelVariants}
    initial="hidden"
    animate="visible"
    className={`rounded-2xl border border-border bg-panel p-5 shadow-glass backdrop-blur-xl ${className}`}
  >
    <header className="mb-4">
      <h2 className="font-display text-lg font-semibold text-white">{title}</h2>
      {subtitle ? <p className="mt-1 text-xs text-muted">{subtitle}</p> : null}
    </header>
    {children}
  </motion.section>
);
