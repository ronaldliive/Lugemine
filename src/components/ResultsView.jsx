import React from 'react';
import { Clock, AlertCircle, RotateCcw, Home, Star } from 'lucide-react';

export const ResultsView = ({ duration, mistakes, onRetry, onHome }) => {
    // Format duration (ms to mm:ss)
    const formatTime = (ms) => {
        const totalSeconds = Math.floor(ms / 1000);
        const minutes = Math.floor(totalSeconds / 60);
        const seconds = totalSeconds % 60;
        return `${minutes}:${seconds.toString().padStart(2, '0')}`;
    };

    const hasMistakes = mistakes.length > 0;

    return (
        <div className="flex flex-col h-full bg-[#FFFDF5] p-6 items-center justify-center animate-in fade-in zoom-in duration-300">
            <div className="bg-white rounded-3xl p-8 w-full max-w-md shadow-2xl border-4 border-yellow-100 flex flex-col items-center text-center">

                <div className="mb-6 bg-yellow-100 p-4 rounded-full text-yellow-500">
                    <Star size={48} className="fill-yellow-500" />
                </div>

                <h2 className="text-3xl font-bold text-slate-800 mb-2">Harjutus tehtud!</h2>
                <p className="text-slate-500 mb-8">Oled väga tubli lugeja!</p>

                <div className="grid grid-cols-2 gap-4 w-full mb-8">
                    <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 flex flex-col items-center">
                        <Clock className="text-blue-500 mb-2" size={24} />
                        <span className="text-xs text-slate-400 uppercase font-bold tracking-wider">Aeg</span>
                        <span className="text-2xl font-mono font-bold text-slate-700">{formatTime(duration)}</span>
                    </div>

                    <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 flex flex-col items-center">
                        <AlertCircle className={hasMistakes ? "text-orange-500" : "text-green-500"} size={24} mb-2 />
                        <span className="text-xs text-slate-400 uppercase font-bold tracking-wider">Vigu/Kordusi</span>
                        <span className="text-2xl font-mono font-bold text-slate-700">{mistakes.length}</span>
                    </div>
                </div>

                {hasMistakes && (
                    <div className="w-full mb-8 text-left bg-orange-50 p-4 rounded-2xl border border-orange-100 max-h-40 overflow-y-auto">
                        <h4 className="text-xs font-bold text-orange-400 uppercase tracking-wider mb-2">Need sõnad vajasid harjutamist:</h4>
                        <div className="flex flex-wrap gap-2">
                            {mistakes.map((m, i) => (
                                <span key={i} className="px-2 py-1 bg-white rounded-md text-sm text-slate-600 border border-orange-100 shadow-sm">
                                    {m}
                                </span>
                            ))}
                        </div>
                    </div>
                )}

                <div className="flex gap-4 w-full">
                    <button
                        onClick={onHome}
                        className="flex-1 py-4 rounded-xl font-bold text-slate-500 hover:bg-slate-100 transition-colors flex items-center justify-center gap-2"
                    >
                        <Home size={20} />
                        Menüü
                    </button>
                    <button
                        onClick={onRetry}
                        className="flex-1 py-4 rounded-xl font-bold bg-green-500 text-white hover:bg-green-600 shadow-lg shadow-green-200 transition-all flex items-center justify-center gap-2"
                    >
                        <RotateCcw size={20} />
                        Uuesti
                    </button>
                </div>

            </div>
        </div>
    );
};
