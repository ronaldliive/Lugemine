import { useState, useEffect, useRef } from 'react';

export const useSpeechRecognition = (lang = 'et-EE') => {
    const [isListening, setIsListening] = useState(false);
    const [transcript, setTranscript] = useState('');
    const [interimTranscript, setInterimTranscript] = useState('');
    const [isSoundDetected, setIsSoundDetected] = useState(false);
    const recognitionRef = useRef(null);
    // Track if the user *wants* us to be listening
    const shouldBeListening = useRef(false);

    useEffect(() => {
        if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
            console.warn('Browser does not support Speech Recognition');
            return;
        }

        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        const recognition = new SpeechRecognition();

        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = lang;

        recognition.onstart = () => {
            console.log("Recognition started");
            setIsListening(true);
        };

        recognition.onaudiostart = () => console.log("Audio started");
        recognition.onsoundstart = () => {
            console.log("Sound started");
            setIsSoundDetected(true);
        };
        recognition.onspeechstart = () => console.log("Speech started");
        recognition.onspeechend = () => console.log("Speech ended");
        recognition.onsoundend = () => {
            console.log("Sound ended");
            setIsSoundDetected(false);
        };
        recognition.onaudioend = () => console.log("Audio ended");

        recognition.onresult = (event) => {
            console.log("Result received", event.results);
            let final = '';
            let interim = '';

            for (let i = event.resultIndex; i < event.results.length; ++i) {
                if (event.results[i].isFinal) {
                    final += event.results[i][0].transcript;
                } else {
                    interim += event.results[i][0].transcript;
                }
            }

            if (final) {
                console.log("Final transcript:", final);
                setTranscript(prev => (prev + ' ' + final).trim());
            }
            setInterimTranscript(interim);
        };

        recognition.onnomatch = (event) => {
            console.log("No match found");
        };

        recognition.onerror = (event) => {
            console.error('Speech recognition error', event.error);
            if (event.error === 'not-allowed') {
                alert("Palun luba mikrofoni kasutamine!");
                shouldBeListening.current = false; // User denied permission, stop trying to listen
                setIsListening(false);
            } else if (event.error === 'aborted') {
                // This error can happen when stop() is called, or if the browser aborts for other reasons.
                // We'll let onend handle the restart logic if shouldBeListening.current is true.
                setIsListening(false);
            } else {
                // Other errors (no-speech, network, etc.) - we will try to restart in onend
            }
        };

        recognition.onend = () => {
            setIsListening(false);
            // Auto-restart if the user hasn't stopped it and we intend to be listening
            if (shouldBeListening.current) {
                console.log("Auto-restarting speech recognition...");
                try {
                    recognition.start();
                } catch (e) {
                    console.error("Failed to restart speech recognition:", e);
                    // If restart fails, assume we can't listen anymore
                    shouldBeListening.current = false;
                }
            }
        };

        recognitionRef.current = recognition;

        return () => {
            if (recognitionRef.current) {
                shouldBeListening.current = false; // Ensure we don't try to restart after unmount
                recognitionRef.current.stop();
            }
        };
    }, [lang]);

    const startListening = () => {
        setTranscript('');
        setInterimTranscript('');
        shouldBeListening.current = true; // User wants to start listening
        recognitionRef.current?.start();
    };

    const stopListening = () => {
        shouldBeListening.current = false; // User wants to stop listening
        recognitionRef.current?.stop();
    };

    const resetTranscript = () => {
        setTranscript('');
        setInterimTranscript('');
    }

    return {
        isListening,
        transcript,
        interimTranscript,
        startListening,
        stopListening,
        resetTranscript,
        isSoundDetected
    };
};
