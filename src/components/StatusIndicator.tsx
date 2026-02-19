import { motion } from "framer-motion";

interface StatusIndicatorProps {
  label: string;
  status: "calibrating" | "ready" | "active" | "error";
}

const statusConfig = {
  calibrating: { color: "bg-neon-cyan", text: "Calibrating...", pulse: true },
  ready: { color: "bg-neon-green", text: "Ready", pulse: false },
  active: { color: "bg-neon-pink", text: "Tracking", pulse: true },
  error: { color: "bg-neon-red", text: "Error", pulse: true },
};

const StatusIndicator = ({ label, status }: StatusIndicatorProps) => {
  const config = statusConfig[status];
  
  return (
    <div className="flex items-center gap-3">
      <div className="relative">
        <div className={`h-2.5 w-2.5 rounded-full ${config.color}`} />
        {config.pulse && (
          <motion.div
            className={`absolute inset-0 rounded-full ${config.color}`}
            animate={{ scale: [1, 2.5], opacity: [0.6, 0] }}
            transition={{ duration: 1.5, repeat: Infinity }}
          />
        )}
      </div>
      <div className="flex flex-col">
        <span className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">{label}</span>
        <span className="font-mono text-xs text-foreground">{config.text}</span>
      </div>
    </div>
  );
};

export default StatusIndicator;
