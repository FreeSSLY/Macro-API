import React, { useState, useMemo, useEffect } from 'react';
import { UserProfile, BodyCompositionLog } from '../types';
import { calculateBodyComposition } from '../utils/calculations';
import BodyCompositionLineChart from './charts/BodyCompositionLineChart';

interface LeanMassCalculatorProps {
  profile: UserProfile;
  currentWeight: number;
  history: BodyCompositionLog[];
  setHistory: (history: BodyCompositionLog[]) => Promise<void>;
}

const LeanMassCalculator: React.FC<LeanMassCalculatorProps> = ({ profile, currentWeight, history, setHistory }) => {
  const latestLog = history.length > 0 ? history[history.length - 1] : null;

  const [neck, setNeck] = useState(latestLog?.neck || profile.neck);
  const [waist, setWaist] = useState(latestLog?.waist || profile.waist);
  const [hip, setHip] = useState(latestLog?.hip || profile.hip);

  useEffect(() => {
    const latest = history.length > 0 ? history[history.length - 1] : null;
    if (latest) {
      setNeck(latest.neck);
      setWaist(latest.waist);
      setHip(latest.hip);
    } else {
      setNeck(profile.neck);
      setWaist(profile.waist);
      setHip(profile.hip);
    }
  }, [history, profile]);
  
  const handleSaveChanges = () => {
    const tempProfileForCalc = {
      ...profile,
      weight: currentWeight,
      neck,
      waist,
      hip,
    };

    const { lbm, fatPercentage } = calculateBodyComposition(tempProfileForCalc);

    const newLog: BodyCompositionLog = {
      date: new Date().toISOString().split('T')[0],
      weight: currentWeight,
      neck,
      waist,
      hip,
      lbm,
      fatPercentage,
    };

    const today = new Date().toISOString().split('T')[0];
    const todayIndex = history.findIndex(log => log.date === today);
    
    let newHistory = [...history];
    if (todayIndex !== -1) {
      newHistory[todayIndex] = newLog;
    } else {
      newHistory.push(newLog);
    }
    
    newHistory.sort((a, b) => a.date.localeCompare(b.date));

    setHistory(newHistory);
    alert("Medidas salvas com sucesso!");
  };
  
  const gains = useMemo(() => {
    if (history.length < 2) {
      return null;
    }

    const first = history[0];
    const last = history[history.length - 1];
    
    // Defensive check for valid data to prevent crashes
    if (!first || !last || typeof first.weight !== 'number' || typeof first.lbm !== 'number' || typeof last.weight !== 'number' || typeof last.lbm !== 'number' || typeof first.fatPercentage !== 'number' || typeof last.fatPercentage !== 'number') {
        console.warn("Dados inválidos no histórico de composição corporal. Pulando cálculo de ganhos.", {first, last});
        return null;
    }

    const firstFatMass = first.weight - first.lbm;
    const lastFatMass = last.weight - last.lbm;

    return {
      deltaFatPercentage: last.fatPercentage - first.fatPercentage,
      deltaLBM: last.lbm - first.lbm,
      deltaFatMass: lastFatMass - firstFatMass,
      first: {
        date: first.date,
        fatPercentage: first.fatPercentage,
        lbm: first.lbm,
        fatMass: firstFatMass,
      },
      last: {
        date: last.date,
        fatPercentage: last.fatPercentage,
        lbm: last.lbm,
        fatMass: lastFatMass,
      }
    };
  }, [history]);

  const renderDelta = (value: number, unit: string) => {
    const isPositive = value > 0;
    const isNegative = value < 0;

    // A negative number is red, a positive number is green, and zero is neutral.
    const color = isNegative ? 'text-red-400' : isPositive ? 'text-green-400' : 'text-gray-400';
    const sign = isPositive ? '+' : '';

    return (
        <span className={color}>
        {sign}{value.toFixed(1)}{unit}
        </span>
    );
  };

  return (
    <div>
      <h2 className="text-2xl font-bold mb-6">Análise de Composição Corporal</h2>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        <div className="lg:col-span-1 flex flex-col">
          {/* Formulário de Medidas */}
          <div className="bg-gray-800 p-6 rounded-xl shadow-lg flex flex-col">
            <h3 className="text-lg font-bold mb-4">Registrar Novas Medidas</h3>
            <div className="space-y-4">
              <div>
                  <label className="block text-sm font-medium text-gray-400">Peso Atual (kg)</label>
                  <input type="number" readOnly value={currentWeight} className="mt-1 w-full bg-gray-700 p-2 rounded-md cursor-not-allowed text-gray-300"/>
              </div>
               <div>
                  <label className="block text-sm font-medium text-gray-400">Pescoço (cm)</label>
                  <input type="number" value={neck} onChange={e => setNeck(parseFloat(e.target.value))} className="mt-1 w-full bg-gray-700 p-2 rounded-md"/>
              </div>
               <div>
                  <label className="block text-sm font-medium text-gray-400">Cintura (cm)</label>
                  <input type="number" value={waist} onChange={e => setWaist(parseFloat(e.target.value))} className="mt-1 w-full bg-gray-700 p-2 rounded-md"/>
              </div>
              {profile.sex === 'female' && (
                <div>
                  <label className="block text-sm font-medium text-gray-400">Quadril (cm)</label>
                  <input type="number" value={hip} onChange={e => setHip(parseFloat(e.target.value))} className="mt-1 w-full bg-gray-700 p-2 rounded-md"/>
                </div>
              )}
            </div>
            <button onClick={handleSaveChanges} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-lg transition duration-300 mt-6">
              Salvar Medidas de Hoje
            </button>
          </div>

          {gains ? (
                <div className="bg-gray-800 p-6 rounded-xl shadow-lg mt-6">
                    <h3 className="text-lg font-bold mb-4 text-center">Ganhos (Início vs. Atual)</h3>
                    
                    <div className="grid grid-cols-3 gap-x-2 text-center">
                        {/* Deltas */}
                        <div className="pb-2 border-b-2 border-gray-700">
                            <p className="text-lg font-bold">{renderDelta(gains.deltaFatPercentage, '%')}</p>
                        </div>
                        <div className="pb-2 border-b-2 border-gray-700">
                            <p className="text-lg font-bold">{renderDelta(gains.deltaLBM, ' kg')}</p>
                        </div>
                        <div className="pb-2 border-b-2 border-gray-700">
                            <p className="text-lg font-bold">{renderDelta(gains.deltaFatMass, ' kg')}</p>
                        </div>

                        {/* Headers */}
                        <div className="pt-2">
                            <p className="text-xs font-semibold text-gray-400">% de Gordura (BF)</p>
                        </div>
                        <div className="pt-2">
                            <p className="text-xs font-semibold text-gray-400">Massa Magra</p>
                        </div>
                        <div className="pt-2">
                            <p className="text-xs font-semibold text-gray-400">Massa Gorda</p>
                        </div>

                        {/* Initial Values */}
                        <div className="mt-2 text-gray-300">
                            <p>{gains.first.fatPercentage.toFixed(1)}%</p>
                        </div>
                        <div className="mt-2 text-gray-300">
                            <p>{gains.first.lbm.toFixed(1)} kg</p>
                        </div>
                        <div className="mt-2 text-gray-300">
                            <p>{gains.first.fatMass.toFixed(1)} kg</p>
                        </div>
                        
                        {/* Final Values */}
                        <div className="mt-1 text-white font-bold">
                            <p>{gains.last.fatPercentage.toFixed(1)}%</p>
                        </div>
                        <div className="mt-1 text-white font-bold">
                            <p>{gains.last.lbm.toFixed(1)} kg</p>
                        </div>
                        <div className="mt-1 text-white font-bold">
                            <p>{gains.last.fatMass.toFixed(1)} kg</p>
                        </div>
                    </div>
                    <p className="text-xs text-gray-500 text-center mt-4">
                        Comparando {new Date(gains.first.date + 'T00:00:00').toLocaleDateString('pt-BR')} com {new Date(gains.last.date + 'T00:00:00').toLocaleDateString('pt-BR')}
                    </p>
                </div>
            ) : (
                <div className="bg-gray-800 p-6 rounded-xl shadow-lg mt-6 text-center text-gray-500">
                    <p>Registre suas medidas por pelo menos dois dias para ver a comparação de ganhos.</p>
                </div>
            )}
        </div>

        {/* Gráfico Histórico */}
        <div className="lg:col-span-2 bg-gray-800 p-6 rounded-xl shadow-lg flex flex-col h-[500px]">
           <h3 className="text-lg font-bold mb-4 flex-shrink-0">Histórico de Evolução</h3>
            {history.length > 0 ? (
              <div className="flex-grow w-full">
                <BodyCompositionLineChart history={history} />
              </div>
            ) : (
                <div className="flex items-center justify-center h-full text-gray-500">
                    <p>Registre suas medidas para ver o gráfico de progresso.</p>
                </div>
            )}
        </div>
      </div>
       <p className="text-xs text-gray-500 mt-4 italic text-center">
            Nota: As estimativas usam a fórmula da Marinha dos EUA. Para medições precisas, consulte um profissional.
        </p>
    </div>
  );
};

export default LeanMassCalculator;