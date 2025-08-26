import { GoogleGenAI, Type, Chat } from "@google/genai";
import type { VideoAnalysis, ChatMessage } from '../types';

const API_KEY = process.env.API_KEY;

if (!API_KEY) {
  throw new Error("API_KEY environment variable not set.");
}

const ai = new GoogleGenAI({ apiKey: API_KEY });

export const analyzeYouTubeVideo = async (url: string): Promise<VideoAnalysis> => {
  if (!url.includes('youtube.com') && !url.includes('youtu.be')) {
    throw new Error('Invalid YouTube URL provided.');
  }

  const prompt = `You are an expert video analyst. Use Google Search to find information about the YouTube video at this URL: ${url}. Based on your search results, analyze the video's content.

Your entire response MUST be a single, valid JSON object, without any markdown formatting (like \`\`\`json). The JSON object must conform to this structure:
{
  "title": "The video's actual title",
  "summary": "A concise, one-paragraph summary of the video based on the search results.",
  "detailedAnalysis": [
    "A key point or observation from your analysis.",
    "Another key point or observation."
  ]
}`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        tools: [{googleSearch: {}}],
      },
    });

    const jsonText = response.text.trim();
    // Gemini may sometimes wrap the JSON in ```json ... ```, so we need to clean it.
    const cleanedJsonText = jsonText.replace(/^```json\s*|```$/g, '');
    const parsedData = JSON.parse(cleanedJsonText);
    
    // Basic validation
    if (!parsedData.title || !parsedData.summary || !Array.isArray(parsedData.detailedAnalysis)) {
        throw new Error("Received malformed data from API. Failed to parse the analysis structure.");
    }
    
    return parsedData as VideoAnalysis;

  } catch (error) {
    console.error("Error calling Gemini API:", error);
    if (error instanceof SyntaxError) {
        // This will catch JSON.parse errors
        throw new Error("Failed to parse the analysis from the API. The response was not valid JSON.");
    }
    throw new Error("Failed to get analysis from Gemini API.");
  }
};

export const streamChatResponse = async (
    modelName: string,
    history: ChatMessage[],
    newMessage: string
) => {
    const chat: Chat = ai.chats.create({
        model: modelName,
        history: history.map(msg => ({
            role: msg.role,
            parts: [{ text: msg.content }]
        }))
    });

    return chat.sendMessageStream({ message: newMessage });
};