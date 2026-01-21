import { useState, useEffect, useRef } from 'react';
import { useSpeechRecognition } from '../hooks/useSpeechRecognition';
import { Mic, MicOff, RefreshCw, ChevronRight, CheckCircle2, ChevronLeft, Star, Clock } from 'lucide-react';
import { ResultsView } from './ResultsView';

const Timer = ({ duration, isRunning, onExpire, difficulty }) => {
    const [timeLeft, setTimeLeft] = useState(duration);

    // Reset timer when duration changes (new step)
    useEffect(() => {
        setTimeLeft(duration);
    }, [duration]);

    useEffect(() => {
        if (!isRunning || timeLeft <= 0 || difficulty === 'snail') return;

        const interval = setInterval(() => {
            setTimeLeft((prev) => {
                if (prev <= 100) { // 100ms interval
                    clearInterval(interval);
                    onExpire();
                    return 0;
                }
                return prev - 100;
            });
        }, 100);

        return () => clearInterval(interval);
    }, [isRunning, timeLeft, onExpire, difficulty]);

    if (difficulty === 'snail') return null;

    const percentage = (timeLeft / duration) * 100;
    const color = percentage > 50 ? 'bg-green-500' : percentage > 20 ? 'bg-yellow-500' : 'bg-red-500';

    return (
        <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden mb-4">
            <div
                className={`h-full transition-all duration-100 ease-linear ${color}`}
                style={{ width: `${percentage}%` }}
            />
        </div>
    );
};

// Helper to normalize
const normalize = (text) => text.toLowerCase().replace(/[.,?!]/g, '');

