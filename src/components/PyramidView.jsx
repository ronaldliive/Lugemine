import React, { useState, useEffect, useRef } from 'react';
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
    const finishedRef = useRef(false); // Ref to prevent double-execution of finish logic

    // Stats
    const [startTime] = useState(Date.now());
    const [endTime, setEndTime] = useState(null);
    const [mistakes, setMistakes] = useState([]);

    // Logic for Persistent Recognition
    const [recognizedIndices, setRecognizedIndices] = useState(new Set());
    const [errorIndex, setErrorIndex] = useState(null); // Track which word to highlight red

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
        setMistakes(prev => [...prev, currentStepText]);
        resetTranscript();
    };

    const currentStepWords = currentStepText.split(' ');

    // Listen to transcript updates and persist recognized words
    // Also detect errors
    useEffect(() => {
        const spokenWords = normalize(transcript + ' ' + interimTranscript).split(/\s+/).filter(Boolean);

        // 1. Identify valid recognitions
        currentStepWords.forEach((word, index) => {
            if (recognizedIndices.has(index)) return;

            const normWord = normalize(word);
            if (spokenWords.includes(normWord)) {
                setRecognizedIndices(prev => {
                    const newSet = new Set(prev);
                    newSet.add(index);
                    return newSet;
                });
                setErrorIndex(null); // Clear error if we found a match
            }
        });

        // 2. Identify Errors (Simple Heuristic)
        // Find the *first* word that we still need to say
        const nextExpectedIndex = currentStepWords.findIndex((_, i) => !recognizedIndices.has(i));

        if (nextExpectedIndex !== -1 && spokenWords.length > 0) {
            // Get the last spoken word (most recent attempt)
            const lastSpoken = spokenWords[spokenWords.length - 1];
            const target = normalize(currentStepWords[nextExpectedIndex]);

            // If we have a decent length word that DOESN'T match the target, flag it
            // Only flag if it's not a substring (to avoid flagging "ka" when trying to say "kass")
            if (lastSpoken.length > 1 && !target.startsWith(lastSpoken) && lastSpoken !== target) {
                // Check if it matches *any* future word (maybe they skipped?)
                // If it doesn't match the *current* expected word, we warn.
                // But be careful of partials.
                // Let's rely on transcript (finalized) vs interim.
                // If 'transcript' has changed (word finalized) and it wasn't the target -> Red.
            }
        }

    }, [transcript, interimTranscript, currentStepText, recognizedIndices]);

    // Better Error Logic using Previous Transcript length to detect *new* final words?
    // Let's us a refined effect for errors specifically on 'transcript' changes (final words)
    const prevTranscriptRef = useRef(transcript);
    useEffect(() => {
        const newWords = normalize(transcript).split(/\s+/).filter(Boolean);
        const oldWords = normalize(prevTranscriptRef.current).split(/\s+/).filter(Boolean);

        if (newWords.length > oldWords.length) {
            // A new final word was added
            const addedWord = newWords[newWords.length - 1];

            // Find next expected
            const nextExpectedIndex = currentStepWords.findIndex((_, i) => !recognizedIndices.has(i));
            if (nextExpectedIndex !== -1) {
                const target = normalize(currentStepWords[nextExpectedIndex]);
                if (addedWord !== target) {
                    // They said something else!
                    setErrorIndex(nextExpectedIndex);
                    // Clear error after 1 sec
                    setTimeout(() => setErrorIndex(null), 1000);
                }
            }
        }
        prevTranscriptRef.current = transcript;
    }, [transcript, recognizedIndices, currentStepWords]);


    // Check if step is complete using persisted set
    const isStepComplete = currentStepWords.every((_, index) => recognizedIndices.has(index));

    useEffect(() => {
        if (isStepComplete && !finishedRef.current) {
            const timer = setTimeout(() => {
                // If we are already finished (by another trigger), do nothing
                if (finishedRef.current) return;

                if (currentStepIndex < exercise.steps.length - 1) {
                    resetTranscript();
                    setRecognizedIndices(new Set());
                    setErrorIndex(null);
                    setCurrentStepIndex(prev => prev + 1);
                } else {
                    // Exercise complete
                    finishedRef.current = true; // Mark as finished immediately
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
    }, [isStepComplete, currentStepIndex, exercise.steps.length, resetTranscript, stopListening, startTime, mistakes, exercise.title, difficulty]);

    if (isFinished) {
        return (
            <ResultsView
                duration={endTime - startTime}
                mistakes={mistakes}
                onRetry={() => {
                    finishedRef.current = false;
                    setIsFinished(false);
                    setCurrentStepIndex(0);
                    setMistakes([]);
                    setRecognizedIndices(new Set());
                    setErrorIndex(null);
                    resetTranscript();
                    // Removing onBack() call to stay in PyramidView.
                }}
                onHome={onBack}
                onNext={onComplete} // We will use onComplete prop to signal "Next Exercise request"
            />
        );
    }

    const progress = Math.round(((currentStepIndex) / exercise.steps.length) * 100);
    const fontClass = fontType === 'hand' ? 'font-hand' : 'font-sans';

    return (
        <div className={`flex flex-col h-[100dvh] bg-[#FFFDF5] text-slate-800 p-4 ${fontClass}`}>
            {/* Header / Progress */}
            <div className="flex justify-between items-center mb-6 shrink-0">
                <button onClick={onBack} className="text-slate-400 hover:text-slate-600">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6" /></svg>
                </button>
                <h2 className="text-3xl font-bold text-slate-600">{exercise.title}</h2>
                <div className="text-xl font-medium text-slate-400 font-sans">{currentStepIndex + 1} / {exercise.steps.length}</div>
            </div>

            {/* Pyramid Area - RESPONSIVE TWEAKS */}
            <div className="flex-1 flex flex-col items-center justify-center space-y-4 overflow-y-auto w-full py-4 min-h-0">
                {exercise.steps.map((step, index) => {
                    const isActive = index === currentStepIndex;
                    const isPast = index < currentStepIndex;
                    const words = step.split(' ');

                    if (index > currentStepIndex) return null;

                    return (
                        <div
                            key={index}
                            className={`text-center transition-all duration-500 ease-in-out px-2 w-full max-w-4xl
                    ${isActive ? 'scale-100 opacity-100 my-2' : 'scale-90 opacity-40 hidden sm:block'}
                  `}
                        >
                            <div className={`inline-block leading-normal tracking-wide transition-all duration-300 ${isActive ? 'py-4' : ''}`}>
                                {words.map((word, wIndex) => {
                                    // Logic for coloring:
                                    let isGreen = false;
                                    let isRed = false;

                                    if (isPast) isGreen = true;
                                    if (isActive && recognizedIndices.has(wIndex)) isGreen = true;
                                    if (isActive && errorIndex === wIndex && !isGreen) isRed = true;

                                    return (
                                        <span
                                            key={wIndex}
                                            className={`
                                                inline-block mr-3 last:mr-0 mb-2
                                                transition-colors duration-300
                                                /* Responsive Font Sizes - Much Larger */
                                                text-[clamp(2.5rem,8vw,5rem)]
                                                ${isGreen ? 'text-green-600' : ''}
                                                ${isRed ? 'text-red-500 animate-pulse' : ''}
                                                ${!isGreen && !isRed && isActive ? 'text-slate-800' : ''}
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

            {/* Controls Container - Fixed visual hierarchy */}
            <div className="mt-auto pt-4 pb-8 w-full max-w-lg mx-auto shrink-0">
                <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-lg p-6 flex flex-col items-center gap-4 border border-slate-100 ring-4 ring-slate-50/50">

                    <Timer
                        duration={duration}
                        isRunning={isListening}
                        onExpire={handleTimeout}
                        difficulty={difficulty}
                    />
                </div>

                <div className="flex gap-6 items-center justify-center -mt-6 relative z-10">
                    <button
                        onClick={() => {
                            setMistakes(prev => [...prev, currentStepText + " (Manuaalne)"]);
                            setRecognizedIndices(new Set()); // Reset green words
                            setErrorIndex(null); // Reset red words
                            resetTranscript();
                        }}
                        className="w-14 h-14 rounded-full bg-white shadow-md border border-slate-100 text-slate-400 hover:text-slate-600 hover:scale-105 active:scale-95 transition-all flex items-center justify-center"
                        aria-label="Proovi uuesti"
                    >
                        <RefreshCw size={24} />
                    </button>

                    <button
                        onClick={isListening ? stopListening : startListening}
                        className={`w-24 h-24 rounded-full shadow-xl transform transition-all active:scale-95 flex items-center justify-center border-4 border-white
                        ${isListening
                                ? 'bg-red-500 text-white shadow-red-200 animate-pulse'
                                : 'bg-green-500 text-white shadow-green-200 hover:bg-green-600 hover:scale-105'}
                    `}
                    >
                        {isListening ? <MicOff size={48} /> : <Mic size={48} />}
                    </button>

                    {/* Manual Next */}
                    <button
                        onClick={() => {
                            setCurrentStepIndex(prev => Math.min(prev + 1, exercise.steps.length - 1));
                            resetTranscript();
                            setRecognizedIndices(new Set()); // Ensure clean manual reset
                            setErrorIndex(null);
                        }}
                        className="w-14 h-14 rounded-full bg-white shadow-md border border-slate-100 text-slate-400 hover:text-slate-600 hover:scale-105 active:scale-95 transition-all flex items-center justify-center"
                        aria-label="Järgmine"
                    >
                        <ChevronRight size={24} />
                    </button>
                </div>
            </div>
        </div>
    );
};
