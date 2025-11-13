
import React, { useState } from 'react';
import type { Language, UserRole } from '../types';
import { translations } from '../constants';
import { login, register } from '../services/authService';

interface LoginPageProps {
  onLoginSuccess: (role: UserRole) => void;
  language: Language;
  setLanguage: (lang: Language) => void;
  logoSrc: string | null;
  isLogoLoading: boolean;
}

const LanguageSelector: React.FC<{ language: Language, setLanguage: (lang: Language) => void }> = ({ language, setLanguage }) => {
  const t = translations[language];

  const getButtonClasses = (lang: Language) => {
    const baseClasses = "px-4 py-2 rounded-md text-sm font-medium transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-yellow";
    if (language === lang) {
      return `${baseClasses} bg-primary-yellow text-white shadow-sm`;
    }
    return `${baseClasses} bg-gray-200 text-text-dark hover:bg-gray-300`;
  };

  return (
    <div className="flex justify-center space-x-2 mb-6">
      <button onClick={() => setLanguage('th')} className={getButtonClasses('th')}>
        {t.thai}
      </button>
      <button onClick={() => setLanguage('en')} className={getButtonClasses('en')}>
        {t.english}
      </button>
    </div>
  );
};

const LoginPage: React.FC<LoginPageProps> = ({ onLoginSuccess, language, setLanguage, logoSrc, isLogoLoading }) => {
  const [isRegisterView, setIsRegisterView] = useState(false);
  
  // States for Login form
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  // States for Registration form
  const [regUsername, setRegUsername] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [nickname, setNickname] = useState('');

  // Common states
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const t = translations[language];

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    setSuccess('');

    try {
      const { role } = await login(username, password);
      onLoginSuccess(role);
    } catch (err: any) {
      setError(err.message || t.invalidCredentialsError);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    setSuccess('');

    if (regPassword.length < 6) {
        setError("Password must be at least 6 characters long.");
        setIsLoading(false);
        return;
    }

    try {
      const result = await register({
        username: regUsername,
        password: regPassword,
        nickname: nickname,
      });
      setSuccess(result.message);
      // Reset form and switch to login view
      setRegUsername('');
      setRegPassword('');
      setNickname('');
      setIsRegisterView(false);
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred.');
    } finally {
      setIsLoading(false);
    }
  };
  
  const toggleView = () => {
    setIsRegisterView(!isRegisterView);
    setError('');
    setSuccess('');
  };

  const renderLoginForm = () => (
    <form className="space-y-6" onSubmit={handleLogin}>
      <div>
        <label htmlFor="username" className="text-sm font-medium text-text-dark block mb-2">
          {t.usernameLabel}
        </label>
        <input
          id="username"
          type="text"
          required
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-yellow"
          placeholder={t.usernameLabel}
        />
      </div>
      <div>
        <label htmlFor="password" className="text-sm font-medium text-text-dark block mb-2">
          {t.passwordLabel}
        </label>
        <input
          id="password"
          type="password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-yellow"
          placeholder={t.passwordLabel}
        />
      </div>
      <div>
        <button
          type="submit"
          disabled={isLoading}
          className="w-full flex justify-center py-3 px-4 rounded-md shadow-sm text-sm font-medium text-white bg-primary-yellow hover:bg-opacity-90 disabled:bg-yellow-300"
        >
          {isLoading ? t.loggingIn : t.loginButton}
        </button>
      </div>
    </form>
  );

  const renderRegisterForm = () => (
    <form className="space-y-6" onSubmit={handleRegister}>
      <div>
        <label htmlFor="reg-username" className="text-sm font-medium text-text-dark block mb-2">
          {t.usernameLabel}
        </label>
        <input
          id="reg-username"
          type="text"
          required
          value={regUsername}
          onChange={(e) => setRegUsername(e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-yellow"
          placeholder={t.usernameLabel}
        />
      </div>
      <div>
        <label htmlFor="reg-password" className="text-sm font-medium text-text-dark block mb-2">
          {t.passwordLabel}
        </label>
        <input
          id="reg-password"
          type="password"
          required
          value={regPassword}
          onChange={(e) => setRegPassword(e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-yellow"
          placeholder={t.passwordLabel}
        />
      </div>
       <div>
        <label htmlFor="nickname" className="text-sm font-medium text-text-dark block mb-2">
          {t.nicknameLabel}
        </label>
        <input
          id="nickname"
          type="text"
          required
          value={nickname}
          onChange={(e) => setNickname(e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-yellow"
          placeholder={t.nicknameLabel}
        />
      </div>
      <div>
        <button
          type="submit"
          disabled={isLoading}
          className="w-full flex justify-center py-3 px-4 rounded-md shadow-sm text-sm font-medium text-white bg-primary-yellow hover:bg-opacity-90 disabled:bg-yellow-300"
        >
          {isLoading ? t.registering : t.registerButton}
        </button>
      </div>
    </form>
  );

  return (
    <div className="w-full max-w-md p-8 space-y-6 bg-white rounded-xl shadow-lg m-4">
      <div className="text-center">
        <div
            className={`relative inline-block mb-4`}
        >
            {logoSrc ? (
                <img src={logoSrc} alt="Hotel Logo" className={`mx-auto h-20 w-20 rounded-full object-cover ${isLogoLoading ? 'opacity-50' : ''}`} />
            ) : (
                <div className={`mx-auto h-20 w-20 rounded-full bg-primary-yellow ${isLogoLoading ? 'animate-pulse' : ''}`}></div>
            )}
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold text-text-dark">{isRegisterView ? t.registerTitle : t.loginTitle}</h1>
      </div>

      <LanguageSelector language={language} setLanguage={setLanguage} />
      
      {error && <p className="text-sm text-red-600 text-center">{error}</p>}
      {success && <p className="text-sm text-green-600 text-center">{success}</p>}

      {isRegisterView ? renderRegisterForm() : renderLoginForm()}
      
      <div className="text-center text-sm">
        <span className="text-gray-600">{isRegisterView ? t.switchToLoginPrompt : t.switchToRegisterPrompt}</span>
        <button onClick={toggleView} className="ml-1 font-medium text-primary-yellow hover:text-yellow-600 focus:outline-none">
          {isRegisterView ? t.loginButton : t.registerButton}
        </button>
      </div>

      <p className="text-center text-xs text-gray-400 pt-2">
        © 2024 SUNRIVER HOTEL Management Application.<br />
        All rights reserved. Version 1.1.4
      </p>
    </div>
  );
};

export default LoginPage;
