import React, { useState, useEffect, useCallback } from 'react';
import { 
    generateSuggestedPrompts, 
    generateImage, 
    generateScriptForTTS,
    startVideoGeneration,
    checkVideoGenerationStatus
} from '../services/geminiService';
import ErrorMessage from './ErrorMessage';
import { ImageIcon } from './icons/ImageIcon';
import { VideoIcon } from './icons/VideoIcon';
import { AudioIcon } from './icons/AudioIcon';
import { PlayIcon } from './icons/PlayIcon';
import { StopIcon } from './icons/StopIcon';

const API_KEY = process.env.API_KEY;

interface ContentGenerationHubProps {
  analysisText: string;
}

const videoLoadingMessages = [
    "Warming up the video generator...",
    "Generation is in progress, this can take a few minutes...",
    "Still rendering frames...",
    "Finalizing the video now...",
];


const GenerationCard: React.FC<{
    title: string;
    icon: React.ReactNode;
    prompt: string;
    setPrompt: (p: string) => void;
    onGenerate: () => void;
    isLoading: boolean;
    isPromptLoading: boolean;
    result?: React.ReactNode;
    error?: string | null;
    isTextArea?: boolean;
}> = ({ title, icon, prompt, setPrompt, onGenerate, isLoading, isPromptLoading, result, error, isTextArea=true }) => (
    <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-4 flex flex-col">
        <h3 className="text-lg font-semibold text-gray-200 mb-3 flex items-center gap-2">
            {icon} {title}
        </h3>
        {isPromptLoading ? (
            <div className="w-full h-24 bg-gray-700 rounded-md animate-pulse"></div>
        ) : (
            isTextArea && <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                rows={3}
                className="w-full mb-3 px-3 py-2 bg-gray-900/50 border border-gray-600 rounded-md focus:ring-2 focus:ring-red-500 focus:border-red-500 transition duration-200 text-gray-300 placeholder-gray-500 disabled:opacity-50"
                disabled={isLoading}
                placeholder={`Enter a prompt for ${title}...`}
            />
        )}
        <button
            onClick={onGenerate}
            disabled={isLoading || isPromptLoading || (isTextArea && !prompt.trim())}
            className="w-full mt-auto flex items-center justify-center px-4 py-2 bg-red-600 text-white font-semibold rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 focus:ring-red-500 disabled:bg-red-800 disabled:cursor-not-allowed transition duration-200"
        >
            {isLoading ? (
                <>
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                    Generating...
                </>
            ) : `Generate ${title}`}
        </button>
        {result && <div className="mt-4">{result}</div>}
        {error && <div className="mt-4"><ErrorMessage message={error} /></div>}
    </div>
);

