import React, { useState, useRef, useEffect } from 'react';
import { User, Check, X, Menu, Send, RotateCcw, Trophy, Zap, BookOpen, GraduationCap, Target } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

/* ═══════════════════════════════════════════
   DATA CONSTANTS
   ═══════════════════════════════════════════ */

const CLASSES = ['Class 5', 'Class 6', 'Class 7', 'Class 8', 'Class 9', 'Class 10', 'Intermediate', 'Honours'];

const SUBJECT_MAP: Record<string, string[]> = {
    'Class 5': ['Bangla', 'English', 'Math', 'Science', 'Bangladesh & Global Studies'],
    'Class 6': ['Bangla', 'English', 'Math', 'Science', 'Bangladesh & Global Studies', 'ICT'],
    'Class 7': ['Bangla', 'English', 'Math', 'Science', 'Bangladesh & Global Studies', 'ICT'],
    'Class 8': ['Bangla', 'English', 'Math', 'Science', 'Bangladesh & Global Studies', 'ICT'],
    'Class 9': ['Bangla', 'English', 'Math', 'Physics', 'Chemistry', 'Biology', 'Higher Math', 'ICT', 'Accounting', 'Finance & Banking', 'Economics'],
    'Class 10': ['Bangla', 'English', 'Math', 'Physics', 'Chemistry', 'Biology', 'Higher Math', 'ICT', 'Accounting', 'Finance & Banking', 'Economics'],
    'Intermediate': ['Bangla', 'English', 'Physics', 'Chemistry', 'Biology', 'Higher Math', 'ICT', 'Accounting', 'Finance & Banking', 'Economics', 'Statistics'],
    'Honours': ['Bangla', 'English', 'Physics', 'Chemistry', 'Biology', 'Mathematics', 'Computer Science', 'Economics', 'Accounting', 'Management'],
};

