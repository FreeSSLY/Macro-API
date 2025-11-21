import React, { useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { DailyLog } from '../../types';

interface ProgressLineChartProps {
  logs: Record<string, DailyLog>;
}

const ProgressLineChart: React.FC<ProgressLineChartProps> = ({ logs }) => {
  const chartData = useMemo(() => {
    const data = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateString = date.toISOString().split('T')[0];
      const log = logs[dateString] || { calories: 0, protein: 0, carbs: 0, fat: 0 };
      data.push({
        name: date.toLocaleDateString('pt-BR', { weekday: 'short' }).replace('.', ''),
        Calorias: log.calories,
        Proteínas: log.protein,
        Carbs: log.carbs,
        Gorduras: log.fat,
      });
    }
    return data;
  }, [logs]);

  return (
    <ResponsiveContainer width="100%" height="100%">
        <LineChart data={chartData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#4A5568" />
            <XAxis dataKey="name" stroke="#A0AEC0" />
            <YAxis stroke="#A0AEC0" />
            <Tooltip 
                contentStyle={{ 
                    backgroundColor: '#2D3748', 
                    border: '1px solid #4A5568',
                    borderRadius: '0.5rem'
                }}
                labelStyle={{ color: '#E2E8F0' }}
            />
            <Legend wrapperStyle={{ color: '#E2E8F0' }} />
            <Line type="monotone" dataKey="Calorias" stroke="#3B82F6" strokeWidth={2} activeDot={{ r: 8 }} />
            <Line type="monotone" dataKey="Proteínas" stroke="#F87171" strokeWidth={2} />
            <Line type="monotone" dataKey="Carbs" stroke="#4ADE80" strokeWidth={2} />
            <Line type="monotone" dataKey="Gorduras" stroke="#FBBF24" strokeWidth={2} />
        </LineChart>
    </ResponsiveContainer>
  );
};

export default ProgressLineChart;
