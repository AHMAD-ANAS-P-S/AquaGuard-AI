import { useState, useEffect, useCallback, createContext, useContext, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  points_required: number;
  category: string;
}

interface UserGamification {
  id: string;
  user_id: string;
  total_points: number;
  quizzes_completed: number;
  reports_submitted: number;
  streak_days: number;
  last_activity_date: string | null;
  level: number;
}

interface LeaderboardEntry {
  user_id: string;
  total_points: number;
  level: number;
  quizzes_completed: number;
  email?: string;
}

interface Achievement {
  id: string;
  type: 'badge' | 'level' | 'points';
  title: string;
  description: string;
  icon?: string;
  points?: number;
  level?: number;
}

interface GamificationContextType {
  gamification: UserGamification | null;
  badges: Badge[];
  earnedBadges: string[];
  leaderboard: LeaderboardEntry[];
  loading: boolean;
  awardPoints: (points: number, reason: string) => Promise<void>;
  logQuizCompletion: (quizType: string, score: number, maxScore: number) => Promise<void>;
  logReportSubmission: () => Promise<void>;
  calculateLevel: (points: number) => number;
  achievements: Achievement[];
  dismissAchievement: () => void;
}

const GamificationContext = createContext<GamificationContextType | null>(null);

export const GamificationProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useAuth();
  const [gamification, setGamification] = useState<UserGamification | null>(null);
  const [badges, setBadges] = useState<Badge[]>([]);
  const [earnedBadges, setEarnedBadges] = useState<string[]>([]);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [achievements, setAchievements] = useState<Achievement[]>([]);

  // Calculate level from points
  const calculateLevel = (points: number): number => {
    if (points < 50) return 1;
    if (points < 150) return 2;
    if (points < 300) return 3;
    if (points < 500) return 4;
    if (points < 800) return 5;
    if (points < 1200) return 6;
    if (points < 1800) return 7;
    if (points < 2500) return 8;
    if (points < 3500) return 9;
    return 10;
  };

  const getLevelName = (level: number): string => {
    const names = [
      'Health Starter',
      'Water Watcher',
      'Community Helper',
      'Health Champion',
      'Village Guardian',
      'Regional Expert',
      'Master Reporter',
      'Health Ambassador',
      'Elite Guardian',
      'Legendary Protector'
    ];
    return names[level - 1] || 'Legendary Protector';
  };

  const addAchievement = useCallback((achievement: Achievement) => {
    setAchievements(prev => [...prev, achievement]);
  }, []);

  const dismissAchievement = useCallback(() => {
    setAchievements(prev => prev.slice(1));
  }, []);

  // Initialize or load gamification data
  const loadGamificationData = useCallback(async () => {
    if (!user) return;

    try {
      // Load user gamification data
      let { data: gamData, error: gamError } = await supabase
        .from('user_gamification')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (gamError && gamError.code === 'PGRST116') {
        // No record exists, create one
        const { data: newData, error: insertError } = await supabase
          .from('user_gamification')
          .insert({ user_id: user.id })
          .select()
          .single();

        if (!insertError) {
          gamData = newData;
        }
      }

      if (gamData) {
        setGamification(gamData);
      }

      // Load all badges
      const { data: badgeData } = await supabase
        .from('badges')
        .select('*')
        .order('points_required', { ascending: true });

      if (badgeData) {
        setBadges(badgeData);
      }

      // Load earned badges
      const { data: earnedData } = await supabase
        .from('user_badges')
        .select('badge_id')
        .eq('user_id', user.id);

      if (earnedData) {
        setEarnedBadges(earnedData.map(e => e.badge_id));
      }

      // Load leaderboard
      const { data: leaderboardData } = await supabase
        .from('user_gamification')
        .select('user_id, total_points, level, quizzes_completed')
        .order('total_points', { ascending: false })
        .limit(20);

      if (leaderboardData) {
        setLeaderboard(leaderboardData);
      }
    } catch (error) {
      console.error('Error loading gamification:', error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Check and award badges
  const checkAndAwardBadges = useCallback(async (totalPoints: number, streakDays: number, currentGamification: UserGamification | null) => {
    if (!user) return;

    for (const badge of badges) {
      if (earnedBadges.includes(badge.id)) continue;

      let shouldAward = false;

      switch (badge.category) {
        case 'points':
          shouldAward = totalPoints >= badge.points_required;
          break;
        case 'streak':
          if (badge.name === 'Streak Starter') shouldAward = streakDays >= 3;
          if (badge.name === 'Streak Champion') shouldAward = streakDays >= 7;
          break;
        case 'quiz':
          if (badge.name === 'First Steps' && currentGamification?.quizzes_completed && currentGamification.quizzes_completed >= 1) {
            shouldAward = true;
          }
          if (badge.name === 'Knowledge Seeker' && currentGamification?.quizzes_completed && currentGamification.quizzes_completed >= 5) {
            shouldAward = true;
          }
          break;
        case 'level':
          if (badge.name === 'Health Ambassador' && currentGamification?.level && currentGamification.level >= 5) {
            shouldAward = true;
          }
          break;
      }

      if (shouldAward) {
        const { error } = await supabase
          .from('user_badges')
          .insert({ user_id: user.id, badge_id: badge.id });

        if (!error) {
          setEarnedBadges(prev => [...prev, badge.id]);
          addAchievement({
            id: badge.id,
            type: 'badge',
            title: badge.name,
            description: badge.description,
            icon: badge.icon,
          });
        }
      }
    }
  }, [user, badges, earnedBadges, addAchievement]);

  // Award points
  const awardPoints = useCallback(async (points: number, reason: string) => {
    if (!user || !gamification) return;

    const newTotal = gamification.total_points + points;
    const currentLevel = gamification.level;
    const newLevel = calculateLevel(newTotal);
    const today = new Date().toISOString().split('T')[0];
    
    // Calculate streak
    let newStreak = gamification.streak_days;
    if (gamification.last_activity_date) {
      const lastDate = new Date(gamification.last_activity_date);
      const todayDate = new Date(today);
      const diffDays = Math.floor((todayDate.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24));
      
      if (diffDays === 1) {
        newStreak += 1;
      } else if (diffDays > 1) {
        newStreak = 1;
      }
    } else {
      newStreak = 1;
    }

    const { error } = await supabase
      .from('user_gamification')
      .update({
        total_points: newTotal,
        level: newLevel,
        streak_days: newStreak,
        last_activity_date: today,
      })
      .eq('user_id', user.id);

    if (!error) {
      const updatedGamification = {
        ...gamification,
        total_points: newTotal,
        level: newLevel,
        streak_days: newStreak,
        last_activity_date: today,
      };
      
      setGamification(updatedGamification);

      // Show points achievement
      addAchievement({
        id: `points-${Date.now()}`,
        type: 'points',
        title: reason,
        description: 'Great contribution to community health!',
        points,
      });

      // Check for level up
      if (newLevel > currentLevel) {
        setTimeout(() => {
          addAchievement({
            id: `level-${newLevel}`,
            type: 'level',
            title: `Level ${newLevel}: ${getLevelName(newLevel)}`,
            description: 'Congratulations on reaching a new level!',
            level: newLevel,
          });
        }, 5500);
      }

      // Check for new badges
      await checkAndAwardBadges(newTotal, newStreak, updatedGamification);
    }
  }, [user, gamification, addAchievement, checkAndAwardBadges]);

  // Log quiz completion
  const logQuizCompletion = useCallback(async (quizType: string, score: number, maxScore: number) => {
    if (!user || !gamification) return;

    const passed = score >= maxScore * 0.6;
    const pointsEarned = passed ? Math.round(score * 10) : Math.round(score * 5);

    // Log the completion
    await supabase
      .from('quiz_completions')
      .insert({
        user_id: user.id,
        quiz_type: quizType,
        score,
        max_score: maxScore,
        points_earned: pointsEarned,
        passed,
      });

    // Update gamification
    const newQuizCount = gamification.quizzes_completed + 1;
    await supabase
      .from('user_gamification')
      .update({ quizzes_completed: newQuizCount })
      .eq('user_id', user.id);

    setGamification(prev => prev ? {
      ...prev,
      quizzes_completed: newQuizCount,
    } : null);

    // Award points
    await awardPoints(pointsEarned, passed ? 'Quiz Passed!' : 'Quiz Completed');
  }, [user, gamification, awardPoints]);

  // Log report submission
  const logReportSubmission = useCallback(async () => {
    if (!user || !gamification) return;

    const newReportsSubmitted = gamification.reports_submitted + 1;
    await supabase
      .from('user_gamification')
      .update({ reports_submitted: newReportsSubmitted })
      .eq('user_id', user.id);

    setGamification(prev => prev ? {
      ...prev,
      reports_submitted: newReportsSubmitted,
    } : null);

    await awardPoints(25, 'Health Report Submitted');
  }, [user, gamification, awardPoints]);

  useEffect(() => {
    loadGamificationData();
  }, [loadGamificationData]);

  // Set up realtime subscription for leaderboard
  useEffect(() => {
    const channel = supabase
      .channel('leaderboard')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'user_gamification' },
        () => {
          loadGamificationData();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [loadGamificationData]);

  return (
    <GamificationContext.Provider value={{
      gamification,
      badges,
      earnedBadges,
      leaderboard,
      loading,
      awardPoints,
      logQuizCompletion,
      logReportSubmission,
      calculateLevel,
      achievements,
      dismissAchievement,
    }}>
      {children}
    </GamificationContext.Provider>
  );
};

export const useGamification = () => {
  const context = useContext(GamificationContext);
  if (!context) {
    // Return a safe default for components not wrapped in provider
    return {
      gamification: null,
      badges: [],
      earnedBadges: [],
      leaderboard: [],
      loading: true,
      awardPoints: async () => {},
      logQuizCompletion: async () => {},
      logReportSubmission: async () => {},
      calculateLevel: () => 1,
      achievements: [],
      dismissAchievement: () => {},
    };
  }
  return context;
};
