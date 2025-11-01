import React, { useState, useMemo } from 'react';
import type { Language, Room, Booking } from '../types';
import { translations } from '../constants';
import LineChart from './LineChart';

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

  return (
    <div className="flex flex-col md:flex-row items-center justify-center gap-6 p-4">
        <div className="w-48 h-48 sm:w-56 sm:h-56 flex-shrink-0 relative">
             <svg viewBox="-1 -1 2 2" style={{ transform: 'rotate(-90deg)' }}>
                {(() => {
                    let cumulativePercent = 0;
                    return data.map((item, index) => {
                        if (item.value <= 0) return null;
                        const percent = item.value / totalValue;
                        const pathData = getPathForSlice(cumulativePercent, percent);
                        cumulativePercent += percent;
                        return (
                            <path key={index} d={pathData} fill={COLORS[index % COLORS.length]} />
                        );
                    });
                })()}
            </svg>
            {/* Render labels on top of the SVG to avoid rotation issues with text */}
            <div className="absolute inset-0">
                <svg viewBox="-1 -1 2 2">
                    {(() => {
                        let cumulativePercentForLabel = 0;
                        return data.map((item) => {
                            if (item.value <= 0) return null;

                            const percent = item.value / totalValue;
                            // Calculate position for the label in the middle of the slice
                            const midAngle = (cumulativePercentForLabel + percent / 2) * 2 * Math.PI - Math.PI / 2; // Adjust for starting at top
                            
                            const textX = Math.cos(midAngle) * 0.7;
                            const textY = Math.sin(midAngle) * 0.7;

                            cumulativePercentForLabel += percent;

                            // Add text only if slice is big enough (e.g., > 5%)
                            if (percent > 0.05) {
                                return (
                                    <text
                                        key={item.label}
                                        x={textX}
                                        y={textY}
                                        fill="#fff"
                                        fontSize="0.12"
                                        fontWeight="bold"
                                        textAnchor="middle"
                                        dominantBaseline="central"
                                    >
                                        {item.value}
                                    </text>
                                );
                            }
                            return null;
                        });
                    })()}
                </svg>
            </div>
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
  allBookings: Booking[];
  isLoading: boolean;
  error: string | null;
}

type OccupancyPeriod = 'daily' | 'monthly' | 'yearly';
type PopularityPeriod = 'monthly' | 'yearly' | 'allTime';


