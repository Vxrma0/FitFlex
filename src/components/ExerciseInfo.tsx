import { motion } from "framer-motion";

const ExerciseInfo = () => {
  const states = ["Ready", "Descending", "Bottom", "Ascending", "Top"];
  const activeState = 3; // "Ascending"

  return (
    <div className="glass rounded-xl border border-neon-purple/20 p-5">
      <div className="mb-4 flex items-center gap-2">
        <span className="text-xl">💪</span>
        <span className="text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">
          Exercise
        </span>
      </div>
      
      <h3 className="mb-1 text-2xl font-bold text-foreground">Bicep Curl</h3>
      <p className="mb-5 text-sm text-muted-foreground">Single-arm isolation • Dumbbell</p>

      {/* State machine */}
      <div className="mb-4">
        <span className="mb-2 block text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
          Rep State
        </span>
        <div className="flex items-center gap-1">
          {states.map((s, i) => (
            <motion.div
              key={s}
              className={`flex-1 rounded-md py-1.5 text-center text-[10px] font-semibold uppercase tracking-wider ${
                i === activeState
                  ? "bg-neon-pink/20 text-neon-pink border border-neon-pink/40"
                  : "bg-muted/50 text-muted-foreground"
              }`}
              animate={i === activeState ? { scale: [1, 1.02, 1] } : {}}
              transition={{ duration: 1.5, repeat: Infinity }}
            >
              {s}
            </motion.div>
          ))}
        </div>
      </div>

      {/* ROM indicator */}
      <div>
        <div className="mb-1 flex justify-between text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
          <span>Range of Motion</span>
          <span className="font-mono text-neon-green">132°</span>
        </div>
        <div className="h-2 rounded-full bg-muted">
          <motion.div
            className="h-full rounded-full bg-gradient-to-r from-neon-pink to-neon-cyan"
            initial={{ width: 0 }}
            animate={{ width: "88%" }}
            transition={{ duration: 1.2, ease: "easeOut" }}
          />
        </div>
        <div className="mt-1 flex justify-between text-[10px] text-muted-foreground">
          <span>0°</span>
          <span>Target: 120°+</span>
          <span>180°</span>
        </div>
      </div>
    </div>
  );
};

export default ExerciseInfo;
