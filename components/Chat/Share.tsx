import React, { useState } from 'react';
import { X, Link2, Facebook, Heart, Check, Share2, Download } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';

/* ═══════════════════════════════════════════════════════════════════════════
   Rotation Spinner — Exactly matching user's provided HTML spinner.
   The WHOLE container spins; each petal is static but arranged radially.
   White petals on dark bg → black petals inside white buttons.
═══════════════════════════════════════════════════════════════════════════ */
const Spinner = ({ color = '#000', size = 24 }: { color?: string; size?: number }) => (
    <div style={{ width: size, height: size, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ transform: `scale(${size / 70})`, display: 'flex', alignItems: 'center', justifyContent: 'center', width: 70, height: 70, transformOrigin: 'center' }}>
            <div className="loader">
                {[...Array(12)].map((_, i) => (
                    <span key={i} style={{ background: color }} />
                ))}
            </div>
        </div>
    </div>
);

/* ═══════════════════════════════════════════════════════════════════════════
   ChatGPT Logo — loaded via image URL for beautiful rendering
═══════════════════════════════════════════════════════════════════════════ */
const ChatGptIcon = ({ size = 26 }: { size?: number }) => {
    const [loaded, setLoaded] = useState(false);
    const [error, setError] = useState(false);

    // Fallback inline SVG if image fails to load
    if (error) {
        return (
            <svg viewBox="0 0 41 41" fill="none" xmlns="http://www.w3.org/2000/svg" width={size} height={size}>
                <path
                    d="M37.532 16.87a9.963 9.963 0 0 0-.856-8.184 10.078 10.078 0 0 0-10.855-4.835A9.964 9.964 0 0 0 19.3.379a10.079 10.079 0 0 0-10.42 5.957 9.967 9.967 0 0 0-6.634 4.82 10.079 10.079 0 0 0 1.24 11.817 9.965 9.965 0 0 0 .856 8.185 10.079 10.079 0 0 0 10.855 4.835 9.965 9.965 0 0 0 6.52 3.472 10.078 10.078 0 0 0 10.42-5.957 9.967 9.967 0 0 0 6.634-4.82 10.079 10.079 0 0 0-1.24-11.817z"
                    fill="#10a37f"
                />
            </svg>
        );
    }

    return (
        <img
            src="https://cdn.oaistatic.com/assets/favicon-o20kmmos.svg"
            alt="ChatGPT"
            width={size}
            height={size}
            onLoad={() => setLoaded(true)}
            onError={() => setError(true)}
            style={{
                opacity: loaded ? 1 : 0,
                transition: 'opacity 0.4s ease',
                objectFit: 'contain',
            }}
        />
    );
};

/* ═══════════════════════════════════════════════════════════════════════════
   Types
═══════════════════════════════════════════════════════════════════════════ */
interface ShareProps {
    isOpen: boolean;
    onClose: () => void;
    text: string;
    title?: string;
}

type ActionKey = 'share' | 'copy' | 'fb' | 'gpt' | 'fav' | 'download';
type ActionState = 'idle' | 'loading' | 'success';

