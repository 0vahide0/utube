import * as genai from "@google/genai";
import type { VideoAnalysis, ChatMessage } from '../types';

const API_KEY = import.meta.env.VITE_API_KEY;

if (!API_KEY) {
  throw new Error("VITE_API_KEY environment variable not set. Please create a .env file and add your key.");
}

const genAI = new genai.GoogleGenerativeAI(API_KEY);

export const analyzeYouTubeVideo = async (url: string): Promise<VideoAnalysis> => {
  if (!url.includes('youtube.com') && !url.includes('youtu.be')) {
    throw new Error('Invalid YouTube URL provided.');
  }

  const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro", tools: [{'googleSearch': {}}]});

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
    const result = await model.generateContent(prompt);
    const response = result.response;
    const jsonText = response.text().trim();

    const cleanedJsonText = jsonText.replace(/^```json\s*|```$/g, '');
    const parsedData = JSON.parse(cleanedJsonText);
    
    if (!parsedData.title || !parsedData.summary || !Array.isArray(parsedData.detailedAnalysis)) {
        throw new Error("Received malformed data from API. Failed to parse the analysis structure.");
    }
    
    return parsedData as VideoAnalysis;

  } catch (error) {
    console.error("Error calling Gemini API:", error);
    if (error instanceof SyntaxError) {
        throw new Error("Failed to parse the analysis from the API. The response was not valid JSON.");
    }
    throw new Error("Failed to get analysis from Gemini API.");
  }
};

export const streamChatResponse = async (
    history: ChatMessage[],
    newMessage:string
) => {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash"});

    const chatHistory = history.map(msg => ({
        role: msg.role,
        parts: [{ text: msg.content }]
    }));

    const chat = model.startChat({
        history: chatHistory,
    });

    const result = await chat.sendMessageStream(newMessage);
    return result.stream;
};