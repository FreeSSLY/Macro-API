
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
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
            <div className="bg-gray-800 rounded-xl p-6 w-full max-w-md border border-gray-700">
                <h3 className="text-xl font-bold mb-4">Editar Metas</h3>
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-300">Calorias Totais</label>
                        <input type="number" value={calories} onChange={e => setCalories(parseInt(e.target.value))} className="mt-1 w-full bg-gray-700 p-2 rounded-md"/>
                    </div>
                     <div className="grid grid-cols-3 gap-2">
                        <div>
                            <label className="text-sm text-red-400">Proteína (%)</label>
                            <input type="number" value={proteinPct} onChange={e => setProteinPct(parseInt(e.target.value))} className="mt-1 w-full bg-gray-700 p-2 rounded-md"/>
                        </div>
                        <div>
                            <label className="text-sm text-green-400">Carboidratos (%)</label>
                            <input type="number" value={carbsPct} onChange={e => setCarbsPct(parseInt(e.target.value))} className="mt-1 w-full bg-gray-700 p-2 rounded-md"/>
                        </div>
                        <div>
                            <label className="text-sm text-yellow-400">Gordura (%)</label>
                            <input type="number" value={fatPct} onChange={e => setFatPct(parseInt(e.target.value))} className="mt-1 w-full bg-gray-700 p-2 rounded-md"/>
                        </div>
                    </div>
                </div>
                <div className="flex justify-end gap-3 mt-6">
                    <button onClick={onClose} className="px-4 py-2 rounded-md bg-gray-600 hover:bg-gray-500">Cancelar</button>
                    <button onClick={handleSave} className="px-4 py-2 rounded-md bg-blue-600 hover:bg-blue-700">Salvar</button>
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
    { name: 'Proteína', value: dailyLog.protein, goal: macroGoals.protein, color: 'text-red-400', unit: 'g' },
    { name: 'Gordura', value: dailyLog.fat, goal: macroGoals.fat, color: 'text-yellow-400', unit: 'g' },
  ];

  return (
    <div className="flex flex-col h-full">
      {isEditingGoals && <GoalSettingsModal initialGoals={macroGoals} onSave={setCustomGoals} onClose={() => setIsEditingGoals(false)} />}
      {isAddFoodModalOpen && <AddFoodModal onSave={handleSaveFood} onClose={() => setIsAddFoodModalOpen(false)} foodToEdit={editingFood} />}
      
      <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold">Acompanhamento Diário</h2>
          <div className="flex items-center gap-2">
            <input 
                type="date" 
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                max={new Date().toISOString().split('T')[0]}
                className="bg-gray-700 text-white rounded-lg p-2 border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <div className="bg-gray-800 rounded-xl p-6 flex flex-col items-center justify-center relative">
            <button onClick={() => setIsEditingGoals(true)} className="absolute top-3 right-3 text-gray-400 hover:text-white" title="Editar Metas">
                <EditIcon className="w-5 h-5"/>
            </button>
            <CircularProgress 
                progress={(dailyLog.calories / (macroGoals.calories || 1)) * 100} 
                color="text-blue-500" 
                size={160}
                strokeWidth={12}
            >
                <div className="text-center">
                    <span className="text-3xl font-bold text-white">{Math.round(dailyLog.calories)}</span>
                    <span className="text-gray-400"> / {macroGoals.calories} kcal</span>
                </div>
            </CircularProgress>
        </div>
        <div className="bg-gray-800 rounded-xl p-6 grid grid-cols-3 gap-4">
          {macros.map(macro => (
            <div key={macro.name} className="flex flex-col items-center justify-center text-center">
              <CircularProgress 
                progress={(macro.value / (macro.goal || 1)) * 100}
                color={macro.color}
                size={80}
                strokeWidth={8}
              >
                  <span className={`font-bold text-lg ${macro.color}`}>{Math.round(macro.value)}<span className="text-sm">{macro.unit}</span></span>
              </CircularProgress>
              <p className="mt-2 text-sm text-gray-300 font-medium">{macro.name}</p>
              <p className="text-xs text-gray-500">Meta: {macro.goal}{macro.unit}</p>
            </div>
          ))}
        </div>
      </div>
      
      <div className="bg-gray-800 rounded-xl p-4 mb-6 flex-grow">
        <div className="flex justify-between items-center mb-3">
            <h3 className="font-bold text-lg">Registro do Dia</h3>
            <button onClick={handleOpenAddModal} className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors">
                <PlusIcon className="w-5 h-5" />
                Adicionar
            </button>
        </div>
        {dailyLog.foods.length > 0 ? (
          <ul className="space-y-2 max-h-48 overflow-y-auto pr-2">
            {dailyLog.foods.map(food => (
              <li key={food.id} className="flex justify-between items-center bg-gray-700 p-3 rounded-lg">
                <span className="font-medium">{food.name}</span>
                <div className="flex items-center space-x-4 text-sm">
                    <span>{Math.round(food.calories)} kcal</span>
                    <div className="flex items-center gap-2">
                        <button onClick={() => handleOpenEditModal(food)} className="text-gray-400 hover:text-white" title="Editar">
                            <EditIcon className="w-4 h-4" />
                        </button>
                        <button onClick={() => removeFoodItem(food.id)} className="text-red-500 hover:text-red-400 font-bold text-lg" title="Remover">&times;</button>
                    </div>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-gray-400 text-center py-4">Nenhum alimento registrado.</p>
        )}
      </div>
    </div>
  );
};

export default MacroTracker;