const CHAPTER_MAP: Record<string, Record<string, string[]>> = {
    'Class 5': {
        'Bangla': ['Chapter 1: আমাদের পরিচয়', 'Chapter 2: ভাষার কথা', 'Chapter 3: পাঠ অনুশীলন', 'Chapter 4: বানান শিক্ষা', 'Chapter 5: রচনা'],
        'English': ['Chapter 1: Greetings', 'Chapter 2: My Family', 'Chapter 3: Our School', 'Chapter 4: Food & Health', 'Chapter 5: Nature'],
        'Math': ['Chapter 1: Numbers', 'Chapter 2: Addition', 'Chapter 3: Subtraction', 'Chapter 4: Multiplication', 'Chapter 5: Division'],
        'Science': ['Chapter 1: Living Things', 'Chapter 2: Plants', 'Chapter 3: Animals', 'Chapter 4: Our Body', 'Chapter 5: Environment'],
        'Bangladesh & Global Studies': ['Chapter 1: Our Country', 'Chapter 2: History', 'Chapter 3: Culture', 'Chapter 4: Society', 'Chapter 5: Geography'],
    },
    'Class 6': {
        'Bangla': ['Chapter 1: সুভাষ', 'Chapter 2: ভাব ও কাজ', 'Chapter 3: কবিতা পাঠ', 'Chapter 4: গল্প পাঠ', 'Chapter 5: ব্যাকরণ'],
        'English': ['Chapter 1: Going Places', 'Chapter 2: Pastimes', 'Chapter 3: Values', 'Chapter 4: Health & Hygiene', 'Chapter 5: Travel'],
        'Math': ['Chapter 1: Natural Numbers', 'Chapter 2: Fractions', 'Chapter 3: Decimals', 'Chapter 4: Geometry', 'Chapter 5: Measurement'],
        'Science': ['Chapter 1: Matter', 'Chapter 2: Force & Motion', 'Chapter 3: Energy', 'Chapter 4: Living World', 'Chapter 5: Earth & Space'],
        'Bangladesh & Global Studies': ['Chapter 1: Bangladesh History', 'Chapter 2: Society', 'Chapter 3: Resources', 'Chapter 4: Government', 'Chapter 5: Global Relations'],
        'ICT': ['Chapter 1: Introduction to ICT', 'Chapter 2: Computer Basics', 'Chapter 3: Internet', 'Chapter 4: Word Processing', 'Chapter 5: Safety Online'],
    },
    'Class 7': {
        'Bangla': ['Chapter 1: কাব্য পরিচিতি', 'Chapter 2: গদ্য পরিচিতি', 'Chapter 3: ব্যাকরণ', 'Chapter 4: রচনা', 'Chapter 5: পত্র লিখন'],
        'English': ['Chapter 1: Conversation', 'Chapter 2: Reading', 'Chapter 3: Writing', 'Chapter 4: Grammar', 'Chapter 5: Literature'],
        'Math': ['Chapter 1: Rational Numbers', 'Chapter 2: Algebra', 'Chapter 3: Geometry', 'Chapter 4: Statistics', 'Chapter 5: Sets'],
        'Science': ['Chapter 1: Scientific Investigation', 'Chapter 2: Cells', 'Chapter 3: Atoms', 'Chapter 4: Light', 'Chapter 5: Sound'],
        'Bangladesh & Global Studies': ['Chapter 1: Liberation War', 'Chapter 2: Culture & Heritage', 'Chapter 3: Population', 'Chapter 4: Climate', 'Chapter 5: Economy'],
        'ICT': ['Chapter 1: Digital Devices', 'Chapter 2: Programming Basics', 'Chapter 3: Spreadsheet', 'Chapter 4: Multimedia', 'Chapter 5: Cyber Security'],
    },
    'Class 8': {
        'Bangla': ['Chapter 1: সাহিত্য পাঠ', 'Chapter 2: কবিতা', 'Chapter 3: গল্প ও উপন্যাস', 'Chapter 4: ব্যাকরণ ও রচনা', 'Chapter 5: ভাষা অনুশীলন'],
        'English': ['Chapter 1: Narration', 'Chapter 2: Tenses', 'Chapter 3: Voice', 'Chapter 4: Composition', 'Chapter 5: Comprehension'],
        'Math': ['Chapter 1: Patterns', 'Chapter 2: Profit & Loss', 'Chapter 3: Exponents', 'Chapter 4: Quadrilaterals', 'Chapter 5: Data Handling'],
        'Science': ['Chapter 1: Microorganisms', 'Chapter 2: Metals & Non-metals', 'Chapter 3: Electricity', 'Chapter 4: Reproduction', 'Chapter 5: Pollution'],
        'Bangladesh & Global Studies': ['Chapter 1: Constitution', 'Chapter 2: Rights', 'Chapter 3: Development', 'Chapter 4: ICT in Society', 'Chapter 5: Natural Disasters'],
        'ICT': ['Chapter 1: Algorithm', 'Chapter 2: Database', 'Chapter 3: Web Design', 'Chapter 4: E-commerce', 'Chapter 5: Robotics'],
    },
    'Class 9': {
        'Bangla': ['Chapter 1: কবিতা সংকলন', 'Chapter 2: গল্প সংকলন', 'Chapter 3: উপন্যাস', 'Chapter 4: নাটক', 'Chapter 5: ব্যাকরণ ও রচনা'],
        'English': ['Chapter 1: Prose', 'Chapter 2: Poetry', 'Chapter 3: Grammar', 'Chapter 4: Writing Skills', 'Chapter 5: Literature'],
        'Math': ['Chapter 1: Real Numbers', 'Chapter 2: Sets & Functions', 'Chapter 3: Algebraic Expressions', 'Chapter 4: Geometry Theorems', 'Chapter 5: Trigonometry'],
        'Physics': ['Chapter 1: Physical Quantities', 'Chapter 2: Motion', 'Chapter 3: Force', 'Chapter 4: Work & Energy', 'Chapter 5: Sound & Waves'],
        'Chemistry': ['Chapter 1: Chemical Bonding', 'Chapter 2: States of Matter', 'Chapter 3: Periodic Table', 'Chapter 4: Reactions', 'Chapter 5: Organic Chemistry'],
        'Biology': ['Chapter 1: Cell Biology', 'Chapter 2: Genetics', 'Chapter 3: Anatomy', 'Chapter 4: Ecology', 'Chapter 5: Evolution'],
        'Higher Math': ['Chapter 1: Sets', 'Chapter 2: Functions', 'Chapter 3: Trigonometry', 'Chapter 4: Coordinate Geometry', 'Chapter 5: Calculus Intro'],
        'ICT': ['Chapter 1: Number Systems', 'Chapter 2: Programming C', 'Chapter 3: HTML & CSS', 'Chapter 4: Database Management', 'Chapter 5: Networking'],
        'Accounting': ['Chapter 1: Introduction', 'Chapter 2: Journal', 'Chapter 3: Ledger', 'Chapter 4: Trial Balance', 'Chapter 5: Financial Statements'],
        'Finance & Banking': ['Chapter 1: Finance Basics', 'Chapter 2: Banking', 'Chapter 3: Insurance', 'Chapter 4: Capital Market', 'Chapter 5: Financial Planning'],
        'Economics': ['Chapter 1: Basic Economics', 'Chapter 2: Demand & Supply', 'Chapter 3: National Income', 'Chapter 4: Money & Banking', 'Chapter 5: International Trade'],
    },
    'Class 10': {
        'Bangla': ['Chapter 1: কবিতা সংকলন', 'Chapter 2: গল্প সংকলন', 'Chapter 3: উপন্যাস', 'Chapter 4: নাটক', 'Chapter 5: ব্যাকরণ ও রচনা'],
        'English': ['Chapter 1: Prose', 'Chapter 2: Poetry', 'Chapter 3: Grammar', 'Chapter 4: Writing Skills', 'Chapter 5: Literature'],
        'Math': ['Chapter 1: Real Numbers', 'Chapter 2: Polynomials', 'Chapter 3: Linear Equations', 'Chapter 4: Triangles', 'Chapter 5: Statistics & Probability'],
        'Physics': ['Chapter 1: Measurement', 'Chapter 2: Laws of Motion', 'Chapter 3: Gravitation', 'Chapter 4: Pressure', 'Chapter 5: Electricity'],
        'Chemistry': ['Chapter 1: Acids & Bases', 'Chapter 2: Chemical Reactions', 'Chapter 3: Carbon Compounds', 'Chapter 4: Metals', 'Chapter 5: Environment Chemistry'],
        'Biology': ['Chapter 1: Life Processes', 'Chapter 2: Control & Coordination', 'Chapter 3: Reproduction', 'Chapter 4: Heredity', 'Chapter 5: Environment'],
        'Higher Math': ['Chapter 1: Logarithm', 'Chapter 2: Sequences', 'Chapter 3: Vectors', 'Chapter 4: Matrix', 'Chapter 5: Probability'],
        'ICT': ['Chapter 1: Communication Systems', 'Chapter 2: Website Development', 'Chapter 3: Programming', 'Chapter 4: Database', 'Chapter 5: Cyber Ethics'],
        'Accounting': ['Chapter 1: Accounting Cycle', 'Chapter 2: Adjustments', 'Chapter 3: Bank Reconciliation', 'Chapter 4: Financial Analysis', 'Chapter 5: Partnership'],
        'Finance & Banking': ['Chapter 1: Financial Institutions', 'Chapter 2: Credit', 'Chapter 3: Investment', 'Chapter 4: Risk Management', 'Chapter 5: Tax'],
        'Economics': ['Chapter 1: Microeconomics', 'Chapter 2: Macroeconomics', 'Chapter 3: Public Finance', 'Chapter 4: Development', 'Chapter 5: Globalization'],
    },
    'Intermediate': {
        'Bangla': ['Chapter 1: সাহিত্যের ইতিহাস', 'Chapter 2: কাব্য বিশ্লেষণ', 'Chapter 3: গদ্য বিশ্লেষণ', 'Chapter 4: ব্যাকরণ', 'Chapter 5: রচনা ও প্রবন্ধ'],
        'English': ['Chapter 1: Advanced Grammar', 'Chapter 2: Essay Writing', 'Chapter 3: Comprehension', 'Chapter 4: Translation', 'Chapter 5: Literature Analysis'],
        'Physics': ['Chapter 1: Vectors', 'Chapter 2: Dynamics', 'Chapter 3: Thermodynamics', 'Chapter 4: Optics', 'Chapter 5: Modern Physics'],
        'Chemistry': ['Chapter 1: Atomic Structure', 'Chapter 2: Chemical Equilibrium', 'Chapter 3: Electrochemistry', 'Chapter 4: Organic Reactions', 'Chapter 5: Polymers'],
        'Biology': ['Chapter 1: Molecular Biology', 'Chapter 2: Plant Physiology', 'Chapter 3: Animal Physiology', 'Chapter 4: Microbiology', 'Chapter 5: Biotechnology'],
        'Higher Math': ['Chapter 1: Complex Numbers', 'Chapter 2: Differential Calculus', 'Chapter 3: Integral Calculus', 'Chapter 4: Differential Equations', 'Chapter 5: Linear Algebra'],
        'ICT': ['Chapter 1: Data Communication', 'Chapter 2: Programming (C/Java)', 'Chapter 3: Database Design', 'Chapter 4: Web Technology', 'Chapter 5: AI Basics'],
        'Accounting': ['Chapter 1: Cost Accounting', 'Chapter 2: Company Accounts', 'Chapter 3: Audit', 'Chapter 4: Management Accounting', 'Chapter 5: Tax Accounting'],
        'Finance & Banking': ['Chapter 1: Financial Management', 'Chapter 2: Stock Market', 'Chapter 3: Banking Operations', 'Chapter 4: International Finance', 'Chapter 5: Financial Derivatives'],
        'Economics': ['Chapter 1: Micro Theory', 'Chapter 2: Macro Theory', 'Chapter 3: Statistics', 'Chapter 4: Development Economics', 'Chapter 5: Bangladesh Economy'],
        'Statistics': ['Chapter 1: Probability', 'Chapter 2: Distributions', 'Chapter 3: Regression', 'Chapter 4: Hypothesis Testing', 'Chapter 5: Sampling'],
    },
    'Honours': {
        'Bangla': ['Chapter 1: প্রাচীন সাহিত্য', 'Chapter 2: মধ্যযুগীয় সাহিত্য', 'Chapter 3: আধুনিক সাহিত্য', 'Chapter 4: ভাষাতত্ত্ব', 'Chapter 5: সমালোচনা'],
        'English': ['Chapter 1: Linguistics', 'Chapter 2: British Literature', 'Chapter 3: Post-colonial Literature', 'Chapter 4: Literary Criticism', 'Chapter 5: Research Methods'],
        'Physics': ['Chapter 1: Classical Mechanics', 'Chapter 2: Electromagnetism', 'Chapter 3: Quantum Mechanics', 'Chapter 4: Statistical Mechanics', 'Chapter 5: Nuclear Physics'],
        'Chemistry': ['Chapter 1: Inorganic Chemistry', 'Chapter 2: Organic Chemistry', 'Chapter 3: Physical Chemistry', 'Chapter 4: Analytical Chemistry', 'Chapter 5: Biochemistry'],
        'Biology': ['Chapter 1: Genetics & Molecular Biology', 'Chapter 2: Ecology & Evolution', 'Chapter 3: Biochemistry', 'Chapter 4: Immunology', 'Chapter 5: Bioinformatics'],
        'Mathematics': ['Chapter 1: Abstract Algebra', 'Chapter 2: Real Analysis', 'Chapter 3: Complex Analysis', 'Chapter 4: Topology', 'Chapter 5: Numerical Methods'],
        'Computer Science': ['Chapter 1: Data Structures', 'Chapter 2: Algorithms', 'Chapter 3: Operating Systems', 'Chapter 4: Computer Networks', 'Chapter 5: Machine Learning'],
        'Economics': ['Chapter 1: Microeconomic Theory', 'Chapter 2: Macroeconomic Theory', 'Chapter 3: Econometrics', 'Chapter 4: International Economics', 'Chapter 5: Game Theory'],
        'Accounting': ['Chapter 1: Financial Accounting', 'Chapter 2: Cost & Management Accounting', 'Chapter 3: Auditing', 'Chapter 4: Taxation', 'Chapter 5: Corporate Governance'],
        'Management': ['Chapter 1: Organizational Behavior', 'Chapter 2: Marketing Management', 'Chapter 3: HRM', 'Chapter 4: Strategic Management', 'Chapter 5: Project Management'],
    },
};

