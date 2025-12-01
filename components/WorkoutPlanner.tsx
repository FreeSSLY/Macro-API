
import React, { useState, useEffect } from 'react';
import { WeeklyWorkoutPlan, WorkoutExercise, ExerciseDatabaseItem } from '../types';
import { EditIcon, PlusIcon } from './Icons';
import * as exerciseService from '../services/exerciseService';

const initialPlan: WeeklyWorkoutPlan = {
  'segunda': { title: 'Segunda-feira', exercises: [] },
  'terca': { title: 'Terça-feira', exercises: [] },
  'quarta': { title: 'Quarta-feira', exercises: [] },
  'quinta': { title: 'Quinta-feira', exercises: [] },
  'sexta': { title: 'Sexta-feira', exercises: [] },
  'sabado': { title: 'Sábado', exercises: [] },
  'domingo': { title: 'Domingo', exercises: [] },
};

// Tipos para controlar a navegação interna do componente
type ViewState = 'daily_list' | 'search' | 'form';

const WorkoutPlanner: React.FC = () => {
  const [plan, setPlan] = useState<WeeklyWorkoutPlan>(initialPlan);
  const [activeDay, setActiveDay] = useState('segunda');
  const [view, setView] = useState<ViewState>('daily_list');
  const [expandedExerciseId, setExpandedExerciseId] = useState<string | null>(null);
  
  // Search State
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<ExerciseDatabaseItem[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  // Form State
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    sets: 3,
    reps: '10-12',
    muscleGroup: '',
    weight: '',
    restTime: '',
    notes: ''
  });

  // Load from localStorage
  useEffect(() => {
    const savedPlan = localStorage.getItem('user-workout-plan');
    if (savedPlan) {
      try {
        setPlan(JSON.parse(savedPlan));
      } catch (e) {
        console.error("Erro ao carregar plano de treino", e);
      }
    }
    // Carregar exercícios iniciais
    handleSearch('');
  }, []);

  // Save to localStorage
  useEffect(() => {
    localStorage.setItem('user-workout-plan', JSON.stringify(plan));
  }, [plan]);

  // Busca de exercícios
  const handleSearch = async (term: string) => {
    setSearchTerm(term);
    setIsSearching(true);
    try {
        const results = await exerciseService.searchExercises(term);
        setSearchResults(results);
    } finally {
        setIsSearching(false);
    }
  };

  // Selecionar exercício da lista de busca
  const handleSelectExercise = (ex: ExerciseDatabaseItem) => {
    setFormData({
        ...formData,
        name: ex.name,
        muscleGroup: ex.muscleGroup,
        sets: 3,
        reps: '10-12',
        weight: '',
        restTime: '',
        notes: ''
    });
    setView('form');
  };

  // Selecionar exercício para criar manualmente
  const handleCreateCustom = () => {
    setFormData({
        name: searchTerm,
        muscleGroup: '',
        sets: 3,
        reps: '10-12',
        weight: '',
        restTime: '',
        notes: ''
    });
    setView('form');
  };

  // Iniciar edição de um exercício existente
  const handleEdit = (e: React.MouseEvent, ex: WorkoutExercise) => {
    e.stopPropagation(); // Previne abrir o accordion
    setFormData({
        name: ex.name,
        sets: ex.sets,
        reps: ex.reps,
        muscleGroup: ex.muscleGroup || '',
        weight: ex.weight || '',
        restTime: ex.restTime || '',
        notes: ex.notes || ''
    });
    setEditingId(ex.id);
    setView('form');
  };

  // Salvar exercício no plano
  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) return;

    const newExercise: WorkoutExercise = {
      id: editingId || crypto.randomUUID(),
      name: formData.name,
      sets: formData.sets,
      reps: formData.reps,
      muscleGroup: formData.muscleGroup,
      weight: formData.weight,
      restTime: formData.restTime,
      notes: formData.notes
    };

    setPlan(prev => {
      const currentDayExercises = prev[activeDay].exercises;
      let updatedExercises;
      
      if (editingId) {
        updatedExercises = currentDayExercises.map(ex => ex.id === editingId ? newExercise : ex);
      } else {
        updatedExercises = [...currentDayExercises, newExercise];
      }

      return {
        ...prev,
        [activeDay]: {
          ...prev[activeDay],
          exercises: updatedExercises
        }
      };
    });

    resetAndGoBack();
  };

  const handleDelete = (e: React.MouseEvent, id: string) => {
    e.stopPropagation(); // Previne abrir o accordion
    if (window.confirm("Tem certeza que deseja remover este exercício?")) {
      setPlan(prev => ({
        ...prev,
        [activeDay]: {
          ...prev[activeDay],
          exercises: prev[activeDay].exercises.filter(ex => ex.id !== id)
        }
      }));
    }
  };

  const toggleDetails = (id: string) => {
      if (expandedExerciseId === id) {
          setExpandedExerciseId(null);
      } else {
          setExpandedExerciseId(id);
      }
  };

  const resetAndGoBack = () => {
    setEditingId(null);
    setFormData({ name: '', sets: 3, reps: '10-12', muscleGroup: '', weight: '', restTime: '', notes: '' });
    setSearchTerm('');
    setView('daily_list');
    handleSearch(''); // Reset search list
  };

  const days = [
    { id: 'segunda', label: 'Seg' },
    { id: 'terca', label: 'Ter' },
    { id: 'quarta', label: 'Qua' },
    { id: 'quinta', label: 'Qui' },
    { id: 'sexta', label: 'Sex' },
    { id: 'sabado', label: 'Sáb' },
    { id: 'domingo', label: 'Dom' },
  ];

  // --- RENDERIZADORES DAS SUB-VIEWS ---

  const renderDailyList = () => (
    <div className="animate-fade-in">
      <div className="flex justify-between items-center mb-6 border-b border-gray-700 pb-4">
        <div>
          <h3 className="text-xl font-bold text-white">{plan[activeDay].title}</h3>
          <p className="text-sm text-gray-400">{plan[activeDay].exercises.length} exercícios</p>
        </div>
        <button 
          onClick={() => setView('search')}
          className="bg-blue-600 hover:bg-blue-700 text-white p-3 rounded-xl shadow-lg shadow-blue-900/20 transition-all active:scale-95 flex items-center gap-2"
        >
          <PlusIcon className="w-5 h-5" />
          <span className="font-semibold text-sm hidden sm:inline">Adicionar</span>
        </button>
      </div>

      <div className="space-y-3 pb-20 md:pb-0">
        {plan[activeDay].exercises.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-gray-500 bg-gray-800/50 rounded-2xl border border-dashed border-gray-700">
            <p className="mb-4">Descanso total ou treino não planejado.</p>
            <button onClick={() => setView('search')} className="bg-gray-700 hover:bg-gray-600 text-blue-400 px-6 py-3 rounded-full text-sm font-bold transition-colors">
              Começar Treino
            </button>
          </div>
        ) : (
          plan[activeDay].exercises.map((ex) => (
            <div 
                key={ex.id} 
                onClick={() => toggleDetails(ex.id)}
                className={`bg-gray-700/50 rounded-xl border transition-all cursor-pointer overflow-hidden ${expandedExerciseId === ex.id ? 'border-blue-500 bg-gray-700' : 'border-gray-700 hover:border-gray-500'}`}
            >
              <div className="p-4 flex justify-between items-center">
                  <div className="flex-grow pr-4">
                    <div className="flex items-center gap-2 mb-2">
                        <h5 className="font-bold text-white text-lg leading-tight">{ex.name}</h5>
                        {ex.muscleGroup && <span className="text-[10px] bg-gray-800 text-gray-400 px-2 py-0.5 rounded uppercase tracking-wide hidden sm:inline-block">{ex.muscleGroup}</span>}
                    </div>
                    <div className="flex flex-wrap gap-2 text-sm font-medium items-center">
                        <span className="text-blue-300 bg-blue-900/20 px-2 py-0.5 rounded">{ex.sets} séries</span>
                        <span className="text-green-300 bg-green-900/20 px-2 py-0.5 rounded">{ex.reps} reps</span>
                        {ex.restTime && (
                             <span className="text-yellow-300 bg-yellow-900/20 px-2 py-0.5 rounded">{ex.restTime}s</span>
                        )}
                    </div>
                  </div>
                  
                  {/* Action Buttons - Coluna no mobile, Linha no Desktop */}
                  <div className="flex flex-col md:flex-row gap-2 ml-2 flex-shrink-0" onClick={(e) => e.stopPropagation()}>
                    <button onClick={(e) => handleEdit(e, ex)} className="p-2.5 bg-gray-800 text-gray-400 rounded-lg hover:text-white hover:bg-gray-600 transition-colors border border-gray-600/50">
                      <EditIcon className="w-5 h-5" />
                    </button>
                    <button onClick={(e) => handleDelete(e, ex.id)} className="p-2.5 bg-gray-800 text-red-400 rounded-lg hover:bg-red-500/20 transition-colors border border-gray-600/50">
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
                      </svg>
                    </button>
                  </div>
              </div>

              {/* Expanded Details View */}
              {expandedExerciseId === ex.id && (
                  <div className="px-4 pb-4 pt-0 border-t border-gray-600/30 mt-2 bg-gray-800/30">
                      <div className="pt-3 grid grid-cols-1 gap-3 text-sm text-gray-300">
                           {ex.weight && (
                               <div className="flex items-center gap-2">
                                   <span className="text-gray-500 font-medium w-20">Carga:</span>
                                   <span className="text-white font-semibold">{ex.weight}</span>
                               </div>
                           )}
                           {ex.muscleGroup && (
                               <div className="flex sm:hidden items-center gap-2">
                                   <span className="text-gray-500 font-medium w-20">Grupo:</span>
                                   <span className="text-white">{ex.muscleGroup}</span>
                               </div>
                           )}
                           {ex.notes ? (
                               <div className="flex flex-col gap-1 mt-1">
                                   <span className="text-gray-500 font-medium">Observações:</span>
                                   <p className="text-gray-200 bg-gray-800 p-2 rounded-lg border border-gray-700 text-xs md:text-sm leading-relaxed">
                                       {ex.notes}
                                   </p>
                               </div>
                           ) : (
                               <p className="text-gray-500 italic text-xs">Sem observações adicionais.</p>
                           )}
                      </div>
                  </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );

  const renderSearch = () => (
    <div className="flex flex-col h-full animate-fade-in">
        <div className="flex items-center gap-3 mb-4">
            <button onClick={resetAndGoBack} className="p-2 rounded-full hover:bg-gray-700 transition-colors">
                 <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6 text-gray-400">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" />
                </svg>
            </button>
            <input 
                type="text" 
                placeholder="Buscar exercício (ex: Supino)..." 
                value={searchTerm}
                onChange={(e) => handleSearch(e.target.value)}
                className="flex-grow bg-gray-800 text-white p-4 rounded-xl border border-gray-600 focus:ring-2 focus:ring-blue-500 outline-none text-lg"
                autoFocus
            />
        </div>

        <div className="flex-grow overflow-y-auto space-y-2 pb-4 pr-1 scrollbar-thin scrollbar-thumb-gray-600 max-h-[60vh]">
            {searchResults.map((ex, idx) => (
                <div 
                    key={idx} 
                    onClick={() => handleSelectExercise(ex)}
                    className="bg-gray-700/50 p-4 rounded-xl border border-gray-700 hover:bg-gray-700 cursor-pointer transition-all active:scale-[0.98] flex justify-between items-center"
                >
                    <span className="font-bold text-white text-lg">{ex.name}</span>
                    <span className="text-xs bg-gray-800 text-gray-400 px-2 py-1 rounded uppercase tracking-wider font-medium">{ex.muscleGroup}</span>
                </div>
            ))}
            
            {searchResults.length === 0 && searchTerm && (
                <div className="text-center py-8">
                    <p className="text-gray-400 mb-4">Nenhum exercício encontrado.</p>
                    <button 
                        onClick={handleCreateCustom}
                        className="bg-gray-700 hover:bg-gray-600 text-blue-400 px-6 py-3 rounded-lg font-medium transition-colors"
                    >
                        Criar "{searchTerm}" manualmente
                    </button>
                </div>
            )}
        </div>
    </div>
  );

  const renderForm = () => (
    <form onSubmit={handleSave} className="animate-fade-in flex flex-col h-full">
        <div className="mb-6 border-b border-gray-700 pb-4 flex items-center gap-2">
            <button type="button" onClick={() => setView('search')} className="mr-2 text-gray-400 hover:text-white">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" />
                </svg>
            </button>
            <h3 className="text-xl font-bold text-white">{editingId ? 'Editar Exercício' : 'Configurar Exercício'}</h3>
        </div>

        <div className="space-y-6 flex-grow overflow-y-auto pb-4 pr-1 custom-scrollbar">
            <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">Nome</label>
                <input 
                    type="text" 
                    value={formData.name} 
                    readOnly
                    className="w-full bg-gray-900 border border-gray-700 rounded-xl p-4 text-gray-300 text-lg focus:outline-none cursor-not-allowed font-semibold"
                />
            </div>

            <div className="grid grid-cols-3 gap-3">
                <div>
                    <label className="block text-sm font-medium text-gray-400 mb-2">Séries</label>
                    <input 
                        type="number" 
                        value={formData.sets} 
                        onChange={e => setFormData({...formData, sets: parseInt(e.target.value)})}
                        className="w-full bg-gray-800 border border-gray-600 rounded-xl p-4 text-white text-center focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-400 mb-2">Reps</label>
                    <input 
                        type="text" 
                        value={formData.reps} 
                        onChange={e => setFormData({...formData, reps: e.target.value})}
                        className="w-full bg-gray-800 border border-gray-600 rounded-xl p-4 text-white text-center focus:ring-2 focus:ring-blue-500 outline-none"
                        placeholder="Ex: 12"
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-400 mb-2">Descanso (s)</label>
                    <input 
                        type="number" 
                        value={formData.restTime} 
                        onChange={e => setFormData({...formData, restTime: e.target.value})}
                        className="w-full bg-gray-800 border border-gray-600 rounded-xl p-4 text-white text-center focus:ring-2 focus:ring-blue-500 outline-none"
                        placeholder="60"
                    />
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                 <div>
                    <label className="block text-sm font-medium text-gray-400 mb-2">Carga (Kg/Lbs)</label>
                    <input 
                        type="text" 
                        value={formData.weight} 
                        onChange={e => setFormData({...formData, weight: e.target.value})}
                        className="w-full bg-gray-800 border border-gray-600 rounded-xl p-4 text-white focus:ring-2 focus:ring-blue-500 outline-none"
                        placeholder="Opcional"
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-400 mb-2">Grupo Muscular</label>
                    <input 
                        type="text" 
                        value={formData.muscleGroup} 
                        readOnly
                        className="w-full bg-gray-900 border border-gray-700 rounded-xl p-4 text-gray-300 focus:outline-none cursor-not-allowed"
                        placeholder="Opcional"
                    />
                </div>
            </div>
             
             <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">Notas Adicionais</label>
                <textarea
                    value={formData.notes} 
                    onChange={e => setFormData({...formData, notes: e.target.value})}
                    className="w-full bg-gray-800 border border-gray-600 rounded-xl p-4 text-white focus:ring-2 focus:ring-blue-500 outline-none h-24 resize-none"
                    placeholder="Ex: Drop-set na última série..."
                />
            </div>
        </div>

        <div className="pt-4 mt-auto border-t border-gray-700 flex gap-4">
            <button type="button" onClick={resetAndGoBack} className="flex-1 py-4 bg-gray-700 hover:bg-gray-600 text-white rounded-xl font-bold transition-colors">
                Cancelar
            </button>
            <button type="submit" className="flex-1 py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold shadow-lg shadow-blue-900/50 transition-all active:scale-95">
                Salvar
            </button>
        </div>
    </form>
  );

  return (
    <div className="pb-6">
      {view === 'daily_list' && (
        <>
            <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
                <h2 className="text-2xl font-bold text-white">Planejador de Treinos</h2>
                <a 
                href="https://musclewiki.com/pt-br" 
                target="_blank" 
                rel="noopener noreferrer"
                className="bg-gray-800 hover:bg-gray-700 text-blue-400 px-4 py-2 rounded-lg text-sm font-bold transition-colors flex items-center gap-2 border border-gray-700"
                >
                <span>Consultar Wiki</span>
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
                </svg>
                </a>
            </div>

            {/* Navegação dos Dias */}
            <div className="flex overflow-x-auto gap-2 mb-6 pb-2 scrollbar-thin scrollbar-thumb-gray-600 -mx-4 px-4 md:mx-0 md:px-0">
                {days.map(day => (
                <button
                    key={day.id}
                    onClick={() => setActiveDay(day.id)}
                    className={`px-5 py-3 rounded-xl font-bold min-w-[70px] transition-all flex-shrink-0 ${
                    activeDay === day.id 
                        ? 'bg-blue-600 text-white scale-105 shadow-lg shadow-blue-900/40' 
                        : 'bg-gray-800 text-gray-400 hover:bg-gray-700 border border-gray-700'
                    }`}
                >
                    {day.label}
                </button>
                ))}
            </div>
        </>
      )}

      <div className="bg-gray-800 rounded-2xl p-4 md:p-6 shadow-2xl border border-gray-700/50 min-h-[60vh] flex flex-col relative overflow-hidden">
        {view === 'daily_list' && renderDailyList()}
        {view === 'search' && renderSearch()}
        {view === 'form' && renderForm()}
      </div>
    </div>
  );
};

export default WorkoutPlanner;
