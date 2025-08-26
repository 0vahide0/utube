import React, { useState, useCallback } from 'react';
import UrlInputForm from './UrlInputForm';
import AnalysisDisplay from './AnalysisDisplay';
import LoadingSpinner from './LoadingSpinner';
import ErrorMessage from './ErrorMessage';
import { analyzeYouTubeVideo } from '../services/geminiService';
import type { VideoAnalysis } from '../types';

const getYouTubeId = (url: string): string | null => {
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
  const match = url.match(regExp);
  return (match && match[2].length === 11) ? match[2] : null;
};

const AnalyzerView: React.FC = () => {
  const [url, setUrl] = useState<string>('');
  const [videoId, setVideoId] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState<VideoAnalysis | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const handleUrlSubmit = useCallback(async (submittedUrl: string) => {
    if (!submittedUrl) return;

    const id = getYouTubeId(submittedUrl);
    if (!id) {
      setError('Invalid YouTube URL. Please provide a valid video link.');
      return;
    }

    setIsLoading(true);
    setAnalysis(null);
    setError(null);
    setVideoId(null);

    try {
      const result = await analyzeYouTubeVideo(submittedUrl);
      setAnalysis(result);
      setVideoId(id);
    } catch (err) {
      console.error(err);
      setError('Failed to analyze the video. Please check the URL or try again later.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleSampleClick = useCallback(() => {
    const sampleUrl = 'https://youtu.be/4Tm6Z1y3h94?si=BYmISzZW2IptXcui';
    setUrl(sampleUrl);
    handleUrlSubmit(sampleUrl);
  }, [handleUrlSubmit]);

  return (
    <>
      <UrlInputForm
        url={url}
        setUrl={setUrl}
        onSubmit={handleUrlSubmit}
        onSampleClick={handleSampleClick}
        isLoading={isLoading}
      />

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
        </div>
      )}
    </>
  );
};

export default AnalyzerView;