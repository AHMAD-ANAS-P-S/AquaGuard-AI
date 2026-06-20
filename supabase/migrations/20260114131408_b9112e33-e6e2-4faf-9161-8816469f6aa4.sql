-- Create gamification tables for points, badges, and leaderboard

-- User gamification profile
CREATE TABLE public.user_gamification (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
    total_points INTEGER DEFAULT 0,
    quizzes_completed INTEGER DEFAULT 0,
    reports_submitted INTEGER DEFAULT 0,
    streak_days INTEGER DEFAULT 0,
    last_activity_date DATE,
    level INTEGER DEFAULT 1,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Badges table
CREATE TABLE public.badges (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT NOT NULL,
    icon TEXT NOT NULL,
    points_required INTEGER DEFAULT 0,
    category TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- User earned badges
CREATE TABLE public.user_badges (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    badge_id UUID REFERENCES public.badges(id) ON DELETE CASCADE NOT NULL,
    earned_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE(user_id, badge_id)
);

-- Quiz completions log
CREATE TABLE public.quiz_completions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    quiz_type TEXT NOT NULL,
    score INTEGER NOT NULL,
    max_score INTEGER NOT NULL,
    points_earned INTEGER NOT NULL,
    passed BOOLEAN NOT NULL,
    completed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Offline sync queue for reports
CREATE TABLE public.offline_sync_queue (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    data_type TEXT NOT NULL,
    data JSONB NOT NULL,
    synced BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    synced_at TIMESTAMP WITH TIME ZONE
);

-- SMS reports table for users without smartphones
CREATE TABLE public.sms_reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    phone_number TEXT NOT NULL,
    message TEXT NOT NULL,
    parsed_data JSONB,
    village_id UUID REFERENCES public.villages(id),
    status TEXT DEFAULT 'pending',
    processed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.user_gamification ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quiz_completions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.offline_sync_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sms_reports ENABLE ROW LEVEL SECURITY;

-- RLS Policies for user_gamification
CREATE POLICY "Users can view their own gamification data"
ON public.user_gamification FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own gamification data"
ON public.user_gamification FOR UPDATE
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own gamification data"
ON public.user_gamification FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Leaderboard: everyone can see all users for leaderboard
CREATE POLICY "Anyone can view leaderboard"
ON public.user_gamification FOR SELECT
TO authenticated
USING (true);

-- RLS Policies for badges (public read)
CREATE POLICY "Anyone can view badges"
ON public.badges FOR SELECT
TO authenticated
USING (true);

-- Only admins can manage badges
CREATE POLICY "Admins can manage badges"
ON public.badges FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for user_badges
CREATE POLICY "Users can view their own badges"
ON public.user_badges FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can earn badges"
ON public.user_badges FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- RLS Policies for quiz_completions
CREATE POLICY "Users can view their own quiz completions"
ON public.quiz_completions FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can log quiz completions"
ON public.quiz_completions FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- RLS Policies for offline_sync_queue
CREATE POLICY "Users can manage their own sync queue"
ON public.offline_sync_queue FOR ALL
TO authenticated
USING (auth.uid() = user_id);

-- RLS Policies for sms_reports
CREATE POLICY "Officials can view SMS reports"
ON public.sms_reports FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'official'));

CREATE POLICY "System can insert SMS reports"
ON public.sms_reports FOR INSERT
TO authenticated
WITH CHECK (true);

-- Insert default badges
INSERT INTO public.badges (name, description, icon, points_required, category) VALUES
('First Steps', 'Complete your first quiz', 'trophy', 0, 'quiz'),
('Knowledge Seeker', 'Complete 5 quizzes', 'book', 50, 'quiz'),
('Quiz Master', 'Complete 10 quizzes with 80%+ score', 'award', 200, 'quiz'),
('Community Helper', 'Submit your first health report', 'heart', 0, 'reports'),
('Health Guardian', 'Submit 10 health reports', 'shield', 100, 'reports'),
('Streak Starter', 'Maintain a 3-day activity streak', 'flame', 30, 'streak'),
('Streak Champion', 'Maintain a 7-day activity streak', 'flame', 70, 'streak'),
('Rising Star', 'Earn 100 total points', 'star', 100, 'points'),
('Water Warrior', 'Complete all water safety quizzes', 'droplet', 150, 'special'),
('Health Ambassador', 'Reach level 5', 'medal', 500, 'level');

-- Enable realtime for leaderboard
ALTER PUBLICATION supabase_realtime ADD TABLE public.user_gamification;
ALTER PUBLICATION supabase_realtime ADD TABLE public.quiz_completions;

-- Create trigger for updated_at
CREATE TRIGGER update_user_gamification_updated_at
BEFORE UPDATE ON public.user_gamification
FOR EACH ROW
EXECUTE FUNCTION public.handle_updated_at();