export const PyramidView = ({ exercise, onComplete, onBack, difficulty = 'rabbit', fontType = 'hand' }) => {
    const [currentStepIndex, setCurrentStepIndex] = useState(0);
    const [isFinished, setIsFinished] = useState(false);

    // Stats
    const [startTime] = useState(Date.now());
    const [endTime, setEndTime] = useState(null);
    const [mistakes, setMistakes] = useState([]);

    // Logic for Persistent Recognition
    const [recognizedIndices, setRecognizedIndices] = useState(new Set());

    const { isListening, transcript, interimTranscript, startListening, stopListening, resetTranscript, isSoundDetected } = useSpeechRecognition('et-EE');

    // Timer logic
    const calculateTime = (text, diff) => {
        const wordCount = text.split(' ').length;
        if (diff === 'tiger') return (wordCount * 1500) + 2000; // Fast
        if (diff === 'rabbit') return (wordCount * 3000) + 5000; // Normal
        return 0; // Snail
    };

    const currentStepText = exercise.steps[currentStepIndex];
    const duration = calculateTime(currentStepText, difficulty);

    const handleTimeout = () => {
        // Timeout counts as a struggle/mistake
        setMistakes(prev => [...prev, currentStepText]);
        resetTranscript();
    };

    const currentStepWords = currentStepText.split(' ');

    // Listen to transcript updates and persist recognized words
    useEffect(() => {
        const spokenWords = normalize(transcript + ' ' + interimTranscript).split(/\s+/);

        currentStepWords.forEach((word, index) => {
            if (recognizedIndices.has(index)) return; // Already recognized

            const normWord = normalize(word);
            if (spokenWords.includes(normWord)) {
                setRecognizedIndices(prev => new Set(prev).add(index));
            }
        });
    }, [transcript, interimTranscript, currentStepText]); // Re-run when transcript changes

    // Check if step is complete using persisted set
    const isStepComplete = currentStepWords.every((_, index) => recognizedIndices.has(index));

    useEffect(() => {
        if (isStepComplete) {
            const timer = setTimeout(() => {
                if (currentStepIndex < exercise.steps.length - 1) {
                    resetTranscript();
                    setRecognizedIndices(new Set()); // Clear for next step
                    setCurrentStepIndex(prev => prev + 1);
                } else {
                    const end = Date.now();
                    setEndTime(end);
                    setIsFinished(true);
                    stopListening();

                    // Save to History
                    const historyItem = {
                        date: new Date().toISOString(),
                        exerciseTitle: exercise.title,
                        duration: end - startTime,
                        mistakes: mistakes,
                        difficulty: difficulty
                    };

                    const existingHistory = JSON.parse(localStorage.getItem('lugemine_history') || '[]');
                    localStorage.setItem('lugemine_history', JSON.stringify([...existingHistory, historyItem]));
                }
            }, 1000);
            return () => clearTimeout(timer);
        }
    }, [isStepComplete, currentStepIndex, exercise.steps.length, resetTranscript, stopListening]);

    if (isFinished) {
        return (
            <ResultsView
                duration={endTime - startTime}
                mistakes={mistakes}
                onRetry={() => {
                    setIsFinished(false);
                    setCurrentStepIndex(0);
                    setMistakes([]);
                    setRecognizedIndices(new Set());
                    resetTranscript();
                    onBack();
                }}
                onHome={onBack}
            />
        );
    }

    const progress = Math.round(((currentStepIndex) / exercise.steps.length) * 100);
    const fontClass = fontType === 'hand' ? 'font-hand' : 'font-sans';

    return (
        <div className={`flex flex-col h-full bg-[#FFFDF5] text-slate-800 p-4 ${fontClass}`}>
            {/* Header / Progress */}
            <div className="flex justify-between items-center mb-6">
                <button onClick={onBack} className="text-slate-400 hover:text-slate-600">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6" /></svg>
                </button>
                <h2 className="text-3xl font-bold text-slate-600">{exercise.title}</h2>
                <div className="text-xl font-medium text-slate-400 font-sans">{currentStepIndex + 1} / {exercise.steps.length}</div>
            </div>

            {/* Pyramid Area - RESPONSIVE TWEAKS */}
            <div className="flex-1 flex flex-col items-center justify-center space-y-6 overflow-y-auto">
                {exercise.steps.map((step, index) => {
                    const isActive = index === currentStepIndex;
                    const isPast = index < currentStepIndex;
                    const words = step.split(' ');

                    if (index > currentStepIndex) return null;

                    return (
                        <div
                            key={index}
                            className={`text-center transition-all duration-500 ease-in-out px-4 w-full max-w-2xl
                    ${isActive ? 'scale-100 opacity-100 my-4' : 'scale-95 opacity-50 hidden sm:block'}
                  `}
                        >
                            <div className="inline-block leading-relaxed tracking-wide">
                                {words.map((word, wIndex) => {
                                    // Logic for coloring:
                                    // Past steps: All green
                                    // Active step: Check persistent indices

                                    let isGreen = false;
                                    if (isPast) isGreen = true;
                                    if (isActive && recognizedIndices.has(wIndex)) isGreen = true;

                                    return (
                                        <span
                                            key={wIndex}
                                            className={`
                                                inline-block mr-2 last:mr-0 mb-1
                                                transition-colors duration-300
                                                /* Responsive Font Sizes - Fluid */
                                                text-[clamp(1.5rem,5vw,3rem)]
                                                ${isGreen ? 'text-green-600' : ''}
                                                ${!isGreen && isActive ? 'text-slate-800' : ''}
                                                ${!isActive && !isPast ? 'text-slate-400' : ''}
                                            `}
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
            <div className="mt-8 mb-4 w-full max-w-lg mx-auto">
                <div className="bg-white rounded-2xl shadow-xl p-6 flex flex-col items-center gap-4 border border-slate-100">

                    <Timer
                        duration={duration}
                        isRunning={isListening}
                        onExpire={handleTimeout}
                        difficulty={difficulty}
                    />
                </div>

                <div className="flex gap-6 items-center justify-center mt-4">
                    <button
                        onClick={() => {
                            setMistakes(prev => [...prev, currentStepText + " (Manuaalne)"]);
                            resetTranscript();
                        }}
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

                    {/* Manual Next */}
                    <button
                        onClick={() => {
                            setCurrentStepIndex(prev => Math.min(prev + 1, exercise.steps.length - 1));
                            resetTranscript();
                            setRecognizedIndices(new Set()); // Ensure clean manual reset
                        }}
                        className="p-4 rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 active:scale-95 transition-all"
                        aria-label="Järgmine"
                    >
                        <ChevronRight size={24} />
                    </button>
                </div>
            </div>
        </div>
    );
};