const ContentGenerationHub: React.FC<ContentGenerationHubProps> = ({ analysisText }) => {
    const [isPromptLoading, setIsPromptLoading] = useState(true);
    const [imagePrompt, setImagePrompt] = useState('');
    const [videoPrompt, setVideoPrompt] = useState('');

    const [isLoadingImage, setIsLoadingImage] = useState(false);
    const [isLoadingVideo, setIsLoadingVideo] = useState(false);
    const [isLoadingScript, setIsLoadingScript] = useState(false);
    
    const [videoLoadingMessage, setVideoLoadingMessage] = useState('');

    const [generatedImageUrl, setGeneratedImageUrl] = useState<string | null>(null);
    const [generatedVideoUrl, setGeneratedVideoUrl] = useState<string | null>(null);
    const [generatedScript, setGeneratedScript] = useState<string | null>(null);
    
    const [imageError, setImageError] = useState<string | null>(null);
    const [videoError, setVideoError] = useState<string | null>(null);
    const [scriptError, setScriptError] = useState<string | null>(null);

    const [isSpeaking, setIsSpeaking] = useState(false);

    // Cleanup speech synthesis on component unmount
    useEffect(() => {
        return () => {
            if (window.speechSynthesis.speaking) {
                window.speechSynthesis.cancel();
            }
        };
    }, []);

    useEffect(() => {
        const fetchPrompts = async () => {
            if (!analysisText) return;
            setIsPromptLoading(true);
            try {
                const { videoPrompt, imagePrompt } = await generateSuggestedPrompts(analysisText);
                setVideoPrompt(videoPrompt);
                setImagePrompt(imagePrompt);
            } catch (error) {
                console.error("Failed to fetch suggested prompts:", error);
                setImageError("Could not load a suggested prompt.");
                setVideoError("Could not load a suggested prompt.");
            } finally {
                setIsPromptLoading(false);
            }
        };
        fetchPrompts();
    }, [analysisText]);
    
    const handleGenerateImage = useCallback(async () => {
        setIsLoadingImage(true);
        setImageError(null);
        setGeneratedImageUrl(null);
        try {
            const imageUrl = await generateImage(imagePrompt);
            setGeneratedImageUrl(imageUrl);
        } catch (err) {
            setImageError(err instanceof Error ? err.message : 'An unknown error occurred.');
        } finally {
            setIsLoadingImage(false);
        }
    }, [imagePrompt]);

    const handleGenerateVideo = useCallback(async () => {
        setIsLoadingVideo(true);
        setVideoError(null);
        setGeneratedVideoUrl(null);
        let messageIndex = 0;
        setVideoLoadingMessage(videoLoadingMessages[messageIndex]);

        try {
            let operation = await startVideoGeneration(videoPrompt);
            
            while (!operation.done) {
                await new Promise(resolve => setTimeout(resolve, 10000));
                messageIndex = Math.min(messageIndex + 1, videoLoadingMessages.length - 1);
                setVideoLoadingMessage(videoLoadingMessages[messageIndex]);
                operation = await checkVideoGenerationStatus(operation);
            }

            if (operation.response?.generatedVideos?.[0]?.video?.uri) {
                setVideoLoadingMessage("Success! Fetching your video...");
                const downloadLink = operation.response.generatedVideos[0].video.uri;
                
                const response = await fetch(`${downloadLink}&key=${API_KEY}`);
                if (!response.ok) throw new Error(`Failed to fetch video file. Status: ${response.status}`);

                const videoBlob = await response.blob();
                setGeneratedVideoUrl(URL.createObjectURL(videoBlob));
            } else {
                throw new Error("Video generation completed, but no video URI was found.");
            }
        } catch (err) {
            setVideoError(err instanceof Error ? err.message : 'An unknown error occurred.');
        } finally {
            setIsLoadingVideo(false);
            setVideoLoadingMessage('');
        }
    }, [videoPrompt]);

    const handleGenerateScript = useCallback(async () => {
        setIsLoadingScript(true);
        setScriptError(null);
        setGeneratedScript(null);
        // Ensure any previous speech is stopped before generating a new script
        if (window.speechSynthesis.speaking) {
            window.speechSynthesis.cancel();
            setIsSpeaking(false);
        }
        try {
            const script = await generateScriptForTTS(analysisText);
            setGeneratedScript(script);
        } catch (err) {
            setScriptError(err instanceof Error ? err.message : 'An unknown error occurred.');
        } finally {
            setIsLoadingScript(false);
        }
    }, [analysisText]);

    const handlePlayAudio = useCallback(() => {
        if (!generatedScript || !window.speechSynthesis) return;

        if (window.speechSynthesis.speaking) {
            window.speechSynthesis.cancel();
        }

        const utterance = new SpeechSynthesisUtterance(generatedScript);
        utterance.onstart = () => setIsSpeaking(true);
        utterance.onend = () => setIsSpeaking(false);
        utterance.onerror = () => {
            console.error("Speech synthesis error");
            setIsSpeaking(false);
            setScriptError("Sorry, there was an error playing the audio.");
        };
        window.speechSynthesis.speak(utterance);
    }, [generatedScript]);

    const handleStopAudio = useCallback(() => {
        window.speechSynthesis.cancel();
        setIsSpeaking(false);
    }, []);

    return (
        <div className="space-y-6">
            <div className="text-center">
                <h2 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-red-400 to-red-600">
                  Content Generation Hub
                </h2>
                <p className="text-gray-400">Use the analysis to create new content.</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                
                <GenerationCard
                    title="Image"
                    icon={<ImageIcon className="w-6 h-6" />}
                    prompt={imagePrompt}
                    setPrompt={setImagePrompt}
                    onGenerate={handleGenerateImage}
                    isLoading={isLoadingImage}
                    isPromptLoading={isPromptLoading}
                    error={imageError}
                    result={generatedImageUrl && (
                        <img src={generatedImageUrl} alt="Generated content" className="rounded-lg border border-gray-600 w-full h-auto" />
                    )}
                />

                <GenerationCard
                    title="Video"
                    icon={<VideoIcon className="w-6 h-6" />}
                    prompt={videoPrompt}
                    setPrompt={setVideoPrompt}
                    onGenerate={handleGenerateVideo}
                    isLoading={isLoadingVideo}
                    isPromptLoading={isPromptLoading}
                    error={videoError}
                    result={
                        isLoadingVideo ? (
                            <p className="text-center text-sm text-gray-400 mt-3">{videoLoadingMessage}</p>
                        ) : generatedVideoUrl && (
                             <video key={generatedVideoUrl} controls autoPlay loop className="w-full h-auto mt-4 rounded-lg border border-gray-600 bg-black">
                                <source src={generatedVideoUrl} type="video/mp4" />
                            </video>
                        )
                    }
                />

                <GenerationCard
                    title="Audio Script"
                    icon={<AudioIcon className="w-6 h-6" />}
                    prompt="" // Not used, but required by component
                    setPrompt={() => {}} // Not used
                    onGenerate={handleGenerateScript}
                    isLoading={isLoadingScript}
                    isPromptLoading={false}
                    isTextArea={false}
                    error={scriptError}
                    result={generatedScript && (
                        <div className="mt-4 space-y-3">
                            <pre className="text-sm bg-gray-900/50 p-3 rounded-md text-gray-300 leading-relaxed whitespace-pre-wrap font-sans border border-gray-600">
                                {generatedScript}
                            </pre>
                            <div className="flex items-center justify-center gap-3">
                                {!isSpeaking ? (
                                    <button
                                        onClick={handlePlayAudio}
                                        className="flex items-center justify-center gap-2 w-full px-4 py-2 bg-gray-700 text-gray-200 font-semibold rounded-md hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 focus:ring-red-500 disabled:opacity-50 transition-colors"
                                    >
                                        <PlayIcon className="w-5 h-5" />
                                        Play Audio
                                    </button>
                                ) : (
                                    <button
                                        onClick={handleStopAudio}
                                        className="flex items-center justify-center gap-2 w-full px-4 py-2 bg-red-800 text-white font-semibold rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 focus:ring-red-500 transition-colors"
                                    >
                                        <StopIcon className="w-5 h-5" />
                                        Stop
                                    </button>
                                )}
                            </div>
                        </div>
                    )}
                />
            </div>
        </div>
    );
};

export default ContentGenerationHub;