const DIFFICULTIES = ['Easy', 'Normal', 'Hard'];

/* ═══════════════════════════════════════════
   TYPES
   ═══════════════════════════════════════════ */

type WidgetType = 'class' | 'subject' | 'chapter' | 'limit' | 'difficulty' | 'mcq' | 'result';

interface ChatEntry {
    id: string;
    role: 'user' | 'assistant';
    content: string;
    widget?: WidgetType;
    widgetData?: any;
    isProcessed?: boolean;
}

interface MCQQuestion {
    question: string;
    options: string[];
    correctIndex: number;
    explanation: string;
}

/* ═══════════════════════════════════════════
   AVATAR COMPONENTS (matches ChatMessage.tsx)
   ═══════════════════════════════════════════ */

const Avatars = {
    user: () => (
        <div className="w-8 h-8 rounded-full bg-black dark:bg-white flex items-center justify-center shadow-md shrink-0">
            <User size={18} className="text-white dark:text-black" />
        </div>
    ),
    assistant: () => (
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-md shrink-0 border border-white/10">
            <span className="text-white font-black text-xs tracking-tight">X</span>
        </div>
    )
};

/* ═══════════════════════════════════════════
   MCQ COMPONENT
   ═══════════════════════════════════════════ */

const MCQ: React.FC = () => {
    const [selectedClass, setSelectedClass] = useState<string>('');
    const [selectedSubject, setSelectedSubject] = useState<string>('');
    const [selectedChapter, setSelectedChapter] = useState<string>('');
    const [mcqLimit, setMcqLimit] = useState<number>(0);
    const [difficulty, setDifficulty] = useState<string>('');
    const [score, setScore] = useState(0);
    const [mcqQuestions, setMcqQuestions] = useState<MCQQuestion[]>([]);
    const [currentQIndex, setCurrentQIndex] = useState(0);

    const [chatLog, setChatLog] = useState<ChatEntry[]>([
        {
            id: 'init-1',
            role: 'assistant',
            content: "🎓 Welcome to the **MCQ Exam Engine!**\n\nLet's set up your exam. First, please select your **academic level** below:",
            widget: 'class',
            isProcessed: false
        }
    ]);

    const scrollContainerRef = useRef<HTMLDivElement>(null);
    const bottomRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (scrollContainerRef.current) {
            scrollContainerRef.current.scrollTo({
                top: scrollContainerRef.current.scrollHeight,
                behavior: 'smooth'
            });
        }
    }, [chatLog]);

    const markLastAsProcessed = () => {
        setChatLog(prev => {
            const newLog = [...prev];
            for (let i = newLog.length - 1; i >= 0; i--) {
                if (newLog[i].role === 'assistant' && !newLog[i].isProcessed) {
                    newLog[i] = { ...newLog[i], isProcessed: true };
                    break;
                }
            }
            return newLog;
        });
    };

    const pushMessage = (role: 'user' | 'assistant', content: string, widget?: WidgetType, widgetData?: any) => {
        setChatLog(prev => [...prev, {
            id: Date.now().toString() + Math.random().toString(),
            role,
            content,
            widget,
            widgetData,
            isProcessed: false
        }]);
    };

    /* ── HANDLERS ── */

    const handleClassSelect = (cls: string) => {
        markLastAsProcessed();
        setSelectedClass(cls);
        pushMessage('user', cls);
        setTimeout(() => {
            pushMessage('assistant', `📚 Great choice! Now select your **subject** for **${cls}**:`, 'subject', { className: cls });
        }, 400);
    };

    const handleSubjectSelect = (subj: string) => {
        markLastAsProcessed();
        setSelectedSubject(subj);
        pushMessage('user', subj);
        setTimeout(() => {
            pushMessage('assistant', `📖 Select the **chapter** you want to practice from **${subj}**:`, 'chapter', { className: selectedClass, subject: subj });
        }, 400);
    };

    const handleChapterSelect = (chap: string) => {
        markLastAsProcessed();
        setSelectedChapter(chap);
        pushMessage('user', chap);
        setTimeout(() => {
            pushMessage('assistant', `🔢 How many MCQs would you like? Enter a number between **1** and **50**:`, 'limit');
        }, 400);
    };

    const handleLimitSelect = (limit: number) => {
        markLastAsProcessed();
        setMcqLimit(limit);
        pushMessage('user', `${limit} MCQs`);
        setTimeout(() => {
            pushMessage('assistant', `⚡ Almost ready! Choose your **difficulty level**:`, 'difficulty');
        }, 400);
    };

    const handleDifficultySelect = (diff: string) => {
        markLastAsProcessed();
        setDifficulty(diff);
        pushMessage('user', diff);
        setTimeout(() => {
            generateMCQs(diff);
        }, 600);
    };

    /* ── MCQ GENERATION ── */

    const generateMCQs = (diff: string) => {
        const generated: MCQQuestion[] = [];
        const optionLabels = ['A', 'B', 'C', 'D'];

        for (let i = 0; i < mcqLimit; i++) {
            const correctIdx = Math.floor(Math.random() * 4);
            const opts = optionLabels.map((label, idx) => {
                if (idx === correctIdx) return `Correct Answer (${label})`;
                return `Option ${label} for Q${i + 1}`;
            });

            generated.push({
                question: `[${selectedClass}] ${selectedSubject} — ${selectedChapter}\n\n**Question ${i + 1}:** This is a ${diff.toLowerCase()} level question about ${selectedSubject} from ${selectedChapter}. What is the correct answer?`,
                options: opts,
                correctIndex: correctIdx,
                explanation: `The correct answer is **Option ${optionLabels[correctIdx]}**. This relates to the concept covered in ${selectedChapter} of ${selectedSubject}.`
            });
        }

        setMcqQuestions(generated);
        setScore(0);
        setCurrentQIndex(0);

        const headerInfo = `📝 **Exam Starting!**\n\n` +
            `**Class:** ${selectedClass}\n` +
            `**Subject:** ${selectedSubject}\n` +
            `**Chapter:** ${selectedChapter}\n` +
            `**Questions:** ${mcqLimit}\n` +
            `**Difficulty:** ${diff}`;

        pushMessage('assistant', headerInfo);

        setTimeout(() => {
            pushMessage('assistant', `**Question 1 of ${mcqLimit}**`, 'mcq', {
                qIndex: 0,
                items: generated,
                score: 0,
                selectedOptionIdx: undefined
            });
        }, 800);
    };

    /* ── ANSWER HANDLER ── */

    const handleAnswerQuestion = (qIndex: number, selectedOptionIdx: number, isCorrect: boolean, question: MCQQuestion) => {
        setChatLog(prev => {
            const newLog = [...prev];
            const lastEntry = newLog[newLog.length - 1];
            if (lastEntry.widget === 'mcq') {
                lastEntry.widgetData = { ...lastEntry.widgetData, selectedOptionIdx };
                lastEntry.isProcessed = true;
            }
            return [...newLog];
        });

        let newScore = score;
        if (isCorrect) {
            newScore++;
            setScore(newScore);
        }

        setTimeout(() => {
            const answerMsg = isCorrect
                ? `✅ **Correct!** Well done!\n\n${question.explanation}`
                : `❌ **Wrong!**\n\n${question.explanation}`;

            pushMessage('assistant', answerMsg);

            setTimeout(() => {
                if (qIndex + 1 < mcqQuestions.length) {
                    setCurrentQIndex(qIndex + 1);
                    pushMessage('assistant', `**Question ${qIndex + 2} of ${mcqQuestions.length}**`, 'mcq', {
                        qIndex: qIndex + 1,
                        items: mcqQuestions,
                        score: newScore,
                        selectedOptionIdx: undefined
                    });
                } else {
                    pushMessage('assistant', `🏆 **Exam Complete!** Let's see how you did...`, 'result', {
                        finalScore: newScore,
                        total: mcqQuestions.length,
                        className: selectedClass,
                        subject: selectedSubject,
                        chapter: selectedChapter,
                        difficulty: difficulty
                    });
                }
            }, 1200);
        }, 800);
    };

    /* ── RESTART ── */

    const handleRestart = () => {
        setSelectedClass('');
        setSelectedSubject('');
        setSelectedChapter('');
        setMcqLimit(0);
        setDifficulty('');
        setScore(0);
        setMcqQuestions([]);
        setCurrentQIndex(0);
        setChatLog([{
            id: 'init-' + Date.now(),
            role: 'assistant',
            content: "🎓 Welcome back! Let's start a new exam.\n\nSelect your **academic level**:",
            widget: 'class',
            isProcessed: false
        }]);
    };

    /* ═══════════════════════════════════════════
       RENDER: MESSAGE BUBBLE (ChatMessage-style)
       ═══════════════════════════════════════════ */

    const renderMessageBubble = (entry: ChatEntry) => {
        const isUser = entry.role === 'user';

        return (
            <div key={entry.id} className="w-full py-1.5 px-2 sm:px-3 md:px-4 animate-in slide-in-from-bottom-2 fade-in duration-300">
                <div className={`max-w-4xl mx-auto flex gap-2.5 sm:gap-3 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>

                    {/* Avatar */}
                    <div className="pt-0.5">
                        {isUser ? Avatars.user() : Avatars.assistant()}
                    </div>

                    <div className={`relative max-w-[85%] sm:max-w-[75%] flex flex-col ${isUser ? 'items-end' : 'items-start'} min-w-0`}>
                        {/* Text Bubble */}
                        {entry.content && (
                            <div className={`overflow-hidden rounded-2xl px-4 py-3 w-full text-sm leading-relaxed ${isUser
                                ? 'bg-gray-100 dark:bg-[#2f2f2f] text-gray-900 dark:text-gray-100 rounded-tr-sm shadow-sm'
                                : 'bg-transparent text-gray-900 dark:text-gray-100 pl-0'
                                }`}>
                                <ReactMarkdown
                                    components={{
                                        strong: ({ node, ...props }) => <strong className="font-bold text-gray-900 dark:text-white" {...props} />,
                                        p: ({ node, ...props }) => <p className="mb-1.5 last:mb-0" {...props} />,
                                    }}
                                >
                                    {entry.content}
                                </ReactMarkdown>
                            </div>
                        )}

                        {/* Interactive Widget */}
                        {entry.role === 'assistant' && entry.widget && (
                            <div className="w-full mt-2.5 pl-0">
                                {renderWidget(entry)}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        );
    };

    /* ═══════════════════════════════════════════
       RENDER: WIDGETS
       ═══════════════════════════════════════════ */

    const renderWidget = (entry: ChatEntry) => {
        const { widget, widgetData, isProcessed } = entry;

        switch (widget) {

            /* ── CLASS PICKER ── */
            case 'class':
                return (
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 max-w-[500px]">
                        {CLASSES.map((cls, idx) => (
                            <button
                                key={idx}
                                disabled={isProcessed}
                                onClick={() => handleClassSelect(cls)}
                                className={`group px-3.5 py-3 rounded-xl border text-sm font-medium transition-all duration-200 text-left flex items-center gap-2 ${isProcessed
                                    ? 'border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-black/10 text-gray-400 opacity-50 cursor-not-allowed'
                                    : 'border-gray-200 dark:border-white/10 dark:bg-[#1e1e1e] hover:bg-indigo-50 dark:hover:bg-indigo-900/20 hover:border-indigo-400 dark:hover:border-indigo-500/40 hover:shadow-md hover:shadow-indigo-500/5 active:scale-[0.97]'
                                    }`}
                            >
                                <GraduationCap size={15} className={`shrink-0 ${isProcessed ? 'text-gray-300' : 'text-indigo-500 dark:text-indigo-400 group-hover:scale-110 transition-transform'}`} />
                                <span className="truncate">{cls}</span>
                            </button>
                        ))}
                    </div>
                );

            /* ── SUBJECT PICKER ── */
            case 'subject': {
                const cls = widgetData?.className || selectedClass;
                const subjects = SUBJECT_MAP[cls] || [];
                return (
                    <div className="flex flex-wrap gap-2 max-w-[500px]">
                        {subjects.map((subj, idx) => (
                            <button
                                key={idx}
                                disabled={isProcessed}
                                onClick={() => handleSubjectSelect(subj)}
                                className={`px-4 py-2.5 rounded-xl border text-sm font-medium transition-all duration-200 ${isProcessed
                                    ? 'border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-black/10 text-gray-400 opacity-50 cursor-not-allowed'
                                    : 'border-gray-200 dark:border-white/10 dark:bg-[#1e1e1e] hover:bg-emerald-50 dark:hover:bg-emerald-900/20 hover:border-emerald-400 dark:hover:border-emerald-500/40 hover:shadow-md hover:shadow-emerald-500/5 active:scale-[0.97]'
                                    }`}
                            >
                                {subj}
                            </button>
                        ))}
                    </div>
                );
            }

            /* ── CHAPTER PICKER ── */
            case 'chapter': {
                const cls = widgetData?.className || selectedClass;
                const subj = widgetData?.subject || selectedSubject;
                const chapters = CHAPTER_MAP[cls]?.[subj] || ['Chapter 1: Introduction', 'Chapter 2: Basics', 'Chapter 3: Advanced', 'Chapter 4: Practice', 'Chapter 5: Review'];
                return (
                    <div className="flex flex-col gap-2 max-w-[400px]">
                        {chapters.map((chap, idx) => (
                            <button
                                key={idx}
                                disabled={isProcessed}
                                onClick={() => handleChapterSelect(chap)}
                                className={`px-4 py-3 rounded-xl border text-sm font-medium transition-all duration-200 text-left flex items-center gap-3 ${isProcessed
                                    ? 'border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-black/10 text-gray-400 opacity-50 cursor-not-allowed'
                                    : 'border-gray-200 dark:border-white/10 dark:bg-[#1e1e1e] hover:bg-violet-50 dark:hover:bg-violet-900/20 hover:border-violet-400 dark:hover:border-violet-500/40 hover:shadow-md hover:shadow-violet-500/5 active:scale-[0.97]'
                                    }`}
                            >
                                <BookOpen size={14} className={`shrink-0 ${isProcessed ? 'text-gray-300' : 'text-violet-500 dark:text-violet-400'}`} />
                                <span className="truncate">{chap}</span>
                            </button>
                        ))}
                    </div>
                );
            }

            /* ── LIMIT INPUT ── */
            case 'limit':
                return (
                    <LimitInput
                        disabled={isProcessed}
                        onSubmit={(val) => handleLimitSelect(val)}
                    />
                );

            /* ── DIFFICULTY PICKER ── */
            case 'difficulty':
                return (
                    <div className="grid grid-cols-3 gap-2 max-w-[380px]">
                        {DIFFICULTIES.map((diff, idx) => {
                            const colors: Record<string, { border: string; bg: string; text: string; icon: string }> = {
                                'Easy': { border: 'border-green-300 dark:border-green-500/30', bg: 'hover:bg-green-50 dark:hover:bg-green-900/20', text: 'text-green-600 dark:text-green-400', icon: '🌿' },
                                'Normal': { border: 'border-blue-300 dark:border-blue-500/30', bg: 'hover:bg-blue-50 dark:hover:bg-blue-900/20', text: 'text-blue-600 dark:text-blue-400', icon: '⚡' },
                                'Hard': { border: 'border-red-300 dark:border-red-500/30', bg: 'hover:bg-red-50 dark:hover:bg-red-900/20', text: 'text-red-600 dark:text-red-400', icon: '🔥' },
                            };
                            const c = colors[diff];

                            return (
                                <button
                                    key={idx}
                                    disabled={isProcessed}
                                    onClick={() => handleDifficultySelect(diff)}
                                    className={`flex flex-col items-center gap-1.5 px-4 py-4 rounded-xl border text-sm font-bold transition-all duration-200 ${isProcessed
                                        ? 'border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-black/10 text-gray-400 opacity-50 cursor-not-allowed'
                                        : `${c.border} ${c.bg} ${c.text} dark:bg-[#1e1e1e] hover:shadow-md active:scale-[0.97]`
                                        }`}
                                >
                                    <span className="text-xl">{c.icon}</span>
                                    <span>{diff}</span>
                                </button>
                            );
                        })}
                    </div>
                );

            /* ── MCQ QUESTION CARD ── */
            case 'mcq': {
                const qIdx = widgetData?.qIndex;
                const question = widgetData?.items?.[qIdx];
                const selectedOpt = widgetData?.selectedOptionIdx;
                const questionAnswered = isProcessed;
                const correctIdx = question?.correctIndex;
                const optionLabels = ['A', 'B', 'C', 'D'];

                if (!question) return null;

                return (
                    <div className="w-full max-w-[550px] animate-in fade-in zoom-in-95 duration-500">
                        {/* Question Card */}
                        <div className="bg-white dark:bg-[#1a1a1a] border border-gray-200 dark:border-white/10 p-5 rounded-2xl shadow-sm">

                            {/* Question badge */}
                            <div className="flex items-center gap-2 mb-4">
                                <div className="inline-flex items-center gap-1.5 bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 px-3 py-1 rounded-full border border-indigo-100 dark:border-indigo-500/20 text-xs font-bold">
                                    <Target size={12} />
                                    Q {qIdx + 1}/{widgetData?.items?.length}
                                </div>
                            </div>

                            {/* Question */}
                            <div className="text-[14px] sm:text-[15px] font-semibold mb-5 text-gray-900 dark:text-gray-100 leading-relaxed">
                                <ReactMarkdown
                                    components={{
                                        strong: ({ node, ...props }) => <strong className="font-bold text-gray-900 dark:text-white" {...props} />,
                                        p: ({ node, ...props }) => <p className="mb-1 last:mb-0" {...props} />,
                                    }}
                                >
                                    {question.question}
                                </ReactMarkdown>
                            </div>

                            {/* Options with Circle Bubbles */}
                            <div className="space-y-3">
                                {question.options.map((opt: string, idx: number) => {
                                    const isSelected = selectedOpt === idx;
                                    const isCorrect = correctIdx === idx;

                                    let btnClass = "w-full p-3.5 rounded-2xl border-2 text-left flex items-center gap-4 transition-all duration-400 ";
                                    let circleClass = "w-10 h-10 rounded-full border-2 flex items-center justify-center shrink-0 text-sm font-bold ";
                                    let circleAnim = "";

                                    if (!questionAnswered) {
                                        btnClass += "border-gray-200 dark:border-gray-700/60 hover:bg-indigo-50/50 dark:hover:bg-indigo-500/5 text-gray-700 dark:text-gray-300 hover:border-indigo-400 dark:hover:border-indigo-500/50 active:scale-[0.97] cursor-pointer hover:shadow-lg hover:shadow-indigo-500/5";
                                        circleClass += "border-gray-300 dark:border-gray-600 text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-800/50";
                                    } else if (isSelected && isCorrect) {
                                        btnClass += "border-emerald-500 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 font-medium shadow-md shadow-emerald-500/15";
                                        circleClass += "bg-emerald-500 border-emerald-500 text-white shadow-lg shadow-emerald-500/30";
                                        circleAnim = "animate-bounce";
                                    } else if (isSelected && !isCorrect) {
                                        btnClass += "border-red-500 bg-red-50 dark:bg-red-500/10 text-red-700 dark:text-red-300 font-medium shadow-md shadow-red-500/15";
                                        circleClass += "bg-red-500 border-red-500 text-white shadow-lg shadow-red-500/30";
                                        circleAnim = "animate-pulse";
                                    } else if (isCorrect) {
                                        btnClass += "border-emerald-400 border-dashed bg-emerald-50/50 dark:bg-emerald-500/5 text-emerald-600 dark:text-emerald-400 font-medium";
                                        circleClass += "border-emerald-400 text-emerald-500 bg-emerald-50 dark:bg-emerald-900/20";
                                    } else {
                                        btnClass += "border-gray-100 dark:border-gray-800 opacity-35 text-gray-400 dark:text-gray-600";
                                        circleClass += "border-gray-200 dark:border-gray-700 text-gray-300 dark:text-gray-600";
                                    }

                                    return (
                                        <button
                                            key={idx}
                                            onClick={() => handleAnswerQuestion(qIdx, idx, isCorrect, question)}
                                            disabled={questionAnswered}
                                            className={btnClass}
                                        >
                                            {/* Circle Bubble */}
                                            <div className={`${circleClass} ${circleAnim}`} style={{ transition: 'all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)' }}>
                                                {questionAnswered && isSelected && isCorrect ? (
                                                    <Check size={20} strokeWidth={3.5} className="text-white drop-shadow-sm" style={{ animation: 'tickPop 0.5s cubic-bezier(0.34, 1.56, 0.64, 1)' }} />
                                                ) : questionAnswered && isSelected && !isCorrect ? (
                                                    <X size={20} strokeWidth={3.5} className="text-white drop-shadow-sm" style={{ animation: 'xShake 0.5s cubic-bezier(0.34, 1.56, 0.64, 1)' }} />
                                                ) : questionAnswered && !isSelected && isCorrect ? (
                                                    <Check size={16} strokeWidth={3} />
                                                ) : (
                                                    <span className="text-[13px]">{optionLabels[idx]}</span>
                                                )}
                                            </div>

                                            {/* Option Text */}
                                            <span className="text-sm flex-1 leading-relaxed">{opt}</span>
                                        </button>
                                    );
                                })}
                            </div>

                            {/* After Answer Footer */}
                            {questionAnswered && (
                                <div className="mt-4 pt-4 border-t border-gray-100 dark:border-white/10 flex items-center justify-between animate-in fade-in slide-in-from-bottom-2 duration-500">
                                    <div className="text-xs font-semibold text-gray-500 dark:text-gray-400">
                                        Score: <span className="text-indigo-600 dark:text-indigo-400 text-sm ml-0.5">{widgetData?.score ?? score}/{widgetData?.items?.length}</span>
                                    </div>
                                    <div className="flex items-center gap-2 text-xs text-gray-400 dark:text-gray-500">
                                        {qIdx + 1 < widgetData?.items?.length ? (
                                            <>
                                                <span className="relative flex h-2.5 w-2.5">
                                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                                                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-indigo-500"></span>
                                                </span>
                                                Next question loading...
                                            </>
                                        ) : (
                                            <>
                                                <Trophy size={13} className="text-amber-500" />
                                                Calculating results...
                                            </>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                );
            }

            /* ── RESULT CARD ── */
            case 'result': {
                const finalScore = widgetData?.finalScore ?? 0;
                const total = widgetData?.total ?? 1;
                const percentage = Math.round((finalScore / total) * 100);
                const isPassed = percentage >= 50;

                return (
                    <div className="w-full max-w-[420px] animate-in zoom-in-95 fade-in duration-700">
                        <div className={`text-center py-8 px-6 rounded-3xl border shadow-xl relative overflow-hidden ${isPassed
                            ? 'bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-900/10 dark:to-teal-900/10 border-emerald-200 dark:border-emerald-500/20'
                            : 'bg-gradient-to-br from-red-50 to-orange-50 dark:from-red-900/10 dark:to-orange-900/10 border-red-200 dark:border-red-500/20'
                            }`}>

                            {/* Decorative circles */}
                            <div className="absolute top-0 right-0 w-24 h-24 bg-white/20 dark:bg-white/5 rounded-full blur-2xl" />
                            <div className="absolute bottom-0 left-0 w-32 h-32 bg-white/10 dark:bg-white/3 rounded-full blur-3xl" />

                            {/* Trophy/X Icon */}
                            <div className={`relative z-10 w-20 h-20 mx-auto rounded-full flex items-center justify-center mb-5 shadow-2xl text-white ${isPassed
                                ? 'bg-gradient-to-br from-emerald-400 to-green-600 shadow-green-500/30'
                                : 'bg-gradient-to-br from-red-400 to-rose-600 shadow-red-500/30'
                                }`}>
                                {isPassed ? <Trophy size={36} strokeWidth={2} /> : <X size={36} strokeWidth={3} />}
                            </div>

                            <h2 className="relative z-10 text-2xl font-black text-gray-900 dark:text-white mb-1">
                                {isPassed ? 'Congratulations! 🎉' : 'Try Again! 💪'}
                            </h2>
                            <p className="relative z-10 text-sm text-gray-500 dark:text-gray-400 mb-6">
                                {isPassed ? 'You passed the exam!' : 'Better luck next time!'}
                            </p>

                            {/* Score Box */}
                            <div className="relative z-10 bg-white dark:bg-[#1a1a1a] p-5 rounded-2xl shadow-sm inline-block min-w-[200px] mb-6 border border-gray-100 dark:border-white/5">
                                <div className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-[0.2em] mb-2">Final Score</div>
                                <div className="text-5xl font-black text-indigo-600 dark:text-indigo-400 leading-none">
                                    {finalScore}
                                    <span className="text-xl text-gray-300 dark:text-gray-600">/{total}</span>
                                </div>
                                <div className={`mt-2 text-sm font-bold ${isPassed ? 'text-green-500' : 'text-red-500'}`}>
                                    {percentage}%
                                </div>
                            </div>

                            {/* Exam Info */}
                            <div className="relative z-10 text-left bg-white/60 dark:bg-[#1a1a1a]/60 rounded-xl p-3 mb-6 text-xs text-gray-500 dark:text-gray-400 space-y-1 border border-gray-100 dark:border-white/5">
                                <div><span className="font-semibold text-gray-700 dark:text-gray-300">Class:</span> {widgetData?.className}</div>
                                <div><span className="font-semibold text-gray-700 dark:text-gray-300">Subject:</span> {widgetData?.subject}</div>
                                <div><span className="font-semibold text-gray-700 dark:text-gray-300">Chapter:</span> {widgetData?.chapter}</div>
                                <div><span className="font-semibold text-gray-700 dark:text-gray-300">Difficulty:</span> {widgetData?.difficulty}</div>
                            </div>

                            {/* Restart Button */}
                            <button
                                onClick={handleRestart}
                                className="relative z-10 inline-flex items-center gap-2 px-6 py-3 bg-black dark:bg-white text-white dark:text-black rounded-xl font-bold hover:opacity-80 transition-all active:scale-95 shadow-lg text-sm"
                            >
                                <RotateCcw size={16} />
                                Start New Exam
                            </button>
                        </div>
                    </div>
                );
            }

            default: return null;
        }
    };

    /* ═══════════════════════════════════════════
       MAIN RENDER
       ═══════════════════════════════════════════ */

    return (
        <div className="flex flex-col h-full">
            {/* ── Hamburger Header ── */}
            <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-100 dark:border-white/5 bg-white/80 dark:bg-[#0d0d0d]/80 backdrop-blur-xl sticky top-0 z-30">
                <button className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-white/5 transition-all active:scale-90">
                    <Menu size={20} className="text-gray-700 dark:text-gray-300" />
                </button>
                <div className="flex-1">
                    <h1 className="text-sm font-bold text-gray-900 dark:text-white tracking-tight">MCQ Exam</h1>
                    <p className="text-[10px] text-gray-400 dark:text-gray-500 font-medium">
                        {selectedClass && selectedSubject ? `${selectedClass} · ${selectedSubject}` : 'Select your exam options'}
                    </p>
                </div>
                {mcqQuestions.length > 0 && (
                    <div className="flex items-center gap-1.5 bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 px-3 py-1.5 rounded-full text-xs font-bold border border-indigo-100 dark:border-indigo-500/20">
                        <Target size={12} />
                        {score}/{mcqQuestions.length}
                    </div>
                )}
            </div>

            {/* ── Scrollable Chat (no visible scrollbar) ── */}
            <div
                ref={scrollContainerRef}
                className="flex-1 overflow-y-auto scroll-smooth"
                style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
            >
                <style>{`div[class*="flex-1 overflow-y-auto"]::-webkit-scrollbar { display: none; }`}</style>
                <div className="flex flex-col pb-16 pt-4">
                    {chatLog.map(entry => renderMessageBubble(entry))}
                    <div ref={bottomRef} className="h-4" />
                </div>
            </div>

            {/* Keyframe animations for tick/x */}
            <style>{`
                @keyframes tickPop {
                    0% { transform: scale(0) rotate(-45deg); opacity: 0; }
                    60% { transform: scale(1.3) rotate(5deg); opacity: 1; }
                    100% { transform: scale(1) rotate(0deg); opacity: 1; }
                }
                @keyframes xShake {
                    0% { transform: scale(0) rotate(0deg); opacity: 0; }
                    40% { transform: scale(1.2) rotate(-10deg); opacity: 1; }
                    60% { transform: scale(1.1) rotate(10deg); }
                    80% { transform: scale(1.05) rotate(-5deg); }
                    100% { transform: scale(1) rotate(0deg); opacity: 1; }
                }
            `}</style>
        </div>
    );
};

/* ═══════════════════════════════════════════
   LIMIT INPUT COMPONENT
   ═══════════════════════════════════════════ */

const LimitInput = ({ disabled, onSubmit }: { disabled?: boolean; onSubmit: (val: number) => void }) => {
    const [val, setVal] = useState('');
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (!disabled && inputRef.current) {
            inputRef.current.focus();
        }
    }, [disabled]);

    const handleSubmit = () => {
        const parsed = parseInt(val);
        if (parsed > 0 && parsed <= 50) onSubmit(parsed);
        else alert("Please enter a number between 1 and 50");
    };

    return (
        <div className="flex gap-2 max-w-[280px]">
            <input
                ref={inputRef}
                type="number"
                disabled={disabled}
                value={val}
                onChange={(e) => setVal(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') handleSubmit(); }}
                placeholder="e.g. 15"
                min="1"
                max="50"
                className={`flex-1 p-3 rounded-xl border bg-white dark:bg-[#1e1e1e] text-sm outline-none transition-all duration-200 ${disabled
                    ? 'border-gray-100 dark:border-gray-800 text-gray-400 opacity-50'
                    : 'border-gray-200 dark:border-white/10 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500'
                    }`}
            />
            <button
                disabled={disabled || !val}
                onClick={handleSubmit}
                className={`flex items-center justify-center p-3 rounded-xl min-w-[48px] transition-all duration-200 ${disabled || !val
                    ? 'bg-gray-100 text-gray-400 dark:bg-white/5 dark:text-gray-600 cursor-not-allowed'
                    : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-md hover:shadow-lg hover:scale-105 active:scale-95'
                    }`}
            >
                <Send size={16} />
            </button>
        </div>
    );
};

export default MCQ; 