import React, { useState, useEffect } from 'react';
import { X, Settings, Database, Paintbrush, ChevronDown, Check } from 'lucide-react';
import { Language } from '../../utils/translations';

interface SettingsModalProps {
    isOpen: boolean;
    onClose: () => void;
    themeMode: 'light' | 'dark' | 'custom';
    setThemeMode: (mode: 'light' | 'dark' | 'custom') => void;
    accentColor: 'Blue' | 'Green' | 'Yellow' | 'Pink' | 'Orange' | 'White';
    setAccentColor: (color: 'Blue' | 'Green' | 'Yellow' | 'Pink' | 'Orange' | 'White') => void;
    uiLanguage: Language;
    setUiLanguage: (lang: Language) => void;
    contextLevel: number;
    setContextLevel: (level: number) => void;
    customWelcomeText: string;
    setCustomWelcomeText: (text: string) => void;
    onClearHistory: () => void;
    t: any;
}

type SettingsTab = 'general' | 'personalization' | 'datacontrols';

interface TabItem {
    id: SettingsTab;
    label: string;
    icon: React.ReactNode;
}

const SettingsModal: React.FC<SettingsModalProps> = ({
    isOpen,
    onClose,
    themeMode,
    setThemeMode,
    accentColor,
    setAccentColor,
    uiLanguage,
    setUiLanguage,
    customWelcomeText,
    setCustomWelcomeText,
    onClearHistory,
    t,
}) => {
    const [activeTab, setActiveTab] = useState<SettingsTab>('general');
    const [openDropdown, setOpenDropdown] = useState<'theme' | 'accent' | 'lang' | null>(null);

    const TABS: TabItem[] = [
        { id: 'general', label: t.general, icon: <Settings size={18} /> },
        { id: 'personalization', label: t.personalization, icon: <Paintbrush size={18} /> },
        { id: 'datacontrols', label: t.dataControls, icon: <Database size={18} /> },
    ];

    useEffect(() => {
        const handleClickOutside = () => setOpenDropdown(null);
        if (openDropdown) window.addEventListener('click', handleClickOutside);
        return () => window.removeEventListener('click', handleClickOutside);
    }, [openDropdown]);

    if (!isOpen) return null;

    const LANGUAGES = [
        { id: 'en', name: 'English' },
        { id: 'bn', name: 'বাংলা' },
        { id: 'es', name: 'Español' },
        { id: 'fr', name: 'Français' },
        { id: 'de', name: 'Deutsch' },
        { id: 'hi', name: 'हिन्दी' },
        { id: 'ja', name: '日本語' },
        { id: 'zh', name: '中文' },
        { id: 'ru', name: 'Русский' },
        { id: 'pt', name: 'Português' },
        { id: 'ar', name: 'العربية' },
        { id: 'it', name: 'Italiano' },
        { id: 'ko', name: '한국어' },
        { id: 'tr', name: 'Türkçe' },
        { id: 'vi', name: 'Tiếng Việt' },
        { id: 'nl', name: 'Nederlands' },
        { id: 'th', name: 'ไทย' },
    ];

    const ACCENT_COLORS = [
        { name: 'Blue', color: '#3b82f6', label: t.blue },
        { name: 'Green', color: '#22c55e', label: t.green },
        { name: 'Yellow', color: '#eab308', label: t.yellow },
        { name: 'Pink', color: '#ec4899', label: t.pink },
        { name: 'Orange', color: '#f97316', label: t.orange },
        { name: 'White', color: '#ffffff', label: t.white },
    ];

    const THEMES = [
        { id: 'system', name: 'System' },
        { id: 'dark', name: t.dark },
        { id: 'light', name: t.light },
    ];

    const CustomDropdown = ({ id, value, options, onSelect }: { id: any, value: any, options: any[], onSelect: (id: any) => void }) => {
        const isOpen = openDropdown === id;
        const currentOption = options.find(o => o.id === value) || options[0];

        return (
            <div className="relative" onClick={e => e.stopPropagation()}>
                <button
                    onClick={() => setOpenDropdown(isOpen ? null : id)}
                    className="flex justify-between items-center w-[160px] bg-gray-50 dark:bg-[#2d2d2d] hover:bg-gray-100 dark:hover:bg-[#363636] py-2.5 px-3.5 rounded-xl transition-all text-sm font-medium border border-gray-200 dark:border-[#444] shadow-sm"
                >
                    <span className="text-gray-900 dark:text-gray-100">{currentOption.name || currentOption.label}</span>
                    <ChevronDown size={16} className={`text-gray-500 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
                </button>

                {isOpen && (
                    <div className="absolute right-0 top-full mt-2 w-[160px] bg-white dark:bg-[#333] border border-gray-200 dark:border-[#444] rounded-xl shadow-xl z-[110] py-1.5 animate-in fade-in zoom-in-95 duration-200 max-h-64 overflow-y-auto custom-scrollbar">
                        {options.map((opt) => (
                            <button
                                key={opt.id}
                                onClick={() => { onSelect(opt.id); setOpenDropdown(null); }}
                                className="w-full flex items-center justify-between px-3 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-white/5 transition-colors"
                            >
                                <span className={value === opt.id ? 'font-medium' : ''}>{opt.name || opt.label}</span>
                                {value === opt.id && <Check size={16} className="text-gray-900 dark:text-gray-100" />}
                            </button>
                        ))}
                    </div>
                )}
            </div>
        );
    };

    const renderGeneralContent = () => (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300 mt-2">
            {/* Appearance */}
            <div className="flex items-center justify-between pb-6 border-b border-gray-100 dark:border-white/5">
                <div>
                    <h4 className="text-[15px] font-semibold text-gray-900 dark:text-white">{t.appearance}</h4>
                    <p className="text-[13px] text-gray-500 mt-1">Choose your preferred theme.</p>
                </div>
                <CustomDropdown
                    id="theme"
                    value={themeMode === 'custom' ? 'dark' : themeMode}
                    options={THEMES}
                    onSelect={(id) => setThemeMode(id as any)}
                />
            </div>

            {/* Language */}
            <div className="flex items-center justify-between pb-6 border-b border-gray-100 dark:border-white/5">
                <div>
                    <h4 className="text-[15px] font-semibold text-gray-900 dark:text-white">{t.language}</h4>
                    <p className="text-[13px] text-gray-500 mt-1">Select the application language.</p>
                </div>
                <CustomDropdown
                    id="lang"
                    value={uiLanguage}
                    options={LANGUAGES}
                    onSelect={(id) => setUiLanguage(id as Language)}
                />
            </div>
        </div>
    );

    const renderPersonalizationContent = () => (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300 mt-2">
            {/* Custom Welcome Message */}
            <div className="flex items-center justify-between pb-6 border-b border-gray-100 dark:border-white/5">
                <div className="flex-1 mr-4">
                    <h4 className="text-[15px] font-semibold text-gray-900 dark:text-white">Custom Welcome Message</h4>
                    <p className="text-[13px] text-gray-500 mt-1">Personalize the welcome text.</p>
                </div>
                <div className="w-[50%]">
                    <input
                        type="text"
                        value={customWelcomeText}
                        onChange={(e) => setCustomWelcomeText(e.target.value)}
                        placeholder="Welcome to my X-community"
                        className="w-full bg-gray-50 dark:bg-[#2d2d2d] focus:bg-white dark:focus:bg-[#1f1f1f] text-gray-900 dark:text-gray-100 placeholder-gray-400 text-sm rounded-xl px-4 py-2.5 outline-none border border-gray-200 dark:border-[#444] focus:border-[var(--accent-color)] transition-all shadow-sm"
                    />
                </div>
            </div>

            {/* Accent Color */}
            <div className="flex items-center justify-between pb-6 border-b border-gray-100 dark:border-white/5">
                <div>
                    <h4 className="text-[15px] font-semibold text-gray-900 dark:text-white">{t.accentColor}</h4>
                    <p className="text-[13px] text-gray-500 mt-1">Change the primary accent color.</p>
                </div>
                <div className="flex flex-wrap gap-2 max-w-[160px] justify-end">
                    {ACCENT_COLORS.map((color) => (
                        <button
                            key={color.name}
                            onClick={() => setAccentColor(color.name as any)}
                            className={`w-8 h-8 rounded-full border-2 transition-all hover:scale-110 active:scale-95 relative ${accentColor === color.name
                                ? 'border-gray-900 dark:border-white shadow-md'
                                : 'border-transparent shadow-sm'
                                }`}
                            style={{ backgroundColor: color.color }}
                            title={color.label}
                        >
                            {accentColor === color.name && (
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <Check size={16} className={color.name === 'White' || color.name === 'Yellow' ? 'text-black' : 'text-white'} strokeWidth={3} />
                                </div>
                            )}
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );

    const renderDataContent = () => (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300 mt-2">
            <div className="flex items-center justify-between p-5 bg-red-50/50 dark:bg-red-500/5 rounded-2xl border border-red-100 dark:border-red-500/10">
                <div>
                    <h4 className="text-[15px] font-bold text-red-600 dark:text-red-400">{t.clearHistory}</h4>
                    <p className="text-[13px] text-red-500/70 mt-1">Permanently erase all chat data and active sessions.</p>
                </div>
                <button
                    onClick={onClearHistory}
                    className="px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-full text-[13px] font-black tracking-wide transition-all shadow-lg active:scale-95"
                >
                    {t.delete}
                </button>
            </div>
        </div>
    );

    const activeTabLabel = TABS.find(t => t.id === activeTab)?.label || t.general;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-300 font-sans" onClick={onClose}>
            <div className="bg-white dark:bg-[#1a1a1a] w-full max-w-[760px] md:h-[65vh] h-[85vh] rounded-3xl shadow-[0_20px_70px_rgba(0,0,0,0.5)] overflow-hidden border border-gray-100/50 dark:border-white/5 flex flex-col md:flex-row shadow-2xl" onClick={e => e.stopPropagation()}>

                {/* Mobile Header (Only visible on small screens) */}
                <div className="md:hidden flex flex-row items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-white/5 bg-gray-50/80 dark:bg-[#1e1e1e]/80">
                    <h2 className="text-[16px] font-bold text-gray-900 dark:text-white tracking-tight">{t.settings}</h2>
                    <button onClick={onClose} className="p-2 hover:bg-gray-200 dark:hover:bg-white/10 rounded-full text-gray-500 transition-colors">
                        <X size={18} />
                    </button>
                </div>

                {/* Left Sidebar Layout */}
                <div className="w-full md:w-[240px] shrink-0 border-b md:border-b-0 md:border-r border-gray-100 dark:border-white/5 bg-gray-50/50 dark:bg-[#1e1e1e]/50 flex flex-row md:flex-col gap-1 p-3 md:p-5 overflow-x-auto md:overflow-y-auto no-scrollbar">
                    <div className="hidden md:block mb-6 mt-2 px-1">
                        <h2 className="text-xl font-bold text-gray-900 dark:text-white">Settings</h2>
                    </div>
                    {TABS.map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`flex flex-row items-center gap-3 px-4 py-2.5 md:py-3.5 rounded-xl text-[14px] font-medium transition-colors whitespace-nowrap ${activeTab === tab.id
                                ? 'bg-white dark:bg-[#2a2a2a] text-gray-900 dark:text-white shadow-sm border border-gray-200/50 dark:border-white/5'
                                : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/5 border border-transparent'
                                }`}
                        >
                            <span className={activeTab === tab.id ? 'text-[var(--accent-color)]' : ''}>{tab.icon}</span>
                            {tab.label}
                        </button>
                    ))}
                </div>

                {/* Content Area */}
                <div className="flex-1 flex flex-col overflow-hidden relative bg-white dark:bg-[#1a1a1a]">
                    <div className="hidden md:flex absolute top-5 right-5 z-10">
                        <button onClick={onClose} className="p-2.5 hover:bg-gray-100 dark:hover:bg-white/10 rounded-full text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors">
                            <X size={20} />
                        </button>
                    </div>
                    <div className="flex-1 overflow-y-auto p-6 md:p-10 custom-scrollbar">
                        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-8 pb-3 border-b border-gray-100 dark:border-white/5 capitalize hidden md:block">
                            {activeTabLabel}
                        </h3>
                        {activeTab === 'general' && renderGeneralContent()}
                        {activeTab === 'personalization' && renderPersonalizationContent()}
                        {activeTab === 'datacontrols' && renderDataContent()}
                    </div>
                </div>

            </div>

            <style>{`
                .custom-scrollbar::-webkit-scrollbar { width: 5px; }
                .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(150, 150, 150, 0.2); border-radius: 10px; }
                .no-scrollbar::-webkit-scrollbar { display: none; }
                .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
            `}</style>
        </div>
    );
};

export default SettingsModal;

