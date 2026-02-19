import { motion } from "framer-motion";

interface SessionLogEntry {
  time: string;
  rep: number;
  score: number;
  feedback: string;
  type: "good" | "bad";
}

const mockLog: SessionLogEntry[] = [
  { time: "0:42", rep: 7, score: 95, feedback: "✅ Perfect Form", type: "good" },
  { time: "0:38", rep: 6, score: 88, feedback: "✅ Good Rep", type: "good" },
  { time: "0:33", rep: 5, score: 62, feedback: "⚠️ Too Fast!", type: "bad" },
  { time: "0:28", rep: 4, score: 91, feedback: "✅ Perfect Form", type: "good" },
  { time: "0:22", rep: 3, score: 78, feedback: "⚠️ Half Rep", type: "bad" },
  { time: "0:16", rep: 2, score: 94, feedback: "✅ Great Tempo", type: "good" },
  { time: "0:09", rep: 1, score: 85, feedback: "✅ Good Rep", type: "good" },
];

const SessionLog = () => {
  return (
    <div className="glass rounded-xl border border-neon-cyan/20 p-5">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-xl">📋</span>
          <span className="text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">
            Session Log
          </span>
        </div>
        <span className="font-mono text-xs text-muted-foreground">gym_data_library.csv</span>
      </div>
      
      <div className="space-y-1.5 max-h-[260px] overflow-y-auto pr-1">
        {mockLog.map((entry, i) => (
          <motion.div
            key={entry.rep}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.08 }}
            className={`flex items-center gap-3 rounded-lg px-3 py-2 text-xs ${
              entry.type === "good" ? "bg-neon-green/5" : "bg-neon-red/5"
            }`}
          >
            <span className="font-mono text-muted-foreground w-10">{entry.time}</span>
            <span className="font-mono font-bold text-foreground w-8">#{entry.rep}</span>
            <span className={`font-mono font-bold w-10 ${
              entry.score >= 80 ? "text-neon-green" : "text-neon-red"
            }`}>
              {entry.score}%
            </span>
            <span className="text-muted-foreground truncate">{entry.feedback}</span>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default SessionLog;
