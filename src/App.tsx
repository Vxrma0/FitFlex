import { ExoskeletonVisualizer } from './components/ExoskeletonVisualizer';
import { AnalysisDashboard } from './components/AnalysisDashboard';
import { Settings } from 'lucide-react';

export default function App() {
  return (
    <div className="min-h-screen bg-[#1a1a1a] p-4 md:p-8 flex flex-col font-sans">
      <nav className="flex justify-between items-center mb-6 text-white px-2">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 rounded bg-[#00ffcc]" />
          <h1 className="text-xl font-black tracking-wider">FITFLEX</h1>
        </div>
        <button className="p-2 hover:bg-gray-800 rounded-full transition-colors">
          <Settings className="w-6 h-6" />
        </button>
      </nav>

      <main className="flex-grow grid grid-cols-1 lg:grid-cols-2 gap-6 h-[calc(100vh-120px)]">
        <div className="h-[50vh] lg:h-full">
          <ExoskeletonVisualizer />
        </div>
        <div className="h-full">
          <AnalysisDashboard />
        </div>
      </main>
    </div>
  );
}
