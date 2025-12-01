
import React, { useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { DailyLog } from '../../types';

interface ProgressLineChartProps {
  logs: Record<string, DailyLog>;
  theme?: 'dark' | 'light';
}

const ProgressLineChart: React.FC<ProgressLineChartProps> = ({ logs, theme = 'dark' }) => {
  const chartData = useMemo(() => {
    const data = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateString = date.toISOString().split('T')[0];
      const log = logs[dateString] || { calories: 0, protein: 0, carbs: 0, fat: 0 };
      data.push({
        name: date.toLocaleDateString('pt-BR', { weekday: 'short' }).replace('.', ''),
        fullDate: date.toLocaleDateString('pt-BR'),
        Calorias: log.calories,
        Proteínas: log.protein,
        Carbs: log.carbs,
        Gorduras: log.fat,
      });
    }
    return data;
  }, [logs]);

  const isLight = theme === 'light';
  const axisColor = isLight ? '#4a5568' : '#A0AEC0'; // Gray-700 vs Gray-400
  const gridColor = isLight ? '#cbd5e0' : '#4A5568'; // Darker gray for print contrast vs Gray-700
  const textColor = isLight ? '#1a202c' : '#E2E8F0'; // Gray-900 vs Gray-200
  const tooltipBg = isLight ? '#ffffff' : '#2D3748';
  const tooltipBorder = isLight ? '#cbd5e0' : '#4A5568';

  return (
    <ResponsiveContainer width="100%" height="100%">
        <LineChart data={chartData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
            <XAxis dataKey="name" stroke={axisColor} tick={{ fill: axisColor }} />
            <YAxis stroke={axisColor} tick={{ fill: axisColor }} />
            <Tooltip 
                contentStyle={{ 
                    backgroundColor: tooltipBg, 
                    border: `1px solid ${tooltipBorder}`,
                    borderRadius: '0.5rem',
                    color: textColor
                }}
                labelStyle={{ color: textColor, fontWeight: 'bold' }}
                itemStyle={{ color: textColor }}
            />
            <Legend wrapperStyle={{ color: textColor }} />
            <Line type="monotone" dataKey="Calorias" stroke="#3B82F6" strokeWidth={2} activeDot={{ r: 8 }} dot={isLight} />
            <Line type="monotone" dataKey="Proteínas" stroke="#ef4444" strokeWidth={2} dot={isLight} />
            <Line type="monotone" dataKey="Carbs" stroke="#10b981" strokeWidth={2} dot={isLight} />
            <Line type="monotone" dataKey="Gorduras" stroke="#f59e0b" strokeWidth={2} dot={isLight} />
        </LineChart>
    </ResponsiveContainer>
  );
};

export default ProgressLineChart;
