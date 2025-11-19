import React, { useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { BodyCompositionLog } from '../../types';

interface BodyCompositionLineChartProps {
  history: BodyCompositionLog[];
}

const BodyCompositionLineChart: React.FC<BodyCompositionLineChartProps> = ({ history }) => {
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

  return (
    <ResponsiveContainer width="100%" height="100%">
        <LineChart data={chartData} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#4A5568" />
            <XAxis dataKey="name" stroke="#A0AEC0" />
            <YAxis yAxisId="left" stroke="#A0AEC0" unit="kg" domain={['dataMin - 5', 'dataMax + 5']} />
            <YAxis yAxisId="right" orientation="right" stroke="#FBBF24" unit="%" domain={['dataMin - 2', 'dataMax + 2']} />
            <Tooltip 
                contentStyle={{ backgroundColor: '#2D3748', border: '1px solid #4A5568', borderRadius: '0.75rem' }}
                labelStyle={{ color: '#E2E8F0' }}
                formatter={(value: number, name: string) => [`${value.toFixed(1)} ${name.includes('%') ? '%' : 'kg'}`, name]}
            />
            <Legend wrapperStyle={{ paddingTop: '20px' }}/>
            <Line yAxisId="left" type="monotone" dataKey="Massa Magra (kg)" stroke="#4ADE80" strokeWidth={2} activeDot={{ r: 8 }} dot={{r: 4}} />
            <Line yAxisId="left" type="monotone" dataKey="Massa Gorda (kg)" stroke="#F87171" strokeWidth={2} dot={{r: 4}} />
            <Line yAxisId="right" type="monotone" dataKey="% de Gordura (BF)" stroke="#FBBF24" strokeWidth={2} dot={{r: 4}} />
        </LineChart>
    </ResponsiveContainer>
  );
};

export default BodyCompositionLineChart;
