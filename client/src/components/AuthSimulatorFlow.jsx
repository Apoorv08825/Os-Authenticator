import { motion } from "framer-motion";
import { stepVariants } from "../animations/variants";

export const AuthSimulatorFlow = ({ simulation }) => {
  if (!simulation) {
    return (
      <div className="rounded-xl border border-dashed border-border bg-black/15 p-5 text-sm text-muted">
        Run authentication simulation to visualize the OS security pipeline.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <p className="text-xs uppercase tracking-[0.16em] text-muted">
        User → Auth Module → Kernel → Resource Access
      </p>

      {simulation.steps.map((step) => (
        <motion.div
          key={step.id}
          variants={stepVariants}
          initial="pending"
          animate={step.status}
          className="rounded-xl border border-border p-3"
        >
          <div className="flex items-center justify-between gap-3">
            <h3 className="font-display text-sm font-semibold text-white">{step.title}</h3>
            <span
              className={`rounded-md px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] ${
                step.status === "success" ? "bg-accent2/20 text-accent2" : "bg-danger/20 text-danger"
              }`}
            >
              {step.status}
            </span>
          </div>
          <p className="mt-2 text-xs text-muted">{step.detail}</p>
        </motion.div>
      ))}

      <div
        className={`rounded-lg border p-3 text-sm font-semibold ${
          simulation.result === "ACCESS_GRANTED"
            ? "border-accent2/40 bg-accent2/10 text-accent2"
            : "border-danger/50 bg-danger/10 text-danger"
        }`}
      >
        Final Result: {simulation.result}
      </div>
    </div>
  );
};
