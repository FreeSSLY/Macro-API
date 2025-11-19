

import React from 'react';
import { DailyLog } from '../types';
import ProgressLineChart from './charts/ProgressLineChart';

interface ProgressChartProps {
  logs: Record<string, DailyLog>;
}

const ProgressChart: React.FC<ProgressChartProps> = ({ logs }) => {
  return (
    <div>
        <h2 className="text-2xl font-bold mb-6">Progresso dos últimos 7 dias</h2>
        <div className="bg-gray-800 p-4 rounded-xl shadow-lg h-96">
            <ProgressLineChart logs={logs} />
        </div>
    </div>
  );
};

export default ProgressChart;