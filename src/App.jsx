import { useState } from 'react';
import { PyramidView } from './components/PyramidView';
import { SettingsModal } from './components/SettingsModal';
import { StatsHistoryView } from './components/StatsHistoryView';
import { exercises } from './data/exercises';
import { BookOpen, Settings, Trophy } from 'lucide-react';

function App() {
  const [currentExercise, setCurrentExercise] = useState(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [showList, setShowList] = useState(false);
  const [difficulty, setDifficulty] = useState('rabbit'); // snail, rabbit, tiger
  const [fontType, setFontType] = useState('hand'); // hand, sans

  const startRandomExercise = () => {
    // Filter out current to avoid immediate repeat
    const available = exercises.filter(e => e.id !== currentExercise?.id);
    const random = available[Math.floor(Math.random() * available.length)];
    setCurrentExercise(random);
  };

  if (currentExercise) {
    return (
      <div className="h-screen w-full bg-[#FFFDF5]">
        <PyramidView
          key={currentExercise.id}
          exercise={currentExercise}
          onBack={() => setCurrentExercise(null)}
          onComplete={startRandomExercise} // Triggers next random exercise
          difficulty={difficulty}
          fontType={fontType}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FFFDF5] p-6 flex flex-col items-center relative transition-all">
      <div className="absolute top-6 left-6 flex gap-2 z-10">
        <button
          onClick={() => setIsSettingsOpen(true)}
          className="p-3 bg-white rounded-full shadow-sm text-slate-400 hover:text-slate-600 transition-colors border border-slate-100"
          aria-label="Seaded"
        >
          <Settings size={24} />
        </button>
        <button
          onClick={() => setIsHistoryOpen(true)}
          className="p-3 bg-white rounded-full shadow-sm text-yellow-500 hover:text-yellow-600 transition-colors border border-slate-100"
          aria-label="Ajalugu"
        >
          <Trophy size={24} />
        </button>
      </div>

      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        difficulty={difficulty}
        setDifficulty={setDifficulty}
        fontType={fontType}
        setFontType={setFontType}
      />

      <StatsHistoryView
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
      />

      <header className="mb-8 mt-12 text-center flex flex-col items-center animate-in fade-in slide-in-from-bottom-4 duration-700">
        <div className="inline-block p-6 bg-white rounded-3xl shadow-xl mb-6 text-green-500 transform hover:scale-105 transition-transform duration-500">
          <BookOpen size={64} />
        </div>
        <h1 className="text-4xl font-bold text-slate-800 mb-3 tracking-tight">Lugemine</h1>
        <p className="text-lg text-slate-500 max-w-xs mx-auto leading-relaxed">Harjuta lugemist ja kogu tähti!</p>
      </header>

      {/* Main Action - Play Button */}
      <div className="flex-1 flex flex-col items-center justify-center w-full max-w-md gap-8 mb-12">
        <button
          onClick={startRandomExercise}
          className="w-full py-6 bg-green-500 rounded-3xl shadow-xl shadow-green-200 text-white font-bold text-2xl
                       transform transition-all active:scale-95 hover:bg-green-600 hover:shadow-2xl flex items-center justify-center gap-3 group"
        >
          <span className="group-hover:translate-x-1 transition-transform">ALUSTA</span>
          <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="m5 3 14 9-14 9V3z" /></svg>
        </button>

        <button
          onClick={() => setShowList(!showList)}
          className="text-slate-400 font-medium hover:text-slate-600 transition-colors text-sm flex items-center gap-1"
        >
          {showList ? 'Peida harjutused' : 'Vali ise harjutus'}
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={`transition-transform ${showList ? 'rotate-180' : ''}`}><path d="m6 9 6 6 6-6" /></svg>
        </button>
      </div>

      {showList && (
        <div className="w-full max-w-md space-y-3 pb-12 animate-in fade-in slide-in-from-bottom-8 duration-500">
          {exercises.map(exercise => (
            <button
              key={exercise.id}
              onClick={() => setCurrentExercise(exercise)}
              className="w-full bg-white p-5 rounded-2xl shadow-sm border border-slate-100 
                        hover:shadow-md hover:scale-[1.01] transition-all text-left flex items-center justify-between group"
            >
              <div>
                <h3 className="text-base font-bold text-slate-700 group-hover:text-green-600 transition-colors">
                  {exercise.title}
                </h3>
                <p className="text-xs text-slate-400 mt-1">{exercise.steps.length} rida</p>
              </div>
              <div className="bg-slate-50 p-2 rounded-full text-slate-300 group-hover:bg-green-50 group-hover:text-green-500 transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6" /></svg>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default App;
