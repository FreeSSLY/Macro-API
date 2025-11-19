import React, { useState, useEffect, useMemo } from 'react';
import { UserProfile, MacroGoals } from '../types';

interface UpdateMeasurementsProps {
  profile: UserProfile;
  macroGoals: MacroGoals;
  onProfileUpdate: (updates: Partial<UserProfile>) => Promise<void>;
}

const UpdateMeasurements: React.FC<UpdateMeasurementsProps> = ({ profile, macroGoals, onProfileUpdate }) => {
  const [formData, setFormData] = useState<Record<string, number | ''>>({
    currentWeight: 70,
    height: 175,
    age: 25,
    neck: 38,
    waist: 85,
    hip: 95,
    calories: 2000,
    proteinPct: 30,
    carbsPct: 40,
    fatPct: 30,
  });

  // Effect to synchronize form data when props change
  useEffect(() => {
    const totalCalories = macroGoals.calories > 0 ? macroGoals.calories : 1;
    const pPct = Math.round((macroGoals.protein * 4) / totalCalories * 100);
    const cPct = Math.round((macroGoals.carbs * 4) / totalCalories * 100);
    const fPct = 100 - pPct - cPct; // Adjust to sum to 100, avoiding rounding issues

    setFormData({
      currentWeight: profile.currentWeight || profile.weight,
      height: profile.height,
      age: profile.age,
      neck: profile.neck,
      waist: profile.waist,
      hip: profile.hip || 0,
      calories: macroGoals.calories,
      proteinPct: pPct,
      carbsPct: cPct,
      fatPct: fPct,
    });
  }, [profile, macroGoals]);
  
  const totalPercentage = useMemo(() => {
    const p = typeof formData.proteinPct === 'number' ? formData.proteinPct : 0;
    const c = typeof formData.carbsPct === 'number' ? formData.carbsPct : 0;
    const f = typeof formData.fatPct === 'number' ? formData.fatPct : 0;
    return p + c + f;
  }, [formData.proteinPct, formData.carbsPct, formData.fatPct]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    // Allow empty string for better UX, will be parsed on save
    setFormData(prev => ({
      ...prev,
      [name]: value === '' ? '' : parseFloat(value),
    }));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const parsedData = Object.fromEntries(
      Object.entries(formData).map(([key, value]) => [key, value === '' ? 0 : value as number])
    ) as Record<string, number>;
    
    // Simple validation
    for(const key in parsedData){
        if(isNaN(parsedData[key]) || parsedData[key] < 0){
             if(key === 'hip' && profile.sex === 'male' && parsedData[key] === 0) continue; // Hip can be 0 for males
             alert(`Por favor, insira um valor válido para '${key}'.`);
             return;
        }
    }

    if (totalPercentage < 99 || totalPercentage > 101) {
        alert("A soma das porcentagens de macros (Proteína, Carboidratos, Gordura) deve ser 100%.");
        return;
    }
    
    const newGoals: MacroGoals = {
        calories: parsedData.calories,
        protein: Math.round((parsedData.calories * (parsedData.proteinPct / 100)) / 4),
        carbs: Math.round((parsedData.calories * (parsedData.carbsPct / 100)) / 4),
        fat: Math.round((parsedData.calories * (parsedData.fatPct / 100)) / 9),
    };

    const updates: Partial<UserProfile> = {
      currentWeight: parsedData.currentWeight,
      height: parsedData.height,
      age: parsedData.age,
      neck: parsedData.neck,
      waist: parsedData.waist,
      customGoals: newGoals,
    };

    if (profile.sex === 'female') {
      updates.hip = parsedData.hip;
    }

    await onProfileUpdate(updates);
    alert('Dados atualizados com sucesso!');
  };

  const formFields = [
      { name: 'currentWeight', label: 'Peso Atual (kg)', step: 0.1 },
      { name: 'height', label: 'Altura (cm)', step: 1 },
      { name: 'age', label: 'Idade', step: 1 },
      { name: 'neck', label: 'Pescoço (cm)', step: 0.5 },
      { name: 'waist', label: 'Cintura (cm)', step: 0.5 },
  ];

  return (
    <div>
      <h2 className="text-2xl font-bold mb-6">Atualizar Medidas e Metas</h2>
      <div className="max-w-xl mx-auto bg-gray-800 p-8 rounded-xl shadow-lg">
        <form onSubmit={handleSave} className="space-y-6">
          <h3 className="text-lg font-semibold text-gray-300 border-b border-gray-700 pb-2">Medidas Corporais</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
            {formFields.map(field => (
                 <div key={field.name}>
                    <label htmlFor={field.name} className="block text-sm font-medium text-gray-400">
                      {field.label}
                    </label>
                    <input
                      type="number"
                      id={field.name}
                      name={field.name}
                      value={formData[field.name]}
                      onChange={handleChange}
                      step={field.step}
                      min="0"
                      className="mt-1 block w-full bg-gray-700 border border-gray-600 rounded-md shadow-sm py-2 px-3 text-white focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    />
                 </div>
            ))}

            {profile.sex === 'female' && (
                <div>
                    <label htmlFor="hip" className="block text-sm font-medium text-gray-400">
                        Quadril (cm)
                    </label>
                    <input
                        type="number"
                        id="hip"
                        name="hip"
                        value={formData.hip}
                        onChange={handleChange}
                        step="0.5"
                        min="0"
                        className="mt-1 block w-full bg-gray-700 border border-gray-600 rounded-md shadow-sm py-2 px-3 text-white focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    />
                </div>
            )}
          </div>
          
          <div className="border-t border-gray-700 pt-6">
             <h3 className="text-lg font-semibold text-gray-300 border-b border-gray-700 pb-2">Metas Nutricionais</h3>
             <div className="mt-4">
                <label htmlFor="calories" className="block text-sm font-medium text-gray-400">
                    Meta de Calorias Diárias (kcal)
                </label>
                <input
                    type="number"
                    id="calories"
                    name="calories"
                    value={formData.calories}
                    onChange={handleChange}
                    step="50"
                    min="0"
                    className="mt-1 block w-full bg-gray-700 border border-gray-600 rounded-md shadow-sm py-2 px-3 text-white focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
             </div>
             <div className="mt-4">
                <label className="block text-sm font-medium text-gray-400">
                    Distribuição de Macros (%)
                </label>
                <div className="grid grid-cols-3 gap-2 mt-2">
                    <div>
                        <label className="text-xs text-red-400">Proteína (%)</label>
                        <input type="number" name="proteinPct" value={formData.proteinPct} onChange={handleChange} min="0" max="100" className="mt-1 w-full bg-gray-700 p-2 rounded-md"/>
                    </div>
                    <div>
                        <label className="text-xs text-green-400">Carboidratos (%)</label>
                        <input type="number" name="carbsPct" value={formData.carbsPct} onChange={handleChange} min="0" max="100" className="mt-1 w-full bg-gray-700 p-2 rounded-md"/>
                    </div>
                    <div>
                        <label className="text-xs text-yellow-400">Gordura (%)</label>
                        <input type="number" name="fatPct" value={formData.fatPct} onChange={handleChange} min="0" max="100" className="mt-1 w-full bg-gray-700 p-2 rounded-md"/>
                    </div>
                </div>
                <p className={`text-center text-xs mt-2 ${totalPercentage === 100 ? 'text-gray-500' : 'text-orange-400 font-semibold'}`}>
                    Total: {totalPercentage}%
                </p>
             </div>
          </div>

          <button
            type="submit"
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-lg transition duration-300 ease-in-out transform hover:scale-105 mt-4"
          >
            Salvar Alterações
          </button>
        </form>
      </div>
    </div>
  );
};

export default UpdateMeasurements;