export const panelVariants = {
  hidden: { opacity: 0, y: 18 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, ease: "easeOut" }
  }
};

export const listItemVariants = {
  hidden: { opacity: 0, x: -16 },
  visible: (index) => ({
    opacity: 1,
    x: 0,
    transition: { delay: index * 0.05, duration: 0.25 }
  })
};

export const stepVariants = {
  pending: { scale: 0.96, opacity: 0.5 },
  success: { scale: 1, opacity: 1, backgroundColor: "rgba(66, 245, 173, 0.16)" },
  failed: { scale: 1, opacity: 1, backgroundColor: "rgba(255, 107, 129, 0.2)" }
};
