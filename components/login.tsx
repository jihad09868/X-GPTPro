import React, { useState, useRef, useEffect } from 'react';
import { ArrowRight, Clipboard, Check, X, Eye, EyeOff, Maximize, Minimize } from 'lucide-react';

interface LoginProps {
    onLoginSuccess: (url: string) => void;
}


const Login: React.FC<LoginProps> = ({ onLoginSuccess }) => {
    const [url, setUrl] = useState('');
    const [buttonState, setButtonState] = useState<'idle' | 'swiping' | 'loading' | 'success' | 'error'>('idle');
    const [isPasswordHidden, setIsPasswordHidden] = useState(false); // Default visible
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [pageExit, setPageExit] = useState(false);

    const inputRef = useRef<HTMLInputElement>(null);
    const [lastSubmitTime, setLastSubmitTime] = useState(0);

    // Security: Anti-Iframe (Clickjacking) & Mirroring Protection
    useEffect(() => {
        try {
            if (window.top !== window.self) {
                window.top!.location.href = window.self.location.href;
            }
        } catch (e) {
            // We are likely framed inside a cross-origin iframe causing a DOMException
            window.top!.location.href = window.self.location.href;
        }
    }, []);

    // Fullscreen Event Listener
    useEffect(() => {
        const handleFullscreenChange = () => {
            setIsFullscreen(!!document.fullscreenElement);
        };
        document.addEventListener('fullscreenchange', handleFullscreenChange);
        return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
    }, []);

    const toggleFullscreen = () => {
        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen().catch(e => console.log(e));
        } else {
            if (document.exitFullscreen) document.exitFullscreen();
        }
    };


    const handlePaste = async () => {
        try {
            const text = await navigator.clipboard.readText();
            setUrl(text);
        } catch (err) {
            console.error('Failed or denied to read clipboard:', err);
        }
    };

    const sanitizeUrl = (input: string) => {
        let clean = input.replace(/<[^>]*>?/gm, '');
        clean = clean.replace(/javascript:/gi, '');
        clean = clean.replace(/data:/gi, '');
        return clean.trim();
    };

    const validateAndSubmit = async () => {
        if (!url || buttonState !== 'idle') return;

        // Prevent rapid repeated requests (DDOS/Spam protection)
        const now = Date.now();
        if (now - lastSubmitTime < 3000) {
            return;
        }
        setLastSubmitTime(now);

        // Start Swiping animation
        setButtonState('swiping');

        setTimeout(() => {
            setButtonState('loading');
            performValidation();
        }, 300); // Wait for arrow to swipe out
    };

    const performValidation = async () => {
        let cleanUrl = sanitizeUrl(url);
        if (!/^https?:\/\//i.test(cleanUrl)) {
            cleanUrl = 'https://' + cleanUrl;
        }

        const urlRegex = /^https?:\/\/[a-zA-Z0-9-._~:/?#[\]@!$&'()*+,;=%]+$/;

        if (!urlRegex.test(cleanUrl)) {
            triggerError();
            return;
        }

        try {
            const controller = new AbortController();
            const id = setTimeout(() => controller.abort(), 8000);

            await fetch(cleanUrl, {
                method: 'GET',
                mode: 'no-cors',
                signal: controller.signal
            });
            clearTimeout(id);

            triggerSuccess(cleanUrl);
        } catch (err) {
            console.error('URL Validation Error:', err);
            triggerError();
        }
    };

    const triggerError = () => {
        setButtonState('error');
        setTimeout(() => {
            setButtonState('idle');
        }, 2000);
    };

    const triggerSuccess = (validUrl: string) => {
        setButtonState('success');
        setTimeout(() => {
            // Trigger page exits smooth black transition
            setPageExit(true);
            setTimeout(() => {
                onLoginSuccess(validUrl);
            }, 600); // Wait for black flash animation
        }, 1200);
    };


    return (
        <div className={`flex items-center justify-center min-h-screen bg-[#f8f8f8] dark:bg-[#212121] font-sans overflow-hidden transition-opacity duration-700 ${pageExit ? 'opacity-0' : 'opacity-100'}`}>

            {/* Fullscreen Button */}
            <button
                onClick={toggleFullscreen}
                className="absolute top-6 right-6 p-2 text-gray-500 dark:text-gray-400 hover:text-black dark:hover:text-white transition-colors z-50"
                title="Toggle Fullscreen"
            >
                {isFullscreen ? <Minimize size={24} /> : <Maximize size={24} />}
            </button>

            <div className={`w-full max-w-[380px] px-6 flex flex-col items-center animate-fade-in-up transition-all duration-500 ease-[cubic-bezier(0.8,0,0.2,1)] ${pageExit ? 'scale-105 blur-[2px]' : 'scale-100'}`}>

                {/* Header Title strictly centered and static */}
                <h1 className="text-[34px] font-bold tracking-wider mb-8 select-none flex justify-center w-full text-gray-900 dark:text-white">
                    <div className="flex items-center drop-shadow-[0_0_10px_rgba(0,0,0,0.1)] dark:drop-shadow-[0_0_10px_rgba(255,255,255,0.15)] relative">
                        <span>X-GPT</span>
                    </div>
                </h1>

                <div className="w-full flex flex-col gap-4 relative z-10 w-full">

                    {/* Input Container */}
                    <div className="relative w-full group flex items-center bg-white dark:bg-[#2F2F2F] rounded-[28px] border border-gray-200 dark:border-white/5 shadow-inner transition-colors focus-within:ring-[1.5px] focus-within:ring-black/10 dark:focus-within:ring-white/20 focus-within:bg-gray-50 dark:focus-within:bg-[#333]">
                        {/* Actual Input with smooth blur transition when hidden */}
                        <input
                            ref={inputRef}
                            type="text"
                            value={url}
                            onChange={(e) => setUrl(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && validateAndSubmit()}
                            placeholder="Invitation link..."
                            className={`w-full bg-transparent text-[15px] placeholder-gray-400 dark:placeholder-gray-500 pl-6 pr-14 py-[16px] focus:outline-none transition-all duration-300 ${isPasswordHidden && url ? 'text-transparent' : 'text-gray-900 dark:text-[#ececec]'}`}
                            style={{ textShadow: isPasswordHidden && url ? '0 0 10px currentColor' : 'none' }}
                            autoComplete="off"
                            spellCheck="false"
                        />

                        <div className="absolute right-3 flex items-center justify-center text-gray-500 dark:text-gray-400 hover:text-black dark:hover:text-white transition-colors z-10">
                            {!url.trim() ? (
                                <button
                                    onClick={handlePaste}
                                    title="Paste URL"
                                    className="p-1.5 focus:outline-none"
                                >
                                    <Clipboard size={18} strokeWidth={2} />
                                </button>
                            ) : (
                                <button
                                    onClick={() => setIsPasswordHidden(!isPasswordHidden)}
                                    title={isPasswordHidden ? "Show text" : "Hide text"}
                                    className="p-1.5 focus:outline-none"
                                >
                                    {isPasswordHidden ? <Eye size={18} strokeWidth={2} /> : <EyeOff size={18} strokeWidth={2} />}
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Submit Button */}
                    <button
                        onClick={validateAndSubmit}
                        disabled={buttonState !== 'idle' || !url.trim()}
                        className={`w-full flex items-center justify-center rounded-[28px] font-medium transition-all duration-300 relative overflow-hidden shadow-md ${buttonState === 'idle' && url.trim()
                            ? 'bg-black text-white hover:bg-gray-800 dark:bg-white dark:text-black dark:hover:bg-gray-200 active:scale-[0.98]'
                            : buttonState === 'error'
                                ? 'bg-red-500/20 text-red-500 border border-red-500/50'
                                : buttonState === 'success' || buttonState === 'loading' || buttonState === 'swiping'
                                    ? 'bg-gray-100 text-gray-900 border-gray-200 dark:bg-[#2F2F2F] dark:text-white border dark:border-white/5'
                                    : 'bg-gray-100 text-gray-400 border-gray-200 dark:bg-[#2F2F2F] dark:text-gray-500 cursor-not-allowed border dark:border-white/5 shadow-none'
                            }`}
                        style={{ height: '56px' }}
                    >
                        {/* Idle / Swiping State */}
                        {(buttonState === 'idle' || buttonState === 'swiping') && (
                            <div className={`flex items-center justify-center w-full h-full transition-all duration-300 ease-[cubic-bezier(0.5,0,0,1)] ${buttonState === 'swiping' ? 'translate-x-[150%] opacity-0' : 'translate-x-0 opacity-100'}`}>
                                <ArrowRight size={22} strokeWidth={2.5} className={`${url.trim() ? "text-white dark:text-black" : "text-gray-400 dark:text-gray-500"}`} />
                            </div>
                        )}

                        {/* Custom SVG Spinner */}
                        {buttonState === 'loading' && (
                            <div className="absolute inset-0 flex items-center justify-center animate-fade-in-quick">
                                <div style={{ transform: 'scale(0.35)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <div className="loader">
                                        {[...Array(12)].map((_, i) => (
                                            <span key={i} style={{ background: 'currentColor' }} />
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Success State */}
                        {buttonState === 'success' && (
                            <div className="absolute inset-0 flex items-center justify-center animate-pop-in">
                                <Check size={26} strokeWidth={3.5} className="text-black dark:text-white" />
                            </div>
                        )}

                        {/* Error State */}
                        {buttonState === 'error' && (
                            <div className="absolute inset-0 flex items-center justify-center animate-bounce-in">
                                <X size={26} strokeWidth={3.5} />
                            </div>
                        )}
                    </button>
                </div>
            </div>

            {/* Animations and Custom Spinner CSS */}
            <style>{`
                /* ══════════════════════════════════════════════════════════
                   ROTATION SPINNER
                ══════════════════════════════════════════════════════════ */
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
                    to { transform: rotate(360deg); }
                }

                @keyframes pop-in {
                    0% { transform: scale(0.4); opacity: 0; }
                    50% { transform: scale(1.2); opacity: 1; }
                    100% { transform: scale(1); opacity: 1; }
                }
                .animate-pop-in {
                    animation: pop-in 0.35s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards;
                }

                @keyframes bounce-in {
                    0% { transform: scale(0.3); opacity: 0; }
                    50% { transform: scale(1.05); opacity: 1; }
                    70% { transform: scale(0.9); opacity: 1; }
                    100% { transform: scale(1); opacity: 1; }
                }
                .animate-bounce-in {
                    animation: bounce-in 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards;
                }
                
                @keyframes fade-in-up {
                    from { transform: translateY(15px); opacity: 0; }
                    to { transform: translateY(0); opacity: 1; }
                }
                .animate-fade-in-up {
                    animation: fade-in-up 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards;
                }
                
                @keyframes fade-in-quick {
                    from { opacity: 0; transform: scale(0.9); }
                    to { opacity: 1; transform: scale(1); }
                }
                .animate-fade-in-quick {
                    animation: fade-in-quick 0.2s ease-out forwards;
                }
            `}</style>
        </div>
    );
};

export default Login;