
import React from 'react';

const DeployButton = () => {
  const handleDeploy = () => {
    window.open('https://render.com/deploy?repo=https://github.com/yourusername/enhanced-research-machine', '_blank');
  };

  return (
    <button
      onClick={handleDeploy}
      className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-lg font-medium transition-all duration-200 flex items-center gap-2 shadow-lg hover:shadow-xl transform hover:scale-105"
    >
      <svg 
        width="20" 
        height="20" 
        viewBox="0 0 24 24" 
        fill="currentColor"
        className="flex-shrink-0"
      >
        <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
      </svg>
      Deploy to Render
    </button>
  );
};

export default DeployButton;
