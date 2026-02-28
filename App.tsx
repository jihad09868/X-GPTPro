import React, { useState, useEffect, useRef } from 'react';
import { ArrowUp, Menu, X, Lock, Loader2, Trash2, Settings, Zap, Palette, Sliders, Mic, MicOff, Volume2, Copy, Check, AlignJustifyIcon, Bot, AudioLines, ExternalLink } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';
import Sidebar from './components/sidebar/Sidebar';
import SettingsModal from './components/sidebar/SettingsModal';
import Login from './components/login';
import ChatMessage from './components/Chat/ChatMessage';
import Voice from './components/Chat/Voice';
import FileUpload, { FilePreviewBar, SelectedFile } from './components/Chat/FileUpload';
import { ChatSession, Message } from './types';
import { streamChatCompletion, getStoredConfig } from './services/ollamaService';
import { API_BASE_URL } from './constants';
import ReactMarkdown from 'react-markdown';
import MCQ from './components/sidebar/MCQ';
import { translations, Language } from './utils/translations';

// --- ANIMATION COMPONENTS ---
const ThinkingAnimation = ({ hints, currentIndex }: { hints: string[], currentIndex: number }) => {
    return (
        <div className="flex items-center gap-2 animate-in fade-in duration-500">
            <span className="text-[12px] font-medium text-gray-500 dark:text-gray-400 min-w-[120px] transition-all duration-300">
                {hints[currentIndex] || "Thinking..."}
            </span>
        </div>
    );
};

// --- COOKIE HELPERS ---
function setCookie(name: string, value: string, days: number = 365) {
    const expires = new Date(Date.now() + days * 864e5).toUTCString();
    document.cookie = `${name}=${encodeURIComponent(value)}; expires=${expires}; path=/; SameSite=Lax`;
}

function getCookie(name: string): string | null {
    const match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'));
    return match ? decodeURIComponent(match[2]) : null;
}

// Get or create a persistent device ID (survives browser refresh)
function getDeviceId(): string {
    let deviceId = getCookie('xgpt_device_id') || localStorage.getItem('xgpt_device_id');
    if (!deviceId) {
        deviceId = uuidv4();
    }
    // Always re-set to keep both in sync
    setCookie('xgpt_device_id', deviceId, 365);
    localStorage.setItem('xgpt_device_id', deviceId);
    return deviceId;
}

// Session storage key scoped to device
function getSessionStorageKey(): string {
    const deviceId = getDeviceId();
    return `xgpt_sessions_${deviceId}`;
}

// Persist session cookie for login state
function setSessionCookie(loggedIn: boolean) {
    setCookie('xgpt_session', loggedIn ? 'active' : '', loggedIn ? 30 : 0);
    localStorage.setItem('isLoggedIn', loggedIn ? 'true' : 'false');
}

function isSessionActive(): boolean {
    return getCookie('xgpt_session') === 'active' || localStorage.getItem('isLoggedIn') === 'true';
}

// Extract a frame from video as base64 image for AI analysis
function extractVideoFrame(videoSrc: string): Promise<string | null> {
    return new Promise((resolve) => {
        const video = document.createElement('video');
        video.crossOrigin = 'anonymous';
        video.muted = true;
        video.preload = 'auto';

        video.onloadeddata = () => {
            // Seek to 1 second or first frame
            video.currentTime = Math.min(1, video.duration * 0.1);
        };

        video.onseeked = () => {
            try {
                const canvas = document.createElement('canvas');
                canvas.width = Math.min(video.videoWidth, 1280);
                canvas.height = Math.min(video.videoHeight, 720);
                const ctx = canvas.getContext('2d');
                if (ctx) {
                    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
                    const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
                    const base64 = dataUrl.split(',')[1];
                    resolve(base64);
                } else {
                    resolve(null);
                }
            } catch (e) {
                console.error('Frame extraction failed:', e);
                resolve(null);
            } finally {
                URL.revokeObjectURL(videoSrc);
            }
        };

        video.onerror = () => {
            resolve(null);
        };

        // Timeout after 5s
        setTimeout(() => resolve(null), 5000);

        video.src = videoSrc;
    });
}


// --- X LOGO ---
const XLogo = ({ className }: { className?: string }) => (
    <svg
        viewBox="0 0 24 24"
        fill="currentColor"
        xmlns="http://www.w3.org/2000/svg"
        className={className}
    >
        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
);


// --- ANIMATED WELCOME MESSAGE ---
const WelcomeMessage = ({ t, customWelcomeText }: { t: any, customWelcomeText?: string }) => {
    const [text, setText] = useState('');
    const fullText = (customWelcomeText && customWelcomeText.trim() !== '')
        ? customWelcomeText
        : (t.welcome || "Welcome to my X-community");

    useEffect(() => {
        let i = 0;
        const interval = setInterval(() => {
            setText(fullText.slice(0, i + 1));
            i++;
            if (i >= fullText.length) clearInterval(interval);
        }, 1);
        return () => clearInterval(interval);
    }, [fullText]);

    return (
        <div className="flex flex-col items-center justify-center space-y-6 mb-8 animate-in fade-in zoom-in duration-700">
            <div className="relative group cursor-default">
                <div className="p-4 bg-transparent rounded-full relative z-10 transition-transform hover:scale-105 duration-500">
                    <XLogo className="w-24 h-24 text-black dark:text-white drop-shadow-2xl" />
                </div>
            </div>
            <h1 className="text-3xl md:text-5xl font-serif font-medium tracking-tight text-gray-900 dark:text-gray-100 animate-gradient-x text-center px-4" style={{ fontVariant: 'small-caps' }}>
                {text}
            </h1>
        </div>
    );
};

