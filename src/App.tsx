
import React, { useState, useEffect } from 'react';
import { 
  BookOpen, LayoutDashboard, Trophy, User, Sparkles, Languages, 
  ChevronRight, Plus, ArrowLeft, CheckCircle, AlertCircle, LogOut, 
  Send, Loader2, Flame, Medal, ThumbsUp, ThumbsDown, 
  ExternalLink, WifiOff, FileText, Database, ShieldCheck, Download,
  Zap, MessageSquare, GraduationCap, X, ChevronLeft, Share2, 
  Award, BrainCircuit, Lightbulb, Link2, Search, Lock, Volume2, Package
} from 'lucide-react';
import { 
  Course, Language, UserProfile, CourseStatus,
  Module, Lesson, TranslationStrings, Badge, TargetLevel, Flashcard 
} from './types';
import { translations } from './translations';
import { generateCourseSyllabus, generateModuleDeepDive, guruBotAnswer, generateBridgeExplanation, generateLessonAudio } from './services/geminiService';
import { linkAcademicID, verifyAchievementOnChain } from './services/web3Service';
import { signOut, onAuthStateChange } from './services/authService';
import { AuthPage } from './components/AuthPage';
import { ForgotPasswordPage } from './components/ForgotPasswordPage';
import { ProfileEditPage } from './components/ProfileEditPage';

const ALL_BADGES: Badge[] = [
  { id: 'early_bird', name: 'Early Bird', description: 'Begin your first academic session.', icon: 'Zap' },
  { id: 'scholar', name: 'Syllabus Master', description: 'Complete 5 core modules.', icon: 'BookOpen' },
  { id: 'crypto_native', name: 'Identity Verified', description: 'Link your digital academic credential.', icon: 'ShieldCheck' },
  { id: 'top_learner', name: 'Grand Scholar', description: 'Accumulate 1000 academic credits.', icon: 'Trophy' },
  { id: 'streak_star', name: 'Consistent Scholar', description: 'Maintain a 5-day learning streak.', icon: 'Flame' }
];

