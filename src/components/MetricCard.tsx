import { motion } from "framer-motion";

interface MetricCardProps {
  label: string;
  value: string | number;
  unit?: string;
  accentColor: "pink" | "cyan" | "purple" | "green";
  icon: string;
}

const glowMap = {
  pink: "neon-glow-pink border-neon-pink/30",
  cyan: "neon-glow-cyan border-neon-cyan/30",
  purple: "border-neon-purple/30",
  green: "neon-glow-green border-neon-green/30",
};

const textMap = {
  pink: "text-neon-pink text-glow-pink",
  cyan: "text-neon-cyan text-glow-cyan",
  purple: "text-neon-purple",
  green: "text-neon-green text-glow-green",
};

const MetricCard = ({ label, value, unit, accentColor, icon }: MetricCardProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className={`glass rounded-xl border p-5 ${glowMap[accentColor]}`}
    >
      <div className="mb-2 flex items-center gap-2">
        <span className="text-xl">{icon}</span>
        <span className="text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">
          {label}
        </span>
      </div>
      <div className="flex items-baseline gap-1">
        <span className={`font-mono text-3xl font-bold ${textMap[accentColor]}`}>
          {value}
        </span>
        {unit && (
          <span className="text-sm text-muted-foreground">{unit}</span>
        )}
      </div>
    </motion.div>
  );
};

export default MetricCard;
