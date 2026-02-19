import { motion } from "framer-motion";

const SkeletonVisualizer = () => {
  // Mock skeleton keypoints for a bicep curl pose
  const joints = [
    { id: "head", x: 150, y: 40 },
    { id: "neck", x: 150, y: 70 },
    { id: "lShoulder", x: 110, y: 90 },
    { id: "rShoulder", x: 190, y: 90 },
    { id: "lElbow", x: 85, y: 140 },
    { id: "rElbow", x: 215, y: 130 },
    { id: "lWrist", x: 95, y: 100 },
    { id: "rWrist", x: 230, y: 170 },
    { id: "lHip", x: 120, y: 190 },
    { id: "rHip", x: 180, y: 190 },
    { id: "lKnee", x: 115, y: 260 },
    { id: "rKnee", x: 185, y: 260 },
    { id: "lAnkle", x: 112, y: 330 },
    { id: "rAnkle", x: 188, y: 330 },
  ];

  const bones: [string, string][] = [
    ["head", "neck"],
    ["neck", "lShoulder"], ["neck", "rShoulder"],
    ["lShoulder", "lElbow"], ["rShoulder", "rElbow"],
    ["lElbow", "lWrist"], ["rElbow", "rWrist"],
    ["lShoulder", "lHip"], ["rShoulder", "rHip"],
    ["lHip", "rHip"],
    ["lHip", "lKnee"], ["rHip", "rKnee"],
    ["lKnee", "lAnkle"], ["rKnee", "rAnkle"],
  ];

  const getJoint = (id: string) => joints.find(j => j.id === id)!;

  return (
    <div className="glass rounded-xl border border-neon-cyan/20 p-4">
      <div className="mb-3 flex items-center gap-2">
        <span className="text-xl">🦴</span>
        <span className="text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">
          Pose Estimation
        </span>
      </div>
      <svg viewBox="0 0 300 360" className="w-full max-w-[280px] mx-auto">
        {/* Bones */}
        {bones.map(([a, b], i) => {
          const ja = getJoint(a);
          const jb = getJoint(b);
          return (
            <motion.line
              key={i}
              x1={ja.x} y1={ja.y} x2={jb.x} y2={jb.y}
              stroke="#00F5FF"
              strokeWidth={2}
              strokeOpacity={0.6}
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 0.8, delay: i * 0.05 }}
            />
          );
        })}
        {/* Joints */}
        {joints.map((j, i) => (
          <motion.circle
            key={j.id}
            cx={j.x} cy={j.y} r={5}
            fill="#FF006E"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: i * 0.04, type: "spring" }}
          />
        ))}
        {/* Active joint highlight (left wrist - curling arm) */}
        <motion.circle
          cx={95} cy={100} r={12}
          fill="none"
          stroke="#00C853"
          strokeWidth={2}
          animate={{ 
            r: [12, 18, 12],
            opacity: [0.8, 0.3, 0.8],
          }}
          transition={{ duration: 2, repeat: Infinity }}
        />
      </svg>
    </div>
  );
};

export default SkeletonVisualizer;