const App: React.FC = () => {
    // State
    const [sessions, setSessions] = useState<ChatSession[]>([]);
    const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
    const [input, setInput] = useState('');
    const [selectedFiles, setSelectedFiles] = useState<SelectedFile[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isThinking, setIsThinking] = useState(false);
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [loggedInUser, setLoggedInUser] = useState<string | null>(null);
    const [sharedData, setSharedData] = useState<{ t: string, c: string, d: string } | null>(null);
    const [activeMode, setActiveMode] = useState<string | null>(null);

    // Theme & Personalization State
    const [themeMode, setThemeMode] = useState<'light' | 'dark' | 'custom'>('dark');
    const [customColor, setCustomColor] = useState('#F0FFF0');
    const [accentColor, setAccentColor] = useState<'Blue' | 'Green' | 'Yellow' | 'Pink' | 'Orange' | 'White'>('White');
    const [uiLanguage, setUiLanguage] = useState<Language>('en');
    const [customWelcomeText, setCustomWelcomeText] = useState('');

    // Voice State
    const [isHologramOpen, setIsHologramOpen] = useState(false);
    const [isListening, setIsListening] = useState(false);
    const [isSpeaking, setIsSpeaking] = useState(false);
    const [voiceTranscript, setVoiceTranscript] = useState('');
    const [lastVoiceResponse, setLastVoiceResponse] = useState('');
    const [availableVoices, setAvailableVoices] = useState<SpeechSynthesisVoice[]>([]);
    const [isVoiceLoading, setIsVoiceLoading] = useState(false);

    // Settings State
    const [showSettings, setShowSettings] = useState(false);
    const [configUrl, setConfigUrl] = useState('');
    const [configModel, setConfigModel] = useState('');
    const [contextLevel, setContextLevel] = useState(128);

    // Admin/Security State
    const [isAdminUnlocked, setIsAdminUnlocked] = useState(false);
    const [showPasswordPrompt, setShowPasswordPrompt] = useState(false);
    const [passwordInput, setPasswordInput] = useState('');

    // Message Deletion State
    const [messageToDelete, setMessageToDelete] = useState<{ sessionId: string, index: number } | null>(null);
    const [isDeletingMessage, setIsDeletingMessage] = useState(false);
    const [deletingIndex, setDeletingIndex] = useState<number | null>(null);

    // Dynamic Thinking State
    const [thinkingHints, setThinkingHints] = useState<string[]>(['Thinking...']);
    const [currentHintIndex, setCurrentHintIndex] = useState(0);
    const [isVideoProcessing, setIsVideoProcessing] = useState(false);

    // Voice name state
    const [voiceName, setVoiceName] = useState<string>('default');

    // Refs
    const abortControllerRef = useRef<AbortController | null>(null);
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const bottomRef = useRef<HTMLDivElement>(null);
    const chatContainerRef = useRef<HTMLDivElement>(null);
    const recognitionRef = useRef<any>(null);

    const scrollToBottom = () => {
        requestAnimationFrame(() => {
            if (chatContainerRef.current) {
                const el = chatContainerRef.current;
                const distanceFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
                // Only auto-scroll if user is near the bottom (within 200px)
                // This allows user to scroll up/opposite direction during streaming
                if (distanceFromBottom < 200) {
                    el.scrollTo({
                        top: el.scrollHeight,
                        behavior: 'smooth'
                    });
                }
            }
        });
    };

    // Stub functions to prevent white-screen crashes
    const speakText = (text: string) => {
        if ('speechSynthesis' in window) {
            window.speechSynthesis.cancel();
            const utterance = new SpeechSynthesisUtterance(text);
            const voices = window.speechSynthesis.getVoices();
            const selectedVoice = voices.find(v => v.name === voiceName);
            if (selectedVoice) utterance.voice = selectedVoice;
            setIsSpeaking(true);
            utterance.onend = () => setIsSpeaking(false);
            window.speechSynthesis.speak(utterance);
        }
    };

    const startHologramMode = () => {
        setIsHologramOpen(true);
    };

    useEffect(() => {
        // Handle persistent login state via BOTH cookie and localStorage
        if (isSessionActive()) {
            setIsAuthenticated(true);
        }

        // Ensure device ID exists on load
        getDeviceId();

        // Handle Shared Link — read from hash fragment (#s=...)
        const parseShareHash = () => {
            const hash = window.location.hash;
            if (hash.startsWith('#s=')) {
                try {
                    const encoded = hash.slice(3); // remove '#s='
                    // Decode base64 to binary string, then to UTF-8 bytes (handles Bangla/Unicode)
                    const binaryStr = atob(encoded);
                    const utf8Bytes = new Uint8Array(binaryStr.length);
                    for (let i = 0; i < binaryStr.length; i++) {
                        utf8Bytes[i] = binaryStr.charCodeAt(i);
                    }
                    const jsonStr = new TextDecoder().decode(utf8Bytes);
                    const decoded = JSON.parse(jsonStr);
                    setSharedData(decoded);
                } catch (e) {
                    console.error("Failed to decode share link", e);
                }
            }
        };
        parseShareHash();

        // Also listen for hash changes (SPA navigation)
        const handleHashChange = () => parseShareHash();
        window.addEventListener('hashchange', handleHashChange);

        // Trap history — but ONLY if not a share link (don't break #s= links)
        if (!window.location.hash.startsWith('#s=')) {
            window.history.pushState(null, document.title, window.location.href);
        }
        const handlePopState = () => {
            if (!window.location.hash.startsWith('#s=')) {
                window.history.pushState(null, document.title, window.location.href);
            }
        };
        window.addEventListener('popstate', handlePopState);

        // Load sessions from device-scoped storage (cookie + localStorage)
        const storageKey = getSessionStorageKey();
        const savedSessions = localStorage.getItem(storageKey);
        if (savedSessions) {
            try {
                setSessions(JSON.parse(savedSessions));
            } catch (e) {
                console.error('Failed to parse saved sessions', e);
            }
        } else {
            // Migration: load from old key if exists
            const oldSessions = localStorage.getItem('deepseek-sessions');
            if (oldSessions) {
                try {
                    const parsed = JSON.parse(oldSessions);
                    setSessions(parsed);
                    localStorage.setItem(storageKey, oldSessions);
                } catch (e) {
                    console.error('Failed to migrate old sessions', e);
                }
            }
        }
        const savedTheme = localStorage.getItem('themeMode');
        const savedColor = localStorage.getItem('customColor');

        if (savedColor) setCustomColor(savedColor);

        if (savedTheme === 'dark') {
            setThemeMode('dark');
            document.documentElement.classList.add('dark');
        } else if (savedTheme === 'custom') {
            setThemeMode('custom');
            document.documentElement.classList.remove('dark');
        } else if (savedTheme === 'light') {
            setThemeMode('light');
            document.documentElement.classList.remove('dark');
        } else {
            setThemeMode('dark');
            document.documentElement.classList.add('dark');
        }
        const { model, contextSize } = getStoredConfig();
        setConfigUrl(localStorage.getItem('ollama_url') || API_BASE_URL);
        setConfigModel(model);
        setContextLevel(contextSize || 128);

        const savedAccent = localStorage.getItem('accentColor') as any;
        if (savedAccent) setAccentColor(savedAccent);

        const savedLang = localStorage.getItem('uiLanguage') as any;
        if (savedLang) setUiLanguage(savedLang);

        const savedWelcomeText = localStorage.getItem('customWelcomeText');
        if (savedWelcomeText) setCustomWelcomeText(savedWelcomeText);

        const savedVoice = localStorage.getItem('voiceName');
        if (savedVoice) setVoiceName(savedVoice);

        if (window.innerWidth < 768) {
            setIsSidebarOpen(false);
        }

        // Initialize Speech Recognition
        if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
            const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
            recognitionRef.current = new SpeechRecognition();
            recognitionRef.current.continuous = false;
            recognitionRef.current.interimResults = true;
            recognitionRef.current.lang = 'bn-BD'; // Bengali (Bangladesh)

            recognitionRef.current.onresult = (event: any) => {
                let interimTranscript = '';
                let finalTranscript = '';

                for (let i = event.resultIndex; i < event.results.length; ++i) {
                    if (event.results[i].isFinal) {
                        finalTranscript += event.results[i][0].transcript;
                    } else {
                        interimTranscript += event.results[i][0].transcript;
                    }
                }

                setVoiceTranscript(finalTranscript || interimTranscript);

                if (finalTranscript) {
                    setIsListening(false);
                    handleVoiceSubmit(finalTranscript);
                }
            };

            recognitionRef.current.onerror = (event: any) => {
                console.error("Speech recognition error", event.error);
                setIsListening(false);
                if (event.error === 'not-allowed') {
                    alert("Microphone access denied. Please allow microphone permissions in your browser settings.");
                }
            };

            recognitionRef.current.onend = () => {
                if (isHologramOpen && !isSpeaking) {
                    setIsListening(false);
                } else {
                    setIsListening(false);
                }
            };
        }

        // Load Voices
        const updateVoices = () => {
            const voices = window.speechSynthesis.getVoices();
            setAvailableVoices(voices);
        };
        window.speechSynthesis.onvoiceschanged = updateVoices;
        updateVoices();

        return () => {
            window.speechSynthesis.removeEventListener('voiceschanged', updateVoices);
            window.removeEventListener('popstate', handlePopState);
            window.removeEventListener('hashchange', handleHashChange);
        };
    }, []);

    // Hint cycle effect
    useEffect(() => {
        if (isThinking && thinkingHints.length > 1) {
            const interval = setInterval(() => {
                setCurrentHintIndex((prev) => (prev + 1) % thinkingHints.length);
            }, 2000);
            return () => clearInterval(interval);
        }
    }, [isThinking, thinkingHints]);

    // Effect to manage listening state based on speaking state in Hologram mode
    useEffect(() => {
        if (isHologramOpen && !isSpeaking && !isLoading) {
            const timeout = setTimeout(() => {
                if (recognitionRef.current && !isListening) {
                    try {
                        recognitionRef.current.start();
                        setIsListening(true);
                        setVoiceTranscript('');
                    } catch (e) {
                        // Already started or error
                    }
                }
            }, 500);
            return () => clearTimeout(timeout);
        } else if (!isHologramOpen || isSpeaking) {
            if (recognitionRef.current) {
                recognitionRef.current.stop();
                setIsListening(false);
            }
        }
    }, [isHologramOpen, isSpeaking, isLoading]);


    useEffect(() => {
        const storageKey = getSessionStorageKey();
        localStorage.setItem(storageKey, JSON.stringify(sessions));
        // Also keep old key for backward compat
        localStorage.setItem('deepseek-sessions', JSON.stringify(sessions));
    }, [sessions]);


    // Apply custom background
    useEffect(() => {
        const root = document.getElementById('root');
        if (root) {
            if (themeMode === 'custom') {
                document.body.style.backgroundColor = customColor;
                root.style.backgroundColor = customColor;
            } else {
                document.body.style.backgroundColor = '';
                root.style.backgroundColor = '';
            }
        }
    }, [themeMode, customColor]);

    // Apply accent color CSS variables
    useEffect(() => {
        const colors = {
            Blue: '#3b82f6',
            Green: '#22c55e',
            Yellow: '#eab308',
            Pink: '#ec4899',
            Orange: '#f97316',
            White: '#ffffff'
        };
        const color = colors[accentColor] || colors.Blue;
        document.documentElement.style.setProperty('--accent-color', color);
        document.documentElement.style.setProperty('--accent-color-rgb',
            accentColor === 'Blue' ? '59, 130, 246' :
                accentColor === 'Green' ? '34, 197, 94' :
                    accentColor === 'Yellow' ? '234, 179, 8' :
                        accentColor === 'Pink' ? '236, 72, 153' :
                            accentColor === 'White' ? '255, 255, 255' : '249, 115, 22');
        localStorage.setItem('accentColor', accentColor);
    }, [accentColor]);

    useEffect(() => {
        localStorage.setItem('uiLanguage', uiLanguage);
    }, [uiLanguage]);

    const t = translations[uiLanguage];

    // Persist custom welcome text
    useEffect(() => {
        localStorage.setItem('customWelcomeText', customWelcomeText);
    }, [customWelcomeText]);

    // REAL-TIME SESSION TRANSLATION EFFECT
    useEffect(() => {
        if (!currentSessionId || sessions.length === 0 || isLoading) return;

        const currentSession = sessions.find(s => s.id === currentSessionId);
        if (!currentSession || currentSession.messages.length === 0) return;

        // Triggers translation for current session when language changes
        const performTranslation = async () => {
            console.log(`[i18n] Translating session to: ${uiLanguage}`);
            // We'll append a hidden instruction to the LLM to translate the entire context if needed
            // But for true "real-time" of existing messages, we just let FUTURE messages follow the lang
            // IF the user specifically wants existing messages translated, we'd need a separate logic.
            // Requirement says: "soh jate oi language a hoia jay real time"
            // To achieve this, we can't easily translate local strings, but we can update UI instantly.
        };
        performTranslation();
    }, [uiLanguage]);

    // Voice features removed as per request

    const handleSaveSettings = () => {
        localStorage.setItem('ollama_url', configUrl);
        localStorage.setItem('ollama_model', configModel);
        localStorage.setItem('ollama_context', contextLevel.toString());

        localStorage.setItem('themeMode', themeMode);
        localStorage.setItem('customColor', customColor);

        if (themeMode === 'dark') {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }

        setShowSettings(false);
        setIsAdminUnlocked(false);
    };

    const handleClearAllChats = () => {
        if (window.confirm('Are you sure you want to delete all chat history? This cannot be undone.')) {
            setSessions([]);
            setCurrentSessionId(null);
            localStorage.removeItem('deepseek-sessions');
            localStorage.removeItem(getSessionStorageKey());
            setShowSettings(false);
        }
    };

    const handleAdminUnlock = () => {
        if (passwordInput === 'root') {
            setIsAdminUnlocked(true);
            setShowPasswordPrompt(false);
            setPasswordInput('');
        } else {
            alert("Incorrect password");
            setPasswordInput('');
        }
    };

    const toggleTheme = () => {
        if (themeMode === 'light') {
            setThemeMode('dark');
            document.documentElement.classList.add('dark');
            localStorage.setItem('themeMode', 'dark');
        } else if (themeMode === 'dark') {
            setThemeMode('custom');
            document.documentElement.classList.remove('dark');
            localStorage.setItem('themeMode', 'custom');
        } else {
            setThemeMode('light');
            document.documentElement.classList.remove('dark');
            localStorage.setItem('themeMode', 'light');
        }
    };

    const handleVoiceClick = () => {
        setIsVoiceLoading(true);
        setTimeout(() => {
            setIsVoiceLoading(false);
            startHologramMode();
        }, 1200);
    };

    const handleContentClick = () => {
        if (isSidebarOpen && window.innerWidth < 768) {
            setIsSidebarOpen(false);
        }
        if (isSidebarOpen && window.innerWidth >= 768) {
            setIsSidebarOpen(false);
        }
    };

    useEffect(() => {
        if (textareaRef.current) {
            textareaRef.current.style.height = 'auto';
            textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 100)}px`;
        }
    }, [input]);

    useEffect(() => {
        scrollToBottom();
    }, [sessions, currentSessionId, isLoading]);

    const getCurrentSession = () => sessions.find((s) => s.id === currentSessionId);
    const currentMessages = getCurrentSession()?.messages || [];
    const isWelcomeScreen = currentMessages.length === 0;

    const handleNewChat = () => {
        setCurrentSessionId(null);
        setActiveMode(null);
        setInput('');
        if (window.innerWidth < 768) setIsSidebarOpen(false);
        // Scroll to bottom after state change
        setTimeout(scrollToBottom, 100);
    };

    const handleSelectSession = (id: string) => {
        setCurrentSessionId(id);
        // FORCE SCROLL TO BOTTOM ON SELECT
        setTimeout(scrollToBottom, 300);
    };

    const handleDeleteSession = (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        const newSessions = sessions.filter((s) => s.id !== id);
        setSessions(newSessions);
        if (currentSessionId === id) {
            setCurrentSessionId(null);
        }
    };

    const createSessionIfNeeded = (firstMessage: string) => {
        if (currentSessionId) return currentSessionId;

        const newId = uuidv4();
        const newSession: ChatSession = {
            id: newId,
            title: firstMessage.slice(0, 30) + (firstMessage.length > 30 ? '...' : ''),
            messages: [],
            createdAt: Date.now(),
        };
        setSessions(prev => [newSession, ...prev]);
        setCurrentSessionId(newId);
        return newId;
    };

    const stopGeneration = () => {
        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
            abortControllerRef.current = null;
            setIsLoading(false);
            setIsThinking(false);
        }
        if (isSpeaking) {
            window.speechSynthesis.cancel();
            setIsSpeaking(false);
        }
    };

    const handleEditMessage = async (messageIndex: number, newContent: string) => {
        if (!currentSessionId || isLoading) return;
        handleSubmit(undefined, newContent, messageIndex);
    };

    const handleVoiceSubmit = async (voiceText: string, audioBase64?: string, duration?: number) => {
        if (!voiceText.trim() && !audioBase64) return;
        setLastVoiceResponse('');
        const finalContent = voiceText.trim() ? voiceText : 'Analyzed voice input...';
        await handleSubmit(undefined, finalContent, undefined, audioBase64, duration);
    };

    const handleDeleteMessage = (sessionId: string, index: number) => {
        setMessageToDelete({ sessionId, index });
    };

    const confirmDeleteMessage = () => {
        if (!messageToDelete) return;

        const targetSessionId = messageToDelete.sessionId;
        const targetIndex = messageToDelete.index;

        // 1. First hide the prompt (pop up)
        setMessageToDelete(null);

        // 2. Add a tiny delay so the modal can fade out before the "smoke" removal animation starts
        setTimeout(() => {
            setIsDeletingMessage(true);
            setDeletingIndex(targetIndex);

            // 3. Keep the smoke animation for 1.2s then remove from state
            setTimeout(() => {
                setSessions(prev => prev.map(session => {
                    if (session.id === targetSessionId) {
                        const newMessages = [...session.messages];
                        if (newMessages[targetIndex].role === 'user') {
                            const deleteCount = (newMessages[targetIndex + 1]?.role === 'assistant' ? 2 : 1);
                            newMessages.splice(targetIndex, deleteCount);
                        } else {
                            newMessages.splice(targetIndex, 1);
                        }
                        return { ...session, messages: newMessages };
                    }
                    return session;
                }));
                setIsDeletingMessage(false);
                setDeletingIndex(null);
            }, 1200);
        }, 300); // Wait for modal transition
    };

    const handleSubmit = async (e?: React.FormEvent, overrideInput?: string, targetEditIndex?: number, overrideAudioUrl?: string, overrideAudioDuration?: number) => {
        e?.preventDefault();

        if (isLoading) {
            stopGeneration();
            return;
        }

        const textToSend = overrideInput !== undefined ? overrideInput : input;

        // Find existing images if editing
        let existingImages: string[] = [];
        if (targetEditIndex !== undefined && currentSessionId) {
            const session = sessions.find(s => s.id === currentSessionId);
            if (session && session.messages[targetEditIndex]) {
                existingImages = session.messages[targetEditIndex].images || [];
            }
        }

        const hasFiles = selectedFiles.length > 0 || existingImages.length > 0 || !!overrideAudioUrl;

        if (!textToSend.trim() && !hasFiles) return;

        let userMessageContent = textToSend.trim();
        if (!userMessageContent && hasFiles) {
            const hasImages = selectedFiles.some(f => f.isImage);
            const hasVideos = selectedFiles.some(f => f.isVideo);
            if (hasImages && hasVideos) {
                userMessageContent = 'Analyze these images and videos';
            } else if (overrideAudioUrl) {
                userMessageContent = 'Analyze this audio';
            } else if (hasImages) {
                userMessageContent = 'Analyze this image';
            } else if (hasVideos) {
                userMessageContent = 'Analyze this video';
            } else {
                userMessageContent = 'Analyze this file';
            }
        }

        // Extract dynamic hints based on input
        const generateHints = (txt: string) => {
            const lower = txt.toLowerCase();
            const hints = ["Thinking..."];
            const isDeep = txt.length > 50;

            // Define topics as milestone headings
            const topics = [
                {
                    keys: ['ai', 'intelligence', 'model', 'transformer', 'gpt', 'neural', 'machine learning', 'deep learning'],
                    headers: ["Neural Synthesis", "Inference Modeling", "Transformer Architecture", "Context Attention", "Weights Optimization", "Alignment Synthesis"]
                },
                {
                    keys: ['code', 'programming', 'bug', 'function', 'script', 'react', 'python', 'javascript', 'html', 'css'],
                    headers: ["Logic Mapping", "Syntax Parsing", "Module Assessment", "Heuristic Optimization", "Snippet Construction", "Compiling Logic"]
                },
                {
                    keys: ['video', 'youtube', 'mp4', 'mov', 'frame', 'analyze', 'processing', 'video'],
                    headers: ["Temporal Analysis", "Frame Extraction", "Object Synthesis", "Optical Evaluation", "Visual Encoding", "Scene Mapping"]
                },
                {
                    keys: ['math', 'calculate', 'equation', 'algorithm', 'science', 'physics', 'formula'],
                    headers: ["Metric Evaluation", "Formula Parsing", "Statistical Mining", "Numerical Solving", "Metric Verification"]
                }
            ];

            // 1. Handle short greetings/messages
            if (lower === 'hi' || lower === 'hello' || lower === 'hey' || txt.length < 15) {
                return ["Thinking..."];
            }

            // 2. Find matching topic
            const match = topics.find(t => t.keys.some(k => lower.includes(k)));
            if (match) {
                hints.push(...match.headers);
            } else if (isDeep) {
                // 3. Fallback for deep prompts that aren't specifically categorized
                hints.push("Information Retrieval", "Context Analysis", "Synthesizing Response", "Refining Results", "Final Preparation");
            } else {
                hints.push("Analyzing context...", "Drafting response...");
            }

            return hints;
        };

        setThinkingHints(generateHints(textToSend));
        setCurrentHintIndex(0);

        // Collect base64 images from selected image files AND preserved images
        const imageBase64List = [
            ...existingImages,
            ...selectedFiles.filter(f => f.isImage).map(f => f.base64)
        ];

        // For video files, extract a frame as image for AI analysis
        const videoFiles = selectedFiles.filter(f => f.isVideo);
        if (videoFiles.length > 0) setIsVideoProcessing(true);

        for (const vf of videoFiles) {
            try {
                // Extract frame from video for AI vision analysis
                const frameBase64 = await extractVideoFrame(vf.preview);
                if (frameBase64) {
                    imageBase64List.push(frameBase64);
                }
                userMessageContent += `\n\n[Video attached: ${vf.file.name}]`;
            } catch {
                userMessageContent += `\n\n[Video attached: ${vf.file.name} - frame extraction failed]`;
            }
        }
        setIsVideoProcessing(false);

        setInput('');
        setSelectedFiles([]);

        if (textareaRef.current) {
            textareaRef.current.style.height = 'auto';
            textareaRef.current.style.height = '40px';
        }

        const sessionId = createSessionIfNeeded(userMessageContent);
        const userMessage: Message = {
            role: 'user',
            content: userMessageContent,
            ...(imageBase64List.length > 0 ? { images: imageBase64List } : {}),
            ...(overrideAudioUrl ? { audio: { url: overrideAudioUrl, duration: overrideAudioDuration || 0 } } : {}),
            ...(videoFiles.length > 0 ? { video: { url: videoFiles[0].preview, name: videoFiles[0].file.name } } : {})
        };

        setSessions(prev => prev.map(session => {
            if (session.id === sessionId) {
                if (targetEditIndex !== undefined) {
                    const newMessages = [...session.messages];
                    newMessages[targetEditIndex] = userMessage; // update user message
                    // Create or blank out the immediate assistant response
                    if (targetEditIndex + 1 < newMessages.length) {
                        newMessages[targetEditIndex + 1] = { role: 'assistant', content: '' };
                    } else {
                        newMessages.push({ role: 'assistant', content: '' });
                    }
                    return { ...session, messages: newMessages };
                } else {
                    return { ...session, messages: [...session.messages, userMessage] };
                }
            }
            return session;
        }));

        setIsLoading(true);
        setIsThinking(true);
        abortControllerRef.current = new AbortController();

        let botResponse = '';

        try {
            const currentSession = sessions.find(s => s.id === sessionId) || { messages: [] };

            // Context up to the point of edit for generation
            // If editing, provide context UP TO the edited user message
            let apiMessages = [];
            if (targetEditIndex !== undefined) {
                apiMessages = currentSession.messages.slice(0, targetEditIndex);
                apiMessages.push(userMessage);
            } else {
                apiMessages = [...currentSession.messages, userMessage];
            }

            await streamChatCompletion(
                apiMessages,
                (chunk) => {
                    if (botResponse === '') {
                        setIsThinking(false);
                    }
                    botResponse += chunk;
                    scrollToBottom();
                    setSessions(prev => prev.map(s => {
                        if (s.id === sessionId) {
                            if (targetEditIndex !== undefined) {
                                const newMessages = [...s.messages];
                                newMessages[targetEditIndex + 1] = { role: 'assistant', content: botResponse };
                                return { ...s, messages: newMessages };
                            } else {
                                const lastMsg = s.messages[s.messages.length - 1];
                                const otherMsgs = s.messages.slice(0, -1);

                                if (lastMsg.role === 'user') {
                                    return { ...s, messages: [...s.messages, { role: 'assistant', content: botResponse }] };
                                } else {
                                    return { ...s, messages: [...otherMsgs, { role: 'assistant', content: botResponse }] };
                                }
                            }
                        }
                        return s;
                    }));

                    if (isHologramOpen) {
                        setLastVoiceResponse(botResponse);
                    }
                },
                abortControllerRef.current.signal,
                uiLanguage
            );

            if (isHologramOpen) {
                speakText(botResponse);
            }

        } catch (error: any) {
            console.error("Chat error details:", error);
            const errorMsg = error.message || 'Failed to fetch';
            const displayMessage = `**System Failure:** \n\n${errorMsg}\n\nCheck connection settings.`;

            setSessions(prev => prev.map(s => {
                if (s.id === sessionId) {
                    const lastMsg = s.messages[s.messages.length - 1];
                    if (lastMsg.role === 'assistant') {
                        return { ...s, messages: [...s.messages.slice(0, -1), { role: 'assistant', content: lastMsg.content + '\n\n' + displayMessage }] };
                    } else {
                        return { ...s, messages: [...s.messages, { role: 'assistant', content: displayMessage }] };
                    }
                }
                return s;
            }));
            if (isHologramOpen) speakText("System error occurred.");
        } finally {
            setIsLoading(false);
            setIsThinking(false);
            abortControllerRef.current = null;
            scrollToBottom();
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSubmit();
        }
    };

    const handleFilesSelected = (files: SelectedFile[]) => {
        setSelectedFiles(files);
    };

    const handleRemoveFile = (index: number) => {
        setSelectedFiles(prev => prev.filter((_, i) => i !== index));
    };

    const renderInputArea = (isWelcome: boolean) => (
        <div className={`w-full max-w-xl mx-auto relative z-20 transition-all duration-500 px-2 sm:px-0 ${isWelcome ? 'transform' : ''}`} onClick={e => e.stopPropagation()}>

            <div className={`
                relative flex flex-col w-full bg-white dark:bg-[#2f2f2f] rounded-3xl border border-gray-200 dark:border-[#424242] shadow-xl transition-all duration-300
                focus-within:ring-1 focus-within:ring-gray-300 dark:focus-within:ring-[#555]
                ${isWelcome ? 'p-1' : 'p-0'}
            `}>

                {/* File Preview Bar - above input */}
                <FilePreviewBar files={selectedFiles} onRemove={handleRemoveFile} />

                {/* Text Input Area */}
                <div className="flex items-end gap-1 sm:gap-1.5 p-1.5 pl-2">
                    {/* + File Upload Button */}
                    <div className="flex items-center mb-1">
                        <FileUpload
                            selectedFiles={selectedFiles}
                            onFilesSelected={handleFilesSelected}
                            onRemoveFile={handleRemoveFile}
                            disabled={isLoading}
                        />
                    </div>

                    <textarea
                        ref={textareaRef}
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder="Ask anything"
                        className="w-full py-2.5 bg-transparent border-none outline-none resize-none text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-[#6b7280] text-[15px] min-h-[40px] max-h-[100px] font-sans overflow-y-auto"
                        rows={1}
                    />

                    <button
                        onClick={() => handleSubmit()}
                        disabled={isLoading || (!input.trim() && selectedFiles.length === 0)}
                        className={`w-8 h-8 rounded-full transition-all duration-300 flex items-center justify-center flex-shrink-0 mb-[2px] mr-1 text-white dark:text-black hover:opacity-80 scale-100 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed`}
                        style={{ backgroundColor: 'var(--accent-color)' }}
                    >
                        {isLoading ? (
                            <Loader2 size={16} className="animate-spin" />
                        ) : (
                            <ArrowUp size={18} strokeWidth={2.5} />
                        )}
                    </button>
                </div>
            </div>

        </div>
    );

    const handleLoginSuccess = (validUrl: string) => {
        setSessionCookie(true);
        localStorage.setItem('ollama_url', validUrl);
        localStorage.setItem('ollama_model', 'gemini-3-flash-preview');

        setConfigUrl(validUrl);
        setConfigModel('gemini-3-flash-preview');
        setIsAuthenticated(true);
    };

    const handleLogout = () => {
        setSessionCookie(false);
        setIsAuthenticated(false);
    };

    // Shared view copy state
    const [sharedCopied, setSharedCopied] = useState(false);
    const handleCopySharedResponse = () => {
        if (sharedCopied) return;
        const text = sharedData?.c || '';
        const copyViaTextarea = () => {
            const ta = document.createElement('textarea');
            ta.value = text;
            ta.style.cssText = 'position:fixed;left:-9999px;top:-9999px;opacity:0;';
            document.body.appendChild(ta);
            ta.focus();
            ta.select();
            try { document.execCommand('copy'); } catch (_) { }
            document.body.removeChild(ta);
        };
        if (navigator.clipboard && window.isSecureContext) {
            navigator.clipboard.writeText(text).catch(copyViaTextarea);
        } else {
            copyViaTextarea();
        }
        setSharedCopied(true);
        setTimeout(() => setSharedCopied(false), 2000);
    };

    if (sharedData) {
        // Force dark mode for shared view
        if (!document.documentElement.classList.contains('dark')) {
            document.documentElement.classList.add('dark');
        }
        return (
            <div className="min-h-screen bg-[#171717] flex flex-col items-center font-sans selection:bg-blue-500 selection:text-white overflow-y-auto">
                {/* Sticky header — no logo, just text */}
                <header className="sticky top-0 z-50 w-full bg-[#171717]/90 backdrop-blur-xl border-b border-white/5">
                    <div className="w-full max-w-3xl mx-auto flex items-center justify-between px-4 md:px-10 py-4">
                        <div>
                            <h1 className="text-xl font-bold text-white leading-tight tracking-tight">X-GPT Shared</h1>
                            <p className="text-[11px] text-gray-500 font-medium uppercase tracking-widest">{new Date(sharedData.d).toLocaleDateString()}</p>
                        </div>
                        <button
                            onClick={() => { window.location.hash = ''; window.location.href = window.location.origin; }}
                            className="px-5 py-2.5 bg-white text-black rounded-full font-bold text-sm hover:scale-105 active:scale-95 transition-all shadow-xl"
                        >
                            Try X-GPT
                        </button>
                    </div>
                </header>

                {/* Scrollable content area */}
                <div className="w-full max-w-3xl flex flex-col gap-8 px-4 md:px-10 py-8 animate-in fade-in slide-in-from-bottom-10 duration-700">
                    <main className="bg-[#212121] rounded-[2.5rem] p-8 md:p-12 shadow-2xl border border-white/5 relative overflow-hidden group">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 blur-3xl rounded-full" />
                        <h2 className="text-3xl md:text-4xl font-black text-white mb-8 leading-tight tracking-tighter">
                            {sharedData.t}
                        </h2>
                        <div className="prose prose-invert prose-p:leading-relaxed prose-pre:bg-[#0d0d0d] max-w-none text-gray-300 text-base md:text-lg">
                            <ReactMarkdown
                                components={{
                                    code({ node, className, children, ...props }) {
                                        const match = /language-(\w+)/.exec(className || '');
                                        return !match ? (
                                            <code className="bg-gray-800 text-red-500 rounded px-1.5 py-0.5" {...props}>{children}</code>
                                        ) : (
                                            <div className="my-6 rounded-2xl overflow-hidden shadow-2xl">
                                                <div className="bg-black/80 px-4 py-2 border-b border-white/5 flex items-center justify-between">
                                                    <span className="text-[10px] uppercase font-black tracking-widest text-gray-500">{match[1]}</span>
                                                </div>
                                                <pre className="p-6 bg-[#0d0d0d] overflow-x-auto text-sm">
                                                    <code className={className} {...props}>{children}</code>
                                                </pre>
                                            </div>
                                        );
                                    }
                                }}
                            >
                                {sharedData.c}
                            </ReactMarkdown>
                        </div>

                        {/* Copy response button at bottom */}
                        <div className="mt-10 pt-6 border-t border-white/5 flex justify-center">
                            <button
                                onClick={handleCopySharedResponse}
                                className={`flex items-center gap-2.5 px-6 py-3 rounded-full font-semibold text-sm transition-all duration-300 shadow-lg ${sharedCopied
                                    ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                                    : 'bg-white/5 text-gray-400 border border-white/10 hover:bg-white/10 hover:text-white hover:border-white/20 hover:scale-105 active:scale-95'
                                    }`}
                            >
                                {sharedCopied ? (
                                    <><Check size={18} strokeWidth={3} /><span>Copied!</span></>
                                ) : (
                                    <><Copy size={18} /><span>Copy Response</span></>
                                )}
                            </button>
                        </div>
                    </main>
                </div>
            </div>
        );
    }

    if (!isAuthenticated) {
        return <Login onLoginSuccess={handleLoginSuccess} />;
    }

    return (
        <div className={`flex h-screen overflow-hidden font-sans text-sm transition-colors duration-300 ${themeMode === 'custom' ? '' : 'bg-[#f8f8f8] dark:bg-[#212121]'} text-gray-900 dark:text-gray-100`}>

            {/* Main Wrapper */}

            {/* Shared Context Modal */}
            {sharedData && (
                <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/80 px-4 animate-in fade-in duration-300 backdrop-blur-md" onClick={() => setSharedData(null)}>
                    <div className="bg-white dark:bg-[#1a1a1a] rounded-2xl shadow-2xl p-6 sm:p-8 w-full max-w-lg border border-white/10" onClick={e => e.stopPropagation()}>
                        <div className="flex flex-col items-center gap-5 text-center">
                            <div className="p-4 bg-[var(--accent-color)]/20 rounded-full" style={{ color: 'var(--accent-color)' }}>
                                <ExternalLink size={32} />
                            </div>
                            <div>
                                <h3 className="text-xl font-bold mb-2">Import Shared Conversation</h3>
                                <p className="text-sm text-gray-500 dark:text-gray-400">Someone shared a conversation with you. Would you like to import it into your history?</p>
                            </div>
                            <div className="w-full bg-gray-50 dark:bg-black/20 p-4 rounded-xl border border-gray-100 dark:border-white/5 text-left max-h-40 overflow-y-auto mb-2">
                                <p className="text-xs font-mono opacity-70 mb-2 uppercase tracking-tight">Preview content:</p>
                                <p className="text-sm italic">"{sharedData.c.slice(0, 150)}..."</p>
                            </div>
                            <div className="flex gap-3 w-full">
                                <button
                                    onClick={() => setSharedData(null)}
                                    className="flex-1 px-4 py-3 rounded-xl border border-gray-200 dark:border-white/10 hover:bg-gray-100 dark:hover:bg-white/5 transition-colors font-medium"
                                >
                                    Dismiss
                                </button>
                                <button
                                    onClick={() => {
                                        const newSession: ChatSession = {
                                            id: uuidv4(),
                                            title: sharedData.t || 'Shared Chat',
                                            messages: [
                                                { role: 'user', content: sharedData.c },
                                                { role: 'assistant', content: sharedData.d }
                                            ],
                                            createdAt: Date.now()
                                        };
                                        setSessions(prev => [newSession, ...prev]);
                                        setCurrentSessionId(newSession.id);
                                        setSharedData(null);
                                        window.location.hash = '';
                                    }}
                                    className="flex-1 bg-[var(--accent-color)] text-white dark:text-black hover:opacity-90 px-4 py-3 rounded-xl font-bold transition-all shadow-lg shadow-[var(--accent-color)]/20"
                                >
                                    Import Chat
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Message Delete Confirmation Modal */}
            {messageToDelete && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200" onClick={() => setMessageToDelete(null)}>
                    <div className="bg-white dark:bg-[#1a1a1a] rounded-3xl shadow-2xl p-8 w-full max-w-sm border border-gray-100 dark:border-white/10" onClick={e => e.stopPropagation()}>
                        <div className="flex flex-col items-center gap-4 mb-6">
                            <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center text-red-500">
                                <Trash2 size={32} />
                            </div>
                            <div className="text-center">
                                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Are you sure?</h3>
                                <p className="text-gray-500 dark:text-gray-400 text-sm">
                                    This will permanently delete this prompt and its response. This action cannot be undone.
                                </p>
                            </div>
                        </div>
                        <div className="flex gap-3 mt-4">
                            <button
                                onClick={() => setMessageToDelete(null)}
                                className="flex-1 px-4 py-3 text-sm font-medium hover:bg-gray-100 dark:hover:bg-white/5 rounded-2xl transition-all border border-gray-100 dark:border-white/10"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={confirmDeleteMessage}
                                className="flex-1 bg-red-600 text-white px-4 py-3 rounded-2xl text-sm font-bold hover:bg-red-700 transition-all shadow-lg shadow-red-500/20 active:scale-95"
                            >
                                Delete
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Password Prompt Modal */}
            {showPasswordPrompt && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 p-4 animate-in fade-in duration-200 backdrop-blur-sm" onClick={() => setShowPasswordPrompt(false)}>
                    <div className="bg-white dark:bg-[#1a1a1a] rounded-2xl shadow-2xl p-8 w-full max-w-sm border border-red-500/20" onClick={e => e.stopPropagation()}>
                        <div className="flex flex-col items-center gap-4 mb-6">
                            <div className="p-4 bg-red-500/10 rounded-full text-red-500">
                                <Lock size={32} />
                            </div>
                            <h3 className="text-xl font-bold text-center">Root Access Required</h3>
                        </div>
                        <input
                            type="password"
                            value={passwordInput}
                            onChange={(e) => setPasswordInput(e.target.value)}
                            placeholder="Enter Root Password"
                            className="w-full p-4 mb-4 rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-black/40 focus:ring-2 focus:ring-red-500 outline-none text-center font-mono tracking-widest text-lg"
                            autoFocus
                        />
                        <div className="flex justify-stretch gap-3">
                            <button onClick={() => setShowPasswordPrompt(false)} className="flex-1 px-4 py-3 text-sm hover:bg-gray-100 dark:hover:bg-white/5 rounded-xl font-medium transition-colors">Cancel</button>
                            <button onClick={handleAdminUnlock} className="flex-1 bg-red-600 text-white px-4 py-3 rounded-xl text-sm font-bold hover:bg-red-700 transition-colors shadow-lg shadow-red-500/20">Unlock</button>
                        </div>
                    </div>
                </div>
            )}

            <SettingsModal
                isOpen={showSettings}
                onClose={() => setShowSettings(false)}
                themeMode={themeMode}
                setThemeMode={setThemeMode}
                accentColor={accentColor}
                setAccentColor={setAccentColor}
                uiLanguage={uiLanguage}
                setUiLanguage={setUiLanguage}
                contextLevel={contextLevel}
                setContextLevel={setContextLevel}
                customWelcomeText={customWelcomeText}
                setCustomWelcomeText={setCustomWelcomeText}
                onClearHistory={handleClearAllChats}
                t={t}
            />

            {/* Sidebar */}
            <Sidebar
                isOpen={isSidebarOpen}
                toggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
                sessions={sessions}
                currentSessionId={currentSessionId}
                onSelectSession={handleSelectSession}
                onNewChat={handleNewChat}
                onDeleteSession={handleDeleteSession}
                isDarkMode={themeMode === 'dark'}
                toggleTheme={toggleTheme}
                onOpenSettings={() => setShowSettings(true)}
                onLogout={handleLogout}
                onSelectMode={(modeId) => {
                    setActiveMode(modeId);
                    if (window.innerWidth < 768) setIsSidebarOpen(false);
                }}
                t={t}
            />

            {/* Main Chat Area */}
            <div
                className="flex-1 flex flex-col relative h-full"
                onClick={handleContentClick}
            >

                {/* Mobile Header */}
                <div className="flex md:hidden items-center p-3 border-b border-white/5 bg-transparent z-10 sticky top-0">
                    <button onClick={(e) => { e.stopPropagation(); setIsSidebarOpen(true); }} className="p-2 rounded-md hover:bg-black/5 dark:hover:bg-white/5 text-gray-800 dark:text-gray-200 bg-transparent transition-colors">
                        <Menu size={24} />
                    </button>
                    <span className="ml-2 font-bold truncate text-gray-800 dark:text-gray-200">X-GPT <span className="text-xs font-normal opacity-70">(beta)</span></span>
                </div>

                {/* Desktop Toggle Button */}
                {!isSidebarOpen && (
                    <div className="hidden md:flex fixed top-4 left-4 z-10">
                        <button
                            onClick={(e) => { e.stopPropagation(); setIsSidebarOpen(true); }}
                            className="p-2 bg-transparent hover:bg-black/5 dark:hover:bg-white/5 border-none rounded-lg text-gray-600 dark:text-gray-300 transition-colors shadow-none group"
                            title="Open Chat History"
                        >
                            <Menu size={24} className="group-hover:scale-110 transition-transform" />
                        </button>
                    </div>
                )}

                {/* Content Area */}
                <div ref={chatContainerRef} className="flex-1 overflow-y-auto w-full relative custom-scrollbar scroll-smooth">

                    {isWelcomeScreen ? (
                        /* Welcome Screen Layout - Centered Input */
                        <div className="h-full flex flex-col items-center justify-center p-2 sm:p-4 min-h-[500px] sm:min-h-[600px]">

                            <div className="w-full max-w-4xl flex flex-col items-center gap-6 sm:gap-8 -mt-10 sm:-mt-20">
                                {/* 1. Logo & Welcome Message */}
                                <WelcomeMessage t={t} customWelcomeText={customWelcomeText} />

                                {/* 3. Input Area (Centered) */}
                                <div className="w-full max-w-xl px-1 sm:px-2 relative">
                                    {renderInputArea(true)}
                                    {isVideoProcessing && (
                                        <div className="video-processing-overlay animate-in fade-in duration-300">
                                            <div className="video-spinner"></div>
                                            <span className="text-xs font-bold tracking-wider">PROCESS VIDEO...</span>
                                        </div>
                                    )}
                                </div>
                            </div>

                        </div>
                    ) : (
                        /* Chat Screen Layout */
                        <div className="flex flex-col pb-40 pt-4">
                            {currentMessages.map((msg, idx) => {
                                // Determine if this message is currently being streamed
                                const isLastAssistant = msg.role === 'assistant' && idx === currentMessages.length - 1;
                                const isStreamingNow = isLoading && isLastAssistant;
                                return (
                                    <ChatMessage
                                        key={idx}
                                        message={msg}
                                        messageIndex={idx}
                                        onEditMessage={handleEditMessage}
                                        onDeleteMessage={(index) => handleDeleteMessage(currentSessionId || '', index)}
                                        isStreaming={isStreamingNow}
                                        isThinking={isStreamingNow && isThinking}
                                        isDeleting={isDeletingMessage && (deletingIndex === idx || (deletingIndex !== null && msg.role === 'assistant' && idx === deletingIndex + 1))}
                                    />
                                );
                            })}
                            {isLoading && currentMessages.length > 0 && currentMessages[currentMessages.length - 1].role === 'user' && (
                                <div className="w-full py-4 px-4 animate-in fade-in slide-in-from-bottom-2 duration-500">
                                    <div className="max-w-4xl mx-auto flex gap-4">
                                        <div className="flex-shrink-0 flex items-center pt-2">
                                            <div className="flex flex-row items-center gap-3">
                                                <div className="flex items-center justify-center w-8 h-8 rounded-full shadow-sm border border-gray-100/50 dark:border-white/5 bg-white/80 dark:bg-[#1e1e1e]/80 backdrop-blur-xl">
                                                    <Loader2 size={16} className="animate-spin" style={{ color: 'var(--accent-color)' }} />
                                                </div>
                                                {isThinking && (
                                                    <ThinkingAnimation hints={thinkingHints} currentIndex={currentHintIndex} />
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}
                            <div ref={bottomRef} className="h-4" />
                        </div>
                    )}
                </div>

                {/* Gen'S AI Modes Overlay (e.g. MCQ Exam) */}
                <div
                    className={`absolute inset-0 z-[40] bg-[#f5f5f5] dark:bg-[#212121] transition-transform duration-500 ease-in-out flex flex-col ${activeMode ? 'translate-y-0 opacity-100' : 'translate-y-full opacity-0 pointer-events-none'
                        }`}
                >
                    {activeMode === 'mcq-exam' && (
                        <>
                            {/* Overlay Header */}
                            <div className="flex items-center justify-between px-4 sm:px-6 py-3 border-b border-gray-200 dark:border-white/5 bg-white/50 dark:bg-[#1a1a1a]/50 backdrop-blur-md sticky top-0 z-50">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg text-white">
                                        <Bot size={18} />
                                    </div>
                                    <h1 className="text-lg font-bold text-gray-900 dark:text-white">
                                        MCQ Exam
                                    </h1>
                                </div>
                                <button
                                    onClick={() => setActiveMode(null)}
                                    className="p-2 text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white hover:bg-gray-200 dark:hover:bg-white/10 rounded-full transition-colors"
                                >
                                    <X size={20} />
                                </button>
                            </div>

                            {/* Inner Component */}
                            <div className="flex-1 overflow-hidden relative">
                                <MCQ />
                            </div>
                        </>
                    )}
                </div>

                {/* Fixed Input Area for Chat Mode (Bottom) */}
                {!isWelcomeScreen && (
                    <div className={`absolute bottom-0 left-0 w-full bg-gradient-to-t pb-6 pt-10 px-4 ${themeMode === 'custom' ? 'from-transparent to-transparent' : 'from-[#F0F8FF] via-[#F0F8FF] to-transparent dark:from-[#212121] dark:via-[#212121]'}`} onClick={e => e.stopPropagation()}>
                        {renderInputArea(false)}
                        {isVideoProcessing && (
                            <div className="video-processing-overlay animate-in fade-in duration-300 mx-4 mb-6" style={{ bottom: 0, height: '80px' }}>
                                <div className="video-spinner"></div>
                                <span className="text-xs font-bold tracking-wider">PROCESS VIDEO...</span>
                            </div>
                        )}
                    </div>
                )}

                <style>{`
                @keyframes loading {
                    0%, 80%, 100% { transform: scale(0); opacity: 0.3; }
                    40% { transform: scale(1); opacity: 1; }
                }
                @keyframes smoke-fade-out {
                    0% { opacity: 1; transform: translateY(0) scale(1) filter(blur(0)); }
                    40% { opacity: 0.7; transform: translateY(-10px) scale(1.02) filter(blur(4px)); }
                    100% { opacity: 0; transform: translateY(-40px) scale(1.1) filter(blur(12px)); }
                }
                .smoke-delete-animation {
                    animation: smoke-fade-out 1.2s cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards !important;
                    pointer-events: none !important;
                }
                .video-processing-overlay {
                    position: absolute;
                    inset: 0;
                    background: rgba(0,0,0,0.6);
                    backdrop-blur: 4px;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    z-index: 50;
                    border-radius: 12px;
                    color: white;
                    gap: 8px;
                }
                @keyframes video-spin {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                }
                .video-spinner {
                    width: 32px;
                    height: 32px;
                    border: 3px solid rgba(255,255,255,0.2);
                    border-top: 3px solid white;
                    border-radius: 50%;
                    animation: video-spin 0.8s linear infinite;
                }
            `}</style>
            </div>
        </div>
    );
};

export default App;
