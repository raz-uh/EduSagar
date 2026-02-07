
export enum Language {
  EN = 'en',
  NP = 'np'
}

export enum TargetLevel {
  PRIMARY = 'Primary (1-8)',
  SECONDARY = 'Secondary (9-12)',
  UNIVERSITY = 'University/Research',
  PROFESSIONAL = 'Professional/Work',
  HOBBY = 'Creative/Hobby',
  TECHNICAL = 'Technical/Skills'
}

export enum CourseStatus {
  SKELETON = 'skeleton',
  PUBLISHED = 'published'
}

export interface Flashcard {
  id: string;
  front: string;
  back: string;
  nextReviewDate: string;
  interval: number;
  easeFactor: number;
}

export interface Quiz {
  question: string;
  options: string[];
  answer: string;
}

export interface Lesson {
  id: string;
  title: string;
  content: string;
  quiz: Quiz;
  citation?: string;
  audioGenerated?: boolean;
}

export interface Module {
  id: string;
  title: string;
  description: string;
  isGenerated: boolean;
  lessons: Lesson[];
}

export interface Course {
  id: string;
  creatorId: string;
  title: string;
  description: string;
  modules: Module[];
  status: CourseStatus;
  points: number;
  createdAt: string;
  targetLevel: TargetLevel;
  verifications: number;
  confidenceScore: number;
  flashcards: Flashcard[];
  isSavedOffline?: boolean;
  ncfMapping?: string;
}

export interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
}

export interface Enrollment {
  id: string;
  user_id: string;
  course_id: string;
  completed_lessons: string[];
  enrolled_at: string;
  completed_at?: string;
  progress_percent?: number;
}

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  avatar: string;
  language: Language;
  walletAddress: string;
  totalPoints: number;
  weeklyPoints: number;
  badges: string[];
  streak: number;
  lastActiveDate: string;
  srsData: Record<string, number>;
  sbtCredentials: Array<{id: string, name: string, date: string}>;
}

export interface TranslationStrings {
  home: string;
  courses: string;
  leaderboard: string;
  profile: string;
  generateCourse: string;
  enroll: string;
  points: string;
  wallet: string;
  language: string;
  admin: string;
  startLearning: string;
  modules: string;
  complete: string;
  next: string;
  submit: string;
  congratulations: string;
  streak: string;
  badges: string;
  academicId: string;
  credits: string;
  lowData: string;
  verify: string;
  source: string;
  flashcards: string;
  askGuru: string;
  bridgeTitle: string;
  bridgeDescription: string;
  unlockModule: string;
  generatingSyllabus: string;
  deepDiving: string;
  listen: string;
  exportBundle: string;
  sbtRegistry: string;
}
