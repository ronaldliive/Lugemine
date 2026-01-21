import { useState, useEffect } from 'react';
import { useSpeechRecognition } from '../hooks/useSpeechRecognition';
import { Mic, MicOff, RefreshCw, ChevronRight, CheckCircle2 } from 'lucide-react';

export const PyramidView = ({ exercise, onComplete, onBack }) => {
    const [currentStepIndex, setCurrentStepIndex] = useState(0);
    const { isListening, transcript, interimTranscript, startListening, stopListening, resetTranscript, isSoundDetected } = useSpeechRecognition('et-EE');

    // Clean up words for matching (lowercase, remove punctuation)
    const normalize = (text) => text.toLowerCase().replace(/[.,?!]/g, '');

    const currentStepText = exercise.steps[currentStepIndex];
    const currentStepWords = currentStepText.split(' ');

    // Check which words in the current step have been spoken
    const spokenWords = normalize(transcript + ' ' + interimTranscript).split(/\s+/);

    // We match words in order, but allow retries/noise in between? 
    // Actually, for simplicity and "forgiveness", let's just check if the target word appears in the spoken words.
    // But strictly, we want "Poiss" then "sööb". 
    // If we just check set inclusion, "Sööb poiss" would pass. That's probably okay for now, or we can improve later.
    // Let's stick to simple inclusion for each word.

    const isWordRecognized = (word) => {
        return spokenWords.includes(normalize(word));
    };

    const matchedWordCount = currentStepWords.filter(w => isWordRecognized(w)).length;
    const isStepComplete = matchedWordCount === currentStepWords.length;

    useEffect(() => {
        if (isStepComplete) {
            // Small delay before moving next or showing success
            const timer = setTimeout(() => {
                if (currentStepIndex < exercise.steps.length - 1) {
                    setCurrentStepIndex(prev => prev + 1);
                    resetTranscript(); // Force repetition
                } else {
                    // Whole exercise done
                    onComplete && onComplete();
                }
            }, 1000);
            return () => clearTimeout(timer);
        }
    }, [isStepComplete, currentStepIndex, exercise.steps.length, resetTranscript, onComplete]);

    const progress = Math.round(((currentStepIndex) / exercise.steps.length) * 100);

    return (
        <div className="flex flex-col h-full bg-[#FFFDF5] text-slate-800 p-4 font-hand">
            {/* Header / Progress */}
            <div className="flex justify-between items-center mb-6">
                <button onClick={onBack} className="text-slate-400 hover:text-slate-600">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6" /></svg>
                </button>
                <h2 className="text-3xl font-bold text-slate-600">{exercise.title}</h2>
                <div className="text-xl font-medium text-slate-400 font-sans">{currentStepIndex + 1} / {exercise.steps.length}</div>
            </div>

            {/* Pyramid Area */}
            <div className="flex-1 flex flex-col items-center justify-center space-y-6 overflow-y-auto">
                {exercise.steps.map((step, index) => {
                    const isActive = index === currentStepIndex;
                    const isPast = index < currentStepIndex;
                    const words = step.split(' ');

                    if (index > currentStepIndex) return null; // Hide future steps completely for "Reveal" feel? 
                    // User said: "esialgi näitab vaid ühte sõna... ilmub järgmine sõna nähtavale"
                    // But logopeed said "treppide kaupa".
                    // Let's keep previous steps visible (isPast) but maybe faded.

                    return (
                        <div
                            key={index}
                            className={`text-center transition-all duration-500 ease-in-out
                    ${isActive ? 'scale-110 opacity-100 my-4' : 'scale-100 opacity-60'}
                  `}
                        >
                            <div className="text-4xl sm:text-5xl tracking-wide flex flex-wrap justify-center gap-3">
                                {words.map((word, wIndex) => {
                                    // If past step, everything is green/done
                                    if (isPast) return <span key={wIndex} className="text-green-600">{word}</span>;

                                    // If future step (within active line?), basic gray
                                    if (!isActive) return <span key={wIndex}>{word}</span>;

                                    // If active, check recognition
                                    const isRecognized = isWordRecognized(word);
                                    return (
                                        <span
                                            key={wIndex}
                                            className={`transition-colors duration-300 ${isRecognized ? 'text-green-600' : 'text-slate-800'}`}
                                        >
                                            {word}
                                        </span>
                                    );
                                })}
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Controls Container */}
            <div className="mt-8 mb-4">
                <div className="bg-white rounded-2xl shadow-xl p-6 flex flex-col items-center gap-4">
                    {/* Transcript Helper (optional, good for debugging/feedback) */}
                    <div className="text-center w-full px-4 mb-2">
                        <div className="flex flex-col items-center justify-center gap-1 mb-2">
                            <p className="text-xs text-slate-400">
                                Olek: {isListening ? (isSoundDetected ? "Kuulen häält 🟢" : "Kuulan (vaikus) 👂") : "Ei kuula 🔴"}
                            </p>
                            {transcript && <p className="text-xs text-slate-400">Tuvastatud:</p>}
                        </div>
                        <div className="min-h-[3rem] p-2 bg-slate-50 rounded border border-slate-200 text-slate-600 font-mono text-sm break-words">
                            {transcript} <span className="text-slate-400">{interimTranscript}</span>
                        </div>
                    </div>

                    <div className="flex gap-6 items-center">
                        <button
                            onClick={resetTranscript}
                            className="p-4 rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 active:scale-95 transition-all"
                            aria-label="Proovi uuesti"
                        >
                            <RefreshCw size={24} />
                        </button>

                        <button
                            onClick={isListening ? stopListening : startListening}
                            className={`p-8 rounded-full shadow-lg transform transition-all active:scale-95
                        ${isListening ? 'bg-red-500 text-white animate-pulse' : 'bg-green-500 text-white'}
                    `}
                        >
                            {isListening ? <MicOff size={40} /> : <Mic size={40} />}
                        </button>

                        {/* Manual Next (fallback) */}
                        <button
                            onClick={() => {
                                setCurrentStepIndex(prev => Math.min(prev + 1, exercise.steps.length - 1));
                                resetTranscript();
                            }}
                            className="p-4 rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 active:scale-95 transition-all"
                            aria-label="Järgmine"
                        >
                            <ChevronRight size={24} />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};
