import React, { useState, useCallback } from 'react';
import { startVideoGeneration, checkVideoGenerationStatus } from '../services/geminiService';
import ErrorMessage from './ErrorMessage';

const API_KEY = process.env.API_KEY;

const loadingMessages = [
    "Kicking off the video generation process...",
    "The model is warming up and preparing the scene.",
    "Video generation is in progress. This can take a few minutes.",
    "Still working... rendering frames and composing the video.",
    "Finalizing the video... adding finishing touches.",
    "Almost there... preparing the video for display.",
];

const GeneratorView: React.FC = () => {
    const [prompt, setPrompt] = useState<string>('');
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [loadingMessage, setLoadingMessage] = useState<string>('');
    const [generatedVideoUrl, setGeneratedVideoUrl] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = useCallback(async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (!prompt.trim() || isLoading) return;

        setIsLoading(true);
        setError(null);
        setGeneratedVideoUrl(null);
        let messageIndex = 0;
        setLoadingMessage(loadingMessages[messageIndex]);

        try {
            let operation = await startVideoGeneration(prompt);
            
            while (!operation.done) {
                await new Promise(resolve => setTimeout(resolve, 10000));
                messageIndex = Math.min(messageIndex + 1, loadingMessages.length - 1);
                setLoadingMessage(loadingMessages[messageIndex]);
                operation = await checkVideoGenerationStatus(operation);
            }

            if (operation.response?.generatedVideos?.[0]?.video?.uri) {
                setLoadingMessage("Success! Fetching your video now.");
                const downloadLink = operation.response.generatedVideos[0].video.uri;
                
                const response = await fetch(`${downloadLink}&key=${API_KEY}`);
                if (!response.ok) {
                    throw new Error(`Failed to fetch video file. Status: ${response.status}`);
                }

                const videoBlob = await response.blob();
                const videoUrl = URL.createObjectURL(videoBlob);
                setGeneratedVideoUrl(videoUrl);
            } else {
                throw new Error("Video generation completed, but no video URI was found.");
            }

        } catch (err) {
            console.error(err);
            const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred.';
            setError(`Failed to generate video. ${errorMessage}`);
        } finally {
            setIsLoading(false);
            setLoadingMessage('');
        }
    }, [prompt, isLoading]);

    const handleSampleClick = useCallback(() => {
        const samplePrompt = 'A cinematic, surreal, futuristic shot of a metallic, bioluminescent octopus swimming through a vibrant, glowing coral reef at night.';
        setPrompt(samplePrompt);
    }, []);

    return (
        <div className="space-y-6">
            <div>
                <p className="text-center text-gray-400 mb-4">
                    Describe the video you want to create. Be as descriptive as possible!
                </p>
                <form onSubmit={handleSubmit} className="space-y-3">
                    <textarea
                        value={prompt}
                        onChange={(e) => setPrompt(e.target.value)}
                        placeholder="e.g., A photorealistic video of a cat playing a grand piano on a beach at sunset."
                        required
                        rows={4}
                        className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-md focus:ring-2 focus:ring-red-500 focus:border-red-500 transition duration-200 text-gray-200 placeholder-gray-500 disabled:opacity-50"
                        disabled={isLoading}
                    />
                    <div className="flex flex-col sm:flex-row items-stretch shrink-0 gap-3">
                        <button
                          type="button"
                          onClick={handleSampleClick}
                          disabled={isLoading}
                          className="px-6 py-3 bg-gray-700 text-gray-200 font-semibold rounded-md hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 focus:ring-red-500 disabled:bg-gray-800 disabled:text-gray-500 disabled:cursor-not-allowed transition duration-200"
                          title="Try with a sample prompt"
                        >
                            Sample Prompt
                        </button>
                        <button
                          type="submit"
                          disabled={isLoading || !prompt.trim()}
                          className="flex-grow flex items-center justify-center px-6 py-3 bg-red-600 text-white font-semibold rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 focus:ring-red-500 disabled:bg-red-800 disabled:cursor-not-allowed transition duration-200"
                        >
                          {isLoading ? (
                            <>
                              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                              </svg>
                              Generating...
                            </>
                          ) : (
                            'Generate Video'
                          )}
                        </button>
                    </div>
                </form>
            </div>

            {isLoading && (
                <div className="flex flex-col items-center justify-center text-center p-6 bg-gray-800/50 border border-gray-700 rounded-lg animate-fade-in">
                    <svg className="animate-spin h-10 w-10 text-red-500 mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <h3 className="text-lg font-semibold text-gray-200">Generating Video...</h3>
                    <p className="text-gray-400 mt-1">{loadingMessage}</p>
                </div>
            )}

            {error && (
                <div className="mt-8 animate-fade-in">
                    <ErrorMessage message={error} />
                </div>
            )}

            {generatedVideoUrl && !isLoading && (
                <div className="mt-8 space-y-4 animate-fade-in">
                    <h3 className="text-xl font-semibold text-center text-gray-200">Your Generated Video</h3>
                    <div className="aspect-video w-full overflow-hidden rounded-lg border border-gray-700 shadow-xl bg-black">
                        <video
                            key={generatedVideoUrl}
                            controls
                            autoPlay
                            loop
                            className="w-full h-full"
                        >
                            <source src={generatedVideoUrl} type="video/mp4" />
                            Your browser does not support the video tag.
                        </video>
                    </div>
                </div>
            )}
        </div>
    );
};

export default GeneratorView;