const StatisticsPage: React.FC<StatisticsPageProps> = ({ language, rooms, allBookings, isLoading, error }) => {
  const t = translations[language];
  
  // Internal state for date management, decoupled from App state.
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const [occupancyPeriod, setOccupancyPeriod] = useState<OccupancyPeriod>('daily');
  const [popularityPeriod, setPopularityPeriod] = useState<PopularityPeriod>('monthly');

  const handleMonthInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const [year, month] = e.target.value.split('-').map(Number);
    setCurrentMonth(new Date(year, month - 1, 1));
  };
  
  const selectedMonthString = `${currentMonth.getFullYear()}-${String(currentMonth.getMonth() + 1).padStart(2, '0')}`;

  // --- Data Processing for Occupancy Statistics ---
  const occupancyData = useMemo(() => {
    const dataMap = new Map<string, number>();
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth() + 1;

    // Filter bookings relevant to the selected period to optimize calculations
    const relevantBookings = allBookings.filter(booking => {
        const checkInYear = new Date(booking.check_in_date).getFullYear();
        if (occupancyPeriod === 'yearly') return true; // consider all bookings for yearly
        return checkInYear === year; // for daily/monthly, only consider current year
    });

    if (occupancyPeriod === 'daily') {
        const daysInMonth = new Date(year, month, 0).getDate();
        for (let i = 1; i <= daysInMonth; i++) {
            dataMap.set(String(i), 0);
        }
    } else if (occupancyPeriod === 'monthly') {
        for (let i = 0; i < 12; i++) {
            dataMap.set(t.months[i].substring(0,3), 0);
        }
    }

    relevantBookings.forEach(booking => {
      const start = new Date(booking.check_in_date + 'T00:00:00Z');
      const end = new Date(booking.check_out_date + 'T00:00:00Z');
      let current = new Date(start);

      while (current < end) {
        const currentYear = current.getUTCFullYear();
        const currentMonth = current.getUTCMonth(); // 0-indexed
        const currentDay = current.getUTCDate();
        
        if (occupancyPeriod === 'daily' && currentYear === year && currentMonth + 1 === month) {
            const key = String(currentDay);
            dataMap.set(key, (dataMap.get(key) || 0) + 1);
        } else if (occupancyPeriod === 'monthly' && currentYear === year) {
            const key = t.months[currentMonth].substring(0,3);
            dataMap.set(key, (dataMap.get(key) || 0) + 1);
        } else if (occupancyPeriod === 'yearly') {
            const key = String(currentYear);
            dataMap.set(key, (dataMap.get(key) || 0) + 1);
        }
        current.setUTCDate(current.getUTCDate() + 1);
      }
    });
    
    let sortedData = Array.from(dataMap.entries());

    if (occupancyPeriod === 'yearly') {
        sortedData = sortedData.sort((a,b) => a[0].localeCompare(b[0]));
    }
     if (occupancyPeriod === 'daily') {
        sortedData = sortedData.sort((a,b) => parseInt(a[0],10) - parseInt(b[0],10));
    }

    return sortedData.map(([label, value]) => ({ label, value }));
  }, [allBookings, occupancyPeriod, currentMonth, t.months]);


  // --- **FIX**: Data Processing for Room Popularity by Room Number ---
  const popularityData = useMemo(() => {
    const nightsByRoomNumber = new Map<string, number>();
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth(); // 0-indexed
    
    let filterStart: Date, filterEnd: Date;
    let periodBookings = allBookings;

    if (popularityPeriod === 'monthly') {
        filterStart = new Date(Date.UTC(year, month, 1));
        filterEnd = new Date(Date.UTC(year, month + 1, 0, 23, 59, 59));
    } else if (popularityPeriod === 'yearly') {
        filterStart = new Date(Date.UTC(year, 0, 1));
        filterEnd = new Date(Date.UTC(year, 11, 31, 23, 59, 59));
    }
    
    if (popularityPeriod !== 'allTime') {
        const filterStartTime = filterStart!.getTime();
        const filterEndTime = filterEnd!.getTime();
        periodBookings = allBookings.filter(b => {
            const bookingStartTime = new Date(b.check_in_date + 'T00:00:00Z').getTime();
            const bookingEndTime = new Date(b.check_out_date + 'T00:00:00Z').getTime();
            return bookingStartTime < filterEndTime && bookingEndTime > filterStartTime;
        });
    }

    periodBookings.forEach(booking => {
        if (!booking.room || !booking.room.room_number) return;

        const bookingStart = new Date(booking.check_in_date + 'T00:00:00Z');
        const bookingEnd = new Date(booking.check_out_date + 'T00:00:00Z');
        
        let overlapStart = bookingStart;
        let overlapEnd = bookingEnd;
        
        if(popularityPeriod !== 'allTime'){
             overlapStart = new Date(Math.max(filterStart!.getTime(), bookingStart.getTime()));
             overlapEnd = new Date(Math.min(filterEnd!.getTime(), bookingEnd.getTime()));
        }

        if (overlapEnd > overlapStart) {
            const nightsInPeriod = (overlapEnd.getTime() - overlapStart.getTime()) / (1000 * 60 * 60 * 24);
            const roomNumber = booking.room.room_number;
            nightsByRoomNumber.set(roomNumber, (nightsByRoomNumber.get(roomNumber) || 0) + nightsInPeriod);
        }
    });

    const data = Array.from(nightsByRoomNumber.entries())
        .map(([label, value]) => ({
            label,
            value: Math.round(value),
        }));

    return data.filter(item => item.value > 0).sort((a,b) => b.value - a.value);
  }, [allBookings, popularityPeriod, currentMonth]);
  
  const PeriodButton: React.FC<{ value: string, label: string, current: string, setter: (p: any) => void }> = ({ value, label, current, setter }) => {
    const isActive = current === value;
    return (
        <button
            onClick={() => setter(value)}
            className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${isActive ? 'bg-primary-yellow text-white' : 'bg-gray-200 hover:bg-gray-300 text-text-dark'}`}
        >
            {label}
        </button>
    );
  }

  const chartContent = () => {
    if (isLoading) return <div className="text-center p-8">{t.loadingBookings}</div>;
    if (error) return <div className="text-center p-8 text-red-500">{error}</div>;

    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Occupancy Statistics Card */}
        <div className="bg-white rounded-lg shadow-lg p-4 sm:p-6">
            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 mb-4">
                <h2 className="text-xl font-semibold text-text-dark">{t.occupancyStatistics}</h2>
                <div className="flex flex-wrap items-center justify-end gap-2">
                    {(occupancyPeriod === 'daily' || occupancyPeriod === 'monthly') && (
                        <input
                            type="month"
                            value={selectedMonthString}
                            onChange={handleMonthInputChange}
                            className="px-2 py-1.5 border border-gray-300 rounded-md shadow-sm focus:ring-primary-yellow focus:border-primary-yellow text-sm"
                            aria-label={t.selectMonth}
                        />
                    )}
                    <div className="flex items-center gap-2 p-1 bg-gray-100 rounded-lg">
                        <PeriodButton value="daily" label={t.daily} current={occupancyPeriod} setter={setOccupancyPeriod} />
                        <PeriodButton value="monthly" label={t.monthly} current={occupancyPeriod} setter={setOccupancyPeriod} />
                        <PeriodButton value="yearly" label={t.yearly} current={occupancyPeriod} setter={setOccupancyPeriod} />
                    </div>
                </div>
            </div>
            <div className="overflow-x-auto">
                <div className="min-w-[600px]">
                    <LineChart data={occupancyData} title={t.occupancyStatistics} />
                </div>
            </div>
        </div>

        {/* Room Popularity Card */}
        <div className="bg-white rounded-lg shadow-lg p-4 sm:p-6">
            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 mb-4">
                <h2 className="text-xl font-semibold text-text-dark">{t.roomPopularity}</h2>
                 <div className="flex items-center gap-2">
                    <div className="flex items-center gap-2 p-1 bg-gray-100 rounded-lg">
                       {/* **FIX**: Updated filter options */}
                       <PeriodButton value="monthly" label={t.monthly} current={popularityPeriod} setter={setPopularityPeriod} />
                       <PeriodButton value="yearly" label={t.yearly} current={popularityPeriod} setter={setPopularityPeriod} />
                       <PeriodButton value="allTime" label={t.allTime} current={popularityPeriod} setter={setPopularityPeriod} />
                    </div>
                 </div>
            </div>
             <div className="overflow-x-auto">
                <PieChart data={popularityData} title={t.roomPopularity} />
            </div>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full h-full flex flex-col space-y-8">
      <h1 className="text-2xl sm:text-3xl font-bold text-text-dark">{t.statisticsTitle}</h1>
      {chartContent()}
    </div>
  );
};

export default StatisticsPage;