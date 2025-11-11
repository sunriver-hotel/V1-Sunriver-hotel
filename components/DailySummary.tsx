import React, { useState } from 'react';
import type { Language, Booking, UserRole, BookingStatus } from '../types';
import { translations } from '../constants';

// Props for DailySummary
interface DailySummaryProps {
  selectedDate: Date;
  language: Language;
  checkIns: Booking[];
  checkOuts: Booking[];
  staying: Booking[];
  onEditBooking: (booking: Booking) => void;
  onDateChange: (date: string) => void;
  userRole: UserRole | null;
}

// Props for the new BookingCard component
interface BookingCardProps {
    booking: Booking;
    onEditBooking: (booking: Booking) => void;
    userRole: UserRole | null;
    language: Language;
}

const calculateNights = (checkIn: string, checkOut: string): number => {
    if (!checkIn || !checkOut) return 1;
    const start = new Date(checkIn + 'T00:00:00Z').getTime();
    const end = new Date(checkOut + 'T00:00:00Z').getTime();
    if (isNaN(start) || isNaN(end) || end <= start) return 1;
    const duration = (end - start) / (1000 * 60 * 60 * 24);
    return Math.max(1, Math.round(duration));
};

const formatDateShort = (dateStr: string, lang: Language): string => {
    const locale = lang === 'th' ? 'th-TH' : 'en-US';
    const options: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'short', timeZone: 'UTC' };
    return new Date(dateStr + 'T00:00:00Z').toLocaleDateString(locale, options);
}

const getStatusBadge = (status: BookingStatus, t: any) => {
    const statusConfig = {
        Paid: { text: t.statuses['Paid'], classes: 'bg-green-100 text-green-800' },
        Deposit: { text: t.statuses['Deposit'], classes: 'bg-green-100 text-green-800' },
        Unpaid: { text: t.statuses['Unpaid'], classes: 'bg-yellow-100 text-yellow-800' }
    };
    const config = statusConfig[status];
    if (!config) return null;
    return <span className={`px-2 py-1 text-xs font-medium rounded-full ${config.classes}`}>{config.text}</span>;
};

// The new Booking Card component, styled like the user's image
const BookingCard: React.FC<BookingCardProps> = ({ booking, onEditBooking, userRole, language }) => {
    const t = translations[language];
    const nights = calculateNights(booking.check_in_date, booking.check_out_date);
    const isActionable = userRole === 'admin';
    const roomText = language === 'th' 
        ? `ห้อง ${booking.room?.room_number || ''} - ${booking.room?.room_type || ''}` 
        : `Room ${booking.room?.room_number || ''} - ${booking.room?.room_type || ''}`;

    return (
        <div 
            onClick={() => isActionable && onEditBooking(booking)}
            className={`bg-white p-4 rounded-lg shadow-sm border border-gray-200 space-y-3 ${isActionable ? 'cursor-pointer hover:shadow-md hover:border-primary-yellow transition' : ''}`}
        >
            <div className="flex justify-between items-start">
                <div>
                    <p className="font-bold text-lg text-text-dark">{booking.customer?.customer_name}</p>
                    <p className="text-sm text-text-light">{roomText}</p>
                </div>
                {getStatusBadge(booking.status, t)}
            </div>
            <div className="flex justify-between items-center text-sm">
                <p className="text-text-light">{formatDateShort(booking.check_in_date, language)} - {formatDateShort(booking.check_out_date, language)}</p>
                <p className="font-semibold text-text-dark">{nights} {nights > 1 ? t.nights : t.night}</p>
            </div>
        </div>
    );
};

type SummaryTab = 'checkIns' | 'staying' | 'checkOuts';

const DailySummary: React.FC<DailySummaryProps> = ({ selectedDate, language, checkIns, checkOuts, staying, onEditBooking, onDateChange, userRole }) => {
  const t = translations[language];
  const [activeTab, setActiveTab] = useState<SummaryTab>('checkIns');

  // Helper to format date for the input[type=date], using UTC methods.
  const formatDateForInput = (date: Date) => {
    const year = date.getUTCFullYear();
    const month = date.getUTCMonth() + 1;
    const day = date.getUTCDate();
    return `${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
  };
  
  const tabs: { id: SummaryTab; title: string; data: Booking[] }[] = [
      { id: 'checkIns', title: t.checkIns, data: checkIns },
      { id: 'staying', title: t.staying, data: staying },
      { id: 'checkOuts', title: t.checkOuts, data: checkOuts }
  ];
  
  const activeData = tabs.find(tab => tab.id === activeTab)?.data || [];

  return (
    <div className="w-full mt-6">
        <div className="flex flex-wrap items-center justify-between mb-4 gap-4">
            <h2 className="text-xl font-bold text-text-dark">{t.dailyList}</h2>
            <div className="relative">
                 <input 
                    type="date"
                    value={formatDateForInput(selectedDate)}
                    onChange={(e) => onDateChange(e.target.value)}
                    className="appearance-none bg-white border border-gray-300 rounded-md py-2 pl-3 pr-10 text-sm leading-5 text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary-yellow focus:border-primary-yellow"
                    aria-label="Select a date for the summary"
                />
                <span className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
                    <svg className="h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                </span>
            </div>
        </div>

        <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-6" aria-label="Tabs">
                {tabs.map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm transition-colors
                            ${activeTab === tab.id
                                ? 'border-primary-yellow text-primary-yellow'
                                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                            }`
                        }
                    >
                        {tab.title} <span className={`ml-1 px-2 py-0.5 rounded-full text-xs font-medium ${activeTab === tab.id ? 'bg-primary-yellow text-white' : 'bg-gray-200 text-gray-800'}`}>{tab.data.length}</span>
                    </button>
                ))}
            </nav>
        </div>

        <div className="mt-4 space-y-3">
           {activeData.length > 0 ? (
               activeData.map(booking => (
                   <BookingCard 
                        key={booking.booking_id}
                        booking={booking}
                        onEditBooking={onEditBooking}
                        userRole={userRole}
                        language={language}
                   />
               ))
           ) : (
                <div className="text-center py-8 bg-white rounded-lg shadow-sm border border-gray-200">
                    <p className="text-text-light italic">{t.noActivity}</p>
                </div>
           )}
        </div>
    </div>
  );
};

export default DailySummary;