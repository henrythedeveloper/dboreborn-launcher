import React from 'react';

/**
 * Initial loading screen shown during launcher startup
 */
const InitialSetupScreen: React.FC = () => {
  return (
    <div className="initial-setup">
      <span className="initial-setup-text">Initializing...</span>
    </div>
  );
};

export default InitialSetupScreen;