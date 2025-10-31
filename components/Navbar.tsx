import React, { useRef } from 'react';
import { translations } from '../constants';
import type { Language, Page } from '../types';

interface NavbarProps {
    currentPage: Page;
    onNavigate: (page: Page) => void;
    onLogout: () => void;
    language: Language;
    logoSrc: string | null;
    onLogoUpload: (logoDataUrl: string) => void;
}

const Navbar: React.FC<NavbarProps> = ({ currentPage, onNavigate, onLogout, language, logoSrc, onLogoUpload }) => {
    const t = translations[language];
    const fileInputRef = useRef<HTMLInputElement>(null);

    const getButtonClasses = (page: Page) => {
        const baseClasses = "py-2 px-4 rounded-md text-sm font-medium transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-yellow";
        if (currentPage === page) {
            return `${baseClasses} bg-primary-yellow text-white shadow-sm`;
        }
        return `${baseClasses} bg-white text-text-dark hover:bg-gray-100`;
    };

    const handleLogoClick = () => {
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
        <header className="bg-white shadow-md sticky top-0 z-40">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center py-3">
                    <div className="flex items-center flex-wrap gap-2 sm:gap-4">
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
                            className="cursor-pointer group relative"
                            title={t.logoUploadTooltip}
                        >
                            {logoSrc ? (
                                <img src={logoSrc} alt="Logo" className="h-10 w-10 rounded-full object-cover" />
                            ) : (
                                <div className="h-10 w-10 rounded-full bg-primary-yellow"></div>
                            )}
                             <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 rounded-full transition-opacity duration-200"></div>
                        </div>
                        
                        <button onClick={() => onNavigate('dashboard')} className={getButtonClasses('dashboard')}>
                            {t.navDashboard}
                        </button>
                        <button onClick={() => onNavigate('room-status')} className={getButtonClasses('room-status')}>
                            {t.navRoomStatus}
                        </button>
                         <button onClick={() => onNavigate('cleaning')} className={getButtonClasses('cleaning')}>
                            {t.navCleaning}
                        </button>
                        <button onClick={() => onNavigate('statistics')} className={getButtonClasses('statistics')}>
                            {t.navStatistics}
                        </button>
                    </div>
                    <div className="flex items-center gap-2 sm:gap-4">
                        <button
                            onClick={onLogout}
                            className="py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-yellow hover:bg-opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-yellow"
                        >
                            {t.logoutButton}
                        </button>
                    </div>
                </div>
            </div>
        </header>
    );
};

export default Navbar;