import { GoogleGenAI, Type, Chat } from "@google/genai";
import type { VideoAnalysis, ChatMessage } from '../types';
import { parseJSON } from "../utils";

const API_KEY = process.env.API_KEY;

if (!API_KEY) {
  throw new Error("API_KEY environment variable not set.");
}

const ai = new GoogleGenAI({ apiKey: API_KEY });

export const analyzeYouTubeVideo = async (url: string, customInstructions: string): Promise<VideoAnalysis> => {
  if (!url.includes('youtube.com') && !url.includes('youtu.be')) {
    throw new Error('Invalid YouTube URL provided.');
  }

  const prompt = `You are an expert video analyst. Analyze the attached video content directly (frames, audio, transcript).
            
  Create a strategic content analysis based on the user's custom instructions below.
  
  Your response must include the video's official title and the detailed analysis text.
  
  ---
  **User's Custom Instructions:**
  ${customInstructions}
  ---
  `;

  try {
    const parts = [
      { text: prompt },
      {
        fileData: {
          mimeType: 'video/mp4',
          fileUri: url,
        },
      },
    ];

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: [{ role: 'user', parts }],
      config: {
        responseMimeType: "application/json",
        responseSchema: {
            type: Type.OBJECT,
            properties: {
                title: {
                    type: Type.STRING,
                    description: "The official title of the YouTube video."
                },
                analysisText: {
                    type: Type.STRING,
                    description: "A detailed analysis of the video content based on the user's instructions. This text can contain formatting like newlines."
                }
            },
            required: ["title", "analysisText"]
        }
      }
    });

    const parsedData = parseJSON(response.text);
    
    if (parsedData.title && typeof parsedData.analysisText !== 'undefined') {
        return {
            title: parsedData.title,
            analysisText: parsedData.analysisText,
        } as VideoAnalysis;
    }

    // This will catch cases where the JSON is valid but lacks the expected fields.
    throw new Error("Received an unexpected or incomplete data structure from the API.");

  } catch (error) {
    console.error("Error in analyzeYouTubeVideo:", error);
    if (error instanceof SyntaxError) {
        throw new Error("Failed to parse the analysis from the API. The response was not valid JSON.");
    }
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
    throw new Error(`Could not analyze video. Reason: ${errorMessage}`);
  }
};

export const generateSuggestedPrompts = async (analysisText: string): Promise<{ videoPrompt: string; imagePrompt: string; }> => {
    const prompt = `Based on the following video analysis, generate two distinct, creative, and descriptive prompts. One should be for generating a video with Veo, and the other for generating an image with Imagen. The prompts should capture the essence or a key theme of the analysis.

Analysis:
---
${analysisText}
---`;

    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        videoPrompt: {
                            type: Type.STRING,
                            description: "A creative and descriptive prompt for generating a video."
                        },
                        imagePrompt: {
                            type: Type.STRING,
                            description: "A creative and descriptive prompt for generating an image."
                        },
                    },
                    required: ["videoPrompt", "imagePrompt"],
                },
            },
        });
        
        return parseJSON(response.text);

    } catch (error) {
        console.error("Error in generateSuggestedPrompts:", error);
        const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
        throw new Error(`Could not generate suggested prompts. Reason: ${errorMessage}`);
    }
};


export const generateImage = async (prompt: string): Promise<string> => {
    try {
        const response = await ai.models.generateImages({
            model: 'imagen-3.0-generate-002',
            prompt: prompt,
            config: {
                numberOfImages: 1,
                outputMimeType: 'image/jpeg',
                aspectRatio: '16:9',
            },
        });

        if (response.generatedImages && response.generatedImages.length > 0) {
            const base64ImageBytes: string = response.generatedImages[0].image.imageBytes;
            return `data:image/jpeg;base64,${base64ImageBytes}`;
        }
        throw new Error("Image generation completed, but no image data was returned.");
    } catch (error) {
        console.error("Error generating image:", error);
        const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
        throw new Error(`Could not generate image. Reason: ${errorMessage}`);
    }
};

export const generateScriptForTTS = async (analysisText: string): Promise<string> => {
    const prompt = `Based on the following video analysis, write a concise and engaging 150-word audio script summarizing the key points. The script should be suitable for a text-to-speech voiceover. It should be written in a clear, narrative style. Do not include any headings or special formatting.

Analysis:
---
${analysisText}
---`;
    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
        });
        return response.text;
    } catch (error) {
        console.error("Error generating TTS script:", error);
        const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
        throw new Error(`Could not generate audio script. Reason: ${errorMessage}`);
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

export const startVideoGeneration = async (prompt: string) => {
  try {
    const operation = await ai.models.generateVideos({
      model: 'veo-2.0-generate-001',
      prompt: prompt,
      config: {
        numberOfVideos: 1,
      },
    });
    return operation;
  } catch (error) {
    console.error("Error starting video generation:", error);
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
    throw new Error(`Could not start video generation. Reason: ${errorMessage}`);
  }
};

export const checkVideoGenerationStatus = async (operation: any) => {
    try {
        const updatedOperation = await ai.operations.getVideosOperation({ operation: operation });
        return updatedOperation;
    } catch (error) {
        console.error("Error checking video generation status:", error);
        const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
        throw new Error(`Could not check video status. Reason: ${errorMessage}`);
    }
};