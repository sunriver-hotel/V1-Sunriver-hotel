
import React, { useState, useRef } from 'react';
import type { Language } from '../types';
import { translations } from '../constants';
import { login } from '../services/authService';

interface LoginPageProps {
  onLoginSuccess: () => void;
  language: Language;
  setLanguage: (lang: Language) => void;
  logoSrc: string | null;
  onLogoUpload: (logoDataUrl: string) => void;
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

const LoginPage: React.FC<LoginPageProps> = ({ onLoginSuccess, language, setLanguage, logoSrc, onLogoUpload, isLogoLoading }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const t = translations[language];

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      await login(username, password);
      onLoginSuccess();
    } catch (err: any) {
      // แสดงข้อความ error ที่ได้รับจาก API โดยตรง, ถ้าไม่มีให้ใช้ข้อความ default
      setError(err.message || t.invalidCredentialsError);
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleLogoClick = () => {
    if (isLogoLoading) return;
    fileInputRef.current?.click();
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (reader.result) {
          onLogoUpload(reader.result as string);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="w-full max-w-md p-8 space-y-6 bg-white rounded-xl shadow-lg m-4">
      <div className="text-center">
        <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept="image/*"
            className="hidden"
            aria-hidden="true"
        />
        <div
            onClick={handleLogoClick}
            className={`group relative inline-block mb-4 ${isLogoLoading ? 'cursor-wait' : 'cursor-pointer'}`}
            title={!isLogoLoading ? t.logoUploadTooltip : undefined}
        >
            {logoSrc ? (
                <img src={logoSrc} alt="Hotel Logo" className={`mx-auto h-20 w-20 rounded-full object-cover transition-opacity ${isLogoLoading ? 'opacity-50' : 'opacity-100'}`} />
            ) : (
                <div className={`mx-auto h-20 w-20 rounded-full bg-primary-yellow ${isLogoLoading ? 'animate-pulse' : ''}`}></div>
            )}
            <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 rounded-full transition-opacity duration-200"></div>
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold text-text-dark">{t.loginTitle}</h1>
        <p className="text-xs text-gray-400 mt-4">Version 1.0.0</p>
      </div>

      <LanguageSelector language={language} setLanguage={setLanguage} />

      <form className="space-y-6" onSubmit={handleLogin}>
        <div>
          <label htmlFor="username" className="text-sm font-medium text-text-dark block mb-2">
            {t.usernameLabel}
          </label>
          <input
            id="username"
            name="username"
            type="text"
            required
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-yellow focus:border-transparent transition"
            placeholder={t.usernameLabel}
          />
        </div>
        <div>
          <label htmlFor="password" className="text-sm font-medium text-text-dark block mb-2">
            {t.passwordLabel}
          </label>
          <input
            id="password"
            name="password"
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-yellow focus:border-transparent transition"
            placeholder={t.passwordLabel}
          />
        </div>

        {error && <p className="text-sm text-red-600 text-center">{error}</p>}

        <div>
          <button
            type="submit"
            disabled={isLoading}
            className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-yellow hover:bg-opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-yellow disabled:bg-yellow-300 disabled:cursor-not-allowed transition-all duration-300"
          >
            {isLoading ? t.loggingIn : t.loginButton}
          </button>
        </div>
      </form>
    </div>
  );
};

export default LoginPage;