const App: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [showProfileEdit, setShowProfileEdit] = useState(false);
  const [activeTab, setActiveTab] = useState<'home' | 'courses' | 'leaderboard' | 'profile' | 'builder'>('home');
  const [lang, setLang] = useState<Language>(Language.EN);
  const [lowDataMode, setLowDataMode] = useState(false);
  const [user, setUser] = useState<UserProfile | null>(null);
  const [courses, setCourses] = useState<Course[]>([]);
  const [enrollments, setEnrollments] = useState<Record<string, string[]>>({});
  const [activeCourse, setActiveCourse] = useState<Course | null>(null);
  const [activeLesson, setActiveLesson] = useState<{moduleIdx: number, lessonIdx: number} | null>(null);
  const [viewingFlashcards, setViewingFlashcards] = useState(false);
  const [isDeepDiving, setIsDeepDiving] = useState(false);
  const [isListening, setIsListening] = useState(false);
  
  const currentT = translations[lang];

  // Initialize auth state on app load
  useEffect(() => {
    const subscription = onAuthStateChange((authUser) => {
      if (authUser) {
        setIsAuthenticated(true);
        setUser(authUser);
        setLang(authUser.language);
      } else {
        setIsAuthenticated(false);
        setUser(null);
      }
    });

    // Cleanup subscription on unmount
    return () => {
      if (subscription) {
        subscription.unsubscribe();
      }
    };
  }, []);

  // Load courses and enrollments when user changes
  useEffect(() => {
    if (isAuthenticated && user) {
      const savedCourses = localStorage.getItem(`edusagar_courses_${user.id}`);
      if (savedCourses) setCourses(JSON.parse(savedCourses));

      const savedEnrollments = localStorage.getItem(`edusagar_enrollments_${user.id}`);
      if (savedEnrollments) setEnrollments(JSON.parse(savedEnrollments));
    }
  }, [isAuthenticated, user]);

  // Handle logout
  const handleLogout = async () => {
    const { error } = await signOut();
    if (!error) {
      setIsAuthenticated(false);
      setUser(null);
      setCourses([]);
      setEnrollments({});
      setActiveCourse(null);
      setActiveTab('home');
    } else {
      alert('Error logging out: ' + error);
    }
  };

  // If not authenticated, show login page
  if (!isAuthenticated || !user) {
    if (showForgotPassword) {
      return <ForgotPasswordPage onBack={() => setShowForgotPassword(false)} />;
    }
    return <AuthPage 
      onAuthSuccess={(authenticatedUser) => {
        setIsAuthenticated(true);
        setUser(authenticatedUser);
      }}
      onForgotPassword={() => setShowForgotPassword(true)}
    />;
  }

  const handleIDLink = async () => {
    const address = await linkAcademicID();
    if (address && user) {
      const updatedUser = { ...user, walletAddress: address };
      if (!updatedUser.badges.includes('crypto_native')) updatedUser.badges.push('crypto_native');
      setUser(updatedUser);
    }
  };

  const enrollInCourse = (course: Course) => {
    setActiveCourse(course);
    const firstM = course.modules.findIndex(m => m.isGenerated);
    if (firstM !== -1) {
      setActiveLesson({ moduleIdx: firstM, lessonIdx: 0 });
    } else {
      setActiveLesson(null);
    }
    setViewingFlashcards(false);
  };

  const handleDeepDive = async (mIdx: number) => {
    if (!activeCourse) return;
    setIsDeepDiving(true);
    try {
      const targetM = activeCourse.modules[mIdx];
      const result = await generateModuleDeepDive(
        activeCourse.title, 
        targetM.title, 
        targetM.description, 
        activeCourse.targetLevel,
        lang
      );
      
      const updatedCourse = { ...activeCourse };
      updatedCourse.modules[mIdx] = {
        ...targetM,
        isGenerated: true,
        lessons: result.lessons
      };
      updatedCourse.flashcards = [...updatedCourse.flashcards, ...result.flashcards];
      
      const updatedCourses = courses.map(c => c.id === updatedCourse.id ? updatedCourse : c);
      setCourses(updatedCourses);
      setActiveCourse(updatedCourse);
      setActiveLesson({ moduleIdx: mIdx, lessonIdx: 0 });
      localStorage.setItem(`edusagar_courses_${user.id}`, JSON.stringify(updatedCourses));
    } catch (e) {
      alert("Course content generation failed. Please try again.");
    } finally {
      setIsDeepDiving(false);
    }
  };

  const handleCompleteLesson = async (lid: string, quizScore: number) => {
    if (!activeCourse || !user) return;
    const current = enrollments[activeCourse.id] || [];
    if (!current.includes(lid)) {
      const earned = 10 + (quizScore * 10);
      const updatedEnrollments = { ...enrollments, [activeCourse.id]: [...current, lid] };
      setEnrollments(updatedEnrollments);
      localStorage.setItem(`edusagar_enrollments_${user.id}`, JSON.stringify(updatedEnrollments));
      
      const currentModule = activeCourse.modules[activeLesson?.moduleIdx || 0];
      const allLessonsDone = currentModule.lessons.every(l => [...current, lid].includes(l.id));
      
      let updatedCredentials = [...user.sbtCredentials];
      if (allLessonsDone && user.walletAddress) {
        const sbt = await verifyAchievementOnChain(user.walletAddress, currentModule.id);
        updatedCredentials.push({ id: sbt.id, name: currentModule.title, date: sbt.timestamp });
      }

      const updatedUser = { 
        ...user, 
        totalPoints: user.totalPoints + earned,
        weeklyPoints: user.weeklyPoints + earned,
        sbtCredentials: updatedCredentials
      };
      setUser(updatedUser);
    }
  };

  const handleListen = async (text: string) => {
    setIsListening(true);
    try {
      await generateLessonAudio(text);
    } catch (e) {
      alert("Audio generation error.");
    } finally {
      setIsListening(false);
    }
  };

  const handleExportBundle = (course: Course) => {
    const data = JSON.stringify(course, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${course.title.replace(/\s+/g, '_')}_Bundle.json`;
    a.click();
    alert("Full course bundle exported for offline study.");
  };

  return (
    <div className={`min-h-screen transition-all duration-300 overflow-x-hidden ${lowDataMode ? 'bg-white font-serif' : 'bg-slate-50 font-sans'}`}>
      <div className="fixed left-0 top-0 h-full w-20 md:w-64 bg-white border-r border-slate-200 z-50 flex flex-col shadow-sm">
        <div className="p-4 md:p-6 flex items-center gap-3">
          <div className="w-10 h-10 bg-indigo-700 rounded-xl flex items-center justify-center text-white shadow-xl rotate-2">
            <GraduationCap size={22} />
          </div>
          <span className="hidden md:block font-black text-xl tracking-tighter text-slate-800">EduSagar</span>
        </div>
        <nav className="flex-1 px-4 space-y-1.5 mt-8">
          <SidebarItem icon={<LayoutDashboard size={20} />} label={currentT.home} active={activeTab === 'home'} onClick={() => { setActiveTab('home'); setActiveCourse(null); }} />
          <SidebarItem icon={<BookOpen size={20} />} label={currentT.courses} active={activeTab === 'courses'} onClick={() => { setActiveTab('courses'); setActiveCourse(null); }} />
          <SidebarItem icon={<Sparkles size={20} />} label={currentT.generateCourse} active={activeTab === 'builder'} onClick={() => { setActiveTab('builder'); setActiveCourse(null); }} />
          <SidebarItem icon={<Trophy size={20} />} label={currentT.leaderboard} active={activeTab === 'leaderboard'} onClick={() => { setActiveTab('leaderboard'); setActiveCourse(null); }} />
          <SidebarItem icon={<User size={20} />} label={currentT.profile} active={activeTab === 'profile'} onClick={() => { setActiveTab('profile'); setActiveCourse(null); }} />
        </nav>
        <div className="p-4 border-t border-slate-100 space-y-2 mb-2">
          <button onClick={() => setLowDataMode(!lowDataMode)} className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50 transition-colors group">
            <WifiOff size={18} className={lowDataMode ? 'text-indigo-600' : 'text-slate-400 group-hover:text-slate-600'} />
            <span className={`hidden md:block text-[11px] font-bold ${lowDataMode ? 'text-indigo-700' : 'text-slate-500'}`}>{currentT.lowData}</span>
          </button>
          <button onClick={() => setLang(lang === Language.EN ? Language.NP : Language.EN)} className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50 text-slate-500 group">
            <Languages size={18} />
            <span className="hidden md:block text-[11px] font-bold uppercase tracking-wider">{lang === Language.EN ? 'नेपाली' : 'English'}</span>
          </button>
          <button onClick={handleLogout} className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-red-50 text-red-500 hover:text-red-700 group transition-colors">
            <LogOut size={18} />
            <span className="hidden md:block text-[11px] font-bold">Logout</span>
          </button>
        </div>
      </div>

      <main className="flex-1 ml-20 md:ml-64 p-4 md:p-10 pb-32">
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-4">
          <div className="animate-in fade-in slide-in-from-top duration-500">
            <h1 className="text-3xl font-black text-slate-900 tracking-tight leading-none">
              {activeCourse ? activeCourse.title : currentT[activeTab as keyof TranslationStrings] || 'Welcome'}
            </h1>
            <p className="text-slate-400 text-sm font-medium mt-2">Generate deep-learning pathways for any subject in the world.</p>
          </div>
          <div className="flex items-center gap-3 bg-white/60 p-1.5 rounded-2xl backdrop-blur-md border border-slate-200 shadow-sm">
             <div className="bg-orange-50 text-orange-600 px-4 py-2.5 rounded-xl flex items-center gap-2 border border-orange-100/50">
              <Flame size={18} fill="currentColor" />
              <span className="font-black text-sm">{user?.streak || 0}</span>
            </div>
            <div className="bg-indigo-50 text-indigo-700 px-4 py-2.5 rounded-xl flex items-center gap-2 border border-indigo-100/50">
              <Sparkles size={18} />
              <span className="font-black text-sm">{user?.totalPoints || 0}</span>
            </div>
          </div>
        </header>

        <section className="max-w-6xl mx-auto">
          {isDeepDiving && (
            <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[200] flex items-center justify-center p-8">
              <div className="bg-white p-12 rounded-[50px] shadow-2xl max-w-lg w-full text-center animate-in zoom-in duration-300">
                 <Loader2 size={48} className="animate-spin text-indigo-600 mx-auto mb-8" />
                 <h2 className="text-3xl font-black text-slate-800 mb-2">{currentT.deepDiving}</h2>
                 <p className="text-slate-500 font-medium italic">Architecting high-depth content from global repositories...</p>
              </div>
            </div>
          )}

          {activeCourse ? (
            <div className="space-y-6">
              <div className="flex flex-wrap justify-between items-center bg-white p-4 rounded-3xl border border-slate-200 shadow-sm gap-3">
                <button onClick={() => setActiveCourse(null)} className="flex items-center gap-2 text-slate-500 font-bold hover:text-slate-900 transition-colors px-3 py-2 rounded-xl hover:bg-slate-50">
                  <ChevronLeft size={20} /> Exit
                </button>
                <div className="flex items-center gap-2">
                   {activeCourse.flashcards.length > 0 && (
                     <button 
                      onClick={() => setViewingFlashcards(!viewingFlashcards)}
                      className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all ${viewingFlashcards ? 'bg-indigo-600 text-white shadow-lg' : 'bg-indigo-50 text-indigo-700 hover:bg-indigo-100'}`}
                     >
                       <Zap size={16} /> {currentT.flashcards}
                     </button>
                   )}
                   <button onClick={() => handleExportBundle(activeCourse)} className="px-4 py-2 bg-slate-50 text-slate-500 rounded-xl text-xs font-bold border border-slate-200 flex items-center gap-2">
                      <Package size={16} /> {currentT.exportBundle}
                   </button>
                </div>
              </div>

              {viewingFlashcards ? (
                <FlashcardSRS cards={activeCourse.flashcards} onExit={() => setViewingFlashcards(false)} t={currentT} />
              ) : activeLesson ? (
                <CourseViewer 
                  course={activeCourse} 
                  lessonIdx={activeLesson} 
                  onNext={(m, l) => setActiveLesson({moduleIdx: m, lessonIdx: l})} 
                  onComplete={handleCompleteLesson}
                  completedIds={enrollments[activeCourse.id] || []}
                  onExit={() => { setActiveCourse(null); setActiveLesson(null); }}
                  t={currentT}
                  lowData={lowDataMode}
                  lang={lang}
                  onVerify={(id, diff) => {
                    const updated = courses.map(c => c.id === id ? { ...c, verifications: Math.max(0, c.verifications + diff) } : c);
                    setCourses(updated);
                  }}
                  onDeepDive={handleDeepDive}
                  onListen={handleListen}
                  isListening={isListening}
                />
              ) : (
                <div className="bg-white rounded-[50px] border border-slate-200 p-12 shadow-xl animate-in fade-in duration-500">
                  <h3 className="text-2xl font-black text-slate-800 mb-8 border-b border-slate-100 pb-4">Course Objectives</h3>
                  <div className="grid gap-4">
                    {activeCourse.modules.map((m, idx) => (
                      <div key={m.id} className="p-8 rounded-[32px] border-2 border-slate-50 bg-slate-50/30 flex flex-col md:flex-row justify-between items-center gap-6 group hover:border-indigo-100 hover:bg-white transition-all">
                        <div className="flex-1">
                          <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-2 block">Module {idx+1}</span>
                          <h4 className="text-xl font-black text-slate-800 mb-2">{m.title}</h4>
                          <p className="text-sm text-slate-500 font-medium">{m.description}</p>
                        </div>
                        {m.isGenerated ? (
                          <button 
                            onClick={() => setActiveLesson({ moduleIdx: idx, lessonIdx: 0 })}
                            className="bg-indigo-600 text-white px-8 py-3 rounded-2xl font-black text-xs shadow-lg hover:scale-105 active:scale-95 transition-all"
                          >
                            Resume Learning
                          </button>
                        ) : (
                          <button 
                            onClick={() => handleDeepDive(idx)}
                            className="bg-slate-900 text-white px-8 py-3 rounded-2xl font-black text-xs shadow-lg flex items-center gap-2 hover:bg-indigo-700 transition-all"
                          >
                            <Lock size={14} /> {currentT.unlockModule}
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <>
              {activeTab === 'home' && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-in fade-in zoom-in duration-500">
                  {courses.length === 0 && (
                    <div className="col-span-full py-32 text-center bg-white rounded-[50px] border border-dashed border-slate-200 shadow-sm flex flex-col items-center">
                      <div className="bg-slate-50 w-24 h-24 rounded-full flex items-center justify-center mb-6">
                        <Database className="text-slate-200" size={40} />
                      </div>
                      <h3 className="text-2xl font-black text-slate-800 tracking-tight">Your Knowledge Hub is Empty</h3>
                      <button onClick={() => setActiveTab('builder')} className="mt-8 bg-indigo-600 text-white px-10 py-4 rounded-2xl font-black hover:bg-indigo-700 shadow-2xl transition-all hover:scale-105">
                        Build Custom Course
                      </button>
                    </div>
                  )}
                  {courses.map(course => (
                    <CourseCard key={course.id} course={course} onEnroll={() => enrollInCourse(course)} t={currentT} />
                  ))}
                </div>
              )}
              {activeTab === 'builder' && <CourseBuilder onGenerated={(course) => { const updated = [course as Course, ...courses]; setCourses(updated); localStorage.setItem(`edusagar_courses_${user.id}`, JSON.stringify(updated)); setActiveTab('home'); }} t={currentT} />}
              {activeTab === 'leaderboard' && <Leaderboard t={currentT} />}
              {activeTab === 'profile' && <ProfileView user={user} t={currentT} onLogout={handleLogout} onEditProfile={() => setShowProfileEdit(true)} />}
            </>
          )}
        </section>
      </main>
      
      {/* Profile Edit Modal */}
      {showProfileEdit && user && (
        <ProfileEditPage
          user={user}
          onSave={(updatedUser) => {
            setUser(updatedUser);
            setShowProfileEdit(false);
          }}
          onCancel={() => setShowProfileEdit(false)}
        />
      )}
    </div>
  );

};

const SidebarItem: React.FC<{ icon: React.ReactNode, label: string, active: boolean, onClick: () => void }> = ({ icon, label, active, onClick }) => (
  <button onClick={onClick} className={`w-full flex items-center gap-4 p-4 rounded-2xl transition-all active:scale-95 ${active ? 'bg-slate-900 text-white shadow-2xl shadow-slate-300' : 'text-slate-400 hover:bg-slate-50 hover:text-slate-700'}`}>
    {icon}
    <span className="hidden md:block text-sm font-black tracking-tight">{label}</span>
  </button>
);

const CourseCard: React.FC<{ course: Course, onEnroll: () => void, t: TranslationStrings }> = ({ course, onEnroll, t }) => (
  <div className="bg-white border border-slate-200 rounded-[40px] overflow-hidden shadow-sm hover:shadow-2xl hover:-translate-y-2 transition-all group relative">
    <div className="p-8 pb-10">
      <div className="flex justify-between items-start mb-6">
        <span className="bg-indigo-50 text-indigo-700 text-[10px] font-black px-3 py-1.5 rounded-lg uppercase tracking-widest border border-indigo-100">{course.targetLevel}</span>
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-black bg-emerald-50 text-emerald-700">
          <ShieldCheck size={14} /> {course.confidenceScore}% Trust
        </div>
      </div>
      <h3 className="font-black text-slate-800 text-xl mb-3 h-14 line-clamp-2">{course.title}</h3>
      <p className="text-slate-400 text-xs line-clamp-2 mb-8 font-medium">{course.description}</p>
      <button onClick={onEnroll} className="w-full bg-slate-900 text-white px-7 py-3 rounded-2xl text-xs font-black hover:bg-indigo-600 transition-all shadow-lg">
        {t.startLearning}
      </button>
    </div>
  </div>
);

const CourseBuilder: React.FC<{ onGenerated: (c: Partial<Course>) => void, t: TranslationStrings }> = ({ onGenerated, t }) => {
  const [topic, setTopic] = useState('');
  const [level, setLevel] = useState<TargetLevel>(TargetLevel.SECONDARY);
  const [isGenerating, setIsGenerating] = useState(false);

  const handleBuild = async () => {
    if (!topic) return;
    setIsGenerating(true);
    try {
      const course = await generateCourseSyllabus(topic, level);
      onGenerated(course);
    } catch (err) {
      alert("AI limit reached. Try again later.");
    } finally {
      setIsGenerating(false);
    }
  };

  if (isGenerating) {
    return (
      <div className="bg-white border border-slate-200 rounded-[50px] p-12 text-center max-w-lg mx-auto shadow-2xl animate-in zoom-in duration-300">
        <Loader2 className="animate-spin text-indigo-600 mx-auto mb-8" size={48} />
        <h2 className="text-3xl font-black text-slate-800 mb-2">{t.generatingSyllabus}</h2>
        <p className="text-slate-500 font-medium italic">Architecting course structure based on global benchmarks...</p>
      </div>
    );
  }

  return (
    <div className="bg-white border border-slate-200 rounded-[60px] p-12 max-w-2xl mx-auto shadow-xl">
      <div className="flex items-center gap-4 mb-12">
        <div className="bg-indigo-700 text-white p-4 rounded-2xl shadow-lg rotate-2"><Sparkles size={32} /></div>
        <h2 className="text-3xl font-black text-slate-800 tracking-tight">{t.generateCourse}</h2>
      </div>
      <div className="space-y-10">
        <div>
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">What do you want to learn?</label>
          <input 
            type="text" value={topic} onChange={e => setTopic(e.target.value)}
            placeholder="e.g. Master React.js, Advanced French, or Quantum Mechanics"
            className="w-full bg-slate-50 border border-slate-200 rounded-3xl px-8 py-5 font-bold focus:outline-none focus:ring-4 focus:ring-indigo-500/10 transition-all"
          />
        </div>
        <div>
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 block">Target Proficiency Level</label>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
             {Object.values(TargetLevel).map(v => (
               <button key={v} onClick={() => setLevel(v)} className={`p-4 rounded-2xl text-[10px] font-black uppercase border-2 transition-all ${level === v ? 'bg-slate-900 text-white border-slate-900 shadow-xl' : 'bg-slate-50 text-slate-400 border-slate-50'}`}>{v}</button>
             ))}
          </div>
        </div>
        <button onClick={handleBuild} className="w-full bg-indigo-700 text-white py-6 rounded-3xl font-black hover:bg-indigo-800 transition-all shadow-2xl active:scale-95 text-lg">Generate Full Course Path</button>
      </div>
    </div>
  );
};

const CourseViewer: React.FC<{ 
  course: Course, lessonIdx: {moduleIdx: number, lessonIdx: number}, 
  onNext: (m: number, l: number) => void, onComplete: (id: string, score: number) => void,
  completedIds: string[], onExit: () => void, t: TranslationStrings, lowData: boolean,
  onVerify: (id: string, d: number) => void, lang: string, onDeepDive: (mIdx: number) => void,
  onListen: (text: string) => void, isListening: boolean
}> = ({ course, lessonIdx, onNext, onComplete, completedIds, onExit, t, lowData, onVerify, lang, onDeepDive, onListen, isListening }) => {
  const currentModule = course.modules[lessonIdx.moduleIdx];
  const currentLesson = currentModule.lessons[lessonIdx.lessonIdx];
  const [quizState, setQuizState] = useState<'pending' | 'correct' | 'wrong'>('pending');
  const [selectedOpt, setSelectedOpt] = useState<string | null>(null);
  const [guruMsg, setGuruMsg] = useState('');
  const [guruAnswer, setGuruAnswer] = useState('');
  const [showGuru, setShowGuru] = useState(false);
  const [bridgeContent, setBridgeContent] = useState<string | null>(null);

  const handleQuizSubmit = async () => {
    if (selectedOpt === currentLesson.quiz.answer) {
      setQuizState('correct');
      onComplete(currentLesson.id, 1);
    } else {
      setQuizState('wrong');
      const bridge = await generateBridgeExplanation(currentLesson.content, currentLesson.quiz.question, selectedOpt!, currentLesson.quiz.answer, lang);
      setBridgeContent(bridge);
    }
  };

  const handleNext = () => {
    let nextL = lessonIdx.lessonIdx + 1;
    let nextM = lessonIdx.moduleIdx;
    if (nextL >= currentModule.lessons.length) { 
      nextL = 0; nextM += 1; 
      if (nextM < course.modules.length && !course.modules[nextM].isGenerated) {
        onDeepDive(nextM);
        return;
      }
    }
    if (nextM >= course.modules.length) { onExit(); } 
    else { onNext(nextM, nextL); setQuizState('pending'); setSelectedOpt(null); setBridgeContent(null); }
  };

  return (
    <div className="bg-white rounded-[40px] shadow-2xl border border-slate-200 overflow-hidden flex flex-col md:flex-row min-h-[700px] animate-in fade-in duration-500">
      <aside className="w-full md:w-72 border-r border-slate-100 bg-slate-50/30 p-8 hidden md:block">
        <h5 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-6">Learning Path</h5>
        <div className="space-y-4">
          {course.modules.map((m, mIdx) => (
            <div key={m.id} className="space-y-2">
              <div className={`text-[11px] font-black p-2 rounded-lg flex items-center gap-2 ${mIdx === lessonIdx.moduleIdx ? 'text-indigo-600 bg-indigo-50' : 'text-slate-400'}`}>
                {m.isGenerated ? <CheckCircle size={14} /> : <Lock size={14} />} {m.title}
              </div>
              {mIdx === lessonIdx.moduleIdx && m.lessons.map((l, lIdx) => (
                <div key={l.id} className={`ml-4 text-[10px] font-bold p-1 border-l-2 flex items-center gap-2 ${lIdx === lessonIdx.lessonIdx ? 'border-indigo-600 text-indigo-700' : 'border-slate-100 text-slate-400'}`}>
                   {completedIds.includes(l.id) && <CheckCircle size={10} />} {l.title}
                </div>
              ))}
            </div>
          ))}
        </div>
      </aside>

      <article className="flex-1 p-8 md:p-16 overflow-y-auto max-h-[850px]">
        <div className="flex justify-between items-start mb-8">
          <h2 className="text-4xl font-black text-slate-900 max-w-2xl">{currentLesson.title}</h2>
          <button 
            onClick={() => onListen(currentLesson.content)} 
            disabled={isListening}
            className="flex items-center gap-2 bg-indigo-50 text-indigo-600 px-6 py-3 rounded-2xl font-black text-xs hover:bg-indigo-100 transition-all disabled:opacity-50"
          >
            {isListening ? <Loader2 size={16} className="animate-spin" /> : <Volume2 size={16} />}
            {t.listen}
          </button>
        </div>
        <div className={`prose max-w-none text-slate-700 leading-relaxed mb-16 ${lowData ? 'text-sm font-serif' : 'text-xl font-medium'}`}>
          {currentLesson.content.split('\n').map((p, i) => <p key={i} className="mb-6">{p}</p>)}
        </div>

        {currentLesson.citation && (
          <div className="bg-slate-50 p-8 rounded-[40px] border border-slate-100 mb-16 flex items-center gap-6">
            <div className="bg-indigo-600 text-white p-4 rounded-2xl shadow-lg"><Link2 size={24} /></div>
            <div>
              <span className="text-[10px] font-black text-slate-300 uppercase block mb-1">Authoritative Global Source</span>
              <a href={currentLesson.citation} target="_blank" className="text-indigo-600 font-bold hover:underline italic flex items-center gap-2">
                Verify Concept against External Documentation <ExternalLink size={14} />
              </a>
            </div>
          </div>
        )}

        <div className="bg-slate-900 p-12 rounded-[50px] text-white">
          <p className="text-2xl font-black mb-12">{currentLesson.quiz.question}</p>
          <div className="grid gap-4 mb-12">
            {currentLesson.quiz.options.map(opt => (
              <button 
                key={opt} onClick={() => quizState === 'pending' && setSelectedOpt(opt)} 
                className={`p-6 rounded-3xl text-left border-2 font-bold transition-all ${selectedOpt === opt ? (quizState === 'correct' ? 'border-emerald-500 bg-emerald-500/10' : 'border-indigo-500 bg-indigo-500/10') : 'border-slate-800 bg-slate-800 hover:border-slate-700'}`}
              >
                {opt}
              </button>
            ))}
          </div>
          {quizState === 'pending' ? (
            <button onClick={handleQuizSubmit} disabled={!selectedOpt} className="w-full bg-indigo-600 py-5 rounded-3xl font-black shadow-xl hover:bg-indigo-700 transition-all">Submit Verification</button>
          ) : (
            <div className="space-y-8 animate-in slide-in-from-bottom duration-500">
               <div className={`p-8 rounded-3xl border ${quizState === 'correct' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-red-500/10 text-red-400 border-red-500/20'}`}>
                  <h4 className="font-black mb-4 flex items-center gap-2">
                    {quizState === 'correct' ? <Trophy size={20} /> : <BrainCircuit size={20} />}
                    {quizState === 'correct' ? 'Concept Mastered!' : 'Bridging Misconception'}
                  </h4>
                  {bridgeContent && <p className="text-sm italic leading-relaxed font-medium">"{bridgeContent}"</p>}
               </div>
               {quizState === 'correct' ? (
                 <button onClick={handleNext} className="w-full bg-white text-slate-900 py-5 rounded-3xl font-black shadow-xl hover:scale-105 active:scale-95 transition-all">Continue Journey</button>
               ) : (
                 <button onClick={() => {setQuizState('pending'); setSelectedOpt(null); setBridgeContent(null);}} className="text-slate-400 underline w-full font-black text-xs uppercase tracking-widest">Retry Understanding</button>
               )}
            </div>
          )}
        </div>
      </article>

      <div className="fixed bottom-8 right-8 z-[100]">
         <button onClick={() => setShowGuru(!showGuru)} className="bg-slate-900 text-white w-16 h-16 rounded-3xl shadow-2xl flex items-center justify-center hover:rotate-12 hover:scale-110 active:scale-95 transition-all"><MessageSquare size={28} /></button>
         {showGuru && (
           <div className="absolute bottom-20 right-0 w-80 bg-white border border-slate-200 rounded-[32px] shadow-2xl p-6 flex flex-col gap-4 animate-in slide-in-from-bottom duration-300">
              <h4 className="font-black text-slate-800 flex items-center gap-2"><Sparkles size={16} className="text-indigo-600" /> Global GuruBot</h4>
              <textarea value={guruMsg} onChange={e => setGuruMsg(e.target.value)} placeholder="Explain in simpler terms..." className="w-full bg-slate-50 border border-slate-100 rounded-2xl p-4 text-xs resize-none h-24 focus:outline-none" />
              <button onClick={async () => {const ans = await guruBotAnswer(currentLesson.content, guruMsg, lang); setGuruAnswer(ans); setGuruMsg('');}} className="bg-indigo-600 text-white py-2 rounded-xl text-xs font-black hover:bg-indigo-700 transition-all">Consult Guru</button>
              {guruAnswer && <div className="text-xs bg-indigo-50 p-4 rounded-xl italic leading-relaxed border border-indigo-100">"{guruAnswer}"</div>}
           </div>
         )}
      </div>
    </div>
  );
};

const FlashcardSRS: React.FC<{ cards: Flashcard[], onExit: () => void, t: TranslationStrings }> = ({ cards, onExit, t }) => {
  const [idx, setIdx] = useState(0);
  const [flipped, setFlipped] = useState(false);
  return (
    <div className="bg-white rounded-[50px] p-12 text-center shadow-2xl max-w-2xl mx-auto min-h-[400px] flex flex-col justify-between animate-in zoom-in duration-500 border border-slate-200">
      <div onClick={() => setFlipped(!flipped)} className={`h-64 flex items-center justify-center p-8 rounded-[40px] border-2 border-dashed cursor-pointer transition-all ${flipped ? 'bg-indigo-700 text-white border-indigo-400 rotate-180' : 'bg-slate-50 text-slate-800 border-slate-200 hover:border-indigo-400'}`}>
        <div className={`font-black text-2xl px-4 ${flipped ? 'rotate-180' : ''}`}>{flipped ? cards[idx].back : cards[idx].front}</div>
      </div>
      <div className="flex gap-4 mt-8">
        <button onClick={() => {if(idx < cards.length-1) setIdx(idx+1); else onExit(); setFlipped(false);}} className="flex-1 bg-slate-900 text-white py-5 rounded-2xl font-black text-xs shadow-xl active:scale-95 transition-all">Next Concept</button>
      </div>
    </div>
  );
};

const Leaderboard: React.FC<{ t: TranslationStrings }> = ({ t }) => (
  <div className="bg-white border border-slate-200 rounded-[50px] overflow-hidden shadow-2xl max-w-2xl mx-auto animate-in slide-in-from-bottom duration-500">
    <div className="bg-slate-900 p-12 text-white">
      <h2 className="text-3xl font-black">{t.leaderboard}</h2>
      <p className="text-indigo-400 text-xs font-bold mt-3 uppercase tracking-widest">Global Achievement Registry (SBT-Linked)</p>
    </div>
    <div className="p-8">
      {[1, 2, 3].map(i => (
        <div key={i} className="p-8 border-b border-slate-50 flex items-center justify-between hover:bg-slate-50 transition-all rounded-3xl">
          <span className="font-black text-3xl text-slate-200">#0{i}</span>
          <div className="flex-1 px-8 text-left">
            <span className="font-black text-slate-700 text-lg block leading-none">Global ID-772{i}</span>
            <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest mt-2 block">Multidisciplinary Scholar</span>
          </div>
          <span className="bg-indigo-50 text-indigo-700 px-6 py-2 rounded-2xl font-black text-xs">{2500 - (i*200)} Credits</span>
        </div>
      ))}
    </div>
  </div>
);

const ProfileView: React.FC<{ user: UserProfile | null, t: TranslationStrings, onLogout: () => void, onEditProfile: () => void }> = ({ user, t, onLogout, onEditProfile }) => {
  return (
    <div className="max-w-2xl mx-auto space-y-8 animate-in fade-in duration-500">
      <div className="bg-white border border-slate-200 rounded-[50px] p-12 shadow-2xl relative overflow-hidden">
        <div className="flex items-center gap-8 mb-12">
          <img src={user?.avatar} className="w-24 h-24 rounded-[36px] shadow-xl border-4 border-white ring-8 ring-slate-50" />
          <div className="flex-1">
            <h2 className="text-3xl font-black text-slate-900 leading-none">{user?.name}</h2>
            <div className="flex items-center gap-2 mt-3">
               <span className="text-slate-400 font-bold uppercase tracking-widest text-[10px]">{user?.email}</span>
            </div>
          </div>
          <button
            onClick={onEditProfile}
            className="px-4 py-2 bg-indigo-100 hover:bg-indigo-200 text-indigo-700 font-bold rounded-xl transition flex items-center gap-2"
          >
            <User size={16} />
            Edit
          </button>
        </div>
        <div className="grid grid-cols-2 gap-4 mb-12">
          <div className="bg-slate-50 p-8 rounded-[32px] text-center border border-slate-100">
            <div className="text-[10px] font-black text-slate-400 uppercase mb-2">Academic Credits</div>
            <div className="text-3xl font-black text-indigo-600">{user?.totalPoints}</div>
          </div>
          <div className="bg-orange-50 p-8 rounded-[32px] text-center border border-orange-100">
            <div className="text-[10px] font-black text-orange-400 uppercase mb-2">Focus Streak</div>
            <div className="text-3xl font-black text-orange-600">{user?.streak} Days</div>
          </div>
        </div>
        <div className="mb-12">
          <h4 className="font-black text-slate-800 text-[10px] uppercase tracking-widest mb-6 border-b border-slate-100 pb-4 flex items-center gap-2">
            <Award size={14} className="text-indigo-600" /> {t.sbtRegistry}
          </h4>
          <div className="space-y-3">
            {user?.sbtCredentials.map(sbt => (
              <div key={sbt.id} className="p-4 bg-indigo-50/50 rounded-2xl border border-indigo-100 flex items-center justify-between">
                <div>
                  <div className="text-[11px] font-black text-indigo-900 uppercase">{sbt.name} Certification</div>
                  <div className="text-[9px] font-bold text-slate-400 uppercase mt-1">SBT Hash: {sbt.id}</div>
                </div>
                <div className="text-[9px] font-black text-indigo-400 uppercase">{sbt.date.split('T')[0]}</div>
              </div>
            ))}
            {!user?.sbtCredentials.length && <p className="text-xs text-slate-300 italic text-center py-4">Complete your first module to earn a global credential.</p>}
          </div>
        </div>
        <button onClick={onLogout} className="w-full bg-red-50 text-red-600 py-4 rounded-3xl font-black text-xs hover:bg-red-100 transition-all">Logout Identity</button>
      </div>
    </div>
  );
};

export default App;
