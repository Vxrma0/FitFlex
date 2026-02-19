import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import ParticleEffect from "@/components/ParticleEffect";
import HeroCounter from "@/components/HeroCounter";
import FeedbackBanner from "@/components/FeedbackBanner";
import MetricCard from "@/components/MetricCard";
import StatusIndicator from "@/components/StatusIndicator";
import SkeletonVisualizer from "@/components/SkeletonVisualizer";
import ExerciseInfo from "@/components/ExerciseInfo";
import SessionLog from "@/components/SessionLog";

const feedbackMessages = [
  { message: "✅ Perfect Form!", type: "good" as const },
  { message: "✅ Great Tempo!", type: "good" as const },
  { message: "⚠️ Too Fast!", type: "bad" as const },
  { message: "✅ Good Rep!", type: "good" as const },
  { message: "⚠️ Half Rep Detected", type: "bad" as const },
];

const Index = () => {
  const [repCount, setRepCount] = useState(7);
  const [isPulsing, setIsPulsing] = useState(false);
  const [formScore, setFormScore] = useState(92);
  const [tempoScore, setTempoScore] = useState(85);
  const [detection, setDetection] = useState(97);
  const [feedback, setFeedback] = useState<{ message: string; type: "good" | "bad"; visible: boolean }>({ message: "✅ Perfect Form!", type: "good", visible: true });
  const [status, setStatus] = useState<"calibrating" | "ready" | "active">("active");

  // Simulate a rep every few seconds
  const simulateRep = useCallback(() => {
    const fb = feedbackMessages[Math.floor(Math.random() * feedbackMessages.length)];
    setRepCount((c) => c + 1);
    setIsPulsing(true);
    setFormScore(Math.floor(Math.random() * 25 + 75));
    setTempoScore(Math.floor(Math.random() * 30 + 70));
    setDetection(Math.floor(Math.random() * 10 + 90));
    setFeedback({ ...fb, visible: true });

    setTimeout(() => setIsPulsing(false), 600);
    setTimeout(() => setFeedback((f) => ({ ...f, visible: false })), 2500);
  }, []);

  useEffect(() => {
    // Initial calibration simulation
    setStatus("calibrating");
    const calibTimer = setTimeout(() => setStatus("ready"), 1500);
    const activeTimer = setTimeout(() => setStatus("active"), 3000);
    
    const interval = setInterval(simulateRep, 4000);
    return () => {
      clearInterval(interval);
      clearTimeout(calibTimer);
      clearTimeout(activeTimer);
    };
  }, [simulateRep]);

  return (
    <div className="relative min-h-screen overflow-hidden bg-background grid-bg">
      <ParticleEffect />

      <FeedbackBanner
        message={feedback.message}
        type={feedback.type}
        visible={feedback.visible}
      />

      {/* Header */}
      <header className="relative z-10 flex items-center justify-between px-6 py-4 md:px-10">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="flex items-center gap-3"
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/20 border border-primary/40">
            <span className="text-xl">⚡</span>
          </div>
          <div>
            <h1 className="text-lg font-bold tracking-tight text-foreground">
              FitFlex <span className="text-primary">Ultra</span>
            </h1>
            <p className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground">
              Smart Gym System
            </p>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="flex items-center gap-6"
        >
          <StatusIndicator label="Camera" status={status} />
          <StatusIndicator label="AI Model" status={status === "calibrating" ? "calibrating" : "ready"} />
          <div className="glass hidden rounded-lg px-4 py-2 md:block">
            <span className="font-mono text-xs text-muted-foreground">ws://localhost:8080</span>
          </div>
        </motion.div>
      </header>

      {/* Main Grid */}
      <main className="relative z-10 px-4 pb-8 md:px-10">
        <div className="grid gap-5 lg:grid-cols-12">
          {/* Left Column - Skeleton + Exercise */}
          <div className="space-y-5 lg:col-span-3">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <SkeletonVisualizer />
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <ExerciseInfo />
            </motion.div>
          </div>

          {/* Center Column - Hero Counter */}
          <div className="flex flex-col items-center justify-center gap-8 lg:col-span-5">
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.1, type: "spring", stiffness: 200 }}
            >
              <HeroCounter count={repCount} isPulsing={isPulsing} />
            </motion.div>

            {/* Metric Cards */}
            <div className="grid w-full max-w-lg grid-cols-2 gap-4">
              <MetricCard
                label="Form Score"
                value={formScore}
                unit="%"
                accentColor="green"
                icon="🎯"
              />
              <MetricCard
                label="Tempo"
                value={tempoScore}
                unit="%"
                accentColor="cyan"
                icon="⏱️"
              />
              <MetricCard
                label="Detection"
                value={detection}
                unit="%"
                accentColor="purple"
                icon="📡"
              />
              <MetricCard
                label="Calories"
                value={Math.floor(repCount * 3.2)}
                unit="kcal"
                accentColor="pink"
                icon="🔥"
              />
            </div>
          </div>

          {/* Right Column - Session Log */}
          <div className="lg:col-span-4">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
            >
              <SessionLog />
            </motion.div>

            {/* Quick Stats */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="mt-5 glass rounded-xl border border-neon-pink/20 p-5"
            >
              <div className="mb-3 flex items-center gap-2">
                <span className="text-xl">📊</span>
                <span className="text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">
                  Session Stats
                </span>
              </div>
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <div className="font-mono text-2xl font-bold text-neon-pink text-glow-pink">5/7</div>
                  <div className="text-[10px] uppercase tracking-[0.15em] text-muted-foreground">Good Reps</div>
                </div>
                <div>
                  <div className="font-mono text-2xl font-bold text-neon-cyan text-glow-cyan">2.8s</div>
                  <div className="text-[10px] uppercase tracking-[0.15em] text-muted-foreground">Avg Tempo</div>
                </div>
                <div>
                  <div className="font-mono text-2xl font-bold text-neon-green text-glow-green">86%</div>
                  <div className="text-[10px] uppercase tracking-[0.15em] text-muted-foreground">Avg Score</div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Index;
