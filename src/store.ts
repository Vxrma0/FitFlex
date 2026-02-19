import { create } from 'zustand';

interface AnalysisState {
  isRecording: boolean;
  exerciseType: string;
  repCount: number;
  formScore: number;
  feedback: string;
  statusColor: 'green' | 'yellow' | 'red';
  jointAngles: Record<string, number>;
  setRecording: (status: boolean) => void;
  updateMetrics: (metrics: Partial<AnalysisState>) => void;
}

export const useAnalysisStore = create<AnalysisState>((set) => ({
  isRecording: false,
  exerciseType: 'squat',
  repCount: 0,
  formScore: 100,
  feedback: 'Position optimal. Awaiting movement.',
  statusColor: 'green',
  jointAngles: { knee: 180, hip: 180, elbow: 180 },
  setRecording: (status) => set({ isRecording: status }),
  updateMetrics: (metrics) => set((state) => ({ ...state, ...metrics })),
}));
