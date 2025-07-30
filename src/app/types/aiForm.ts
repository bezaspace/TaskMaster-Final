export interface AIFormParseRequest {
  text: string;
}

export interface AIFormParseResponse {
  success: boolean;
  data?: {
    title: string;
    description: string;
    task_date?: string | null;
    start_time?: string | null;
    end_time?: string | null;
  };
  error?: string;
  confidence?: number; // 0-1 scale of how confident the AI is in the parsing
}

export interface AIFormFillerProps {
  onFormFill: (data: AIFormParseResponse['data']) => void;
  disabled?: boolean;
}