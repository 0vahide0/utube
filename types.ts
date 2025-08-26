
export interface VideoAnalysis {
  title: string;
  analysisText: string;
}

export interface ChatMessage {
  role: 'user' | 'model';
  content: string;
}