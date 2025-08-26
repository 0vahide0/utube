import React from 'react';
import type { VideoAnalysis } from '../types';

interface AnalysisDisplayProps {
  analysis: VideoAnalysis;
}

const AnalysisDisplay: React.FC<AnalysisDisplayProps> = ({ analysis }) => {
  return (
    <div className="bg-gray-800/50 border border-gray-700 rounded-lg shadow-lg p-6">
      <h2 className="text-2xl font-bold text-red-400 mb-3">{analysis.title}</h2>
      
      <div className="mb-6">
        <h3 className="text-xl font-semibold text-gray-200 border-b-2 border-gray-600 pb-2 mb-3">Summary</h3>
        <p className="text-gray-300 leading-relaxed">{analysis.summary}</p>
      </div>

      <div>
        <h3 className="text-xl font-semibold text-gray-200 border-b-2 border-gray-600 pb-2 mb-4">Key Points</h3>
        <ul className="space-y-3 list-disc list-inside text-gray-300">
          {analysis.detailedAnalysis.map((point, index) => (
            <li key={index} className="leading-relaxed">
              <span className="text-red-400 font-semibold mr-2">&#8226;</span>{point}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default AnalysisDisplay;