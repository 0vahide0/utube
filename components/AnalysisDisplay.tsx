import React from 'react';
import type { VideoAnalysis } from '../types';

interface AnalysisDisplayProps {
  analysis: VideoAnalysis;
}

const AnalysisDisplay: React.FC<AnalysisDisplayProps> = ({ analysis }) => {
  return (
    <div className="bg-gray-800/50 border border-gray-700 rounded-lg shadow-lg p-6">
      <h2 className="text-2xl font-bold text-red-400 mb-4">{analysis.title}</h2>
      
      <div>
        <h3 className="text-xl font-semibold text-gray-200 border-b-2 border-gray-600 pb-2 mb-4">
          Content Analysis
        </h3>
        <pre className="text-gray-300 leading-relaxed whitespace-pre-wrap font-sans">
          {analysis.analysisText}
        </pre>
      </div>
    </div>
  );
};

export default AnalysisDisplay;