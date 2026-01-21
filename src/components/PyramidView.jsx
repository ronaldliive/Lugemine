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

export const PyramidView = ({ exercise, onComplete, onBack, difficulty = 'rabbit' }) => {
    const [currentStepIndex, setCurrentStepIndex] = useState(0);
    const [isFinished, setIsFinished] = useState(false);

    // Stats
    const [startTime] = useState(Date.now());
    const [endTime, setEndTime] = useState(null);
    const [mistakes, setMistakes] = useState([]);

    // We can't easily get *incorrect* words from our current hook because it only returns the accumulated transcript.
    // However, we can infer "struggle" if the transcript gets long without matching the target.
    // Ideally, we'd listen to 'onresult' events for finals that DON'T match.
    // For now, let's keep mistakes simple: maybe just count timeouts or "Retry" clicks?
    // OR: We can use a ref to track what was spoken.

    // Actually, let's use the hook's transcript to detect "noise".
    // A better approach for "mistakes" without deep API hacking:
    // If we have to reset the transcript, we count that as a "retry/mistake".

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
        setMistakes(prev => [...prev, currentStepText]); // Log the phrase they failed on
        resetTranscript();
    };

    // Clean up words for matching (lowercase, remove punctuation)
    const normalize = (text) => text.toLowerCase().replace(/[.,?!]/g, '');

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
                    // Move to next step
                    resetTranscript(); // Force re-reading of the full sentence
                    setCurrentStepIndex(prev => prev + 1);
                } else {
                    // Exercise complete
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
                    // Full reset
                    setIsFinished(false);
                    setCurrentStepIndex(0);
                    setMistakes([]);
                    resetTranscript();
                    // startTime is complicated since it's state initiated once.
                    // Ideally we remount the component.
                    // Let's call onBack() then immediately we'd need to re-select.
                    // simpler: just reload page or let parent handle?
                    // Let's just reset local state somewhat cleanly, but startTime won't reset easily without effect.
                    // Actually, cleanest is to ask parent to unmount/remount.
                    // But for now -> onBack() is safest to return to menu.
                    onBack();
                }}
                onHome={onBack}
            />
        );
    }

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
                        // Note: Added 'hidden sm:block' to past items on mobile to save vertical space? 
                        // User liked the "Pyramid" effect. Let's keep them but make them smaller/tighter.
                        // Actually, to prevent "cutting", let's just ensure nice wrapping.
                        >
                            <div className="inline-block leading-relaxed tracking-wide">
                                {words.map((word, wIndex) => {
                                    const isRecognized = isActive ? isWordRecognized(word) : false;

                                    return (
                                        <span
                                            key={wIndex}
                                            className={`
                                                inline-block mr-2 last:mr-0 mb-1
                                                transition-colors duration-300
                                                /* Responsive Font Sizes - Fluid */
                                                text-[clamp(1.5rem,5vw,3rem)]
                                                ${isPast ? 'text-green-600' : ''}
                                                ${isActive && isRecognized ? 'text-green-600' : ''}
                                                ${isActive && !isRecognized ? 'text-slate-800' : ''}
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

                    {/* Hidden debug state, logic remains for stats tracking if we wanted */}
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
