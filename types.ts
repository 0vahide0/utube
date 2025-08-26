
export interface VideoAnalysis {
  title: string;
  summary: string;
  detailedAnalysis: string[];
}

export interface ChatMessage {
  role: 'user' | 'model';
  content: string;
}
