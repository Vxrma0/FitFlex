import { motion, AnimatePresence } from "framer-motion";

interface FeedbackBannerProps {
  message: string;
  type: "good" | "bad" | "neutral";
  visible: boolean;
}

const FeedbackBanner = ({ message, type, visible }: FeedbackBannerProps) => {
  const colorMap = {
    good: "bg-neon-green/20 border-neon-green/50 text-neon-green neon-glow-green",
    bad: "bg-neon-red/20 border-neon-red/50 text-neon-red neon-glow-red",
    neutral: "bg-neon-cyan/20 border-neon-cyan/50 text-neon-cyan neon-glow-cyan",
  };

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ y: -80, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -80, opacity: 0 }}
          transition={{ type: "spring", stiffness: 300, damping: 25 }}
          className={`fixed left-1/2 top-4 z-50 -translate-x-1/2 rounded-xl border px-8 py-3 text-center font-semibold text-lg backdrop-blur-xl ${colorMap[type]}`}
        >
          {message}
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default FeedbackBanner;
