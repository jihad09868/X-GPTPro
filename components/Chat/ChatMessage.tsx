
import React, { useState, useEffect, useRef, useMemo } from 'react';
import ReactMarkdown from 'react-markdown';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import { Message } from '../../types';
import { User, Copy, Check, Download, Terminal, Pencil, X, Maximize2, Monitor, Smartphone, Tablet, ExternalLink, Play, Pause, ThumbsUp, ThumbsDown, Share, RefreshCcw, Volume2, MoreHorizontal, Upload, Paperclip, Loader2, Trash2 } from 'lucide-react';
import ShareModal from './Share';
import DownloadButton from './DownloadButton';

interface ChatMessageProps {
    message: Message;
    messageIndex: number;
    onEditMessage?: (index: number, newContent: string) => void;
    onDeleteMessage?: (index: number) => void;
    isStreaming?: boolean;
    isThinking?: boolean;
    isDeleting?: boolean; // Prop to indicate if THIS message is being deleted
}

const CodeBlock = ({ language, value }: { language: string, value: string }) => {
    const [code, setCode] = useState(value);
    const [copied, setCopied] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [showPreview, setShowPreview] = useState(false);
    const [isFullScreen, setIsFullScreen] = useState(false);
    const [deviceView, setDeviceView] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');

    const isPreviewable = language === 'html' || language === 'svg' || language === 'javascript' || language === 'jsx';

    const getCleanCode = (rawCode: string) => {
        const scrollbarHideCSS = `
        <style>
          ::-webkit-scrollbar { width: 0px; background: transparent; display: none; }
          body { -ms-overflow-style: none; scrollbar-width: none; }
        </style>
      `;
        if (rawCode.includes('<head>')) {
            return rawCode.replace('<head>', '<head>' + scrollbarHideCSS);
        }
        return scrollbarHideCSS + rawCode;
    };

    const handleCopy = () => {
        const copyViaTextarea = (text: string) => {
            const ta = document.createElement('textarea');
            ta.value = text;
            ta.setAttribute('readonly', '');
            ta.style.position = 'absolute';
            ta.style.left = '-9999px';
            document.body.appendChild(ta);
            ta.select();
            ta.setSelectionRange(0, 99999);
            try { document.execCommand('copy'); } catch (_) { }
            document.body.removeChild(ta);
        };
        if (navigator.clipboard) {
            navigator.clipboard.writeText(code).catch(() => copyViaTextarea(code));
        } else {
            copyViaTextarea(code);
        }
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleDownload = () => {
        const mimeType = language === 'html' ? 'text/html' : language === 'css' ? 'text/css' : language === 'javascript' || language === 'js' ? 'application/javascript' : 'text/plain';
        const ext = language || 'txt';
        const blob = new Blob([code], { type: mimeType });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `script.${ext}`;
        a.style.display = 'none';
        document.body.appendChild(a);
        a.click();
        // Delay cleanup to ensure download starts
        setTimeout(() => {
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        }, 250);
    };

    const toggleFullScreen = () => {
        setIsFullScreen(!isFullScreen);
        setDeviceView('desktop');
    };

    const getContainerStyles = () => {
        switch (deviceView) {
            case 'mobile':
                return 'w-[375px] h-[667px] border-[10px] border-[#1a1a1a] rounded-[30px] shadow-xl';
            case 'tablet':
                return 'w-[768px] h-[1024px] border-[12px] border-[#1a1a1a] rounded-[24px] shadow-xl';
            default:
                return 'w-full h-full rounded-none border-none';
        }
    };

    return (
        <>
            {isFullScreen && (
                <div className="fixed inset-0 z-[100] bg-black/95 flex flex-col animate-in fade-in duration-200">
                    <div className="flex items-center justify-between p-4 bg-[#1e1e1e] text-white border-b border-white/10 shrink-0">
                        <div className="flex items-center gap-4">
                            <h3 className="font-bold text-sm uppercase tracking-wider text-gray-400">Preview Mode</h3>
                            <div className="flex bg-black/50 rounded-lg p-1 gap-1">
                                <button onClick={() => setDeviceView('desktop')} className={`p-2 rounded ${deviceView === 'desktop' ? 'bg-blue-600' : 'text-gray-400 hover:text-white'}`}><Monitor size={16} /></button>
                                <button onClick={() => setDeviceView('tablet')} className={`p-2 rounded ${deviceView === 'tablet' ? 'bg-blue-600' : 'text-gray-400 hover:text-white'}`}><Tablet size={16} /></button>
                                <button onClick={() => setDeviceView('mobile')} className={`p-2 rounded ${deviceView === 'mobile' ? 'bg-blue-600' : 'text-gray-400 hover:text-white'}`}><Smartphone size={16} /></button>
                            </div>
                        </div>
                        <button onClick={toggleFullScreen} className="p-2 hover:bg-white/10 rounded-full transition-colors"><X size={24} /></button>
                    </div>

                    <div className={`flex-1 flex items-center justify-center bg-[#0d0d0d] overflow-hidden ${deviceView === 'desktop' ? 'p-0' : 'p-8'}`}>
                        <div className={`bg-white transition-all duration-300 overflow-hidden relative ${getContainerStyles()}`}>
                            <iframe
                                srcDoc={getCleanCode(code)}
                                className="w-full h-full border-none bg-white block"
                                title="fullscreen-preview"
                                sandbox="allow-scripts allow-modals allow-forms allow-popups"
                            />
                        </div>
                    </div>
                </div>
            )}

            {/* Code Editor — merged with chat background */}
            <div className="my-4 sm:my-6 rounded-xl overflow-hidden border border-gray-200/10 dark:border-white/[0.06] bg-[#f5f5f5] dark:bg-[#212121] shadow-lg w-full max-w-full flex flex-row group/code">

                {/* Main Editor Area */}
                <div className="flex-1 relative min-w-0 flex flex-col">
                    <div className="flex items-center justify-between px-3 sm:px-4 py-2 bg-[#e8e8e8] dark:bg-[#1a1a1a] border-b border-gray-200/20 dark:border-white/[0.05]">
                        <div className="flex items-center gap-2">
                            <Terminal size={14} className="text-gray-500 dark:text-gray-400" />
                            <span className="text-xs font-mono uppercase font-bold text-gray-500 dark:text-gray-400">{language || 'plaintext'}</span>
                        </div>
                    </div>

                    <div className="relative w-full h-full min-h-[80px] sm:min-h-[100px]">
                        {showPreview ? (
                            <div className="bg-white relative h-[250px] sm:h-[300px]">
                                <div className="absolute top-2 right-2 z-10">
                                    <button onClick={toggleFullScreen} className="bg-black/50 hover:bg-black/80 text-white p-1.5 rounded backdrop-blur-sm"><Maximize2 size={16} /></button>
                                </div>
                                <div className="w-full h-full">
                                    {isPreviewable ? (
                                        <iframe srcDoc={getCleanCode(code)} className="w-full h-full border-none" title="preview" sandbox="allow-scripts" />
                                    ) : (
                                        <div className="text-gray-400 font-mono text-sm p-4">Preview available for HTML/SVG/JS only.</div>
                                    )}
                                </div>
                            </div>
                        ) : isEditing ? (
                            <textarea value={code} onChange={(e) => setCode(e.target.value)} className="w-full h-[250px] sm:h-[300px] bg-[#f5f5f5] dark:bg-[#212121] text-gray-800 dark:text-gray-200 p-3 sm:p-4 font-mono text-xs outline-none resize-y" spellCheck={false} />
                        ) : (
                            <div className="p-3 sm:p-4 overflow-x-auto custom-scrollbar bg-[#f5f5f5] dark:bg-[#212121]">
                                {/* whitespace-pre-wrap ensures code wraps to next line if too long for screen */}
                                <pre className="text-xs font-mono text-gray-800 dark:text-gray-200 leading-relaxed whitespace-pre-wrap break-words min-w-0">
                                    <code>{code}</code>
                                </pre>
                            </div>
                        )}
                    </div>
                </div>

                {/* Side Toolbar */}
                <div className="w-9 sm:w-10 bg-[#e8e8e8] dark:bg-[#1a1a1a] border-l border-gray-200/20 dark:border-white/[0.05] flex flex-col items-center py-2 gap-1.5 sm:gap-2 shrink-0">
                    <button onClick={handleCopy} className="p-1.5 sm:p-2 rounded-md text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-200/60 dark:hover:bg-white/10 transition-all relative overflow-visible" title="Copy Code">
                        <div className={`transition-all duration-300 ${copied ? 'scale-0 opacity-0' : 'scale-100 opacity-100'}`}>
                            <Copy size={16} strokeWidth={1.5} />
                        </div>
                        <div className={`transition-all duration-300 absolute inset-0 flex items-center justify-center ${copied ? 'scale-110 opacity-100' : 'scale-0 opacity-0'}`}>
                            <Check size={16} className="text-green-500 dark:text-green-400" strokeWidth={3} />
                        </div>
                        {/* Copied tooltip animation */}
                        <div className={`absolute -left-16 top-1/2 -translate-y-1/2 px-2 py-1 bg-green-500 text-white text-[10px] font-bold rounded-md shadow-lg whitespace-nowrap transition-all duration-300 pointer-events-none ${copied ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-2'}`}>
                            Copied!
                        </div>
                    </button>

                    <button onClick={() => setIsEditing(!isEditing)} className={`p-1.5 sm:p-2 rounded-md transition-all ${isEditing ? 'text-blue-500 dark:text-blue-400 bg-blue-100 dark:bg-blue-900/30' : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-200/60 dark:hover:bg-white/10'}`} title="Edit Code">
                        <Pencil size={16} strokeWidth={1.5} />
                    </button>

                    {isPreviewable && (
                        <button onClick={() => setShowPreview(!showPreview)} className={`p-1.5 sm:p-2 rounded-md transition-all ${showPreview ? 'text-pink-500 dark:text-pink-400 bg-pink-100 dark:bg-pink-900/30' : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-200/60 dark:hover:bg-white/10'}`} title="Live Preview">
                            {showPreview ? <Terminal size={16} strokeWidth={1.5} /> : <Play size={16} strokeWidth={1.5} />}
                        </button>
                    )}

                    <button onClick={handleDownload} className="p-1.5 sm:p-2 rounded-md text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-200/60 dark:hover:bg-white/10 transition-all" title="Download">
                        <Download size={16} strokeWidth={1.5} />
                    </button>
                </div>

            </div>
        </>
    );
};

const ImageModal = ({ src, onClose }: { src: string; onClose: () => void }) => (
    <div className="fixed inset-0 z-[200] bg-black/90 flex items-center justify-center p-4 cursor-pointer animate-in fade-in duration-200" onClick={onClose}>
        <img src={src} alt="Full screen" className="max-w-full max-h-full rounded-lg shadow-2xl object-contain" />
        <button className="absolute top-4 right-4 text-white p-2 bg-black/50 rounded-full hover:bg-white/20"><X size={24} /></button>
    </div>
);

// Helper to auto-link URLs in text if markdown is missing
const processText = (text: string) => {
    // Basic regex to find URLs not already inside markdown links
    // This matches http/https URLs that are NOT preceded by `](` or `="` or `(`
    const urlRegex = /(?<!\]\(|="|href="|src="|\[)(https?:\/\/[^\s<]+)/g;
    return text.replace(urlRegex, (url) => `[${url}](${url})`);
};

const ButtonSpinner = ({ size = 16, color }: { size?: number; color?: string }) => (
    <div
        style={{ width: size, height: size }}
        className="relative flex items-center justify-center"
    >
        <div style={{ transform: `scale(${size / 70})`, width: 70, height: 70, position: 'absolute', transformOrigin: 'center' }}>
            <div className="chat-btn-loader">
                {[...Array(12)].map((_, i) => (
                    <span key={i} style={{ background: color || 'currentColor' }} />
                ))}
            </div>
        </div>
    </div>
);

const CharacterReveal = ({ text }: { text: string }) => {
    return (
        <>
            {text.split('').map((char, i) => (
                <span
                    key={i}
                    className="ai-char-visible"
                    style={{ animationDelay: `${i * 3}ms` }}
                >
                    {char}
                </span>
            ))}
        </>
    );
};

const AudioBubble = ({ url, duration }: { url: string; duration: number }) => {
    const [isPlaying, setIsPlaying] = useState(false);
    const audioRef = useRef<HTMLAudioElement>(null);

    const togglePlay = () => {
        if (!audioRef.current) return;
        if (isPlaying) {
            audioRef.current.pause();
        } else {
            audioRef.current.play();
        }
        setIsPlaying(!isPlaying);
    };

    return (
        <div className="flex items-center gap-3 bg-black/10 dark:bg-white/10 rounded-full py-2 px-4 shadow-sm mb-2 border border-black/5 dark:border-white/5" style={{ minWidth: '160px' }}>
            <button
                onClick={(e) => { e.stopPropagation(); togglePlay(); }}
                className="w-8 h-8 rounded-full bg-white dark:bg-[#2a2a2a] text-black dark:text-white flex items-center justify-center shadow-md shrink-0 transition-transform active:scale-95"
            >
                {isPlaying ? <Pause size={14} fill="currentColor" /> : <Play size={14} fill="currentColor" className="ml-0.5" />}
            </button>
            <div className="flex-1 flex items-center justify-center gap-[3px] opacity-70">
                {[3, 5, 2, 6, 4, 3, 7, 3, 2, 5, 4, 2].map((h, i) => (
                    <div key={i} className={`w-[3px] bg-white dark:bg-gray-200 rounded-full transition-all duration-300 ${isPlaying ? 'animate-pulse opacity-100' : 'opacity-60'}`} style={{ height: `${h * 3.5}px` }} />
                ))}
            </div>
            <span className="text-[11px] font-mono ml-2 opacity-90 text-white dark:text-gray-200 border-l border-white/20 pl-3">
                0:{duration.toString().padStart(2, '0')}
            </span>
            <audio ref={audioRef} src={url} onEnded={() => setIsPlaying(false)} />
        </div>
    );
};

const ChatMessage: React.FC<ChatMessageProps> = ({
    message,
    messageIndex,
    onEditMessage,
    onDeleteMessage,
    isStreaming = false,
    isThinking = false,
    isDeleting = false
}) => {
    const isUser = message.role === 'user';
    const [msgCopied, setMsgCopied] = useState(false);
    const [userMsgCopied, setUserMsgCopied] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [editContent, setEditContent] = useState(message.content);
    const [zoomImage, setZoomImage] = useState<string | null>(null);
    const [showVoice, setShowVoice] = useState(false);
    const [isVoiceLoading, setIsVoiceLoading] = useState(false);
    const [isEditLoading, setIsEditLoading] = useState(false);
    const [feedback, setFeedback] = useState<'like' | 'dislike' | null>(null);
    const [isFeedbackLoading, setIsFeedbackLoading] = useState<'like' | 'dislike' | null>(null);
    const [showShare, setShowShare] = useState(false);
    const [isSharing, setIsSharing] = useState(false);
    const [smokeWordIndices, setSmokeWordIndices] = useState<Set<number>>(new Set());
    const prevContentLenRef = useRef(0);
    const editTextareaRef = useRef<HTMLTextAreaElement>(null);
    const contentRef = React.useRef<HTMLDivElement>(null);

    // Track previous content length for smoke animation
    // const prevContentLenRef = useRef(0); // Removed duplicate
    // const [smokeWordIndices, setSmokeWordIndices] = useState<Set<number>>(new Set()); // Removed duplicate

    const getAutoTitle = (txt: string) => {
        const words = txt.replace(/[*#]/g, '').split(/\s+/).filter(w => w.length > 0);
        return words.slice(0, 3).join(' ') || "Response";
    };

    const handleFeedback = (type: 'like' | 'dislike') => {
        setFeedback(prev => prev === type ? null : type);
    };

    const triggerShareAndOpen = () => {
        setIsSharing(true);
        setTimeout(() => {
            setIsSharing(false);
            setShowShare(true);
        }, 1200);
    };

    const copyMessage = () => {
        const cleanText = message.content.replace(/!\[.*?\]\(data:image.*?\)/g, '[Image]');
        const copyTextFallback = (text: string) => {
            const ta = document.createElement('textarea');
            ta.value = text;
            ta.setAttribute('readonly', '');
            ta.style.position = 'absolute';
            ta.style.left = '-9999px';
            document.body.appendChild(ta);
            ta.select();
            ta.setSelectionRange(0, 99999);
            try { document.execCommand('copy'); } catch (_) { }
            document.body.removeChild(ta);
        };
        if (navigator.clipboard) {
            navigator.clipboard.writeText(cleanText).catch(() => copyTextFallback(cleanText));
        } else {
            copyTextFallback(cleanText);
        }
        setMsgCopied(true);
        setTimeout(() => setMsgCopied(false), 2000);
    };

    const copyUserMessage = () => {
        const cleanText = message.content.replace(/!\[.*?\]\(data:image.*?\)/g, '[Image]');
        const copyTextFallback = (text: string) => {
            const ta = document.createElement('textarea');
            ta.value = text;
            ta.setAttribute('readonly', '');
            ta.style.position = 'absolute';
            ta.style.left = '-9999px';
            document.body.appendChild(ta);
            ta.select();
            ta.setSelectionRange(0, 99999);
            try { document.execCommand('copy'); } catch (_) { }
            document.body.removeChild(ta);
        };
        if (navigator.clipboard) {
            navigator.clipboard.writeText(cleanText).catch(() => copyTextFallback(cleanText));
        } else {
            copyTextFallback(cleanText);
        }
        setUserMsgCopied(true);
        setTimeout(() => setUserMsgCopied(false), 2000);
    };

    const handleStartEdit = () => {
        setIsEditLoading(true);
        setTimeout(() => {
            setIsEditLoading(false);
            setEditContent(message.content);
            setIsEditing(true);
            setTimeout(() => {
                if (editTextareaRef.current) {
                    editTextareaRef.current.focus();
                    editTextareaRef.current.style.height = 'auto';
                    editTextareaRef.current.style.height = editTextareaRef.current.scrollHeight + 'px';
                }
            }, 50);
        }, 1200);
    };

    const handleSaveEdit = () => {
        if (onEditMessage && messageIndex !== undefined && editContent.trim()) {
            onEditMessage(messageIndex, editContent.trim());
            setIsEditing(false);
        }
    };

    const handleCancelEdit = () => {
        setEditContent(message.content);
        setIsEditing(false);
    };

    const triggerVoice = () => {
        setIsVoiceLoading(true);
        setTimeout(() => {
            setIsVoiceLoading(false);
            setShowVoice(true);
        }, 1200);
    };

    const handleFeedbackWithSpinner = (type: 'like' | 'dislike') => {
        setIsFeedbackLoading(type);
        setTimeout(() => {
            setIsFeedbackLoading(null);
            setFeedback(prev => prev === type ? null : type);
        }, 1200);
    };

    // Track newly added words for smoke effect during streaming
    useEffect(() => {
        if (!isUser && isStreaming && message.content) {
            const currentLen = message.content.length;
            if (currentLen > prevContentLenRef.current) {
                // New content was added - find the new words
                const allWords = message.content.split(/(\s+)/);
                const prevWords = (message.content.slice(0, prevContentLenRef.current) || '').split(/(\s+)/);
                const newWordCount = allWords.length;
                const prevWordCount = prevWords.length;

                if (newWordCount > prevWordCount) {
                    const newIndices = new Set(smokeWordIndices);
                    for (let i = prevWordCount; i < newWordCount; i++) {
                        if (allWords[i] && allWords[i].trim()) {
                            newIndices.add(i);
                        }
                    }
                    setSmokeWordIndices(newIndices);

                    // Clear smoke after animation completes
                    setTimeout(() => {
                        setSmokeWordIndices(prev => {
                            const updated = new Set(prev);
                            for (let i = prevWordCount; i < newWordCount; i++) {
                                updated.delete(i);
                            }
                            return updated;
                        });
                    }, 1000);
                }
            }
            prevContentLenRef.current = currentLen;
        }
    }, [message.content, isStreaming, isUser]);

    // Pre-process content to ensure raw URLs become markdown links
    const processedContent = isUser ? message.content : processText(message.content);

    return (
        <>
            {zoomImage && <ImageModal src={zoomImage} onClose={() => setZoomImage(null)} />}

            <div className={`w-full py-2 px-1 sm:px-2 md:px-4 group transition-all duration-300 ${isDeleting ? 'smoke-delete-animation' : ''}`}>
                <div className={`max-w-4xl mx-auto flex gap-2 sm:gap-3 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>

                    {/* Avatar */}
                    <div className="flex-shrink-0 flex flex-col relative items-center pt-1 w-6 sm:w-8">
                        {isUser && (
                            <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-black dark:bg-white flex items-center justify-center shadow-md">
                                <User size={14} className="text-white dark:text-black sm:hidden" />
                                <User size={16} className="text-white dark:text-black hidden sm:block" />
                            </div>
                        )}
                    </div>

                    {/* Message Content Container */}
                    <div className={`relative max-w-[90%] md:max-w-[85%] flex flex-col ${isUser ? 'items-end' : 'items-start'} min-w-0`}>
                        {isUser && isEditing ? (
                            /* User message edit mode */
                            <div className="w-full bg-gray-100 dark:bg-[#2f2f2f] rounded-2xl p-2 shadow-sm overflow-hidden animate-in fade-in slide-in-from-top-2 zoom-in-95 duration-200">
                                {message.images && message.images.length > 0 && (
                                    <div className="flex flex-wrap gap-2 mb-2 pl-2 pt-1">
                                        {message.images.map((img, idx) => (
                                            <div key={idx} className="relative w-16 h-16 rounded-lg overflow-hidden border border-gray-200 dark:border-white/10">
                                                <img src={`data:image/png;base64,${img}`} alt="Attached" className="w-full h-full object-cover" />
                                            </div>
                                        ))}
                                    </div>
                                )}
                                <textarea
                                    ref={editTextareaRef}
                                    value={editContent}
                                    onChange={(e) => {
                                        setEditContent(e.target.value);
                                        e.target.style.height = 'auto';
                                        e.target.style.height = e.target.scrollHeight + 'px';
                                    }}
                                    className="w-full bg-transparent text-gray-900 dark:text-gray-100 text-sm px-4 py-3 outline-none resize-none min-h-[60px] font-sans"
                                    style={{ lineHeight: '1.6' }}
                                />
                                <div className="flex items-center justify-end gap-2 px-3 py-2 border-t border-gray-200 dark:border-white/10">
                                    <button
                                        onClick={handleCancelEdit}
                                        className="px-4 py-1.5 text-xs font-semibold text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 rounded-lg hover:bg-gray-200 dark:hover:bg-white/10 transition-all"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={handleSaveEdit}
                                        className="px-4 py-1.5 text-xs font-bold rounded-lg hover:opacity-80 transition-all shadow-sm"
                                        style={{ backgroundColor: 'var(--accent-color)', color: '#000' }}
                                    >
                                        Send
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <div className={`animate-in fade-in slide-in-from-bottom-2 duration-200 w-full flex flex-col ${isUser ? 'items-end' : 'items-start'} gap-2`}>

                                {/* Render attached images SEPARATELY above the text bubble */}
                                {isUser && message.images && message.images.length > 0 && (
                                    <div className={`flex flex-wrap gap-2.5 justify-end ${message.images.length === 1 ? '' : ''}`}>
                                        {message.images.map((img, imgIdx) => (
                                            <div
                                                key={imgIdx}
                                                className="relative cursor-zoom-in group/chatimg"
                                                onClick={() => setZoomImage(`data:image/png;base64,${img}`)}
                                                style={{ animationDelay: `${imgIdx * 100}ms` }}
                                            >
                                                <div className={`rounded-2xl overflow-hidden border border-gray-200/40 dark:border-white/8 shadow-lg bg-white dark:bg-[#2a2a2a] transition-all duration-300 hover:shadow-2xl hover:border-gray-300 dark:hover:border-white/15 ${message.images!.length === 1 ? 'max-w-[280px]' : 'max-w-[180px]'
                                                    }`}>
                                                    <img
                                                        src={`data:image/png;base64,${img}`}
                                                        alt={`Attached image ${imgIdx + 1}`}
                                                        className={`w-full object-cover transition-transform duration-400 group-hover/chatimg:scale-[1.03] ${message.images!.length === 1 ? 'max-h-[280px]' : 'max-h-[180px]'
                                                            }`}
                                                    />
                                                </div>
                                                {/* Hover zoom overlay */}
                                                <div className="absolute inset-0 rounded-2xl bg-black/0 group-hover/chatimg:bg-black/15 transition-all duration-300 flex items-center justify-center">
                                                    <div className="opacity-0 group-hover/chatimg:opacity-100 transition-all duration-300 transform scale-75 group-hover/chatimg:scale-100">
                                                        <div className="p-2 bg-black/60 backdrop-blur-md rounded-full shadow-lg">
                                                            <Maximize2 size={16} className="text-white" />
                                                        </div>
                                                    </div>
                                                </div>
                                                {/* Paperclip badge */}
                                                <div className="absolute bottom-2 left-2 opacity-0 group-hover/chatimg:opacity-100 transition-all duration-200">
                                                    <div className="flex items-center gap-1 px-2 py-1 bg-black/50 backdrop-blur-sm rounded-lg">
                                                        <Paperclip size={10} className="text-white/80" />
                                                        <span className="text-[10px] text-white/80 font-medium">Image</span>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                {/* Render audio component if present */}
                                {isUser && message.audio && (
                                    <AudioBubble url={message.audio.url} duration={message.audio.duration} />
                                )}

                                {/* Render video component if present */}
                                {message.video && (
                                    <div className="w-full mb-3 rounded-xl overflow-hidden bg-black shadow-lg border border-white/10 aspect-video relative group/video">
                                        <video
                                            src={message.video.url}
                                            controls
                                            className="w-full h-full object-contain"
                                            poster={message.images && message.images[0] ? `data:image/jpeg;base64,${message.images[0]}` : undefined}
                                        />
                                        <div className="absolute top-2 left-2 px-2 py-1 bg-black/60 backdrop-blur-md rounded-lg text-[10px] text-white/90 font-bold border border-white/10 opacity-0 group-hover/video:opacity-100 transition-opacity">
                                            VIDEO: {message.video.name}
                                        </div>
                                    </div>
                                )}

                                {/* Text bubble - hide if voice message, or if auto-generated text for image-only messages */}
                                {(() => {
                                    if (isUser && message.audio) return null;
                                    const isAutoImageText = isUser && message.images && message.images.length > 0 &&
                                        (message.content === 'Analyze this image' || message.content === 'Analyze this file' || message.content.trim() === '');
                                    if (isAutoImageText) return null;
                                    return (
                                        <div
                                            className={`overflow-hidden rounded-2xl px-4 py-3 w-full transition-all duration-300 message-content-wrapper ${isUser
                                                ? 'text-white rounded-tr-[4px] shadow-sm hover:shadow-md'
                                                : 'bg-white/80 dark:bg-[#252525]/80 backdrop-blur-xl border border-gray-100/50 dark:border-white/[0.04] shadow-sm rounded-tl-[4px]'
                                                } ${isDeleting ? 'smoke-delete-animation' : ''}`}
                                            style={isUser ? { backgroundColor: 'var(--accent-color)', color: getComputedStyle(document.documentElement).getPropertyValue('--accent-color-rgb').trim() === '255, 255, 255' ? '#000' : '#fff' } : {}}
                                        >
                                            <div ref={contentRef} className={`prose dark:prose-invert prose-p:leading-relaxed prose-pre:p-0 prose-pre:bg-transparent max-w-full overflow-hidden break-words text-[13.5px] whitespace-pre-wrap font-sans`}>
                                                <ReactMarkdown
                                                    components={{
                                                        a: ({ node, ...props }) => (
                                                            <a target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:text-blue-400 underline break-all cursor-pointer inline-flex items-center gap-0.5" {...props}>
                                                                {props.children} <ExternalLink size={10} className="inline mb-1" />
                                                            </a>
                                                        ),
                                                        pre: ({ children }) => <>{children}</>,
                                                        img: ({ node, ...props }) => (
                                                            <div className="my-2 relative group/image cursor-zoom-in inline-block" onClick={() => setZoomImage((props.src as string) || null)}>
                                                                <img {...props} className="max-w-full h-auto rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm transition-transform hover:scale-[1.01]" style={{ maxHeight: '400px', objectFit: 'contain' }} />
                                                                <div className="absolute inset-0 bg-black/0 group-hover/image:bg-black/10 transition-colors rounded-xl flex items-center justify-center opacity-0 group-hover/image:opacity-100 pointer-events-none">
                                                                    <Maximize2 className="text-white drop-shadow-md" size={24} />
                                                                </div>
                                                            </div>
                                                        ),
                                                        // Wrap paragraphs with line-by-line reveal animation for AI responses
                                                        p: ({ node, children, ...props }) => {
                                                            if (!isUser && isStreaming) {
                                                                return <p className="ai-char-reveal-p" {...props}>
                                                                    {typeof children === 'string' ? <CharacterReveal text={children} /> : children}
                                                                </p>;
                                                            }
                                                            return <p {...props}>{children}</p>;
                                                        },
                                                        strong: ({ node, ...props }) => <strong className="font-bold text-gray-900 dark:text-white" {...props} />,
                                                        h1: ({ node, ...props }) => <h1 className="text-2xl font-bold mt-6 mb-4 text-gray-900 dark:text-white border-b border-gray-200 dark:border-gray-700 pb-2 break-words" {...props} />,
                                                        h2: ({ node, ...props }) => <h2 className="text-xl font-bold mt-5 mb-3 text-gray-900 dark:text-gray-100 break-words" {...props} />,
                                                        h3: ({ node, ...props }) => <h3 className="text-lg font-bold mt-4 mb-2 text-gray-800 dark:text-gray-200 break-words" {...props} />,
                                                        ol: ({ node, ...props }) => <ol className="list-decimal pl-5 space-y-1 my-2 text-gray-800 dark:text-gray-300" {...props} />,
                                                        ul: ({ node, ...props }) => <ul className="list-disc pl-5 space-y-1 my-2 text-gray-800 dark:text-gray-300" {...props} />,
                                                        li: ({ node, children, ...props }) => {
                                                            if (!isUser && isStreaming) {
                                                                return <li className="pl-1 ai-line-reveal" {...props}>{children}</li>;
                                                            }
                                                            return <li className="pl-1" {...props}>{children}</li>;
                                                        },
                                                        blockquote: ({ node, ...props }) => <blockquote className="border-l-4 border-red-500 pl-4 italic text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-white/5 py-2 rounded-r my-2" {...props} />,
                                                        code({ node, className, children, ...props }) {
                                                            const match = /language-(\w+)/.exec(className || '')
                                                            const isMultiLine = String(children).includes('\n');
                                                            const isInline = !match && !isMultiLine;
                                                            if (isInline) {
                                                                return <code className="bg-gray-200 dark:bg-gray-800 text-red-600 dark:text-red-400 rounded px-1.5 py-0.5 text-xs font-mono break-all" {...props}>{children}</code>;
                                                            }
                                                            return <CodeBlock language={match?.[1] || ''} value={String(children).replace(/\n$/, '')} />;
                                                        }
                                                    }}
                                                >
                                                    {processedContent}
                                                </ReactMarkdown>
                                            </div>
                                        </div>
                                    );
                                })()}

                                {/* User Actions Section (Below bubble) */}
                                {isUser && !isEditing && (
                                    <div className="mt-2 flex items-center justify-end gap-2 px-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                                        <button onClick={copyUserMessage} className="p-1.5 flex items-center justify-center text-gray-400 hover:text-black dark:text-gray-400 dark:hover:text-white rounded-md transition-all relative overflow-hidden" title="Copy message">
                                            <div className={`transition-all duration-300 ${userMsgCopied ? 'scale-0 opacity-0' : 'scale-100 opacity-100'}`}>
                                                <Copy size={16} strokeWidth={1.5} />
                                            </div>
                                            <div className={`transition-all duration-300 absolute inset-0 flex items-center justify-center ${userMsgCopied ? 'scale-110 opacity-100' : 'scale-0 opacity-0'}`}>
                                                <Check size={16} className="text-[#fff]" strokeWidth={3} />
                                            </div>
                                        </button>
                                        {onEditMessage && (
                                            <button onClick={handleStartEdit} className="p-1.5 flex items-center justify-center text-gray-400 hover:text-black dark:text-gray-400 dark:hover:text-white rounded-md transition-all" title="Edit message">
                                                {isEditLoading ? (
                                                    <Loader2 size={16} className="animate-spin text-gray-400" />
                                                ) : (
                                                    <Pencil size={16} strokeWidth={1.5} />
                                                )}
                                            </button>
                                        )}
                                        {onDeleteMessage && (
                                            <button onClick={() => onDeleteMessage(messageIndex)} className="p-1.5 flex items-center justify-center text-gray-400 hover:text-red-500 dark:text-gray-400 dark:hover:text-red-500 rounded-md transition-all" title="Delete prompt and response">
                                                <Trash2 size={16} strokeWidth={1.5} />
                                            </button>
                                        )}
                                    </div>
                                )}

                                {/* Assistant Actions Section */}
                                {!isUser && (
                                    <div className="mt-1 flex items-center justify-start gap-0.5 py-0.5 px-0.5 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                                        {/* Copy */}
                                        <button onClick={copyMessage} className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/5 rounded-full transition-all relative overflow-hidden" title="Copy text">
                                            <div className={`transition-all duration-300 ${msgCopied ? 'scale-0 opacity-0' : 'scale-100 opacity-100'}`}>
                                                <Copy size={16} strokeWidth={2} />
                                            </div>
                                            <div className={`transition-all duration-300 absolute inset-0 flex items-center justify-center ${msgCopied ? 'scale-110 opacity-100' : 'scale-0 opacity-0'}`}>
                                                <Check size={16} className="text-gray-900 dark:text-white" strokeWidth={3} />
                                            </div>
                                        </button>

                                        {/* Share without spinner */}
                                        <button
                                            onClick={triggerShareAndOpen}
                                            className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/5 rounded-full transition-all group/share relative overflow-hidden"
                                            title="Share"
                                        >
                                            <div className={`transition-all duration-300 ${isSharing ? 'scale-0 opacity-0' : 'scale-100 opacity-100'}`}>
                                                <Upload size={16} strokeWidth={2} className="group-hover/share:text-[var(--accent-color)]" />
                                            </div>
                                            <div className={`transition-all duration-300 absolute inset-0 flex items-center justify-center ${isSharing ? 'scale-110 opacity-100' : 'scale-0 opacity-0'}`}>
                                                <Loader2 size={16} className="text-[var(--accent-color)] animate-spin" strokeWidth={3} />
                                            </div>
                                        </button>

                                        {/* Download */}
                                        <DownloadButton content={message.content} title={getAutoTitle(message.content)} />
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <ShareModal
                isOpen={showShare}
                onClose={() => setShowShare(false)}
                text={message.content}
                title={getAutoTitle(message.content)}
            />

            <style>{`
                /* Button spinner loader */
                .chat-btn-loader {
                    position: relative;
                    width: 70px;
                    height: 70px;
                    transform-origin: center center;
                    animation: chat-btn-spin 1s linear infinite;
                }
                .chat-btn-loader span {
                    position: absolute;
                    width: 4px;
                    height: 22px;
                    border-radius: 4px;
                    top: 50%;
                    left: 50%;
                    transform-origin: 50% 100%;
                }
                .chat-btn-loader span:nth-child(1)  { transform: translate(-50%, -100%) rotate(  0deg); opacity: 0.08; }
                .chat-btn-loader span:nth-child(2)  { transform: translate(-50%, -100%) rotate( 30deg); opacity: 0.17; }
                .chat-btn-loader span:nth-child(3)  { transform: translate(-50%, -100%) rotate( 60deg); opacity: 0.25; }
                .chat-btn-loader span:nth-child(4)  { transform: translate(-50%, -100%) rotate( 90deg); opacity: 0.33; }
                .chat-btn-loader span:nth-child(5)  { transform: translate(-50%, -100%) rotate(120deg); opacity: 0.42; }
                .chat-btn-loader span:nth-child(6)  { transform: translate(-50%, -100%) rotate(150deg); opacity: 0.50; }
                .chat-btn-loader span:nth-child(7)  { transform: translate(-50%, -100%) rotate(180deg); opacity: 0.58; }
                .chat-btn-loader span:nth-child(8)  { transform: translate(-50%, -100%) rotate(210deg); opacity: 0.67; }
                .chat-btn-loader span:nth-child(9)  { transform: translate(-50%, -100%) rotate(240deg); opacity: 0.75; }
                .chat-btn-loader span:nth-child(10) { transform: translate(-50%, -100%) rotate(270deg); opacity: 0.83; }
                .chat-btn-loader span:nth-child(11) { transform: translate(-50%, -100%) rotate(300deg); opacity: 0.92; }
                .chat-btn-loader span:nth-child(12) { transform: translate(-50%, -100%) rotate(330deg); opacity: 1.0; }

                @keyframes chat-btn-spin {
                    from { transform: rotate(0deg); }
                    to   { transform: rotate(360deg); }
                }
            `}</style>
        </>
    );
};

export default ChatMessage;