import { useGamification } from '@/hooks/useGamification';
import { AchievementNotification } from './AchievementNotification';

export const AchievementDisplay = () => {
  const { achievements, dismissAchievement } = useGamification();
  
  const currentAchievement = achievements.length > 0 ? achievements[0] : null;

  return (
    <AchievementNotification 
      achievement={currentAchievement} 
      onClose={dismissAchievement} 
    />
  );
};
