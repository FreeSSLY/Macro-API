
import React, { useState, useMemo } from 'react';
import { DailyLog, MacroGoals, FoodItem } from '../types';
import CircularProgress from './common/CircularProgress';
import { EditIcon, PlusIcon } from './Icons';
import AddFoodModal from './AddFoodModal';

interface MacroTrackerProps {
  logs: Record<string, DailyLog>;
  setLogs: (logs: Record<string, DailyLog>) => Promise<void>;
  macroGoals: MacroGoals;
  setCustomGoals: (goals: MacroGoals | null) => Promise<void>;
}

// O componente GoalSettingsModal permanece o mesmo...
const GoalSettingsModal: React.FC<{
    initialGoals: MacroGoals;
    onSave: (newGoals: MacroGoals) => void;
    onClose: () => void;
}> = ({ initialGoals, onSave, onClose }) => {
    const [calories, setCalories] = useState(initialGoals.calories);
    const [proteinPct, setProteinPct] = useState(Math.round(initialGoals.protein * 4 / initialGoals.calories * 100));
    const [carbsPct, setCarbsPct] = useState(Math.round(initialGoals.carbs * 4 / initialGoals.calories * 100));
    const [fatPct, setFatPct] = useState(Math.round(initialGoals.fat * 9 / initialGoals.calories * 100));

    const handleSave = () => {
        const totalPct = proteinPct + carbsPct + fatPct;
        if (totalPct < 99 || totalPct > 101) {
            alert("A soma das porcentagens de macros deve ser 100%.");
            return;
        }
        
        const newGoals: MacroGoals = {
            calories: calories,
            protein: Math.round((calories * (proteinPct / 100)) / 4),
            carbs: Math.round((calories * (carbsPct / 100)) / 4),
            fat: Math.round((calories * (fatPct / 100)) / 9),
        };
        onSave(newGoals);
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-gray-800 rounded-xl p-4 sm:p-6 w-full max-w-md border border-gray-700 shadow-2xl flex flex-col max-h-[90vh] overflow-y-auto">
                <h3 className="text-xl font-bold mb-4 text-white">Editar Metas</h3>
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-300">Calorias Totais</label>
                        <input type="number" value={calories} onChange={e => setCalories(parseInt(e.target.value))} className="mt-1 w-full bg-gray-700 text-white border border-gray-600 p-3 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"/>
                    </div>
                     <div className="grid grid-cols-3 gap-2">
                        <div>
                            <label className="text-xs md:text-sm text-red-400 font-medium">Prot (%)</label>
                            <input type="number" value={proteinPct} onChange={e => setProteinPct(parseInt(e.target.value))} className="mt-1 w-full bg-gray-700 text-white border border-gray-600 p-2 rounded-lg text-center"/>
                        </div>
                        <div>
                            <label className="text-xs md:text-sm text-green-400 font-medium">Carb (%)</label>
                            <input type="number" value={carbsPct} onChange={e => setCarbsPct(parseInt(e.target.value))} className="mt-1 w-full bg-gray-700 text-white border border-gray-600 p-2 rounded-lg text-center"/>
                        </div>
                        <div>
                            <label className="text-xs md:text-sm text-yellow-400 font-medium">Gord (%)</label>
                            <input type="number" value={fatPct} onChange={e => setFatPct(parseInt(e.target.value))} className="mt-1 w-full bg-gray-700 text-white border border-gray-600 p-2 rounded-lg text-center"/>
                        </div>
                    </div>
                </div>
                <div className="flex flex-col sm:flex-row justify-end gap-3 mt-6">
                    <button onClick={onClose} className="w-full sm:w-auto px-4 py-3 sm:py-2 rounded-lg bg-gray-700 text-gray-200 hover:bg-gray-600 transition-colors font-medium order-2 sm:order-1">Cancelar</button>
                    <button onClick={handleSave} className="w-full sm:w-auto px-4 py-3 sm:py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors font-medium order-1 sm:order-2">Salvar</button>
                </div>
            </div>
        </div>
    );
};

