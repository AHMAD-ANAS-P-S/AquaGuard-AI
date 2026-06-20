import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, Star, Award, Sparkles, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import confetti from 'canvas-confetti';

interface Achievement {
  id: string;
  type: 'badge' | 'level' | 'points';
  title: string;
  description: string;
  icon?: string;
  points?: number;
  level?: number;
}

interface AchievementNotificationProps {
  achievement: Achievement | null;
  onClose: () => void;
}

export const AchievementNotification = ({ achievement, onClose }: AchievementNotificationProps) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (achievement) {
      setIsVisible(true);
      
      // Trigger confetti for major achievements
      if (achievement.type === 'level' || achievement.type === 'badge') {
        const duration = 3000;
        const end = Date.now() + duration;

        const frame = () => {
          confetti({
            particleCount: 3,
            angle: 60,
            spread: 55,
            origin: { x: 0, y: 0.6 },
            colors: ['#22c55e', '#3b82f6', '#f59e0b', '#ec4899']
          });
          confetti({
            particleCount: 3,
            angle: 120,
            spread: 55,
            origin: { x: 1, y: 0.6 },
            colors: ['#22c55e', '#3b82f6', '#f59e0b', '#ec4899']
          });

          if (Date.now() < end) {
            requestAnimationFrame(frame);
          }
        };
        frame();
      }

      // Auto close after 5 seconds
      const timer = setTimeout(() => {
        setIsVisible(false);
        setTimeout(onClose, 300);
      }, 5000);

      return () => clearTimeout(timer);
    }
  }, [achievement, onClose]);

  const getIcon = () => {
    switch (achievement?.type) {
      case 'badge':
        return <Award className="w-12 h-12 text-yellow-400" />;
      case 'level':
        return <Star className="w-12 h-12 text-purple-400" />;
      case 'points':
        return <Trophy className="w-12 h-12 text-emerald-400" />;
      default:
        return <Sparkles className="w-12 h-12 text-blue-400" />;
    }
  };

  const getGradient = () => {
    switch (achievement?.type) {
      case 'badge':
        return 'from-yellow-500/20 via-amber-500/20 to-orange-500/20';
      case 'level':
        return 'from-purple-500/20 via-pink-500/20 to-rose-500/20';
      case 'points':
        return 'from-emerald-500/20 via-green-500/20 to-teal-500/20';
      default:
        return 'from-blue-500/20 via-cyan-500/20 to-sky-500/20';
    }
  };

  if (!achievement) return null;

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: -100, scale: 0.8 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -50, scale: 0.8 }}
          transition={{ type: 'spring', damping: 15, stiffness: 300 }}
          className="fixed top-4 left-1/2 -translate-x-1/2 z-[100] w-[90%] max-w-md"
        >
          <div className={`relative overflow-hidden rounded-2xl border border-border/50 bg-gradient-to-br ${getGradient()} backdrop-blur-xl shadow-2xl`}>
            {/* Animated background particles */}
            <div className="absolute inset-0 overflow-hidden">
              {[...Array(20)].map((_, i) => (
                <motion.div
                  key={i}
                  className="absolute w-1 h-1 rounded-full bg-white/30"
                  initial={{ 
                    x: Math.random() * 400, 
                    y: Math.random() * 200,
                    opacity: 0 
                  }}
                  animate={{ 
                    y: [null, Math.random() * -100],
                    opacity: [0, 1, 0],
                  }}
                  transition={{
                    duration: 2 + Math.random() * 2,
                    repeat: Infinity,
                    delay: Math.random() * 2,
                  }}
                />
              ))}
            </div>

            <div className="relative p-6">
              <Button
                variant="ghost"
                size="icon"
                className="absolute top-2 right-2 h-8 w-8 rounded-full"
                onClick={() => {
                  setIsVisible(false);
                  setTimeout(onClose, 300);
                }}
              >
                <X className="h-4 w-4" />
              </Button>

              <div className="flex items-center gap-4">
                {/* Icon with glow effect */}
                <motion.div
                  className="relative"
                  animate={{ 
                    scale: [1, 1.1, 1],
                    rotate: [0, 5, -5, 0]
                  }}
                  transition={{ 
                    duration: 2,
                    repeat: Infinity,
                    ease: "easeInOut"
                  }}
                >
                  <div className="absolute inset-0 blur-xl bg-current opacity-50" />
                  <div className="relative bg-card/80 rounded-full p-3 border border-border/50">
                    {getIcon()}
                  </div>
                </motion.div>

                <div className="flex-1 min-w-0">
                  <motion.p
                    className="text-xs font-medium text-muted-foreground uppercase tracking-wider"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.2 }}
                  >
                    {achievement.type === 'level' ? '🎉 Level Up!' : 
                     achievement.type === 'badge' ? '🏆 New Badge!' : 
                     '⭐ Points Earned!'}
                  </motion.p>
                  <motion.h3
                    className="text-lg font-bold text-foreground truncate"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.3 }}
                  >
                    {achievement.title}
                  </motion.h3>
                  <motion.p
                    className="text-sm text-muted-foreground line-clamp-2"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.4 }}
                  >
                    {achievement.description}
                  </motion.p>
                </div>
              </div>

              {/* Points/Level indicator */}
              {(achievement.points || achievement.level) && (
                <motion.div
                  className="mt-4 flex items-center justify-center"
                  initial={{ opacity: 0, scale: 0 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.5, type: 'spring' }}
                >
                  <div className="bg-primary/20 rounded-full px-4 py-2 border border-primary/30">
                    <span className="text-lg font-bold text-primary">
                      {achievement.points ? `+${achievement.points} Points` : `Level ${achievement.level}`}
                    </span>
                  </div>
                </motion.div>
              )}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
