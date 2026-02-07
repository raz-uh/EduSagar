
import { createClient } from '@supabase/supabase-js';
import { UserProfile, Course, Enrollment } from '../types';

// Initialize Supabase client
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

if (!supabaseUrl || !supabaseKey) {
  console.warn('Supabase credentials not found. Some features may be unavailable.');
}

export const supabase = createClient(supabaseUrl || '', supabaseKey || '');

// ============ USER OPERATIONS ============

export async function getUserProfile(userId: string): Promise<UserProfile | null> {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('id', userId)
    .single();

  if (error) {
    console.error('Error fetching user:', error);
    return null;
  }
  return data;
}

export async function createUserProfile(user: UserProfile): Promise<UserProfile | null> {
  const { data, error } = await supabase
    .from('users')
    .insert([user])
    .select()
    .single();

  if (error) {
    console.error('Error creating user:', error);
    return null;
  }
  return data;
}

export async function updateUserProfile(userId: string, updates: Partial<UserProfile>): Promise<UserProfile | null> {
  const { data, error } = await supabase
    .from('users')
    .update(updates)
    .eq('id', userId)
    .select()
    .single();

  if (error) {
    console.error('Error updating user:', error);
    return null;
  }
  return data;
}

// ============ COURSE OPERATIONS ============

export async function getCourses(): Promise<Course[]> {
  const { data, error } = await supabase
    .from('courses')
    .select('*');

  if (error) {
    console.error('Error fetching courses:', error);
    return [];
  }
  return data || [];
}

export async function getCourseById(courseId: string): Promise<Course | null> {
  const { data, error } = await supabase
    .from('courses')
    .select('*')
    .eq('id', courseId)
    .single();

  if (error) {
    console.error('Error fetching course:', error);
    return null;
  }
  return data;
}

export async function createCourse(course: Course): Promise<Course | null> {
  const { data, error } = await supabase
    .from('courses')
    .insert([course])
    .select()
    .single();

  if (error) {
    console.error('Error creating course:', error);
    return null;
  }
  return data;
}

export async function updateCourse(courseId: string, updates: Partial<Course>): Promise<Course | null> {
  const { data, error } = await supabase
    .from('courses')
    .update(updates)
    .eq('id', courseId)
    .select()
    .single();

  if (error) {
    console.error('Error updating course:', error);
    return null;
  }
  return data;
}

export async function deleteCourse(courseId: string): Promise<boolean> {
  const { error } = await supabase
    .from('courses')
    .delete()
    .eq('id', courseId);

  if (error) {
    console.error('Error deleting course:', error);
    return false;
  }
  return true;
}

// ============ ENROLLMENT OPERATIONS ============

export async function getEnrollments(userId: string): Promise<Enrollment[]> {
  const { data, error } = await supabase
    .from('enrollments')
    .select('*')
    .eq('user_id', userId);

  if (error) {
    console.error('Error fetching enrollments:', error);
    return [];
  }
  return data || [];
}

export async function getEnrollment(userId: string, courseId: string): Promise<Enrollment | null> {
  const { data, error } = await supabase
    .from('enrollments')
    .select('*')
    .eq('user_id', userId)
    .eq('course_id', courseId)
    .single();

  if (error && error.code !== 'PGRST116') { // PGRST116 = no rows found
    console.error('Error fetching enrollment:', error);
  }
  return data || null;
}

export async function createEnrollment(userId: string, courseId: string): Promise<Enrollment | null> {
  const { data, error } = await supabase
    .from('enrollments')
    .insert([{ user_id: userId, course_id: courseId, completed_lessons: [] }])
    .select()
    .single();

  if (error) {
    console.error('Error creating enrollment:', error);
    return null;
  }
  return data;
}

export async function updateEnrollmentLessons(
  userId: string,
  courseId: string,
  completedLessonId: string
): Promise<Enrollment | null> {
  // Get current enrollment
  const enrollment = await getEnrollment(userId, courseId);
  if (!enrollment) return null;

  // Add lesson to completed array if not already there
  const completed = Array.isArray(enrollment.completed_lessons) ? enrollment.completed_lessons : [];
  if (!completed.includes(completedLessonId)) {
    completed.push(completedLessonId);
  }

  // Update with new array
  const { data, error } = await supabase
    .from('enrollments')
    .update({ completed_lessons: completed })
    .eq('user_id', userId)
    .eq('course_id', courseId)
    .select()
    .single();

  if (error) {
    console.error('Error updating enrollment:', error);
    return null;
  }
  return data;
}

// ============ BADGE OPERATIONS ============

export async function addBadgeToUser(userId: string, badgeId: string): Promise<boolean> {
  const user = await getUserProfile(userId);
  if (!user) return false;

  const badges = Array.isArray(user.badges) ? user.badges : [];
  if (!badges.includes(badgeId)) {
    badges.push(badgeId);
  }

  const updated = await updateUserProfile(userId, { badges });
  return updated !== null;
}

// ============ SOULBOUND CREDENTIAL OPERATIONS ============

export async function addSBTCredential(
  userId: string,
  credentialId: string,
  moduleName: string,
  date: string
): Promise<boolean> {
  const user = await getUserProfile(userId);
  if (!user) return false;

  const credentials = Array.isArray(user.sbtCredentials) ? user.sbtCredentials : [];
  credentials.push({ id: credentialId, name: moduleName, date });

  const updated = await updateUserProfile(userId, { sbtCredentials: credentials });
  return updated !== null;
}

// ============ STREAK OPERATIONS ============

export async function updateStreak(userId: string, newStreak: number, lastActiveDate: string): Promise<boolean> {
  const updated = await updateUserProfile(userId, { streak: newStreak, lastActiveDate });
  return updated !== null;
}

// ============ POINTS OPERATIONS ============

export async function addPoints(userId: string, points: number): Promise<boolean> {
  const user = await getUserProfile(userId);
  if (!user) return false;

  const newTotal = (user.totalPoints || 0) + points;
  const newWeekly = (user.weeklyPoints || 0) + points;

  const updated = await updateUserProfile(userId, {
    totalPoints: newTotal,
    weeklyPoints: newWeekly
  });
  return updated !== null;
}

// ============ BULK OPERATIONS ============

export async function exportUserData(userId: string): Promise<{ user: UserProfile | null; courses: Course[]; enrollments: Enrollment[] }> {
  const user = await getUserProfile(userId);
  const enrollmentsList = await getEnrollments(userId);
  
  const courseIds = enrollmentsList.map(e => e.course_id);
  let courses: Course[] = [];
  
  if (courseIds.length > 0) {
    const { data, error } = await supabase
      .from('courses')
      .select('*')
      .in('id', courseIds);
    
    if (!error) {
      courses = data || [];
    }
  }

  return { user, courses, enrollments: enrollmentsList };
}
