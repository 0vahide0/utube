import React, { useState, useCallback, useEffect } from 'react';
import UrlInputForm from './UrlInputForm';
import AnalysisDisplay from './AnalysisDisplay';
import LoadingSpinner from './LoadingSpinner';
import ErrorMessage from './ErrorMessage';
import ContentGenerationHub from './ContentGenerationHub';
import { analyzeYouTubeVideo } from '../services/geminiService';
import type { VideoAnalysis } from '../types';
import { getYouTubeVideoId } from '../utils';

const DEFAULT_ANALYZER_PROMPT = `You are an expert content strategist. Your task is to analyze the provided YouTube video's content (visuals, audio, and transcript).

Based on what you see and hear in the video, provide a summary and analysis.

Your output should be a well-formatted text block that includes:
1.  **Summary:** A concise overview of the video's content and purpose.
2.  **Key Topics:** A bulleted list of the main subjects or themes discussed.
3.  **Target Audience:** An educated guess about who the video is intended for, based on its content and tone.`;

const AnalyzerView: React.FC = () => {
  const [url, setUrl] = useState<string>('');
  const [instructions, setInstructions] = useState<string>(() => {
    return localStorage.getItem('customAnalyzerPrompt') || DEFAULT_ANALYZER_PROMPT;
  });
  const [videoId, setVideoId] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState<VideoAnalysis | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    localStorage.setItem('customAnalyzerPrompt', instructions);
  }, [instructions]);

  const handleUrlSubmit = useCallback(async (submittedUrl: string) => {
    if (!submittedUrl) return;

    const id = getYouTubeVideoId(submittedUrl);
    if (!id) {
      setError('Invalid YouTube URL. Please provide a valid video link.');
      return;
    }

    setIsLoading(true);
    setAnalysis(null);
    setError(null);
    setVideoId(null);

    try {
      const result = await analyzeYouTubeVideo(submittedUrl, instructions);
      setAnalysis(result);
      setVideoId(id);
    } catch (err) {
      console.error(err);
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('An unknown error occurred. Please try again later.');
      }
    } finally {
      setIsLoading(false);
    }
  }, [instructions]);

  const handleSampleClick = useCallback(() => {
    const sampleUrl = 'https://youtu.be/4Tm6Z1y3h94?si=BYmISzZW2IptXcui';
    setUrl(sampleUrl);
    handleUrlSubmit(sampleUrl);
  }, [handleUrlSubmit]);

  const handleResetInstructions = useCallback(() => {
    setInstructions(DEFAULT_ANALYZER_PROMPT);
  }, []);

  return (
    <>
      <div className="space-y-4">
        <UrlInputForm
          url={url}
          setUrl={setUrl}
          onSubmit={handleUrlSubmit}
          onSampleClick={handleSampleClick}
          isLoading={isLoading}
        />
        <div>
          <div className="flex justify-between items-center mb-2">
            <label htmlFor="instructions" className="block text-sm font-medium text-gray-400">
              Analysis Instructions (based on video content)
            </label>
            <button
              onClick={handleResetInstructions}
              disabled={isLoading}
              className="text-xs font-medium text-red-400 hover:text-red-300 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 focus:ring-red-500 rounded px-2 py-1 disabled:opacity-50"
            >
              Reset to Default
            </button>
          </div>
          <textarea
            id="instructions"
            value={instructions}
            onChange={(e) => setInstructions(e.target.value)}
            rows={10}
            className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-md focus:ring-2 focus:ring-red-500 focus:border-red-500 transition duration-200 text-gray-200 placeholder-gray-500"
            disabled={isLoading}
          />
        </div>
      </div>

      {isLoading && (
        <div className="mt-8">
          <LoadingSpinner />
        </div>
      )}

      {error && (
        <div className="mt-8">
          <ErrorMessage message={error} />
        </div>
      )}

      {analysis && videoId && !isLoading && (
        <div className="mt-8 space-y-8 animate-fade-in">
          <div className="aspect-video w-full overflow-hidden rounded-lg border border-gray-700 shadow-xl">
            <iframe
              width="100%"
              height="100%"
              src={`https://www.youtube.com/embed/${videoId}`}
              title="YouTube video player"
              frameBorder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            ></iframe>
          </div>
          <AnalysisDisplay analysis={analysis} />
          <ContentGenerationHub analysisText={analysis.analysisText} />
        </div>
      )}
    </>
  );
};

export default AnalyzerView;