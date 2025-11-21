import React, { useMemo } from 'react';
import { UserProfile, DailyLog, BodyCompositionLog, MacroGoals } from '../types';
import ProgressChart from './ProgressChart';
import LeanMassCalculator from './LeanMassCalculator';
import { LogoIcon } from './Icons';

interface ReportProps {
    profile: UserProfile;
    selectedDate: string;
    logs: Record<string, DailyLog>;
    history: BodyCompositionLog[];
    macroGoals: MacroGoals;
}

const Report = React.forwardRef<HTMLDivElement, ReportProps>((props, ref) => {
    const { profile, selectedDate, logs, history, macroGoals } = props;
    
    const selectedLog = useMemo(() => {
        return logs[selectedDate] || { foods: [], calories: 0, protein: 0, carbs: 0, fat: 0 };
    }, [logs, selectedDate]);

    const last7DaysLogs = useMemo(() => {
        const relevantLogs: Record<string, DailyLog> = {};
        for (let i = 6; i >= 0; i--) {
            const date = new Date();
            date.setDate(date.getDate() - i);
            const dateString = date.toISOString().split('T')[0];
            if(logs[dateString]) {
                relevantLogs[dateString] = logs[dateString];
            }
        }
        return relevantLogs;
    }, [logs]);

    const currentWeight = profile.currentWeight || profile.weight;

    return (
        <div ref={ref} className="bg-gray-900 text-gray-200 p-10" style={{ width: '820px' }}>
            {/* Title */}
            <div className="text-center mb-10 border-b border-gray-700 pb-6">
                <LogoIcon className="w-16 h-16 text-blue-500 mx-auto mb-3" />
                <h1 className="text-4xl font-bold text-white">Relatório de Acompanhamento</h1>
                <p className="text-gray-400 mt-2">Gerado para: {profile.name}</p>
                <p className="text-gray-400">Data do Relatório: {new Date().toLocaleDateString('pt-BR')}</p>
            </div>
            
            {/* Daily Log */}
            <div className="mb-10">
                <h2 className="text-2xl font-bold mb-4 text-white">Resumo do Dia: {new Date(selectedDate + 'T00:00:00').toLocaleDateString('pt-BR')}</h2>
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-gray-800">
                            <th className="p-3 border border-gray-700">Métrica</th>
                            <th className="p-3 border border-gray-700">Consumido</th>
                            <th className="p-3 border border-gray-700">Meta</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr className="bg-gray-800/50"><td className="p-3 border border-gray-700">Calorias (kcal)</td><td className="p-3 border border-gray-700">{selectedLog.calories.toFixed(0)}</td><td className="p-3 border border-gray-700">{macroGoals.calories.toFixed(0)}</td></tr>
                        <tr className="bg-gray-800/50"><td className="p-3 border border-gray-700">Proteínas (g)</td><td className="p-3 border border-gray-700">{selectedLog.protein.toFixed(1)}</td><td className="p-3 border border-gray-700">{macroGoals.protein.toFixed(1)}</td></tr>
                        <tr className="bg-gray-800/50"><td className="p-3 border border-gray-700">Carboidratos (g)</td><td className="p-3 border border-gray-700">{selectedLog.carbs.toFixed(1)}</td><td className="p-3 border border-gray-700">{macroGoals.carbs.toFixed(1)}</td></tr>
                        <tr className="bg-gray-800/50"><td className="p-3 border border-gray-700">Gorduras (g)</td><td className="p-3 border border-gray-700">{selectedLog.fat.toFixed(1)}</td><td className="p-3 border border-gray-700">{macroGoals.fat.toFixed(1)}</td></tr>
                    </tbody>
                </table>

                {selectedLog.foods.length > 0 && (
                    <div className="mt-6">
                        <h3 className="text-xl font-semibold mb-3">Alimentos Registrados</h3>
                        <table className="w-full text-left border-collapse">
                            <thead><tr className="bg-gray-800"><th className="p-3 border border-gray-700">Alimento</th><th className="p-3 border border-gray-700">kcal</th><th className="p-3 border border-gray-700">P(g)</th><th className="p-3 border border-gray-700">C(g)</th><th className="p-3 border border-gray-700">F(g)</th></tr></thead>
                            <tbody>
                                {selectedLog.foods.map(f => (
                                    <tr key={f.id} className="bg-gray-800/50"><td className="p-2 border border-gray-700">{f.name}</td><td className="p-2 border border-gray-700">{f.calories.toFixed(0)}</td><td className="p-2 border border-gray-700">{f.protein.toFixed(1)}</td><td className="p-2 border border-gray-700">{f.carbs.toFixed(1)}</td><td className="p-2 border border-gray-700">{f.fat.toFixed(1)}</td></tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Progress Chart */}
            <div className="mb-10" style={{ pageBreakBefore: 'always' }}>
                 <h2 className="text-2xl font-bold mb-4 text-white">Progresso dos Últimos 7 Dias</h2>
                 <div className="h-[400px]"><ProgressChart logs={last7DaysLogs} /></div>
            </div>

            {/* Weight & Goals */}
            <div className="mb-10">
                <h2 className="text-2xl font-bold mb-4 text-white">Medidas e Metas Atuais</h2>
                 <div className="grid grid-cols-2 gap-4 bg-gray-800 p-4 rounded-lg">
                    <p><strong>Peso Atual:</strong> {currentWeight} kg</p>
                    <p><strong>Altura:</strong> {profile.height} cm</p>
                    <p><strong>Pescoço:</strong> {profile.neck} cm</p>
                    <p><strong>Cintura:</strong> {profile.waist} cm</p>
                    {profile.sex === 'female' && <p><strong>Quadril:</strong> {profile.hip} cm</p>}
                 </div>
            </div>

            {/* Body Composition */}
            {history.length > 0 && (
                <div style={{ pageBreakBefore: 'always' }}>
                    <h2 className="text-2xl font-bold mb-4 text-white">Análise de Composição Corporal</h2>
                    <LeanMassCalculator 
                        profile={profile} 
                        currentWeight={currentWeight}
                        history={history}
                        setHistory={async () => {}}
                    />
                </div>
            )}
        </div>
    );
});

export default Report;
