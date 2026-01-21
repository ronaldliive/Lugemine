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
  const [difficulty, setDifficulty] = useState('rabbit'); // snail, rabbit, tiger
  const [fontType, setFontType] = useState('hand'); // hand, sans

  if (currentExercise) {
    return (
      <div className="h-screen w-full bg-[#FFFDF5]">
        <PyramidView
          exercise={currentExercise}
          onBack={() => setCurrentExercise(null)}
          onComplete={() => {
            // Alert removed, ResultsView handles feedback now via state inside PyramidView
            // But we might want a simple fallback or nothing if PyramidView handles "Finished" state internally?
            // PyramidView switches to ResultsView internally, so onComplete here is just for "Exiting" the whole view?
            // Actually, in PyramidView: onComplete && onComplete() is called by the ResultsView's "Menüü" button NOW?
            // No, wait.
            // In PyramidView, when finished, it shows ResultsView. ResultsView has "Menüü" which calls onHome (passed as onBack).
            // So onBack here handles resetting currentExercise. Correct.
            // onComplete prop might not be needed strictly anymore for the alert, but kept for safety.
            setCurrentExercise(null);
          }}
          difficulty={difficulty}
          fontType={fontType}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FFFDF5] p-6 flex flex-col items-center relative">
      <div className="absolute top-6 left-6 flex gap-2">
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

      <header className="mb-12 mt-8 text-center">
        <div className="inline-block p-4 bg-green-100 rounded-full mb-4 text-green-600">
          <BookOpen size={48} />
        </div>
        <h1 className="text-3xl font-bold text-slate-800 mb-2">Lugemine</h1>
        <p className="text-slate-500">Vali harjutus ja hakka lugema!</p>
      </header>

      <div className="w-full max-w-md space-y-4 pb-12">
        {exercises.map(exercise => (
          <button
            key={exercise.id}
            onClick={() => setCurrentExercise(exercise)}
            className="w-full bg-white p-6 rounded-2xl shadow-sm border border-slate-100 
                     hover:shadow-md hover:scale-[1.02] transition-all text-left flex items-center justify-between group"
          >
            <div>
              <h3 className="text-lg font-bold text-slate-700 group-hover:text-green-600 transition-colors">
                {exercise.title}
              </h3>
              <p className="text-sm text-slate-400">{exercise.steps.length} rida</p>
            </div>
            <div className="bg-slate-50 p-2 rounded-full text-slate-300 group-hover:bg-green-50 group-hover:text-green-500 transition-colors">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6" /></svg>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

export default App;
