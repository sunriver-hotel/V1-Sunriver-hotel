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
    isLogoLoading: boolean;
}

// SVG Icon Components
const DashboardIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
    </svg>
);

const RoomStatusIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M8 14v3m4-3v3m4-3v3M3 21h18M3 18h18M3 12l6.424 6.424a2 2 0 002.828 0L18 12M4 9a2 2 0 012-2h12a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V9z" />
    </svg>
);

const CleaningIcon = () => (
     <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
    </svg>
);

const StatisticsIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
    </svg>
);

const ReceiptIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    </svg>
);

const LogoutIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
    </svg>
);


const Navbar: React.FC<NavbarProps> = ({ currentPage, onNavigate, onLogout, language, logoSrc, onLogoUpload, isLogoLoading }) => {
    const t = translations[language];
    const fileInputRef = useRef<HTMLInputElement>(null);

    const navItems = [
        { id: 'dashboard', text: t.navDashboard, icon: DashboardIcon },
        { id: 'room-status', text: t.navRoomStatus, icon: RoomStatusIcon },
        { id: 'cleaning', text: t.navCleaning, icon: CleaningIcon },
        { id: 'statistics', text: t.navStatistics, icon: StatisticsIcon },
        { id: 'receipt', text: t.navReceipt, icon: ReceiptIcon },
    ] as const;

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
        <header className="bg-white shadow-md sticky top-0 z-40">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center py-3">
                    <div className="flex items-center flex-wrap gap-2 sm:gap-3">
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
                            className={`group relative ${isLogoLoading ? 'cursor-wait' : 'cursor-pointer'}`}
                            title={!isLogoLoading ? t.logoUploadTooltip : undefined}
                        >
                            {logoSrc ? (
                                <img src={logoSrc} alt="Logo" className={`h-10 w-10 rounded-full object-cover transition-opacity ${isLogoLoading ? 'opacity-50' : 'opacity-100'}`} />
                            ) : (
                                <div className={`h-10 w-10 rounded-full bg-primary-yellow ${isLogoLoading ? 'animate-pulse' : ''}`}></div>
                            )}
                             <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 rounded-full transition-opacity duration-200"></div>
                        </div>
                        
                        {navItems.map(item => {
                            const isActive = currentPage === item.id;
                            const buttonClasses = `flex items-center gap-2 py-2 px-3 rounded-md text-sm font-medium transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-yellow ${
                                isActive ? 'bg-primary-yellow text-white shadow-sm' : 'bg-white text-text-dark hover:bg-gray-100'
                            }`;
                            
                            return (
                                <button key={item.id} onClick={() => onNavigate(item.id)} className={buttonClasses}>
                                    <item.icon />
                                    <span className="hidden lg:inline">{item.text}</span>
                                </button>
                            );
                        })}

                    </div>
                    <div className="flex items-center gap-2 sm:gap-4">
                        <button
                            onClick={onLogout}
                            className="flex items-center gap-2 py-2 px-3 lg:px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-yellow hover:bg-opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-yellow"
                        >
                            <LogoutIcon />
                            <span className="hidden lg:inline">{t.logoutButton}</span>
                        </button>
                    </div>
                </div>
            </div>
        </header>
    );
};

export default Navbar;