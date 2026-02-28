import React, { useState, useEffect, useRef, useCallback } from 'react';
import { ChatSession } from '../../types';
import { SquarePen, Trash2, X, MessageCircle, Search, Calendar, Bot, User, Settings, PanelLeftClose, Image as ImageIcon, LayoutGrid, Terminal, Power, Sparkles, ChevronRight } from 'lucide-react';

interface SidebarProps {
    isOpen: boolean;
    toggleSidebar: () => void;
    sessions: ChatSession[];
    currentSessionId: string | null;
    onSelectSession: (id: string) => void;
    onNewChat: () => void;
    onDeleteSession: (id: string, e: React.MouseEvent) => void;
    isDarkMode: boolean;
    toggleTheme: () => void;
    onOpenSettings: () => void;
    onLogout: () => void;
    onSelectMode?: (id: string) => void;
    t: any;
}

interface MatchResult {
    sessionId: string;
    sessionTitle: string;
    createdAt: number;
    matchCount: number;
    matchedMessages: {
        role: string;
        snippet: string;
    }[];
}

const Sidebar: React.FC<SidebarProps> = ({
    isOpen,
    toggleSidebar,
    sessions,
    currentSessionId,
    onSelectSession,
    onNewChat,
    onDeleteSession,
    isDarkMode,
    toggleTheme,
    onOpenSettings,
    onLogout,
    onSelectMode,
    t
}) => {
    const [isSearchOpen, setIsSearchOpen] = useState(false);
    const [query, setQuery] = useState('');
    const [searchResults, setSearchResults] = useState<MatchResult[]>([]);
    const [isSearchClosing, setIsSearchClosing] = useState(false);


    const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
    const [isLoggingOut, setIsLoggingOut] = useState(false);
    const [isSettingsOpening, setIsSettingsOpening] = useState(false);

    const searchInputRef = useRef<HTMLInputElement>(null);

    // Focus input when search opens
    useEffect(() => {
        if (isSearchOpen) {
            setQuery('');
            setSearchResults([]);
            setTimeout(() => searchInputRef.current?.focus(), 100);
        }
    }, [isSearchOpen]);

    // Search logic
    const extractSnippet = (content: string, term: string) => {
        const index = content.toLowerCase().indexOf(term.toLowerCase());
        if (index === -1) return content.slice(0, 100) + '...';

        const start = Math.max(0, index - 40);
        const end = Math.min(content.length, index + term.length + 40);
        let snippet = content.slice(start, end);
        if (start > 0) snippet = '...' + snippet;
        if (end < content.length) snippet = snippet + '...';
        return snippet;
    };

    useEffect(() => {
        if (!query.trim()) {
            setSearchResults([]);
        } else {
            const lowerQuery = query.toLowerCase();
            const results: MatchResult[] = [];

            sessions.forEach(session => {
                const matches: { role: string; snippet: string }[] = [];
                let matchCount = 0;

                session.messages.forEach(msg => {
                    // Count all occurrences in the message
                    const regex = new RegExp(lowerQuery.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
                    const matchArray = msg.content.match(regex);
                    if (matchArray) {
                        matchCount += matchArray.length;
                        matches.push({
                            role: msg.role,
                            snippet: extractSnippet(msg.content, lowerQuery)
                        });
                    }
                });

                if (matches.length > 0 || session.title.toLowerCase().includes(lowerQuery)) {
                    results.push({
                        sessionId: session.id,
                        sessionTitle: session.title,
                        createdAt: session.createdAt,
                        matchCount: matchCount,
                        matchedMessages: matches.slice(0, 2)
                    });
                }
            });
            setSearchResults(results);
        }
    }, [query, sessions]);

    const handleCloseSearch = () => {
        setIsSearchClosing(true);
        setTimeout(() => {
            setIsSearchOpen(false);
            setIsSearchClosing(false);
        }, 150);
    };

    // Groupings
    const groupSessionsByTime = useCallback((sessionList: ChatSession[]) => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const todayMs = today.getTime();
        const yesterdayMs = todayMs - 86400000;
        const weekAgoMs = todayMs - 7 * 86400000;

        const groups: { label: string; sessions: ChatSession[] }[] = [];

        const todaySessions = sessionList.filter(s => s.createdAt >= todayMs);
        const yesterdaySessions = sessionList.filter(s => s.createdAt >= yesterdayMs && s.createdAt < todayMs);
        const thisWeekSessions = sessionList.filter(s => s.createdAt >= weekAgoMs && s.createdAt < yesterdayMs);
        const olderSessions = sessionList.filter(s => s.createdAt < weekAgoMs);

        if (todaySessions.length > 0) groups.push({ label: 'Today', sessions: todaySessions });
        if (yesterdaySessions.length > 0) groups.push({ label: 'Yesterday', sessions: yesterdaySessions });
        if (thisWeekSessions.length > 0) groups.push({ label: 'Previous 7 Days', sessions: thisWeekSessions });
        if (olderSessions.length > 0) groups.push({ label: 'Older', sessions: olderSessions });

        return groups;
    }, []);

    const sessionGroups = groupSessionsByTime(sessions);

    const formatDate = (ms: number) => {
        const d = new Date(ms);
        return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
    };

    const highlightMatch = (text: string) => {
        if (!query.trim()) return text;
        const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
        const parts = text.split(regex);
        return parts.map((part, i) =>
            regex.test(part) ? (
                <span key={i} className="text-[#10a37f] dark:text-[#10a37f] font-bold bg-[#10a37f]/10 rounded px-0.5">
                    {part}
                </span>
            ) : (
                part
            )
        );
    };

    return (
        <>
            {/* ======================= MAIN SIDEBAR ======================= */}
            <div
                className={`fixed inset-0 bg-black/50 z-20 transition-opacity duration-500 md:hidden ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
                onClick={toggleSidebar}
            />

            <div
                className={`fixed inset-y-0 left-0 z-30 flex flex-col w-[260px] bg-[#f9f9f9] dark:bg-[#171717] border-r border-gray-200 dark:border-transparent sidebar-transition transform ${isOpen ? 'translate-x-0' : '-translate-x-[110%]'
                    } md:static md:translate-x-0 md:h-screen md:w-[260px] overflow-hidden`}
                style={!isOpen && window.innerWidth >= 768 ? { display: 'none' } : {}}
            >
                <div className="flex-1 flex flex-col h-full overflow-hidden">

                    {/* 1. Header (Logo / Collapse) */}
                    <div className="flex items-center justify-between pt-3 pb-2 px-3">
                        <button
                            onClick={toggleSidebar}
                            className="p-2 text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200 rounded-lg hover:bg-gray-200 dark:hover:bg-[#171717] transition-colors"
                            title="Close sidebar"
                        >
                            <PanelLeftClose size={20} />
                        </button>
                        <div className="flex items-center gap-1">
                            <button
                                onClick={onNewChat}
                                className="p-2 text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200 rounded-lg hover:bg-gray-200 dark:hover:bg-[#171717] transition-colors"
                                title="New chat"
                            >
                                <SquarePen size={20} />
                            </button>
                        </div>
                    </div>

                    {/* 2. Top Nav Actions */}
                    <div className="px-3 pb-4 space-y-0.5 mt-2">
                        <button
                            onClick={onNewChat}
                            className="w-full flex items-center gap-3 px-3 py-2 text-[14px] text-gray-900 dark:text-white rounded-lg hover:bg-gray-200 dark:hover:bg-[#171717] transition-colors group"
                        >
                            <SquarePen size={16} className="text-gray-500 dark:text-gray-400 shrink-0" />
                            <span className="font-medium truncate transition-colors">{t.newChat}</span>
                        </button>

                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                if (window.innerWidth < 768) toggleSidebar();
                                setIsSearchOpen(true);
                            }}
                            className="w-full flex items-center gap-3 px-2.5 py-2.5 text-[14px] text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-[#171717] transition-colors group"
                        >
                            <Search size={16} className="text-gray-500 dark:text-gray-400 shrink-0" />
                            <span className="font-medium truncate group-hover:text-gray-900 dark:group-hover:text-white transition-colors">Search chats</span>
                        </button>
                    </div>

                    {/* 3. Sections Container */}
                    <div className="flex-1 overflow-y-auto px-1.5 pb-6 sidebar-scrollbar flex flex-col gap-6">



                        {/* Your chats / History Section */}
                        <div>
                            <div className="px-2 pt-1 pb-2">
                                <span className="text-[12px] font-semibold text-gray-500 dark:text-gray-400">
                                    {t.dataControls}
                                </span>
                            </div>

                            {sessions.length === 0 ? (
                                <div className="text-[13px] text-gray-500/80 dark:text-gray-400/80 px-4 py-4 italic">
                                    No chats yet.
                                </div>
                            ) : (
                                <div className="space-y-4 pb-2">
                                    {sessionGroups.map((group) => (
                                        <div key={group.label} className="flex flex-col gap-0.5">
                                            <div className="text-[11px] font-semibold text-gray-400 dark:text-gray-500 px-3 pb-1">
                                                {group.label}
                                            </div>
                                            {group.sessions.map((session) => (
                                                <div
                                                    key={session.id}
                                                    onClick={() => {
                                                        onSelectSession(session.id);
                                                        if (window.innerWidth < 768) toggleSidebar();
                                                    }}
                                                    className={`group flex items-center gap-3 px-3 py-2 text-[13px] rounded-lg cursor-pointer transition-colors relative mx-1.5 ${currentSessionId === session.id
                                                        ? 'bg-[#ececec] dark:bg-[#171717] text-gray-900 dark:text-gray-100 font-medium'
                                                        : 'text-gray-700 dark:text-[#d1d5db] hover:bg-[#ececec]/50 dark:hover:bg-[#171717]/70'
                                                        }`}
                                                >
                                                    <span className="truncate flex-1 pr-6">{session.title}</span>
                                                    <button
                                                        onClick={(e) => onDeleteSession(session.id, e)}
                                                        className={`absolute right-1 opacity-0 group-hover:opacity-100 p-1.5 text-gray-400 hover:text-red-500 transition-all rounded-md hover:bg-white dark:hover:bg-[#323232] ${currentSessionId === session.id ? 'opacity-100' : ''}`}
                                                    >
                                                        <Trash2 size={14} />
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* 4. Footer (Settings/Profile) */}
                    <div className="flex gap-2 p-3 border-t border-gray-200 dark:border-white/5">
                        <button
                            onClick={() => {
                                setIsSettingsOpening(true);
                                setTimeout(() => {
                                    setIsSettingsOpening(false);
                                    onOpenSettings();
                                }, 400);
                            }}
                            className="flex-1 flex items-center justify-center py-2.5 rounded-xl hover:bg-gray-200 dark:hover:bg-[#171717] transition-colors text-black dark:text-white shadow-sm font-bold group overflow-hidden"
                        >
                            <Settings
                                size={18}
                                className={`transition-all duration-500 ease-in-out ${isSettingsOpening ? 'animate-spin-once' : 'group-hover:rotate-90'}`}
                            />
                        </button>
                        <button
                            onClick={() => setShowLogoutConfirm(true)}
                            className="flex-1 flex items-center justify-center py-2.5 rounded-xl hover:bg-gray-200 dark:hover:bg-[#171717] transition-colors text-gray-500 dark:text-gray-400 hover:text-red-500 dark:hover:text-red-500"
                        >
                            <Power size={18} />
                        </button>
                    </div>
                </div>
            </div>

            {/* ======================= SEARCH POPUP MODAL ======================= */}
            {isSearchOpen && (
                <>
                    <div
                        className={`fixed inset-0 bg-black/60 z-40 transition-all duration-300 backdrop-blur-sm shadow-2xl ${isSearchClosing ? 'opacity-0' : 'opacity-100 animate-in fade-in duration-300'
                            }`}
                        onClick={handleCloseSearch}
                    />

                    <div
                        className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none p-4 sm:p-0"
                        onClick={handleCloseSearch}
                    >
                        <div
                            onClick={(e) => e.stopPropagation()}
                            className={`pointer-events-auto flex flex-col w-[90%] sm:w-[540px] h-[80vh] sm:h-[65vh] bg-[#2d2d2d] dark:bg-[#212121] transition-all duration-300 ease-in-out transform ${isSearchClosing ? 'scale-95 opacity-0 translate-y-4' : 'scale-100 opacity-100 translate-y-0 popup-slow-open'
                                } rounded-2xl border border-white/5 overflow-hidden shadow-[0_8px_30px_rgb(0,0,0,0.4)]`}
                        >
                            {/* Header & Input */}
                            <div className="flex items-center px-4 py-3 border-b border-white/10 bg-[#2d2d2d] dark:bg-[#212121] shrink-0">
                                <input
                                    ref={searchInputRef}
                                    type="text"
                                    className="flex-1 bg-transparent border-none outline-none text-gray-100 placeholder-gray-500 text-[15px] font-medium h-8"
                                    placeholder={t.searchChats || "Search chats..."}
                                    value={query}
                                    onChange={(e) => setQuery(e.target.value)}
                                />
                                <button
                                    onClick={handleCloseSearch}
                                    className="ml-3 p-1.5 text-gray-400 hover:text-gray-200 hover:bg-white/10 rounded-lg transition-colors flex-shrink-0"
                                >
                                    <X size={18} />
                                </button>
                            </div>

                            <div className="flex-1 overflow-y-auto px-2 py-2 pb-6 popup-scrollbar bg-[#292929] dark:bg-[#202020]">

                                {!query.trim() && (
                                    <button
                                        onClick={() => {
                                            onNewChat();
                                            handleCloseSearch();
                                        }}
                                        className="w-[calc(100%-16px)] mx-2 mt-2 mb-4 flex items-center gap-3 px-3 py-3.5 text-[14px] text-gray-200 hover:bg-[#343434] dark:hover:bg-[#2f2f2f] rounded-xl transition-colors group border border-transparent hover:border-white/5"
                                    >
                                        <SquarePen size={18} className="text-gray-400 group-hover:text-gray-200 transition-colors shrink-0" />
                                        <span className="font-medium tracking-wide">New chat</span>
                                    </button>
                                )}

                                {query.trim() && searchResults.length === 0 ? (
                                    <div className="text-[14px] text-gray-500 px-4 py-12 text-center italic">
                                        No matching chats found.
                                    </div>
                                ) : query.trim() ? (
                                    <div className="space-y-3 px-2 mt-2">
                                        {searchResults.map((result) => (
                                            <div
                                                key={result.sessionId}
                                                onClick={() => {
                                                    onSelectSession(result.sessionId);
                                                    handleCloseSearch();
                                                }}
                                                className="p-3 bg-[#3a3a3a]/40 dark:bg-[#2a2a2a] hover:bg-[#3a3a3a]/80 dark:hover:bg-[#353535] rounded-xl cursor-pointer transition-colors border border-transparent hover:border-white/5"
                                            >
                                                <div className="flex items-center justify-between gap-2 mb-2">
                                                    <span className="font-medium text-gray-200 text-[14px] truncate">
                                                        {highlightMatch(result.sessionTitle)}
                                                    </span>
                                                    <div className="flex flex-col items-end gap-1 shrink-0">
                                                        <div className="flex items-center gap-1 text-[10px] text-gray-400 whitespace-nowrap bg-black/20 px-2 py-0.5 rounded-full">
                                                            <Calendar size={10} />
                                                            {formatDate(result.createdAt)}
                                                        </div>
                                                        {result.matchCount > 0 && (
                                                            <span className="text-[10px] text-gray-900 dark:text-white bg-gray-200 dark:bg-white/10 px-1.5 py-0.5 rounded font-medium">
                                                                {result.matchCount} {result.matchCount === 1 ? 'match' : 'matches'}
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>

                                                <div className="space-y-1.5 line-clamp-3">
                                                    {result.matchedMessages.length > 0 ?
                                                        result.matchedMessages.map((msg, idx) => (
                                                            <div key={idx} className="flex gap-2 text-[12px] leading-snug pl-1 border-l-2 border-white/5">
                                                                <span className="text-gray-400 italic">
                                                                    "{highlightMatch(msg.snippet)}"
                                                                </span>
                                                            </div>
                                                        ))
                                                        :
                                                        <span className="text-[12px] text-gray-500 italic">Matched in title only</span>
                                                    }
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="pt-2">
                                        {sessions.length === 0 ? (
                                            <div className="text-[13px] text-gray-500 px-4 py-8 text-center italic">
                                                No chats yet.
                                            </div>
                                        ) : (
                                            sessionGroups.map((group, gIdx) => (
                                                <div key={group.label} className={gIdx > 0 ? "mt-5" : ""}>
                                                    <div className="text-[11px] font-semibold text-gray-400 px-4 pb-2">
                                                        {group.label}
                                                    </div>
                                                    <div className="space-y-0.5 px-2">
                                                        {group.sessions.map((session) => (
                                                            <div
                                                                key={session.id}
                                                                onClick={() => {
                                                                    onSelectSession(session.id);
                                                                    handleCloseSearch();
                                                                }}
                                                                className={`group flex items-center gap-3 px-3 py-3 text-[14px] rounded-xl cursor-pointer transition-colors relative ${currentSessionId === session.id
                                                                    ? 'bg-[#3b3b3b] dark:bg-[#353535] text-white font-medium'
                                                                    : 'text-gray-300 hover:bg-[#343434] dark:hover:bg-[#2f2f2f]'
                                                                    }`}
                                                            >
                                                                <MessageCircle size={16} strokeWidth={1.5} className="text-gray-400 flex-shrink-0 group-hover:text-gray-300 transition-colors" />
                                                                <span className="truncate flex-1 font-normal opacity-90">{session.title}</span>
                                                                <button
                                                                    onClick={(e) => {
                                                                        onDeleteSession(session.id, e);
                                                                        if (currentSessionId === session.id) handleCloseSearch();
                                                                    }}
                                                                    className={`absolute right-2 opacity-0 group-hover:opacity-100 p-1.5 text-gray-500 hover:text-red-400 transition-all rounded-md hover:bg-[#454545] dark:hover:bg-[#404040] ${currentSessionId === session.id ? 'opacity-100' : ''}`}
                                                                >
                                                                    <Trash2 size={15} />
                                                                </button>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </>
            )}

            {/* Logout Confirmation Modal */}
            {showLogoutConfirm && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 p-4 animate-in fade-in duration-200 backdrop-blur-sm">
                    <div className="bg-white dark:bg-[#1e1e1e] rounded-2xl shadow-2xl p-6 w-full max-w-[320px] text-center border border-gray-200 dark:border-white/10 animate-in slide-in-from-bottom-2">
                        <div className="w-12 h-12 bg-red-100 dark:bg-red-500/10 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Power size={24} />
                        </div>
                        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Are you sure?</h3>
                        <p className="text-gray-500 dark:text-gray-400 text-sm mb-6">Confirm logging out of current session and history state.</p>
                        <div className="flex gap-3">
                            <button
                                onClick={() => setShowLogoutConfirm(false)}
                                disabled={isLoggingOut}
                                className="flex-1 py-3 text-sm font-medium rounded-xl border border-gray-200 dark:border-white/10 hover:bg-gray-100 dark:hover:bg-white/5 transition-colors text-gray-700 dark:text-gray-300 disabled:opacity-50"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={() => {
                                    setIsLoggingOut(true);
                                    setTimeout(() => {
                                        onLogout();
                                    }, 1200);
                                }}
                                disabled={isLoggingOut}
                                className="flex-1 relative py-3 text-sm font-bold rounded-xl bg-red-500 hover:bg-red-600 text-white transition-colors overflow-hidden disabled:opacity-90 min-h-[46px]"
                            >
                                {isLoggingOut ? (
                                    <div className="absolute inset-0 flex items-center justify-center bg-red-600">
                                        <div className="custom-spinner-small">
                                            {[...Array(12)].map((_, i) => <span key={i} />)}
                                        </div>
                                    </div>
                                ) : (
                                    "Sure"
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Styles */}
            <style>{`
        .sidebar-scrollbar::-webkit-scrollbar {
            width: 5px;
        }
        .sidebar-scrollbar::-webkit-scrollbar-track {
            background: transparent;
        }
        .sidebar-scrollbar::-webkit-scrollbar-thumb {
            background-color: transparent;
            border-radius: 9999px;
            transition: background-color 0.2s;
        }
        .sidebar-scrollbar:hover::-webkit-scrollbar-thumb {
            background-color: rgba(150, 150, 150, 0.4);
        }

        .custom-spinner-small {
            position: relative;
            width: 20px;   
            height: 20px;
            transform-origin: center center;
            animation: spin 1s linear infinite; 
        }
        .custom-spinner-small span {
            position: absolute;
            width: 2px;
            height: 6px;
            background: #ffffff; 
            border-radius: 2px;
            top: 50%;
            left: 50%;
            transform-origin: 50% 100%;
        }
        .custom-spinner-small span:nth-child(1) { transform: translate(-50%, -100%) rotate(0deg); }
        .custom-spinner-small span:nth-child(2) { transform: translate(-50%, -100%) rotate(30deg); }
        .custom-spinner-small span:nth-child(3) { transform: translate(-50%, -100%) rotate(60deg); }
        .custom-spinner-small span:nth-child(4) { transform: translate(-50%, -100%) rotate(90deg); }
        .custom-spinner-small span:nth-child(5) { transform: translate(-50%, -100%) rotate(120deg); }
        .custom-spinner-small span:nth-child(6) { transform: translate(-50%, -100%) rotate(150deg); }
        .custom-spinner-small span:nth-child(7) { transform: translate(-50%, -100%) rotate(180deg); }
        .custom-spinner-small span:nth-child(8) { transform: translate(-50%, -100%) rotate(210deg); }
        .custom-spinner-small span:nth-child(9) { transform: translate(-50%, -100%) rotate(240deg); }
        .custom-spinner-small span:nth-child(10) { transform: translate(-50%, -100%) rotate(270deg); }
        .custom-spinner-small span:nth-child(11) { transform: translate(-50%, -100%) rotate(300deg); }
        .custom-spinner-small span:nth-child(12) { transform: translate(-50%, -100%) rotate(330deg); }

        @keyframes spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
        }
        @keyframes spin-once {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
        }
        .animate-spin-once {
            animation: spin-once 0.4s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .popup-scrollbar::-webkit-scrollbar {
            width: 8px;
        }
        .popup-scrollbar::-webkit-scrollbar-track {
            background: transparent;
            margin: 4px;
        }
        .popup-scrollbar::-webkit-scrollbar-thumb {
            background-color: #4a4a4a;
            border-radius: 9999px;
            border: 2px solid #292929;
        }
        .dark .popup-scrollbar::-webkit-scrollbar-thumb {
            background-color: #444;
            border: 2px solid #202020;
        }
        .popup-scrollbar::-webkit-scrollbar-thumb:hover {
            background-color: #5a5a5a;
        }
      `}</style>


        </>
    );
};

export default Sidebar;
