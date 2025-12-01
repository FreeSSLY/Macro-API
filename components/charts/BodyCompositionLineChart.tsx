
import React, { useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { BodyCompositionLog } from '../../types';

interface BodyCompositionLineChartProps {
  history: BodyCompositionLog[];
  theme?: 'dark' | 'light';
}

const BodyCompositionLineChart: React.FC<BodyCompositionLineChartProps> = ({ history, theme = 'dark' }) => {
  const chartData = useMemo(() => {
    // Ordena o histórico por data para garantir que o gráfico seja exibido corretamente
    const sortedHistory = [...history].sort((a, b) => a.date.localeCompare(b.date));

    return sortedHistory.map(log => {
        const fatMass = log.weight - log.lbm;
        return {
            ...log,
            name: new Date(log.date + 'T00:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
            'Massa Magra (kg)': parseFloat(log.lbm.toFixed(2)),
            'Massa Gorda (kg)': parseFloat(fatMass.toFixed(2)),
            '% de Gordura (BF)': parseFloat(log.fatPercentage.toFixed(2)),
        };
    });
  }, [history]);

  const isLight = theme === 'light';
  const axisColor = isLight ? '#4a5568' : '#A0AEC0';
  const gridColor = isLight ? '#cbd5e0' : '#4A5568'; // Darker for print
  const textColor = isLight ? '#1a202c' : '#E2E8F0';
  const tooltipBg = isLight ? '#ffffff' : '#2D3748';
  const tooltipBorder = isLight ? '#cbd5e0' : '#4A5568';

  return (
    <ResponsiveContainer width="100%" height="100%">
        <LineChart data={chartData} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
            <XAxis dataKey="name" stroke={axisColor} tick={{ fill: axisColor }} />
            <YAxis yAxisId="left" stroke={axisColor} unit="kg" domain={['dataMin - 5', 'dataMax + 5']} tick={{ fill: axisColor }} />
            <YAxis yAxisId="right" orientation="right" stroke="#d97706" unit="%" domain={['dataMin - 2', 'dataMax + 2']} tick={{ fill: '#d97706' }} />
            <Tooltip 
                contentStyle={{ backgroundColor: tooltipBg, border: `1px solid ${tooltipBorder}`, borderRadius: '0.75rem' }}
                labelStyle={{ color: textColor, fontWeight: 'bold' }}
                itemStyle={{ color: textColor }}
                formatter={(value: number, name: string) => [`${value.toFixed(1)} ${name.includes('%') ? '%' : 'kg'}`, name]}
            />
            <Legend wrapperStyle={{ paddingTop: '20px', color: textColor }}/>
            <Line yAxisId="left" type="monotone" dataKey="Massa Magra (kg)" stroke="#10b981" strokeWidth={2} activeDot={{ r: 8 }} dot={{r: 4}} />
            <Line yAxisId="left" type="monotone" dataKey="Massa Gorda (kg)" stroke="#ef4444" strokeWidth={2} dot={{r: 4}} />
            <Line yAxisId="right" type="monotone" dataKey="% de Gordura (BF)" stroke="#d97706" strokeWidth={2} dot={{r: 4}} />
        </LineChart>
    </ResponsiveContainer>
  );
};

export default BodyCompositionLineChart;
