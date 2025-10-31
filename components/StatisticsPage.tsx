import React, { useState, useMemo } from 'react';
import type { Language, Room, Booking, RoomType } from '../types';
import { translations } from '../constants';

// --- Reusable Vertical Bar Chart Component ---
interface VerticalBarChartProps {
  data: { label: string; value: number }[];
  title: string;
}

const VerticalBarChart: React.FC<VerticalBarChartProps> = ({ data, title }) => {
    const maxValue = useMemo(() => Math.max(...data.map(d => d.value), 0) || 1, [data]); // Use 1 to avoid division by zero on empty data

    if (data.length === 0) {
        return <div className="text-center text-text-light p-8">{`No data available for ${title}`}</div>;
    }

    return (
        <div className="w-full h-64 sm:h-72 flex justify-around items-end gap-1 sm:gap-2 px-2 pt-4">
            {data.map((item, index) => (
                <div key={index} className="flex-1 flex flex-col items-center justify-end h-full group relative text-center">
                    {/* Tooltip */}
                    <div className="absolute bottom-full mb-2 w-max px-2 py-1 bg-gray-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none z-10">
                        {item.label}: {item.value}
                    </div>
                    {/* Bar */}
                    <div
                        className="w-full bg-primary-yellow rounded-t-md hover:bg-opacity-80 transition-all duration-300"
                        style={{ height: `${(item.value / maxValue) * 100}%` }}
                    >
                    </div>
                    {/* Label */}
                    <div className="text-[10px] sm:text-xs text-text-light mt-2 w-full truncate" title={item.label}>
                        {item.label}
                    </div>
                </div>
            ))}
        </div>
    );
};


// --- Reusable Pie Chart Component ---
interface PieChartProps {
  data: { label: string; value: number }[];
  title: string;
}

const PieChart: React.FC<PieChartProps> = ({ data, title }) => {
  if (data.length === 0) {
    return <div className="text-center text-text-light p-8">{`No data available for ${title}`}</div>;
  }
  
  const COLORS = ['#e6c872', '#a7c7e7', '#c1e1c1', '#d8b4fe', '#f2b5a3', '#ffc0cb', '#b2e2f2', '#fde2a3', '#d9d9f3', '#ffb3ba'];
  
  const totalValue = useMemo(() => data.reduce((sum, item) => sum + item.value, 0), [data]);

  const getPathForSlice = (cumulativePercent: number, percent: number) => {
    const startAngle = cumulativePercent * 2 * Math.PI;
    const endAngle = (cumulativePercent + percent) * 2 * Math.PI;
    
    const startX = Math.cos(startAngle);
    const startY = Math.sin(startAngle);
    const endX = Math.cos(endAngle);
    const endY = Math.sin(endAngle);

    const largeArcFlag = percent > 0.5 ? 1 : 0;

    return `M ${startX} ${startY} A 1 1 0 ${largeArcFlag} 1 ${endX} ${endY} L 0 0`;
  };

  let cumulativePercent = 0;

  return (
    <div className="flex flex-col md:flex-row items-center justify-center gap-6 p-4">
        <div className="w-48 h-48 sm:w-56 sm:h-56 flex-shrink-0">
             <svg viewBox="-1 -1 2 2" style={{ transform: 'rotate(-90deg)' }}>
                {data.map((item, index) => {
                    if (item.value <= 0) return null;
                    const percent = item.value / totalValue;
                    const pathData = getPathForSlice(cumulativePercent, percent);
                    cumulativePercent += percent;
                    return (
                        <path key={index} d={pathData} fill={COLORS[index % COLORS.length]} />
                    );
                })}
            </svg>
        </div>
        <ul className="w-full md:w-auto text-sm space-y-2">
            {data.map((item, index) => (
                <li key={index} className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded-sm flex-shrink-0" style={{ backgroundColor: COLORS[index % COLORS.length] }}></div>
                    <span className="font-medium text-text-dark truncate">{item.label}:</span>
                    <span className="text-text-light font-semibold ml-auto">{item.value}</span>
                </li>
            ))}
        </ul>
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
    
    let sortedData = Array.from(dataMap.entries()).sort((a, b) => a[0].localeCompare(b[0]));
    
    if(occupancyPeriod === 'daily') {
        // For daily, we want descending order (most recent first)
        sortedData = sortedData.reverse();
        return sortedData.map(([date, value]) => ({
            label: new Date(date + 'T00:00:00Z').toLocaleDateString(language, { day: 'numeric', timeZone: 'UTC' }),
            value
        }));
    }
    if (occupancyPeriod === 'monthly') {
        return sortedData.map(([key, value]) => ({
            label: t.months[parseInt(key.split('-')[1], 10) - 1].substring(0,3),
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
      .slice(0, 10) // Show top 10
      .map(item => ({
        label: `Room ${item.room.room_number}`,
        value: Math.round(item.nights),
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
                <VerticalBarChart data={occupancyData} title={t.occupancyStatistics} />
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
                <PieChart data={popularityData} title={t.roomPopularity} />
            </div>
        </div>
      </div>
    </div>
  );
};

export default StatisticsPage;