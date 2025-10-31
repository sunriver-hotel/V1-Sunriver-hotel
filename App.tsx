import React, { useState } from 'react';
import LoginPage from './components/LoginPage';
import Dashboard from './components/Dashboard';
import type { Language } from './types';

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [language, setLanguage] = useState<Language>('th');

  const handleLoginSuccess = () => {
    setIsLoggedIn(true);
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
  };

  return (
    <div className="bg-pastel-bg min-h-screen w-full flex items-center justify-center font-sans">
      {!isLoggedIn ? (
        <LoginPage 
          onLoginSuccess={handleLoginSuccess} 
          language={language}
          setLanguage={setLanguage}
        />
      ) : (
        <Dashboard
          onLogout={handleLogout}
          language={language}
        />
      )}
    </div>
  );
}

export default App;
