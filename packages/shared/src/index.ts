export * from "./resume.js";

export type UserRole = "USER" | "ADMIN";

export interface UserProfile {
  targetRole: string;
  experienceLevel: "STUDENT" | "ENTRY" | "MID" | "SENIOR" | "";
  targetCompanies: string[];
  dailyGoalMinutes: number;
  onboardingComplete: boolean;
  textSize: TextSize;
}

export type TextSize = "LARGE" | "EXTRA_LARGE" | "HUGE";

export interface PublicUser {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  profile: UserProfile;
}

export interface ApiResponse<T> {
  data: T;
  message?: string;
}

export interface AuthResponse {
  user: PublicUser;
}

export type UserProfileRow = {
  id: string;
  full_name: string;
  role: UserRole;
  target_role: string;
  experience_level: UserProfile["experienceLevel"];
  target_companies: string[];
  daily_goal_minutes: number;
  onboarding_complete: boolean;
  text_size: TextSize;
  created_at: string;
  updated_at: string;
};

export interface Database {
  public: {
    Tables: {
      user_profiles: {
        Row: UserProfileRow;
        Insert: {
          id: string;
          full_name?: string;
          target_role?: string;
          experience_level?: UserProfileRow["experience_level"];
          target_companies?: string[];
          daily_goal_minutes?: number;
          onboarding_complete?: boolean;
          text_size?: TextSize;
        };
        Update: {
          full_name?: string;
          target_role?: string;
          experience_level?: UserProfileRow["experience_level"];
          target_companies?: string[];
          daily_goal_minutes?: number;
          onboarding_complete?: boolean;
          text_size?: TextSize;
          updated_at?: string;
        };
        Relationships: [];
      };
      topics: {
        Row: TopicRow;
        Insert: { name: string; category: TopicCategory; description?: string };
        Update: Partial<TopicRow>;
        Relationships: [];
      };
      questions: {
        Row: QuestionRow;
        Insert: Omit<QuestionRow, "id" | "created_at">;
        Update: Partial<QuestionRow>;
        Relationships: [];
      };
      attempts: {
        Row: AttemptRow;
        Insert: {
          user_id: string;
          mode: PracticeMode;
          status?: AttemptRow["status"];
          topic_ids?: string[];
          difficulty?: QuestionDifficulty | null;
          company?: string | null;
          question_ids?: string[];
          duration_seconds?: number | null;
          completed_at?: string | null;
          score?: number;
          total_questions?: number;
        };
        Update: Partial<AttemptRow>;
        Relationships: [];
      };
      attempt_answers: {
        Row: AttemptAnswerRow;
        Insert: Omit<AttemptAnswerRow, "id">;
        Update: Partial<AttemptAnswerRow>;
        Relationships: [];
      };
      bookmarks: {
        Row: BookmarkRow;
        Insert: Omit<BookmarkRow, "created_at"> & { created_at?: string };
        Update: Partial<BookmarkRow>;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}

export type TopicCategory = "aptitude" | "technical" | "hr";
export type QuestionDifficulty = "easy" | "medium" | "hard";
export type PracticeMode = "practice" | "timed";

export type TopicRow = {
  id: string;
  name: string;
  category: TopicCategory;
  description: string;
  created_at: string;
};

export type QuestionRow = {
  id: string;
  topic_id: string;
  question_type: TopicCategory;
  difficulty: QuestionDifficulty;
  prompt: string;
  options: string[];
  correct_answer: string;
  explanation: string;
  company_tags: string[];
  active: boolean;
  created_at: string;
};

export type AttemptRow = {
  id: string;
  user_id: string;
  mode: PracticeMode;
  status: "in_progress" | "completed";
  topic_ids: string[];
  difficulty: QuestionDifficulty | null;
  company: string | null;
  question_ids: string[];
  duration_seconds: number | null;
  started_at: string;
  completed_at: string | null;
  score: number;
  total_questions: number;
  created_at: string;
};

export type AttemptAnswerRow = {
  id: string;
  attempt_id: string;
  question_id: string;
  selected_answer: string | null;
  is_correct: boolean | null;
  flagged: boolean;
  elapsed_seconds: number;
  answered_at: string | null;
};

export type BookmarkRow = {
  user_id: string;
  question_id: string;
  created_at: string;
};

export interface OnboardingInput {
  targetRole: string;
  experienceLevel: UserProfile["experienceLevel"];
  targetCompanies: string[];
  dailyGoalMinutes: number;
}
