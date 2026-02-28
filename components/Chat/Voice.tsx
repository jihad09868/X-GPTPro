import React, { useState, useEffect, useRef, useCallback } from 'react';
import { X, Download, Check } from 'lucide-react';

interface VoiceProps {
    isOpen: boolean;
    onClose: () => void;
    text: string;
}

const Voice: React.FC<VoiceProps> = ({ isOpen, onClose, text }) => {
    const [isPlaying, setIsPlaying] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);
    const [totalDuration, setTotalDuration] = useState(0);
    const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
    const timerRef = useRef<any>(null);
    const startTimeRef = useRef<number>(0);
    const pausedAtRef = useRef<number>(0);
    const waveformRef = useRef<HTMLDivElement>(null);

    // Split text into words for semi-accurate seeking
    const words = useRef<string[]>([]);
    const currentWordIndex = useRef<number>(0);

    // Static waveform bar heights (deterministic pattern)
    const barHeights = [30, 55, 40, 70, 35, 60, 80, 45, 65, 50, 75, 38, 58, 42, 68, 55, 73, 40, 62, 48, 72, 35, 60, 52, 78, 44, 67, 50, 42, 65];
    const totalBars = barHeights.length;

    // Estimate duration from text length (rough: ~150 words/min)
    const estimateDuration = useCallback((txt: string) => {
        const cleanTxt = txt.replace(/[*_#`~>]/g, '');
        const wordList = cleanTxt.split(/\s+/).filter(w => w.length > 0);
        words.current = wordList;
        const seconds = Math.max(3, Math.ceil((wordList.length / 140) * 60)); // slightly slower than 150
        return seconds;
    }, []);

    // Format time display
    const formatTime = (seconds: number): string => {
        const s = Math.floor(seconds);
        const m = Math.floor(s / 60);
        const sec = s % 60;
        return `${m.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`;
    };

    // Start speech from a specific word index
    const startSpeechFrom = useCallback((index: number) => {
        window.speechSynthesis.cancel();

        const remainingText = words.current.slice(index).join(' ');
        if (!remainingText) {
            handleClose();
            return;
        }

        const utterance = new SpeechSynthesisUtterance(remainingText);
        const hasBangla = /[\u0980-\u09FF]/.test(remainingText);
        const hasHindi = /[\u0900-\u097F]/.test(remainingText);

        utterance.lang = hasBangla ? 'bn-BD' : hasHindi ? 'hi-IN' : 'en-US';

        const voices = window.speechSynthesis.getVoices();
        let targetVoice = null;
        if (hasBangla) {
            targetVoice =
                voices.find(v => v.lang === 'bn-BD' && v.name.toLowerCase().includes('female') && (v.name.includes('Neural') || v.name.includes('Online'))) ||
                voices.find(v => v.lang === 'bn-BD' && (v.name.includes('Neural') || v.name.includes('Online'))) ||
                voices.find(v => v.lang === 'bn-BD' && v.name.toLowerCase().includes('female')) ||
                voices.find(v => v.lang === 'bn-BD') ||
                voices.find(v => v.lang.includes('bn') && v.name.toLowerCase().includes('female') && (v.name.includes('Neural') || v.name.includes('Online'))) ||
                voices.find(v => v.lang.includes('bn') && (v.name.includes('Neural') || v.name.includes('Online'))) ||
                voices.find(v => v.name.includes('Google Bangla') || v.name.includes('Bangladesh')) ||
                voices.find(v => v.lang.includes('bn'));
        } else if (hasHindi) {
            targetVoice =
                voices.find(v => v.lang.includes('hi') && v.name.toLowerCase().includes('female') && (v.name.includes('Neural') || v.name.includes('Online'))) ||
                voices.find(v => v.lang.includes('hi') && (v.name.includes('Neural') || v.name.includes('Online'))) ||
                voices.find(v => v.name.includes('Google हिन्दी')) ||
                voices.find(v => v.lang.includes('hi'));
        } else {
            targetVoice =
                voices.find(v => v.lang === 'en-US' && v.name.toLowerCase().includes('female') && (v.name.includes('Neural') || v.name.includes('Online'))) ||
                voices.find(v => v.lang === 'en-US' && v.name.toLowerCase().includes('female')) ||
                voices.find(v => v.lang === 'en-US' && v.name.includes('Neural')) ||
                voices.find(v => v.lang === 'en-US' || v.lang.includes('en'));
        }
        if (targetVoice) {
            utterance.voice = targetVoice;
        }

        utterance.rate = 1.05;
        utterance.pitch = 1.4;

        utterance.onboundary = (event) => {
            if (event.name === 'word') {
                // Approximate index update
                const charIndex = event.charIndex;
                const spokeText = remainingText.substring(0, charIndex);
                const spokeWords = spokeText.split(/\s+/).filter(w => w.length > 0).length;
                currentWordIndex.current = index + spokeWords;
            }
        };

        utterance.onend = () => {
            setIsPlaying(false);
            setCurrentTime(totalDuration);
        };

        utteranceRef.current = utterance;
        window.speechSynthesis.speak(utterance);
        setIsPlaying(true);

        const dur = estimateDuration(text);
        const ratio = index / words.current.length;
        startTimeRef.current = Date.now() - (ratio * dur * 1000);

        setCurrentTime(ratio * dur); // Immediate update for white waveform sync

        if (timerRef.current) clearInterval(timerRef.current);
        timerRef.current = setInterval(() => {
            const elapsed = (Date.now() - startTimeRef.current) / 1000;
            setCurrentTime(Math.min(elapsed, dur));
        }, 50);
    }, [text, estimateDuration, totalDuration]);

    const pauseSpeech = useCallback(() => {
        window.speechSynthesis.pause();
        setIsPlaying(false);
        pausedAtRef.current = currentTime;
        if (timerRef.current) {
            clearInterval(timerRef.current);
            timerRef.current = null;
        }
    }, [currentTime]);

    const resumeSpeech = useCallback(() => {
        window.speechSynthesis.resume();
        setIsPlaying(true);
        startTimeRef.current = Date.now() - (pausedAtRef.current * 1000);

        const dur = estimateDuration(text);

        setCurrentTime(pausedAtRef.current); // Sync immediately

        if (timerRef.current) clearInterval(timerRef.current);
        timerRef.current = setInterval(() => {
            const elapsed = (Date.now() - startTimeRef.current) / 1000;
            setCurrentTime(Math.min(elapsed, dur));
        }, 50);
    }, [text, estimateDuration, pausedAtRef]);

    const togglePlayPause = useCallback(() => {
        if (isPlaying) {
            pauseSpeech();
        } else {
            if (window.speechSynthesis.paused) {
                resumeSpeech();
            } else {
                startSpeechFrom(currentWordIndex.current);
            }
        }
    }, [isPlaying, pauseSpeech, resumeSpeech, startSpeechFrom]);

    const [isDownloading, setIsDownloading] = useState(false);

    const handleDownloadMP3 = async () => {
        if (isDownloading) return;
        setIsDownloading(true);
        try {
            const hasBangla = /[\u0980-\u09FF]/.test(text);
            const hasHindi = /[\u0900-\u097F]/.test(text);
            const langCode = hasBangla ? 'bn-BD' : hasHindi ? 'hi-IN' : 'en-US';

            const response = await fetch(`/api/tts?text=${encodeURIComponent(text)}&lang=${langCode}`);
            if (!response.ok) throw new Error('TTS server error');

            const audioBlob = await response.blob();
            const url = URL.createObjectURL(audioBlob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `xgpt-voice-${Date.now()}.mp3`;
            a.style.display = 'none';
            document.body.appendChild(a);
            a.click();
            setTimeout(() => {
                document.body.removeChild(a);
                URL.revokeObjectURL(url);
            }, 500);
            setIsDownloading(false);
        } catch (err) {
            console.error('MP3 download failed:', err);
            setIsDownloading(false);
        }
    };

    const handleWaveformClick = useCallback((e: React.MouseEvent) => {
        if (!waveformRef.current) return;
        const rect = waveformRef.current.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const ratio = Math.max(0, Math.min(1, x / rect.width));

        const newWordIndex = Math.floor(ratio * words.current.length);
        currentWordIndex.current = newWordIndex;

        const dur = estimateDuration(text);
        const newTime = ratio * dur;
        setCurrentTime(newTime);
        pausedAtRef.current = newTime;

        if (isPlaying) {
            startSpeechFrom(newWordIndex);
        } else {
            startTimeRef.current = Date.now() - (newTime * 1000);
        }
    }, [text, estimateDuration, isPlaying, startSpeechFrom]);

    const handleClose = useCallback(() => {
        window.speechSynthesis.cancel();
        setIsPlaying(false);
        setCurrentTime(0);
        pausedAtRef.current = 0;
        currentWordIndex.current = 0;
        if (timerRef.current) {
            clearInterval(timerRef.current);
            timerRef.current = null;
        }
        onClose();
    }, [onClose]);

    useEffect(() => {
        if (isOpen) {
            const dur = estimateDuration(text);
            setTotalDuration(dur);
            setCurrentTime(0);
            pausedAtRef.current = 0;
            currentWordIndex.current = 0;
            startSpeechFrom(0);
        }
        return () => {
            window.speechSynthesis.cancel();
            if (timerRef.current) clearInterval(timerRef.current);
        };
    }, [isOpen, text, estimateDuration, startSpeechFrom]);

    if (!isOpen) return null;

    const progress = totalDuration > 0 ? currentTime / totalDuration : 0;

    return (
        <div className="fixed inset-x-0 bottom-[90px] z-[10] flex items-center justify-center p-4 pointer-events-none animate-in fade-in slide-in-from-bottom-5 duration-300">
            <div className="voice-popup pointer-events-auto">
                <button onClick={handleDownloadMP3} className="voice-popup-download" title="Download MP3">
                    {isDownloading ? (
                        <div style={{ transform: 'scale(0.25)', width: 14, height: 14, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <div className="loader">
                                {[...Array(12)].map((_, i) => <span key={i} style={{ background: '#fff' }} />)}
                            </div>
                        </div>
                    ) : (
                        <Download size={12} strokeWidth={2.5} />
                    )}
                </button>
                <button onClick={handleClose} className="voice-popup-close">
                    <X size={14} strokeWidth={2.5} />
                </button>

                <button onClick={togglePlayPause} className="voice-popup-play">
                    {isPlaying ? (
                        <div className="flex gap-1">
                            <div className="w-1 h-4 bg-black rounded-full"></div>
                            <div className="w-1 h-4 bg-black rounded-full"></div>
                        </div>
                    ) : (
                        <div className="ml-1 w-0 h-0 border-t-[8px] border-t-transparent border-l-[12px] border-l-black border-b-[8px] border-b-transparent"></div>
                    )}
                </button>

                <div ref={waveformRef} className="voice-popup-waveform" onClick={handleWaveformClick}>
                    {barHeights.map((h, i) => {
                        const barRatio = i / totalBars;
                        const isPlayed = isPlaying && barRatio <= progress;
                        return (
                            <div key={i} className="voice-popup-bar" style={{
                                height: `${h}%`,
                                background: isPlayed ? 'var(--accent-color, #ffffff)' : 'rgba(255,255,255,0.25)',
                            }} />
                        );
                    })}
                </div>

                <div className="voice-popup-time flex items-center gap-2">
                    {formatTime(currentTime)} / {formatTime(totalDuration)}
                </div>
            </div>

            <style>{`
                .loader {
                    position: relative;
                    width: 70px;
                    height: 70px;
                    transform-origin: center center;
                    animation: spin 1s linear infinite;
                }
                .loader span {
                    position: absolute;
                    width: 4px;
                    height: 22px;
                    border-radius: 4px;
                    top: 50%;
                    left: 50%;
                    transform-origin: 50% 100%;
                }
                .loader span:nth-child(1)  { transform: translate(-50%, -100%) rotate(  0deg); }
                .loader span:nth-child(2)  { transform: translate(-50%, -100%) rotate( 30deg); }
                .loader span:nth-child(3)  { transform: translate(-50%, -100%) rotate( 60deg); }
                .loader span:nth-child(4)  { transform: translate(-50%, -100%) rotate( 90deg); }
                .loader span:nth-child(5)  { transform: translate(-50%, -100%) rotate(120deg); }
                .loader span:nth-child(6)  { transform: translate(-50%, -100%) rotate(150deg); }
                .loader span:nth-child(7)  { transform: translate(-50%, -100%) rotate(180deg); }
                .loader span:nth-child(8)  { transform: translate(-50%, -100%) rotate(210deg); }
                .loader span:nth-child(9)  { transform: translate(-50%, -100%) rotate(240deg); }
                .loader span:nth-child(10) { transform: translate(-50%, -100%) rotate(270deg); }
                .loader span:nth-child(11) { transform: translate(-50%, -100%) rotate(300deg); }
                .loader span:nth-child(12) { transform: translate(-50%, -100%) rotate(330deg); }
                @keyframes spin {
                    from { transform: rotate(0deg); }
                    to   { transform: rotate(360deg); }
                }

                .voice-popup {
                    display: flex;
                    align-items: center;
                    gap: 16px;
                    padding: 0 12px;
                    background: transparent;
                    width: 100%;
                    max-width: 480px;
                    position: relative;
                }
                .voice-popup-close {
                    position: absolute;
                    top: -10px;
                    right: 0px;
                    width: 24px;
                    height: 24px;
                    border-radius: 50%;
                    background: transparent;
                    color: rgba(255,255,255,0.7);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    cursor: pointer;
                    transition: all 0.2s;
                    z-index: 10;
                }
                .voice-popup-close:hover { color: white; }
                
                .voice-popup-download {
                    position: absolute;
                    top: -10px;
                    right: 20px;
                    width: 24px;
                    height: 24px;
                    border-radius: 50%;
                    background: transparent;
                    color: rgba(255,255,255,0.7);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    cursor: pointer;
                    transition: all 0.2s;
                    z-index: 10;
                }
                .voice-popup-download:hover { color: white; }
                
                .voice-popup-play {
                    width: 40px;
                    height: 40px;
                    border-radius: 50%;
                    background: var(--accent-color, white);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    border: none;
                    cursor: pointer;
                    flex-shrink: 0;
                    transition: transform 0.2s;
                }
                .voice-popup-play:hover { transform: scale(1.05); }
                .voice-popup-waveform {
                    flex: 1;
                    height: 20px;
                    display: flex;
                    align-items: center;
                    gap: 3px;
                    cursor: pointer;
                }
                .voice-popup-bar {
                    flex: 1;
                    min-width: 2px;
                    border-radius: 4px;
                    transition: all 0.2s;
                }
                .voice-popup-time {
                    color: rgba(255,255,255,0.6);
                    font-family: monospace;
                    font-size: 12px;
                    min-width: 80px;
                    text-align: right;
                }
            `}</style>
        </div >
    );
};

export default Voice;
