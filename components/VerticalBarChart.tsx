import React, { useMemo } from 'react';

interface VerticalBarChartProps {
  data: { label: string; value: number }[];
  title: string;
}

const VerticalBarChart: React.FC<VerticalBarChartProps> = ({ data, title }) => {
    const maxValue = useMemo(() => Math.max(...data.map(d => d.value), 0) || 1, [data]);

    if (data.length === 0) {
        return <div className="text-center text-text-light p-8">{`No data available for ${title}`}</div>;
    }

    return (
        <div className="w-full h-64 sm:h-72 flex justify-around items-end gap-1 sm:gap-2 px-2 pt-8">
            {data.map((item, index) => {
                const barHeightPercent = (item.value / maxValue) * 100;
                // Determine if label fits inside. Threshold can be ~15% of height for readability.
                const isLabelInside = barHeightPercent > 15;

                return (
                    <div key={index} className="flex-1 flex flex-col items-center justify-end h-full group relative text-center">
                        {/* Bar */}
                        <div
                            className="w-full bg-primary-yellow rounded-t-md hover:bg-opacity-80 transition-all duration-300 relative"
                            style={{ height: `${barHeightPercent}%` }}
                        >
                             {/* Value Label - INSIDE */}
                             {item.value > 0 && isLabelInside && (
                                 <span className="absolute top-1 left-0 right-0 text-xs font-bold text-white">
                                     {item.value}
                                 </span>
                             )}
                        </div>
                        {/* Value Label - OUTSIDE */}
                        {item.value > 0 && !isLabelInside && (
                             <span className="absolute text-xs font-bold text-text-dark" style={{ bottom: `calc(${barHeightPercent}% + 4px)` }}>
                                 {item.value}
                             </span>
                        )}

                        {/* Label */}
                        <div className="text-[10px] sm:text-xs text-text-light mt-2 w-full truncate" title={item.label}>
                            {item.label}
                        </div>
                    </div>
                );
            })}
        </div>
    );
};

export default VerticalBarChart;
