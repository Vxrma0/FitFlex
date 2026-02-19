import React from 'react';
import { useAnalysisStore } from '../store';
import { Play, Square, Download } from 'lucide-react';

export const AnalysisDashboard = () => {
  const { 
    isRecording, 
    exerciseType, 
    repCount, 
    formScore, 
    feedback, 
    statusColor, 
    jointAngles, 
    setRecording,
    updateMetrics
  } = useAnalysisStore();

  const statusMap = {
    green: 'bg-green-500/20 text-green-400 border-green-500',
    yellow: 'bg-yellow-500/20 text-yellow-400 border-yellow-500',
    red: 'bg-red-500/20 text-red-400 border-red-500'
  };

  const handleExerciseChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    updateMetrics({ exerciseType: e.target.value });
  };

  const handleExport = () => {
    // Export functionality would be implemented here
    console.log('Exporting analysis data...');
    alert('Analysis exported successfully!');
  };

  return (
    <div className="flex flex-col h-full space-y-6 text-white p-6 rounded-2xl bg-[#2a2a2a]">
      <div className="flex justify-between items-center">
        <select 
          className="bg-[#1a1a1a] border border-gray-700 rounded-lg px-4 py-2 outline-none focus:border-[#00ffcc] transition-colors"
          value={exerciseType}
          onChange={handleExerciseChange}
        >
          <option value="squat">Squat</option>
          <option value="pushup">Push-up</option>
          <option value="deadlift">Deadlift</option>
        </select>
        <button 
          onClick={() => setRecording(!isRecording)}
          className={`flex items-center px-6 py-2 rounded-lg font-bold transition-all ${isRecording ? 'bg-red-500 hover:bg-red-600' : 'bg-[#00ffcc] text-black hover:bg-[#00ccaa]'}`}
        >
          {isRecording ? <Square className="w-4 h-4 mr-2" /> : <Play className="w-4 h-4 mr-2" />}
          {isRecording ? 'Stop Recording' : 'Start Session'}
        </button>
      </div>

      <div className={`p-4 rounded-xl border-l-4 ${statusMap[statusColor]} transition-colors`}>
        <h3 className="font-bold mb-1">Live Commentary</h3>
        <p className="font-mono text-sm">{feedback}</p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="bg-[#1a1a1a] p-4 rounded-xl">
          <span className="text-gray-400 text-sm block">Repetitions</span>
          <span className="text-4xl font-bold">{repCount}</span>
        </div>
        <div className="bg-[#1a1a1a] p-4 rounded-xl">
          <span className="text-gray-400 text-sm block">Form Score</span>
          <div className="flex items-end mt-1">
            <span className="text-4xl font-bold">{formScore}</span>
            <span className="text-lg ml-1 text-gray-400">%</span>
          </div>
          <div className="w-full bg-gray-800 h-2 rounded-full mt-2">
            <div 
              className="bg-[#00ffcc] h-2 rounded-full transition-all duration-300" 
              style={{ width: `${formScore}%` }} 
            />
          </div>
        </div>
      </div>

      <div className="bg-[#1a1a1a] p-4 rounded-xl flex-grow">
        <h4 className="text-gray-400 text-sm mb-4">Joint Angles</h4>
        <div className="space-y-4">
          {Object.entries(jointAngles).map(([joint, angle]) => (
            <div key={joint} className="flex justify-between items-center border-b border-gray-800 pb-2">
              <span className="capitalize">{joint}</span>
              <span className="font-mono text-[#00ffcc]">{angle}°</span>
            </div>
          ))}
        </div>
      </div>

      <button 
        onClick={handleExport}
        className="flex items-center justify-center w-full py-3 bg-[#1a1a1a] hover:bg-gray-800 rounded-xl transition-colors"
      >
        <Download className="w-4 h-4 mr-2" /> Export Analysis
      </button>
    </div>
  );
};
