import { motion } from "framer-motion";
import { listItemVariants } from "../animations/variants";

const typeToTone = (type) => {
  if (type.includes("denied") || type.includes("failed") || type.includes("breach")) {
    return "text-danger";
  }
  if (type.includes("blocked") || type.includes("grant") || type.includes("success")) {
    return "text-accent2";
  }
  return "text-accent";
};

export const LogsPanel = ({ logs }) => (
  <div className="h-[420px] overflow-y-auto rounded-xl border border-border bg-black/20 p-3">
    {logs.length === 0 ? (
      <p className="text-sm text-muted">No events yet. Start simulation to populate logs.</p>
    ) : (
      <div className="space-y-2">
        {logs.map((log, index) => (
          <motion.div
            key={log.id}
            variants={listItemVariants}
            initial="hidden"
            animate="visible"
            custom={index}
            className="rounded-lg border border-border/50 bg-black/30 p-3"
          >
            <div className="flex items-center justify-between">
              <p className={`text-xs font-semibold uppercase tracking-[0.12em] ${typeToTone(log.status)}`}>
                {log.status}
              </p>
              <p className="text-[11px] text-muted">{new Date(log.time).toLocaleTimeString()}</p>
            </div>
            <p className="mt-2 text-sm text-white">{log.title}</p>
            <p className="mt-1 text-xs text-muted">{log.description}</p>
          </motion.div>
        ))}
      </div>
    )}
  </div>
);
