export type LessonLevel = "beginner" | "intermediate" | "advanced";

export type VisualActionType =
  | "heading"
  | "text"
  | "diagram"
  | "annotation"
  | "highlight"
  | "arrow"
  | "equation"
  | "list"
  | "box"
  | "label";

export type Position = {
  x: number;
  y: number;
};

export type VisualAction = {
  id: string;
  type: VisualActionType;
  content: string;
  start_time: number;
  duration: number;
  position: Position;
};

export type LessonSection = {
  id: string;
  title: string;
  narration: string;
  start_time: number;
  end_time: number;
  visual_actions: VisualAction[];
};

export type Lesson = {
  id: string;
  title: string;
  topic: string;
  level: LessonLevel;
  duration: number;
  introduction: string;
  learning_objectives: string[];
  sections: LessonSection[];
  summary: string;
  key_points: string[];
  follow_up_questions: string[];
};

export type LessonGenerateRequest = {
  topic: string;
  level?: LessonLevel;
  duration?: number;
};

export type ApiErrorBody = {
  detail?: string | { detail?: string; code?: string };
  code?: string;
};
