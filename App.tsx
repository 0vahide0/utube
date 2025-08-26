import React, { useState } from 'react';
import AnalyzerView from './components/AnalyzerView';
import ChatView from './components/ChatView';
import { YouTubeIcon } from './components/icons/YouTubeIcon';
import { ChatIcon } from './components/icons/ChatIcon';

type View = 'analyzer' | 'chat';

const App: React.FC = () => {
  const [activeView, setActiveView] = useState<View>('analyzer');

  const navItemClasses = "flex items-center gap-2 px-4 py-2 rounded-md transition-colors duration-200 cursor-pointer";
  const activeNavItemClasses = "bg-red-600/80 text-white";
  const inactiveNavItemClasses = "text-gray-400 hover:bg-gray-700/50 hover:text-gray-200";

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100 flex flex-col items-center p-4 sm:p-6 lg:p-8">
      <div className="w-full max-w-3xl mx-auto flex flex-col h-full">
        <header className="text-center mb-6">
          <div className="flex justify-center items-center gap-4 mb-4">
             <h1 className="text-4xl sm:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-red-500 to-red-700">
              Gemini Showcase
            </h1>
          </div>
          <p className="text-lg text-gray-400">
            Explore the power of Gemini for video analysis and conversational AI.
          </p>
        </header>

        <nav className="flex justify-center mb-8">
          <div className="flex items-center gap-4 p-2 bg-gray-800 border border-gray-700 rounded-lg">
            <button
              onClick={() => setActiveView('analyzer')}
              className={`${navItemClasses} ${activeView === 'analyzer' ? activeNavItemClasses : inactiveNavItemClasses}`}
              aria-current={activeView === 'analyzer' ? 'page' : undefined}
            >
              <YouTubeIcon className="w-6 h-6" />
              <span>Video Analyzer</span>
            </button>
            <button
              onClick={() => setActiveView('chat')}
              className={`${navItemClasses} ${activeView === 'chat' ? activeNavItemClasses : inactiveNavItemClasses}`}
              aria-current={activeView === 'chat' ? 'page' : undefined}
            >
              <ChatIcon className="w-6 h-6" />
              <span>Chat</span>
            </button>
          </div>
        </nav>

        <main className="flex-grow">
          {activeView === 'analyzer' && <AnalyzerView />}
          {activeView === 'chat' && <ChatView />}
        </main>
        
        <footer className="text-center mt-12 text-gray-500 text-sm">
          <p>Powered by Gemini</p>
        </footer>
      </div>
    </div>
  );
};

export default App;