const MacroTracker: React.FC<MacroTrackerProps> = ({ logs, setLogs, macroGoals, setCustomGoals }) => {
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [isEditingGoals, setIsEditingGoals] = useState(false);
  const [isAddFoodModalOpen, setIsAddFoodModalOpen] = useState(false);
  const [editingFood, setEditingFood] = useState<FoodItem | null>(null);

  const dailyLog = useMemo<DailyLog>(() => {
    return logs[selectedDate] || { foods: [], calories: 0, protein: 0, carbs: 0, fat: 0 };
  }, [logs, selectedDate]);

  const handleOpenAddModal = () => {
    setEditingFood(null);
    setIsAddFoodModalOpen(true);
  };

  const handleOpenEditModal = (food: FoodItem) => {
    setEditingFood(food);
    setIsAddFoodModalOpen(true);
  };
  
  const handleSaveFood = (foodData: Omit<FoodItem, 'id'>, foodIdToUpdate?: string) => {
    const newLogs = { ...logs };
    const logForDate = newLogs[selectedDate] || { foods: [], calories: 0, protein: 0, carbs: 0, fat: 0 };
    let updatedFoods;

    if (foodIdToUpdate) { // Editing existing food
        updatedFoods = logForDate.foods.map(f => 
            f.id === foodIdToUpdate ? { ...f, ...foodData } : f
        );
    } else { // Adding new food
        updatedFoods = [...logForDate.foods, { ...foodData, id: crypto.randomUUID() }];
    }
    
    const updatedLog = updatedFoods.reduce((acc, food) => {
        acc.calories += food.calories;
        acc.protein += food.protein;
        acc.carbs += food.carbs;
        acc.fat += food.fat;
        return acc;
    }, { foods: updatedFoods, calories: 0, protein: 0, carbs: 0, fat: 0 });
    
    newLogs[selectedDate] = updatedLog;
    setLogs(newLogs);
  };
  
  const removeFoodItem = (foodId: string) => {
    const newLogs = { ...logs };
    const logForDate = newLogs[selectedDate];
    if (!logForDate) return;

    const updatedFoods = logForDate.foods.filter(food => food.id !== foodId);
    
    if (updatedFoods.length === 0) {
      delete newLogs[selectedDate];
    } else {
        const updatedLog = updatedFoods.reduce((acc, food) => {
            acc.calories += food.calories;
            acc.protein += food.protein;
            acc.carbs += food.carbs;
            acc.fat += food.fat;
            return acc;
        }, { foods: updatedFoods, calories: 0, protein: 0, carbs: 0, fat: 0 });
        newLogs[selectedDate] = updatedLog;
    }
    
    setLogs(newLogs);
  };

  const macros = [
    { name: 'Carbs', value: dailyLog.carbs, goal: macroGoals.carbs, color: 'text-green-400', unit: 'g' },
    { name: 'Prot', value: dailyLog.protein, goal: macroGoals.protein, color: 'text-red-400', unit: 'g' },
    { name: 'Gord', value: dailyLog.fat, goal: macroGoals.fat, color: 'text-yellow-400', unit: 'g' },
  ];

  return (
    <div className="flex flex-col h-full max-w-4xl mx-auto">
      {isEditingGoals && <GoalSettingsModal initialGoals={macroGoals} onSave={setCustomGoals} onClose={() => setIsEditingGoals(false)} />}
      {isAddFoodModalOpen && <AddFoodModal onSave={handleSaveFood} onClose={() => setIsAddFoodModalOpen(false)} foodToEdit={editingFood} />}
      
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-4">
          <h2 className="text-2xl font-bold text-white">Acompanhamento</h2>
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <input 
                type="date" 
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                max={new Date().toISOString().split('T')[0]}
                className="bg-gray-800 text-white rounded-lg p-3 border border-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 w-full sm:w-auto"
            />
          </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 mb-6">
        {/* Card de Calorias */}
        <div className="bg-gray-800 rounded-2xl p-6 flex flex-col items-center justify-center relative shadow-lg border border-gray-700/50">
            <button onClick={() => setIsEditingGoals(true)} className="absolute top-4 right-4 text-gray-400 hover:text-white p-2 bg-gray-700/50 rounded-full transition-colors" title="Editar Metas">
                <EditIcon className="w-5 h-5"/>
            </button>
            <CircularProgress 
                progress={(dailyLog.calories / (macroGoals.calories || 1)) * 100} 
                color="text-blue-500" 
                size={180}
                strokeWidth={12}
            >
                <div className="text-center flex flex-col">
                    {/* Tamanho do texto reduzido para evitar overlap */}
                    <span className="text-xl sm:text-3xl font-bold text-white leading-tight">{Math.round(dailyLog.calories)}</span>
                    <span className="text-xs sm:text-sm text-gray-400 mt-1">/ {macroGoals.calories} kcal</span>
                </div>
            </CircularProgress>
        </div>

        {/* Card de Macros */}
        <div className="bg-gray-800 rounded-2xl p-6 grid grid-cols-3 gap-3 items-center shadow-lg border border-gray-700/50">
          {macros.map(macro => (
            <div key={macro.name} className="flex flex-col items-center justify-center text-center">
              <CircularProgress 
                progress={(macro.value / (macro.goal || 1)) * 100}
                color={macro.color}
                size={70}
                strokeWidth={7}
              >
                  <span className={`font-bold text-sm sm:text-base ${macro.color}`}>{Math.round(macro.value)}</span>
              </CircularProgress>
              <p className="mt-2 text-sm text-gray-300 font-medium">{macro.name}</p>
              <p className="text-[10px] sm:text-xs text-gray-500">{macro.goal}{macro.unit}</p>
            </div>
          ))}
        </div>
      </div>
      
      <div className="bg-gray-800 rounded-2xl p-4 md:p-6 mb-6 flex-grow shadow-lg border border-gray-700/50">
        <div className="flex justify-between items-center mb-4">
            <h3 className="font-bold text-lg text-white">Refeições</h3>
            <button onClick={handleOpenAddModal} className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2.5 px-5 rounded-xl transition-colors shadow-md active:scale-95 transform duration-150">
                <PlusIcon className="w-5 h-5" />
                <span className="hidden sm:inline">Adicionar</span>
            </button>
        </div>
        {dailyLog.foods.length > 0 ? (
          <ul className="space-y-3 max-h-[400px] overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-transparent">
            {dailyLog.foods.map(food => (
              <li key={food.id} className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-gray-700/50 p-4 rounded-xl border border-gray-700 hover:bg-gray-700 transition-colors">
                <div className="mb-2 sm:mb-0">
                    <span className="font-medium text-white block">{food.name}</span>
                    <span className="text-xs text-gray-400">
                        P: {Math.round(food.protein)}g | C: {Math.round(food.carbs)}g | G: {Math.round(food.fat)}g
                    </span>
                </div>
                <div className="flex items-center justify-between w-full sm:w-auto space-x-4">
                    <span className="font-bold text-blue-400">{Math.round(food.calories)} kcal</span>
                    <div className="flex items-center gap-1">
                        <button onClick={() => handleOpenEditModal(food)} className="p-2 text-gray-400 hover:text-white hover:bg-gray-600 rounded-lg transition-colors" title="Editar">
                            <EditIcon className="w-5 h-5" />
                        </button>
                        <button onClick={() => removeFoodItem(food.id)} className="p-2 text-red-400 hover:text-red-300 hover:bg-red-500/20 rounded-lg transition-colors" title="Remover">
                             <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                                <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
                            </svg>
                        </button>
                    </div>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <div className="flex flex-col items-center justify-center py-10 text-gray-500 bg-gray-700/30 rounded-xl border border-dashed border-gray-700">
            <p>Nenhum alimento registrado hoje.</p>
            <button onClick={handleOpenAddModal} className="mt-2 text-blue-400 hover:underline text-sm">Adicionar agora</button>
          </div>
        )}
      </div>
    </div>
  );
};

export default MacroTracker;
