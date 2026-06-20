import { useGamification } from '@/hooks/useGamification';
import { useAuth } from '@/hooks/useAuth';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Trophy, Medal, Award, Star, Crown, Flame } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';

export const Leaderboard = () => {
  const { user } = useAuth();
  const { leaderboard, gamification, badges, earnedBadges, loading } = useGamification();

  const getRankIcon = (rank: number) => {
    if (rank === 1) return <Crown className="w-5 h-5 text-yellow-500" />;
    if (rank === 2) return <Medal className="w-5 h-5 text-gray-400" />;
    if (rank === 3) return <Medal className="w-5 h-5 text-amber-600" />;
    return <span className="w-5 h-5 flex items-center justify-center text-sm font-bold text-muted-foreground">#{rank}</span>;
  };

  const getLevelColor = (level: number) => {
    if (level >= 8) return 'bg-gradient-to-r from-purple-500 to-pink-500';
    if (level >= 6) return 'bg-gradient-to-r from-blue-500 to-cyan-500';
    if (level >= 4) return 'bg-gradient-to-r from-green-500 to-emerald-500';
    return 'bg-gradient-to-r from-gray-500 to-slate-500';
  };

  if (loading) {
    return (
      <Card className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-muted rounded w-1/3"></div>
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map(i => (
              <div key={i} className="h-12 bg-muted rounded"></div>
            ))}
          </div>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* User Stats Card */}
      {gamification && (
        <Card className="p-6 bg-gradient-to-br from-primary/10 via-secondary/5 to-accent/10 border-primary/20">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <Star className="w-5 h-5 text-primary" />
              Your Progress
            </h3>
            <Badge className={`${getLevelColor(gamification.level)} text-white`}>
              Level {gamification.level}
            </Badge>
          </div>
          
          <div className="grid grid-cols-3 gap-4 text-center">
            <div className="p-3 bg-background/50 rounded-lg">
              <div className="text-2xl font-bold text-primary">{gamification.total_points}</div>
              <div className="text-xs text-muted-foreground">Total Points</div>
            </div>
            <div className="p-3 bg-background/50 rounded-lg">
              <div className="text-2xl font-bold text-secondary">{gamification.quizzes_completed}</div>
              <div className="text-xs text-muted-foreground">Quizzes</div>
            </div>
            <div className="p-3 bg-background/50 rounded-lg flex flex-col items-center">
              <div className="text-2xl font-bold text-accent flex items-center gap-1">
                {gamification.streak_days}
                <Flame className="w-4 h-4" />
              </div>
              <div className="text-xs text-muted-foreground">Day Streak</div>
            </div>
          </div>
        </Card>
      )}

      {/* Badges */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold flex items-center gap-2 mb-4">
          <Award className="w-5 h-5 text-accent" />
          Your Badges
        </h3>
        <div className="grid grid-cols-4 md:grid-cols-5 gap-3">
          {badges.map(badge => {
            const earned = earnedBadges.includes(badge.id);
            return (
              <div
                key={badge.id}
                className={`p-3 rounded-lg text-center transition-all ${
                  earned 
                    ? 'bg-accent/20 border border-accent/30' 
                    : 'bg-muted/30 opacity-50'
                }`}
                title={badge.description}
              >
                <div className={`text-2xl mb-1 ${earned ? '' : 'grayscale'}`}>
                  {badge.icon === 'trophy' && '🏆'}
                  {badge.icon === 'book' && '📚'}
                  {badge.icon === 'award' && '🎖️'}
                  {badge.icon === 'heart' && '❤️'}
                  {badge.icon === 'shield' && '🛡️'}
                  {badge.icon === 'flame' && '🔥'}
                  {badge.icon === 'star' && '⭐'}
                  {badge.icon === 'droplet' && '💧'}
                  {badge.icon === 'medal' && '🏅'}
                </div>
                <div className="text-xs font-medium truncate">{badge.name}</div>
              </div>
            );
          })}
        </div>
      </Card>

      {/* Leaderboard */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold flex items-center gap-2 mb-4">
          <Trophy className="w-5 h-5 text-yellow-500" />
          Leaderboard
        </h3>
        <ScrollArea className="h-[300px]">
          <div className="space-y-2">
            {leaderboard.map((entry, index) => {
              const isCurrentUser = entry.user_id === user?.id;
              return (
                <div
                  key={entry.user_id}
                  className={`flex items-center gap-3 p-3 rounded-lg transition-all ${
                    isCurrentUser 
                      ? 'bg-primary/10 border border-primary/30' 
                      : 'bg-muted/30 hover:bg-muted/50'
                  }`}
                >
                  <div className="w-8 flex justify-center">
                    {getRankIcon(index + 1)}
                  </div>
                  <div className="flex-1">
                    <div className="font-medium text-sm">
                      {isCurrentUser ? 'You' : `Player ${index + 1}`}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Level {entry.level} • {entry.quizzes_completed} quizzes
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-primary">{entry.total_points}</div>
                    <div className="text-xs text-muted-foreground">points</div>
                  </div>
                </div>
              );
            })}
          </div>
        </ScrollArea>
      </Card>
    </div>
  );
};
