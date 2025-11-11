import React, { useMemo } from 'react';

interface LineChartProps {
  data: { label: string; value: number }[];
  title: string;
}

const LineChart: React.FC<LineChartProps> = ({ data, title }) => {
  const padding = { top: 20, right: 20, bottom: 40, left: 40 };
  const width = 600; // Fixed width for consistency
  const height = 288; // 288px = 18rem (h-72)

  const maxValue = useMemo(() => Math.max(...data.map(d => d.value), 0) || 10, [data]);
  const yAxisMax = Math.ceil(maxValue / 5) * 5; // Round up to nearest 5

  if (data.length === 0) {
    return <div className="text-center text-text-light p-8">{`No data available for ${title}`}</div>;
  }

  const xScale = (index: number) => {
    if (data.length === 1) {
      // Center the single point if there's only one
      return padding.left + (width - padding.left - padding.right) / 2;
    }
    return padding.left + (index / (data.length - 1)) * (width - padding.left - padding.right);
  };
  const yScale = (value: number) => height - padding.bottom - (value / yAxisMax) * (height - padding.top - padding.bottom);

  const linePath = data.map((d, i) => `${i === 0 ? 'M' : 'L'} ${xScale(i)} ${yScale(d.value)}`).join(' ');
  const areaPath = `${linePath} L ${xScale(data.length - 1)} ${height - padding.bottom} L ${xScale(0)} ${height - padding.bottom} Z`;

  // Y-axis labels (e.g., 0, 5, 10, 15, 20)
  const yAxisLabels = Array.from({ length: 6 }, (_, i) => {
      const value = (yAxisMax / 5) * i;
      return { value, y: yScale(value) };
  });

  return (
    <div className="w-full h-72">
      <svg width="100%" height="100%" viewBox={`0 0 ${width} ${height}`}>
        {/* Y-axis grid lines and labels */}
        {yAxisLabels.map(({ value, y }) => (
          <g key={value} className="text-gray-400">
            <line x1={padding.left} x2={width - padding.right} y1={y} y2={y} stroke="currentColor" strokeWidth="0.5" strokeDasharray="2,2" />
            <text x={padding.left - 8} y={y} dy="0.32em" textAnchor="end" className="text-xs fill-current text-text-light">
              {value}
            </text>
          </g>
        ))}

        {/* X-axis labels */}
        {data.map((d, i) => (
           (data.length < 15 || i % 2 === 0) && // Show all labels if few, otherwise skip every other
           <text key={i} x={xScale(i)} y={height - padding.bottom + 15} textAnchor="middle" className="text-xs fill-current text-text-light">
             {d.label}
           </text>
        ))}

        {/* Gradient for area fill */}
        <defs>
          <linearGradient id="areaGradient" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="#e6c872" stopOpacity={0.4} />
            <stop offset="100%" stopColor="#e6c872" stopOpacity={0} />
          </linearGradient>
        </defs>

        {/* Area path */}
        <path d={areaPath} fill="url(#areaGradient)" />

        {/* Line path */}
        <path d={linePath} fill="none" stroke="#e6c872" strokeWidth="2" />

        {/* Data points with tooltips */}
        {data.map((d, i) => (
          <g key={i} className="group">
            <circle cx={xScale(i)} cy={yScale(d.value)} r="4" fill="#e6c872" className="transition-transform group-hover:scale-125" />
            <circle cx={xScale(i)} cy={yScale(d.value)} r="8" fill="transparent" />
             {/* Tooltip */}
             <g className="opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                <rect x={xScale(i) - 20} y={yScale(d.value) - 30} width="40" height="20" rx="4" fill="rgba(0,0,0,0.7)" />
                <text x={xScale(i)} y={yScale(d.value) - 20} textAnchor="middle" fill="white" className="text-xs font-bold">
                    {d.value}
                </text>
            </g>
          </g>
        ))}
      </svg>
    </div>
  );
};

export default LineChart;