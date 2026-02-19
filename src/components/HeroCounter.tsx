import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState } from "react";

interface HeroCounterProps {
  count: number;
  isPulsing: boolean;
}

const HeroCounter = ({ count, isPulsing }: HeroCounterProps) => {
  const [displayCount, setDisplayCount] = useState(count);

  useEffect(() => {
    setDisplayCount(count);
  }, [count]);

  return (
    <div className="relative flex flex-col items-center justify-center">
      {/* Outer ring */}
      <div className="relative flex h-56 w-56 items-center justify-center rounded-full border border-neon-pink/30 md:h-72 md:w-72">
        {/* Inner glow ring */}
        <motion.div
          className="absolute inset-2 rounded-full border-2 border-neon-pink/60"
          animate={isPulsing ? { 
            boxShadow: [
              "0 0 20px hsl(335 100% 50% / 0.3), 0 0 60px hsl(335 100% 50% / 0.1)",
              "0 0 40px hsl(335 100% 50% / 0.6), 0 0 100px hsl(335 100% 50% / 0.3)",
              "0 0 20px hsl(335 100% 50% / 0.3), 0 0 60px hsl(335 100% 50% / 0.1)",
            ],
            scale: [1, 1.03, 1],
          } : {}}
          transition={{ duration: 0.6, ease: "easeOut" }}
        />
        
        {/* Background glass */}
        <div className="absolute inset-4 rounded-full glass" />

        {/* Counter */}
        <AnimatePresence mode="popLayout">
          <motion.span
            key={displayCount}
            initial={{ scale: 1.4, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 20 }}
            className="relative z-10 font-mono text-7xl font-bold text-primary md:text-[96px] text-glow-pink"
          >
            {displayCount}
          </motion.span>
        </AnimatePresence>
      </div>

      <span className="mt-4 text-sm font-semibold uppercase tracking-[0.3em] text-muted-foreground">
        Reps Completed
      </span>
    </div>
  );
};

export default HeroCounter;
