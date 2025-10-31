import React, { useState, useMemo } from 'react';
import type { Language, Room, Booking, RoomType } from '../types';
import { translations } from '../constants';

// --- Reusable Bar Chart Component ---
interface BarChartProps {
  data: { label: string; value: number }[];
  title: string;
}

const BarChart: React.FC<BarChartProps> = ({ data, title }) => {
    const maxValue = useMemo(() => Math.max(...data.map(d => d.value), 0), [data]);

    if (data.length === 0) {
        return <div className="text-center text-text-light p-8">{`No data available for ${title}`}</div>;
    }

    return (
        <div className="w-full space-y-3 p-4">
            {data.map((item, index) => (
                <div key={index} className="flex items-center gap-4 text-sm">
                    <div className="w-24 sm:w-28 text-right font-medium text-text-dark truncate" title={item.label}>
                        {item.label}
                    </div>
                    <div className="flex-grow flex items-center gap-2">
                        <div className="w-full bg-gray-200 rounded-full h-6">
                            <div
                                className="bg-primary-yellow h-6 rounded-full flex items-center justify-end px-2"
                                style={{ width: maxValue > 0 ? `${(item.value / maxValue) * 100}%` : '0%' }}
                            >
                               <span className="text-white font-bold text-xs">{item.value > 0 ? item.value : ''}</span>
                            </div>
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
};


// --- Main Statistics Page Component ---
interface StatisticsPageProps {
  language: Language;
  rooms: Room[];
  bookings: Booking[];
}

type OccupancyPeriod = 'daily' | 'monthly' | 'yearly';

const StatisticsPage: React.FC<StatisticsPageProps> = ({ language, rooms, bookings }) => {
  const t = translations[language];
  const [occupancyPeriod, setOccupancyPeriod] = useState<OccupancyPeriod>('daily');
  const [selectedRoomType, setSelectedRoomType] = useState<RoomType | 'All'>('All');

  // --- Data Processing for Occupancy Statistics ---
  const occupancyData = useMemo(() => {
    const dataMap = new Map<string, number>();
    
    if (occupancyPeriod === 'daily') {
      const today = new Date();
      today.setUTCHours(0, 0, 0, 0);
      for (let i = 0; i < 30; i++) {
        const date = new Date(today);
        date.setUTCDate(today.getUTCDate() - i);
        const dateString = date.toISOString().split('T')[0];
        dataMap.set(dateString, 0);
      }
    } else if (occupancyPeriod === 'monthly') {
        const currentYear = new Date().getFullYear();
        for(let i = 0; i < 12; i++) {
            const key = `${currentYear}-${String(i+1).padStart(2, '0')}`;
            dataMap.set(key, 0);
        }
    }

    bookings.forEach(booking => {
      const start = new Date(booking.check_in_date + 'T00:00:00Z');
      const end = new Date(booking.check_out_date + 'T00:00:00Z');
      let current = new Date(start);

      while (current < end) {
        if (occupancyPeriod === 'daily') {
          const dateString = current.toISOString().split('T')[0];
          if (dataMap.has(dateString)) {
            dataMap.set(dateString, dataMap.get(dateString)! + 1);
          }
        } else if (occupancyPeriod === 'monthly') {
            const currentYear = new Date().getFullYear();
            if(current.getUTCFullYear() === currentYear) {
                const key = `${current.getUTCFullYear()}-${String(current.getUTCMonth() + 1).padStart(2, '0')}`;
                if (dataMap.has(key)) {
                    dataMap.set(key, dataMap.get(key)! + 1);
                }
            }
        } else if (occupancyPeriod === 'yearly') {
            const year = String(current.getUTCFullYear());
            dataMap.set(year, (dataMap.get(year) || 0) + 1);
        }
        current.setUTCDate(current.getUTCDate() + 1);
      }
    });
    
    const sortedData = Array.from(dataMap.entries()).sort((a, b) => a[0].localeCompare(b[0]));
    
    if(occupancyPeriod === 'daily') {
        return sortedData.map(([date, value]) => ({
            label: new Date(date + 'T00:00:00Z').toLocaleDateString(language, { month: 'short', day: 'numeric', timeZone: 'UTC' }),
            value
        })).reverse();
    }
    if (occupancyPeriod === 'monthly') {
        return sortedData.map(([key, value]) => ({
            label: t.months[parseInt(key.split('-')[1], 10) - 1],
            value
        }));
    }

    return sortedData.map(([label, value]) => ({ label, value }));
  }, [bookings, occupancyPeriod, language, t.months]);


  // --- Data Processing for Room Popularity ---
  const popularityData = useMemo(() => {
    const nightsByRoom = new Map<number, number>();
    
    bookings.forEach(booking => {
        const start = new Date(booking.check_in_date).getTime();
        const end = new Date(booking.check_out_date).getTime();
        const duration = (end - start) / (1000 * 60 * 60 * 24); // nights
        nightsByRoom.set(booking.room_id, (nightsByRoom.get(booking.room_id) || 0) + duration);
    });

    const filteredRooms = selectedRoomType === 'All' 
        ? rooms 
        : rooms.filter(room => room.room_type === selectedRoomType);
    
    return filteredRooms
      .map(room => ({
        room,
        nights: nightsByRoom.get(room.room_id) || 0,
      }))
      .sort((a, b) => b.nights - a.nights)
      .slice(0, 15) // Show top 15
      .map(item => ({
        label: `Room ${item.room.room_number}`,
        value: item.nights,
      }))
      .filter(item => item.value > 0); // Only show rooms that have been booked

  }, [bookings, rooms, selectedRoomType]);
  
  const PeriodButton: React.FC<{ value: OccupancyPeriod, label: string }> = ({ value, label }) => {
    const isActive = occupancyPeriod === value;
    return (
        <button
            onClick={() => setOccupancyPeriod(value)}
            className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${isActive ? 'bg-primary-yellow text-white' : 'bg-gray-200 hover:bg-gray-300 text-text-dark'}`}
        >
            {label}
        </button>
    );
  }

  return (
    <div className="w-full h-full flex flex-col space-y-8">
      <h1 className="text-2xl sm:text-3xl font-bold text-text-dark">{t.statisticsTitle}</h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Occupancy Statistics Card */}
        <div className="bg-white rounded-lg shadow-lg p-4 sm:p-6">
            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 mb-4">
                <h2 className="text-xl font-semibold text-text-dark">{t.occupancyStatistics}</h2>
                <div className="flex items-center gap-2 p-1 bg-gray-100 rounded-lg">
                    <PeriodButton value="daily" label={t.daily} />
                    <PeriodButton value="monthly" label={t.monthly} />
                    <PeriodButton value="yearly" label={t.yearly} />
                </div>
            </div>
            <div className="overflow-x-auto">
                <BarChart data={occupancyData} title={t.occupancyStatistics} />
            </div>
        </div>

        {/* Room Popularity Card */}
        <div className="bg-white rounded-lg shadow-lg p-4 sm:p-6">
            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 mb-4">
                <h2 className="text-xl font-semibold text-text-dark">{t.roomPopularity}</h2>
                 <div className="flex items-center gap-2">
                    <label htmlFor="room-type-filter" className="text-sm font-medium text-text-dark">{t.filterByRoomType}</label>
                     <select
                        id="room-type-filter"
                        value={selectedRoomType}
                        onChange={(e) => setSelectedRoomType(e.target.value as RoomType | 'All')}
                        className="px-2 py-1.5 border border-gray-300 rounded-md shadow-sm focus:ring-primary-yellow focus:border-primary-yellow text-sm"
                     >
                        <option value="All">{t.allTypes}</option>
                        <option value="River view">River view</option>
                        <option value="Standard view">Standard view</option>
                        <option value="Cottage">Cottage</option>
                     </select>
                 </div>
            </div>
             <div className="overflow-x-auto">
                <BarChart data={popularityData} title={t.roomPopularity} />
            </div>
        </div>
      </div>
    </div>
  );
};

export default StatisticsPage;