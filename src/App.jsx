import { useState } from 'react';
import { PyramidView } from './components/PyramidView';
import { exercises } from './data/exercises';
import { BookOpen } from 'lucide-react';

function App() {
  const [currentExercise, setCurrentExercise] = useState(null);

  if (currentExercise) {
    return (
      <div className="h-screen w-full bg-[#FFFDF5]">
        <PyramidView
          exercise={currentExercise}
          onBack={() => setCurrentExercise(null)}
          onComplete={() => {
            alert("Tubli töö! Harjutus tehtud.");
            setCurrentExercise(null);
          }}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FFFDF5] p-6 flex flex-col items-center">
      <header className="mb-12 mt-8 text-center">
        <div className="inline-block p-4 bg-green-100 rounded-full mb-4 text-green-600">
          <BookOpen size={48} />
        </div>
        <h1 className="text-3xl font-bold text-slate-800 mb-2">Lugemine</h1>
        <p className="text-slate-500">Vali harjutus ja hakka lugema!</p>
      </header>

      <div className="w-full max-w-md space-y-4">
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