/* ═══════════════════════════════════════════════════════════════════════════
   Share Component
═══════════════════════════════════════════════════════════════════════════ */
const Share: React.FC<ShareProps> = ({ isOpen, onClose, text, title }) => {
    const [actionState, setActionState] = useState<Record<ActionKey, ActionState>>({
        share: 'idle',
        copy: 'idle',
        fb: 'idle',
        gpt: 'idle',
        fav: 'idle',
        download: 'idle',
    });
    const [isClosing, setIsClosing] = useState(false);
    const previewRef = React.useRef<HTMLDivElement>(null);

    if (!isOpen && !isClosing) return null;

    const displayTitle = title || 'Generated Output';

    /* Trigger loading → success → idle transition */
    const triggerAction = (type: ActionKey, actionFn: () => void) => {
        setActionState(prev => ({ ...prev, [type]: 'loading' }));
        setTimeout(() => {
            actionFn();
            setActionState(prev => ({ ...prev, [type]: 'success' }));
            setTimeout(() => {
                setActionState(prev => ({ ...prev, [type]: 'idle' }));
            }, 1100);
        }, 1200);
    };

    /* ── Close with fall-away animation ── */
    const handleClose = () => {
        setIsClosing(true);
        setTimeout(() => {
            setIsClosing(false);
            onClose();
        }, 700);
    };

    /* ── Generate shareable URL that encodes ONLY this response ── */
    const getSharedUrl = () => {
        const payload = {
            t: displayTitle,
            c: text,
            d: new Date().toISOString(),
        };
        // Use encodeURIComponent for Unicode-safe encoding, then btoa for URL-safe base64
        const jsonStr = JSON.stringify(payload);
        // Convert to UTF-8 bytes, then to base64 (handles Bangla/Unicode properly)
        const utf8Bytes = new TextEncoder().encode(jsonStr);
        const binaryStr = Array.from(utf8Bytes, (b) => String.fromCharCode(b)).join('');
        const encoded = btoa(binaryStr);
        // Use only origin (no pathname duplication)
        return `${window.location.origin}/#s=${encoded}`;
    };

    /* ── Action handlers ── */
    const handleCopy = () =>
        triggerAction('copy', () => {
            const url = getSharedUrl();
            // Use textarea fallback FIRST (works in all contexts including non-HTTPS)
            const copyViaTextarea = () => {
                const ta = document.createElement('textarea');
                ta.value = url;
                ta.style.cssText = 'position:fixed;left:-9999px;top:-9999px;opacity:0;';
                document.body.appendChild(ta);
                ta.focus();
                ta.select();
                try { document.execCommand('copy'); } catch (_) { }
                document.body.removeChild(ta);
            };
            // Try modern API first, fallback to textarea
            if (navigator.clipboard && window.isSecureContext) {
                navigator.clipboard.writeText(url).catch(copyViaTextarea);
            } else {
                copyViaTextarea();
            }
        });

    const handleFacebook = () =>
        triggerAction('fb', () => {
            window.open(
                `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(getSharedUrl())}`,
                '_blank'
            );
        });

    const handleChatGPT = () =>
        triggerAction('gpt', () => {
            window.open(
                `https://chatgpt.com/?q=${encodeURIComponent('Please analyze this content: ' + text)}`,
                '_blank'
            );
        });

    const handleFavorite = () =>
        triggerAction('fav', () => {
            // Save to localStorage favorites
            const existing = JSON.parse(localStorage.getItem('xgpt-favorites') || '[]');
            existing.push({ title: displayTitle, content: text, date: new Date().toISOString() });
            localStorage.setItem('xgpt-favorites', JSON.stringify(existing));
        });

    /* ── PDF Export — Black font, black watermark bottom-right, title.pdf ── */
    const handleDownloadPDF = async () => {
        if (!previewRef.current) return;

        const canvas = await html2canvas(previewRef.current, {
            backgroundColor: '#ffffff',
            scale: 2,
            useCORS: true,
        });

        const imgData = canvas.toDataURL('image/png');
        const pdf = new jsPDF('p', 'mm', 'a4');
        const pageWidth = pdf.internal.pageSize.getWidth();
        const pageHeight = pdf.internal.pageSize.getHeight();
        const imgProps = pdf.getImageProperties(imgData);
        const imgHeight = (imgProps.height * pageWidth) / imgProps.width;

        // Add content image
        pdf.addImage(imgData, 'PNG', 0, 0, pageWidth, Math.min(imgHeight, pageHeight - 10));

        // Big black watermark — bottom-center, very prominent
        pdf.setFontSize(40);
        pdf.setTextColor(0, 0, 0);
        const watermarkText = 'X-GPT';
        const textWidth = pdf.getTextWidth(watermarkText);
        pdf.text(watermarkText, (pageWidth - textWidth) / 2, pageHeight - 15);

        // Filename = title.pdf — use blob URL to avoid "Insecure download blocked"
        const safeTitle = displayTitle.replace(/[^a-zA-Z0-9\u0980-\u09FF\s-_]/g, '').trim() || 'Response';
        const pdfBlob = pdf.output('blob');
        const url = URL.createObjectURL(pdfBlob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `${safeTitle}.pdf`;
        link.style.display = 'none';
        document.body.appendChild(link);
        link.click();
        setTimeout(() => {
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
        }, 250);
    };

    /* ── Download with spinner animation ── */
    const handleDownloadWithSpinner = () =>
        triggerAction('download', async () => {
            await handleDownloadPDF();
        });

    /* ── Reusable button renderer ── */
    const renderButton = (
        type: ActionKey,
        icon: React.ReactNode,
        label: string,
        onClick: () => void,
        spinnerColor = '#000'
    ) => {
        const state = actionState[type];
        return (
            <div className="share-btn-wrap">
                <button
                    onClick={onClick}
                    disabled={state !== 'idle'}
                    className={`share-btn ${state === 'success' ? 'share-btn--success' : ''}`}
                    aria-label={label}
                >
                    {state === 'loading' ? (
                        <Spinner color={spinnerColor} size={26} />
                    ) : state === 'success' ? (
                        <span className="share-tick">
                            <Check size={28} className="text-[#000]" strokeWidth={3} />
                        </span>
                    ) : (
                        <span className="share-icon">{icon}</span>
                    )}
                </button>
                <span className="share-label">{label}</span>
            </div>
        );
    };

    return (
        <div
            className={`share-overlay ${isClosing ? 'share-overlay--out' : 'share-overlay--in'}`}
            onClick={handleClose}
        >
            <div
                className={`share-card ${isClosing ? 'share-card--out' : 'share-card--in'}`}
                onClick={(e) => e.stopPropagation()}
            >
                {/* ── Header ── */}
                <div className="share-header">
                    <h2 className="share-title">{displayTitle}</h2>
                    <button onClick={handleClose} className="share-close" aria-label="Close">
                        <X size={22} />
                    </button>
                </div>

                {/* ── Scrollable Content preview ── */}
                <div className="share-body">
                    <div className="share-preview">
                        <div className="share-preview-text custom-scrollbar" ref={previewRef}>
                            <ReactMarkdown>{text}</ReactMarkdown>
                        </div>
                        {/* X-GPT — normal font (not bold) */}
                        <div className="share-branding">X-GPT</div>
                    </div>
                </div>

                {/* ── Action buttons ── */}
                <div className="share-actions">
                    {renderButton('copy', <Link2 size={24} strokeWidth={1.5} />, 'Copy link', handleCopy, '#000')}
                    {renderButton('download', <Download size={24} strokeWidth={1.5} />, 'Download', handleDownloadWithSpinner, '#000')}
                    {renderButton('fb', <Facebook size={24} strokeWidth={1.5} fill="currentColor" />, 'Facebook', handleFacebook, '#000')}
                    {renderButton('gpt', <ChatGptIcon size={26} />, 'ChatGPT', handleChatGPT, '#000')}
                    {renderButton('fav', <Heart size={24} strokeWidth={1.5} />, 'Favourite', handleFavorite, '#000')}
                </div>
            </div>

            {/* ═══ Scoped Styles ═══ */}
            <style>{`
                /* ── Overlay ── */
                .share-overlay {
                    position: fixed;
                    inset: 0;
                    z-index: 100;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    padding: 1rem;
                    background: rgba(0,0,0,.72);
                    backdrop-filter: blur(14px);
                    -webkit-backdrop-filter: blur(14px);
                }
                .share-overlay--in  { animation: shareOverlayIn  .25s ease forwards; }
                .share-overlay--out { animation: shareOverlayOut .4s ease forwards; }
                @keyframes shareOverlayIn  { from { opacity:0 } to { opacity:1 } }
                @keyframes shareOverlayOut { from { opacity:1 } to { opacity:0 } }

                /* ── Card ── */
                .share-card {
                    background: #171717;
                    border-radius: 2.5rem;
                    width: 100%;
                    max-width: 520px;
                    max-height: 90vh;
                    display: flex;
                    flex-direction: column;
                    overflow: hidden;
                    border: 1px solid rgba(255,255,255,.09);
                    box-shadow: 0 32px 80px rgba(0,0,0,.6);
                }
                .share-card--in {
                    animation: shareCardIn .35s cubic-bezier(.22,1,.36,1) forwards;
                }
                .share-card--out {
                    animation: shareCardFall .7s cubic-bezier(.5,0,1,1) forwards;
                }
                @keyframes shareCardIn {
                    from { opacity:0; transform:scale(.92) translateY(24px); }
                    to   { opacity:1; transform:scale(1) translateY(0); }
                }
                /* Fall-away: pop falls down with slight rotation */
                @keyframes shareCardFall {
                    0%   { opacity:1; transform:translateY(0) rotate(0deg); }
                    100% { opacity:0; transform:translateY(120vh) rotate(25deg); }
                }

                /* ── Header ── */
                .share-header {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    padding: 1.75rem 1.75rem 1rem;
                }
                .share-title {
                    font-size: clamp(1.1rem,3vw,1.4rem);
                    font-weight: 700;
                    color: #fff;
                    letter-spacing: -.02em;
                    overflow: hidden;
                    text-overflow: ellipsis;
                    white-space: nowrap;
                    padding-right: 1rem;
                    margin: 0;
                }
                .share-close {
                    flex-shrink: 0;
                    padding: .5rem;
                    color: #9ca3af;
                    background: transparent;
                    border: none;
                    cursor: pointer;
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    transition: color .2s, background .2s;
                }
                .share-close:hover { color:#fff; background:rgba(255,255,255,.1); }

                /* ── Body / Preview — SCROLLABLE ── */
                .share-body {
                    padding: 0 1.75rem 1.5rem;
                    flex: 1;
                    overflow: hidden;
                    display: flex;
                    flex-direction: column;
                    min-height: 0;
                }
                .share-preview {
                    background: #212121;
                    border-radius: 1.5rem;
                    padding: 1.5rem;
                    flex: 1;
                    min-height: 200px;
                    max-height: 50vh;
                    display: flex;
                    flex-direction: column;
                    position: relative;
                    border: 1px solid rgba(255,255,255,.05);
                    overflow: hidden;
                }
                .share-preview-text {
                    flex: 1;
                    overflow-y: auto;
                    font-size: 13.5px;
                    line-height: 1.65;
                    color: #d1d5db;
                    padding-right: .75rem;
                    padding-bottom: 2.5rem;
                }
                .share-preview-text p { margin: 0 0 .6em; }
                .share-preview-text h1 { font-size: 1.4em; font-weight: 700; margin: .8em 0 .4em; color: #fff; }
                .share-preview-text h2 { font-size: 1.2em; font-weight: 700; margin: .7em 0 .3em; color: #e5e7eb; }
                .share-preview-text h3 { font-size: 1.05em; font-weight: 600; margin: .5em 0 .25em; color: #d1d5db; }
                .share-preview-text ul { list-style: disc; padding-left: 1.5em; margin: .4em 0; }
                .share-preview-text ol { list-style: decimal; padding-left: 1.5em; margin: .4em 0; }
                .share-preview-text li { margin: .2em 0; }
                .share-preview-text code { background: rgba(255,255,255,.08); padding: 1px 5px; border-radius: 4px; font-size: .9em; }
                .share-preview-text pre { background: rgba(0,0,0,.3); padding: .75em; border-radius: 8px; overflow-x: auto; margin: .5em 0; }
                .share-preview-text blockquote { border-left: 3px solid rgba(255,255,255,.2); padding-left: .75em; color: #9ca3af; margin: .5em 0; }

                /* X-GPT branding — NORMAL font (not bold) */
                .share-branding {
                    position: absolute;
                    bottom: 1.25rem;
                    right: 1.75rem;
                    font-weight: 800;
                    font-size: 1.1rem;
                    color: rgba(255,255,255,.4);
                    user-select: none;
                    letter-spacing: -.01em;
                    pointer-events: none;
                }

                /* ── Scrollbar ── */
                .custom-scrollbar::-webkit-scrollbar { width: 4px; }
                .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,255,255,.12); border-radius: 20px; }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(255,255,255,.22); }

                /* ── Action row ── */
                .share-actions {
                    display: flex;
                    justify-content: center;
                    gap: clamp(.8rem,3.5vw,2rem);
                    padding: 0 1.75rem 2.5rem;
                    flex-wrap: wrap;
                }

                /* ── Button ── */
                .share-btn-wrap {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    gap: .5rem;
                }
                .share-btn {
                    width: 54px;
                    height: 54px;
                    border-radius: 50%;
                    background: var(--accent-color, #e5e7eb);
                    border: none;
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    color: #111;
                    box-shadow: 0 4px 18px rgba(0,0,0,.35);
                    transition: transform .18s, box-shadow .18s, background .18s, filter .18s;
                    position: relative;
                    overflow: hidden;
                }
                .share-btn--success { /* keep original bg */ }
                .share-btn:hover:not(:disabled) {
                    transform: scale(1.09);
                    box-shadow: 0 8px 28px rgba(0,0,0,.45);
                    filter: brightness(1.1);
                }
                .share-btn:active:not(:disabled) { transform: scale(.94); }
                .share-btn:disabled { cursor: default; }

                .share-icon { display:flex; align-items:center; justify-content:center; }

                /* ── Tick animation ── */
                .share-tick {
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    animation: shareTickPop .3s cubic-bezier(.22,1,.36,1) forwards;
                }
                .share-tick svg {
                    color: #111;
                }
                @keyframes shareTickPop {
                    0%   { transform: scale(.4); opacity:0; }
                    60%  { transform: scale(1.2); opacity:1; }
                    100% { transform: scale(1);   opacity:1; }
                }

                /* ── Button label ── */
                .share-label {
                    font-size: 11px;
                    font-weight: 600;
                    color: #9ca3af;
                    letter-spacing: .01em;
                    white-space: nowrap;
                }

                /* ══════════════════════════════════════════════════════════
                   NORMAL SPINNER
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

                @keyframes spin{
                    from { transform:rotate(0deg); }
                    to   { transform:rotate(360deg); }
                }
            `}</style>
        </div>
    );
};

export default Share;
