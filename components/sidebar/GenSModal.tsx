import React, { useState, useEffect } from 'react';
import {
    X,
    MessageCircle,
    BookOpen,
    FileText,
    FileCode,
    Network,
    Wand2,
    Globe,
    Search,
    Sparkles,
    Layers,
    ChevronRight,
} from 'lucide-react';

interface GenSModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSelectMode?: (id: string) => void;
}

interface AIMode {
    id: string;
    name: string;
    description: string;
    icon: React.ReactNode;
    gradient: string;
    accentColor: string;
}

const aiModes: AIMode[] = [
    {
        id: 'mcq-exam',
        name: 'MCQ Exam',
        description: 'Generate multiple choice questions & practice exams',
        icon: <BookOpen size={20} />,
        gradient: 'from-violet-500/20 to-purple-600/20',
        accentColor: 'text-violet-400',
    },
    {
        id: 'pdf-editor',
        name: 'PDF Editor',
        description: 'Edit, convert and manage PDF documents',
        icon: <FileText size={20} />,
        gradient: 'from-rose-500/20 to-pink-600/20',
        accentColor: 'text-rose-400',
    },
    {
        id: 'file-editor',
        name: 'File Editor',
        description: 'Edit and transform any file with AI assistance',
        icon: <FileCode size={20} />,
        gradient: 'from-cyan-500/20 to-blue-600/20',
        accentColor: 'text-cyan-400',
    },
    {
        id: 'structure-maker',
        name: 'Structure Maker',
        description: 'Create project structures and organize files',
        icon: <Network size={20} />,
        gradient: 'from-emerald-500/20 to-teal-600/20',
        accentColor: 'text-emerald-400',
    },
    {
        id: 'prompt-gen',
        name: 'Prompt Gen',
        description: 'Generate optimized prompts for any AI model',
        icon: <Wand2 size={20} />,
        gradient: 'from-amber-500/20 to-orange-600/20',
        accentColor: 'text-amber-400',
    },
    {
        id: 'website-builder',
        name: 'Website Builder',
        description: 'Build complete websites with code generation',
        icon: <Globe size={20} />,
        gradient: 'from-blue-500/20 to-indigo-600/20',
        accentColor: 'text-blue-400',
    },
    {
        id: 'information-gathering',
        name: 'Information Gathering',
        description: 'Research, collect and summarize information',
        icon: <Search size={20} />,
        gradient: 'from-fuchsia-500/20 to-purple-600/20',
        accentColor: 'text-fuchsia-400',
    },
];

const GenSModal: React.FC<GenSModalProps> = ({ isOpen, onClose, onSelectMode }) => {
    const [isClosing, setIsClosing] = useState(false);
    const [hoveredMode, setHoveredMode] = useState<string | null>(null);

    const handleClose = () => {
        setIsClosing(true);
        setTimeout(() => {
            onClose();
            setIsClosing(false);
        }, 200);
    };

    useEffect(() => {
        if (isOpen) {
            setIsClosing(false);
        }
    }, [isOpen]);

    if (!isOpen) return null;

    return (
        <>
            {/* Backdrop */}
            <div
                className={`fixed inset-0 bg-black/60 z-[70] transition-all duration-300 backdrop-blur-sm ${isClosing ? 'opacity-0' : 'opacity-100 animate-in fade-in duration-300'
                    }`}
                onClick={handleClose}
            />

            {/* Modal Container - centered, mobile responsive */}
            <div
                className="fixed inset-0 z-[80] flex items-start sm:items-center justify-center pointer-events-none p-3 sm:p-4 pt-[10vh] sm:pt-4"
                onClick={handleClose}
            >
                <div
                    onClick={(e) => e.stopPropagation()}
                    className={`pointer-events-auto flex flex-col w-full max-w-[95vw] sm:max-w-[520px] max-h-[80vh] sm:max-h-[70vh] bg-[#1a1a1a] transition-all duration-300 ease-out transform ${isClosing
                        ? 'scale-95 opacity-0 translate-y-4'
                        : 'scale-100 opacity-100 translate-y-0 animate-in fade-in zoom-in-95 slide-in-from-bottom-4 duration-300'
                        } rounded-2xl border border-white/[0.08] overflow-hidden shadow-[0_25px_60px_rgb(0,0,0,0.5)]`}
                >
                    {/* Header */}
                    <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.06] bg-[#1a1a1a] shrink-0">
                        <div className="flex items-center gap-3">
                            <div>
                                <h2 className="text-[17px] font-bold text-white tracking-tight">Gen'S AI modes</h2>
                            </div>
                        </div>
                        <button
                            onClick={handleClose}
                            className="p-2 text-gray-500 hover:text-gray-200 hover:bg-white/10 rounded-xl transition-all duration-200"
                        >
                            <X size={18} />
                        </button>
                    </div>

                    {/* Modes List */}
                    <div className="flex-1 overflow-y-auto px-3 py-3 gens-scrollbar bg-[#161616]">
                        <div className="space-y-1.5">
                            {aiModes.map((mode, index) => (
                                <div
                                    key={mode.id}
                                    onClick={() => {
                                        if (onSelectMode) onSelectMode(mode.id);
                                    }}
                                    className={`group flex items-center gap-3.5 px-3.5 py-3 rounded-xl cursor-pointer transition-all duration-200 border border-transparent hover:border-white/[0.1] relative overflow-hidden ${hoveredMode === mode.id
                                        ? 'bg-white/[0.08]'
                                        : 'bg-transparent hover:bg-white/[0.04]'
                                        }`}
                                    onMouseEnter={() => setHoveredMode(mode.id)}
                                    onMouseLeave={() => setHoveredMode(null)}
                                    style={{ animationDelay: `${index * 50}ms` }}
                                >
                                    {/* Hover glow effect removed for a cleaner look */}
                                    <div
                                        className={`absolute inset-0 bg-white/[0.05] opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-xl`}
                                    />

                                    {/* Mode Icon */}
                                    <div
                                        className={`relative z-10 w-8 h-8 flex items-center justify-center shrink-0 transition-all duration-200 text-white`}
                                    >
                                        {mode.icon}
                                    </div>

                                    {/* Mode Info */}
                                    <div className="relative z-10 flex-1 min-w-0">
                                        <h3 className="text-[14px] font-semibold text-gray-200 group-hover:text-white transition-colors truncate">
                                            {mode.name}
                                        </h3>
                                    </div>

                                    {/* Chat Button */}
                                    <button
                                        className={`relative z-10 p-2.5 rounded-xl shrink-0 transition-all duration-200 ${hoveredMode === mode.id
                                            ? 'bg-white/10 text-white scale-105 shadow-lg shadow-white/10'
                                            : 'text-gray-500 hover:text-gray-300 hover:bg-white/[0.06]'
                                            }`}
                                        title={`Chat with ${mode.name}`}
                                    >
                                        <MessageCircle size={18} strokeWidth={1.8} />
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* Styles */}
            <style>{`
                .gens-scrollbar::-webkit-scrollbar {
                    width: 6px;
                }
                .gens-scrollbar::-webkit-scrollbar-track {
                    background: transparent;
                }
                .gens-scrollbar::-webkit-scrollbar-thumb {
                    background-color: rgba(100, 100, 100, 0.3);
                    border-radius: 9999px;
                }
                .gens-scrollbar::-webkit-scrollbar-thumb:hover {
                    background-color: rgba(140, 140, 140, 0.5);
                }
            `}</style>
        </>
    );
};

export default GenSModal;
