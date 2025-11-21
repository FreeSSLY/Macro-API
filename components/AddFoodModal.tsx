
import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import * as foodService from '../services/foodService';
import { FoodDatabaseItem, FoodItem } from '../types';

interface AddFoodModalProps {
    onClose: () => void;
    onSave: (food: Omit<FoodItem, 'id' | 'baseFoodName' | 'grams'>, idToUpdate?: string) => void;
    foodToEdit: FoodItem | null;
}

const useDebounce = (value: string, delay: number) => {
    const [debouncedValue, setDebouncedValue] = useState(value);
    useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedValue(value);
        }, delay);
        return () => {
            clearTimeout(handler);
        };
    }, [value, delay]);
    return debouncedValue;
};


const AddFoodModal: React.FC<AddFoodModalProps> = ({ onClose, onSave, foodToEdit }) => {
    const [view, setView] = useState<'search' | 'create'>('search');
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedFood, setSelectedFood] = useState<FoodDatabaseItem | null>(null);
    const [quantity, setQuantity] = useState(100);
    const [selectedUnit, setSelectedUnit] = useState<'g' | 'ml' | 'unidade'>('g');
    const [calculatedMacros, setCalculatedMacros] = useState({ calories: 0, protein: 0, carbs: 0, fat: 0 });
    
    // Create food state - use strings for better input control
    const [newFoodData, setNewFoodData] = useState({
        name: '',
        calories: '',
        protein: '',
        carbs: '',
        fat: '',
        unitName: '',
        servingSize: '',
    });
    const [isSubmitting, setIsSubmitting] = useState(false);

    // State for async data fetching
    const [displayedFoods, setDisplayedFoods] = useState<FoodDatabaseItem[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [page, setPage] = useState(0);
    const [hasMore, setHasMore] = useState(true);
    const [error, setError] = useState<string | null>(null);
    
    const listContainerRef = useRef<HTMLUListElement>(null);
    const debouncedSearchTerm = useDebounce(searchTerm, 300);

    const loadMoreFoods = useCallback(async () => {
        if (isLoading || !hasMore) return;
        setIsLoading(true);
        setError(null);
        try {
            const nextPage = page + 1;
            const newFoods = await foodService.getFoods(nextPage);
            if (newFoods.length > 0) {
                setDisplayedFoods(prev => [...prev, ...newFoods]);
                setPage(nextPage);
            } else {
                setHasMore(false);
            }
        } catch (err: any) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    }, [isLoading, hasMore, page]);
    
    useEffect(() => {
        const fetchData = async (isSearch: boolean) => {
            setIsLoading(true);
            setError(null);
            setPage(0); // Reset page for new search/initial load
            try {
                if (isSearch) {
                    const results = await foodService.searchFoods(debouncedSearchTerm);
                    setDisplayedFoods(results);
                    setHasMore(false);
                } else {
                    const initialFoods = await foodService.getFoods(0);
                    setDisplayedFoods(initialFoods);
                    setHasMore(initialFoods.length > 0);
                }
            } catch (err: any) {
                setError(err.message);
                setDisplayedFoods([]);
            } finally {
                setIsLoading(false);
            }
        };
        // Only fetch if not in create mode and a food isn't already selected (for editing)
        if(view === 'search' && !selectedFood){
            if (!debouncedSearchTerm) {
                fetchData(false);
            } else {
                fetchData(true);
            }
        }
    }, [debouncedSearchTerm, view, selectedFood]);


    useEffect(() => {
        if (foodToEdit) {
            const fetchAndSetEditingFood = async () => {
                // If baseFoodName is missing, we can't reliably edit. Fallback to search.
                if (!foodToEdit.baseFoodName) {
                    const cleanedName = foodToEdit.name.replace(/\s*\([^)]*\)/, '').trim();
                    setSearchTerm(cleanedName);
                    return;
                }

                setIsLoading(true);
                setError(null);
                try {
                    const baseFood = await foodService.getFoodByName(foodToEdit.baseFoodName);
                    if (baseFood) {
                        setSelectedFood(baseFood);
                        
                        // Parsing logic from foodToEdit.name, e.g., "Banana (1unidade)"
                        const match = foodToEdit.name.match(/\((\d+\.?\d*)\s*([^)]+)\)$/);
                        let qty = 1;
                        let unit: 'g' | 'ml' | 'unidade' = 'g';

                        if (match) {
                            qty = parseFloat(match[1]);
                            const unitStr = match[2].toLowerCase();

                            if (unitStr === 'g') {
                                unit = 'g';
                            } else if (unitStr === 'ml') {
                                unit = 'ml';
                            } else {
                                // Assumes any other unit string (like 'unidade', 'fatia', etc.) corresponds to the 'unidade' type.
                                unit = 'unidade';
                            }
                        } else if (foodToEdit.grams) {
                            // Fallback to grams if parsing name fails
                            qty = foodToEdit.grams;
                            unit = 'g';
                        }
                        
                        setQuantity(qty);
                        setSelectedUnit(unit);
                    } else {
                        // Base food not found in DB, fallback to search view with the name.
                        setError(`Alimento base "${foodToEdit.baseFoodName}" não encontrado. Buscando na lista...`);
                        setSearchTerm(foodToEdit.baseFoodName);
                    }
                } catch (err: any) {
                    setError(err.message);
                    setSearchTerm(foodToEdit.baseFoodName);
                } finally {
                    setIsLoading(false);
                }
            };
            fetchAndSetEditingFood();
        }
    }, [foodToEdit]);

    
    useEffect(() => {
        if (!selectedFood || isNaN(quantity) || quantity < 0) {
            setCalculatedMacros({ calories: 0, protein: 0, carbs: 0, fat: 0 });
            return;
        }

        // Prevent division by zero if servingSize is somehow 0
        const servingSizeInGrams = selectedFood.servingSize > 0 ? selectedFood.servingSize : 100;

        const caloriesPerGram = selectedFood.calories / servingSizeInGrams;
        const proteinPerGram = selectedFood.protein / servingSizeInGrams;
        const carbsPerGram = selectedFood.carbs / servingSizeInGrams;
        const fatPerGram = selectedFood.fat / servingSizeInGrams;

        let totalGrams = 0;
        if (selectedUnit === 'g') {
            totalGrams = quantity;
        } else if (selectedUnit === 'ml' && selectedFood.mlToGRatio) {
            totalGrams = quantity * selectedFood.mlToGRatio;
        } else if (selectedUnit === 'unidade' && selectedFood.unitToGRatio) {
            // unitToGRatio should be equal to servingSize for new foods.
            // This will also work for old foods like 'Ovo' which has unitToGRatio: 55
            totalGrams = quantity * selectedFood.unitToGRatio;
        } else {
            // Fallback for items that may not have a unitToGRatio but have a unitName (e.g. from db)
             totalGrams = quantity * servingSizeInGrams;
        }
        
        setCalculatedMacros({
            calories: Math.round(caloriesPerGram * totalGrams),
            protein: parseFloat((proteinPerGram * totalGrams).toFixed(1)),
            carbs: parseFloat((carbsPerGram * totalGrams).toFixed(1)),
            fat: parseFloat((fatPerGram * totalGrams).toFixed(1)),
        });

    }, [selectedFood, quantity, selectedUnit]);

    const handleScroll = () => {
        if (searchTerm) return;
        const container = listContainerRef.current;
        if (container) {
            const { scrollTop, scrollHeight, clientHeight } = container;
            if (scrollHeight - scrollTop - clientHeight < 200) { 
                loadMoreFoods();
            }
        }
    };
    
    const handleCreateFoodChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setNewFoodData(prev => ({
            ...prev,
            [name]: value,
        }));
    };

    const handleCreateFoodSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        const name = newFoodData.name.trim();
        const calories = parseFloat(newFoodData.calories);
        const unitName = newFoodData.unitName.trim();
        const servingSize = parseFloat(newFoodData.servingSize);

        if (!name || !unitName || isNaN(calories) || calories <= 0 || isNaN(servingSize) || servingSize <= 0) {
            alert("Por favor, preencha todos os campos do formulário com valores válidos e maiores que zero.");
            return;
        }

        setIsSubmitting(true);
        setError(null);
        try {
            const foodPayload: Omit<FoodDatabaseItem, 'id' | 'servingUnit'> = {
                name,
                calories,
                protein: parseFloat(newFoodData.protein) || 0,
                carbs: parseFloat(newFoodData.carbs) || 0,
                fat: parseFloat(newFoodData.fat) || 0,
                unitName,
                servingSize,
                unitToGRatio: servingSize, // For compatibility
            };

            const createdFood = await foodService.addFoodToDatabase(foodPayload);
            alert("Alimento criado com sucesso!");
            handleSelectFood(createdFood); // Automatically select the new food
            setView('search'); // Go back to the main flow
        } catch (err: any) {
            setError(err.message);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleSaveFood = () => {
        if (!selectedFood || isNaN(quantity) || quantity <= 0) {
            alert("Selecione um alimento e insira uma quantidade válida.");
            return;
        }

        let finalGrams = 0;
        if (selectedUnit === 'g') {
            finalGrams = quantity;
        } else if (selectedUnit === 'ml' && selectedFood.mlToGRatio) {
            finalGrams = quantity * selectedFood.mlToGRatio;
        } else if (selectedUnit === 'unidade' && (selectedFood.unitToGRatio || selectedFood.servingSize)) {
             finalGrams = quantity * (selectedFood.unitToGRatio || selectedFood.servingSize);
        }

        const unitLabel = selectedUnit === 'unidade' ? (selectedFood.unitName || 'un') : selectedUnit;
        const formattedQuantity = Number(quantity.toFixed(1)); // Clean up decimals
        const foodName = `${selectedFood.name} (${formattedQuantity}${unitLabel})`;

        const newFood: Omit<FoodItem, 'id'> = {
            name: foodName,
            ...calculatedMacros,
            baseFoodName: selectedFood.name,
            grams: Math.round(finalGrams),
        };

        onSave(newFood, foodToEdit?.id);
        onClose();
    };
    
    const handleSelectFood = (food: FoodDatabaseItem) => {
        setSelectedFood(food);
    };
    
    const renderSearch = () => (
        <div className="flex flex-col h-full">
            <div className="flex items-center gap-2 mb-4 flex-shrink-0">
                <input
                    type="text"
                    placeholder="Buscar alimento..."
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    className="w-full bg-gray-700 text-white p-3 rounded-lg border border-gray-600 focus:ring-2 focus:ring-blue-500 outline-none"
                    autoFocus
                />
                <button onClick={() => setView('create')} className="flex-shrink-0 bg-gray-700 hover:bg-gray-600 text-white font-medium py-3 px-4 rounded-lg transition-colors text-sm whitespace-nowrap border border-gray-600">
                    + Novo
                </button>
            </div>
            <ul ref={listContainerRef} onScroll={handleScroll} className="flex-grow overflow-y-auto space-y-2 pr-1 scrollbar-thin scrollbar-thumb-gray-600">
                 {error && (
                    <li className="p-4 text-center text-red-400 bg-red-500/10 rounded-lg border border-red-500/20">
                        <p className="font-semibold">Ocorreu um Erro</p>
                        <p className="text-sm mt-1">{error}</p>
                    </li>
                )}
                 {!error && displayedFoods.map(food => (
                    <li key={food.id} onClick={() => handleSelectFood(food)} className="p-4 bg-gray-700/50 rounded-xl cursor-pointer hover:bg-gray-700 active:bg-gray-600 transition-colors border border-gray-700">
                        <div className="flex justify-between items-center">
                            <div>
                                <p className="font-medium text-white">{food.name}</p>
                                <p className="text-xs text-gray-400 mt-1">Porção ref: {food.servingSize}{food.servingUnit} ({food.unitName})</p>
                            </div>
                            <span className="text-blue-400 font-bold text-sm">{Math.round(food.calories)} kcal</span>
                        </div>
                    </li>
                ))}
                {isLoading && <li className="p-4 text-center text-gray-400 animate-pulse">Carregando alimentos...</li>}
                {!error && !hasMore && !searchTerm && <li className="p-4 text-center text-xs text-gray-500">Fim da lista.</li>}
                {!error && debouncedSearchTerm && displayedFoods.length === 0 && !isLoading && (
                    <div className="text-center py-8">
                        <p className="text-gray-400 mb-2">Não encontramos "{searchTerm}"</p>
                        <button onClick={() => setView('create')} className="text-blue-400 hover:underline font-medium">
                            Criar este alimento manualmente
                        </button>
                    </div>
                )}
            </ul>
        </div>
    );
    
    const renderCreate = () => (
        <form onSubmit={handleCreateFoodSubmit} className="flex-grow flex flex-col space-y-4 overflow-y-auto pr-1 pb-2">
            <h4 className="text-lg font-semibold text-center text-white flex-shrink-0">Criar Novo Alimento</h4>
            {error && <p className="text-red-400 bg-red-500/10 p-3 rounded-lg text-sm text-center border border-red-500/20">{error}</p>}
            
            <div className="space-y-4 flex-grow">
                <div>
                    <label className="text-sm font-medium text-gray-300">Nome do Alimento</label>
                    <input type="text" name="name" value={newFoodData.name} onChange={handleCreateFoodChange} className="w-full bg-gray-700 text-white p-3 rounded-lg mt-1 border border-gray-600 focus:ring-2 focus:ring-blue-500 outline-none" required autoFocus placeholder="Ex: Pão Caseiro" />
                </div>
                
                <div className="bg-gray-700/30 p-4 rounded-xl border border-gray-700">
                    <h5 className="text-sm font-semibold mb-3 text-blue-400 uppercase tracking-wider">Definição da Porção</h5>
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="text-xs text-gray-400 block mb-1">Unidade (Ex: Fatia)</label>
                            <input
                                type="text"
                                name="unitName"
                                placeholder="Ex: Fatia"
                                value={newFoodData.unitName}
                                onChange={handleCreateFoodChange}
                                className="w-full bg-gray-700 text-white p-3 rounded-lg border border-gray-600 focus:ring-blue-500 outline-none"
                                required
                            />
                        </div>
                        <div>
                            <label className="text-xs text-gray-400 block mb-1">Peso em Gramas</label>
                            <input
                                type="number"
                                step="0.1"
                                name="servingSize"
                                placeholder="Ex: 30"
                                value={newFoodData.servingSize}
                                onChange={handleCreateFoodChange}
                                className="w-full bg-gray-700 text-white p-3 rounded-lg border border-gray-600 focus:ring-blue-500 outline-none"
                                required
                            />
                        </div>
                    </div>
                </div>

                <div className="bg-gray-700/30 p-4 rounded-xl border border-gray-700">
                    <h5 className="text-sm font-semibold mb-3 text-green-400 uppercase tracking-wider">Macros (por porção)</h5>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="text-xs text-gray-400 block mb-1">Calorias (kcal)</label>
                            <input type="number" name="calories" value={newFoodData.calories} onChange={handleCreateFoodChange} className="w-full bg-gray-700 text-white p-3 rounded-lg border border-gray-600 focus:ring-blue-500 outline-none" required />
                        </div>
                        <div>
                            <label className="text-xs text-gray-400 block mb-1">Proteínas (g)</label>
                            <input type="number" step="0.1" name="protein" value={newFoodData.protein} onChange={handleCreateFoodChange} className="w-full bg-gray-700 text-white p-3 rounded-lg border border-gray-600 focus:ring-blue-500 outline-none" required />
                        </div>
                        <div>
                            <label className="text-xs text-gray-400 block mb-1">Carboidratos (g)</label>
                            <input type="number" step="0.1" name="carbs" value={newFoodData.carbs} onChange={handleCreateFoodChange} className="w-full bg-gray-700 text-white p-3 rounded-lg border border-gray-600 focus:ring-blue-500 outline-none" required />
                        </div>
                        <div>
                            <label className="text-xs text-gray-400 block mb-1">Gorduras (g)</label>
                            <input type="number" step="0.1" name="fat" value={newFoodData.fat} onChange={handleCreateFoodChange} className="w-full bg-gray-700 text-white p-3 rounded-lg border border-gray-600 focus:ring-blue-500 outline-none" required />
                        </div>
                    </div>
                </div>
            </div>

             <div className="flex flex-col-reverse sm:flex-row justify-end gap-3 pt-2 mt-auto border-t border-gray-700 pt-4 flex-shrink-0">
                 <button type="button" onClick={() => { setView('search'); setError(null); }} className="w-full sm:w-auto px-4 py-3 rounded-lg bg-gray-700 hover:bg-gray-600 text-white font-medium transition-colors">Voltar</button>
                 <button type="submit" disabled={isSubmitting} className="w-full sm:w-auto px-6 py-3 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold transition-colors disabled:bg-gray-600 disabled:opacity-50">
                    {isSubmitting ? 'Salvando...' : 'Salvar Alimento'}
                 </button>
             </div>
        </form>
    );

    const renderQuantity = () => {
         const unitOptions = ['unidade', 'g'];
         if (selectedFood?.mlToGRatio) unitOptions.splice(1, 0, 'ml');

        return (
            <div className="flex-grow flex flex-col items-center overflow-y-auto pr-1">
                <div className="text-center mb-6 flex-shrink-0">
                    <h4 className="text-2xl font-bold text-white mb-1">{selectedFood!.name}</h4>
                    <div className="inline-block bg-gray-700/50 rounded-full px-3 py-1 text-xs text-gray-400 border border-gray-700">
                        Base: {selectedFood!.servingSize}g ({selectedFood!.unitName || 'porção'})
                    </div>
                </div>
                
                {/* Seletor de Unidade - Mobile Friendly */}
                <div className="flex flex-wrap justify-center gap-2 mb-6 w-full flex-shrink-0">
                    {unitOptions.map(unit => (
                        <button
                            key={unit}
                            onClick={() => setSelectedUnit(unit as any)}
                            className={`px-4 py-3 rounded-lg text-sm font-semibold transition-all flex-1 sm:flex-none min-w-[80px] ${
                                selectedUnit === unit 
                                ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/50 ring-2 ring-blue-400 ring-offset-2 ring-offset-gray-800' 
                                : 'bg-gray-700 text-gray-300 hover:bg-gray-600 border border-gray-600'
                            }`}
                        >
                            {unit === 'unidade' ? (selectedFood!.unitName || 'unidade') : unit}
                        </button>
                    ))}
                </div>

                <div className="w-full max-w-xs mb-8 flex-shrink-0">
                     <label className="block text-sm font-medium text-gray-300 text-center mb-2">
                        Quantidade ({selectedUnit === 'unidade' ? selectedFood!.unitName || 'unidade' : selectedUnit})
                     </label>
                     <div className="relative">
                        <input
                            type="number"
                            value={quantity}
                            onChange={e => setQuantity(parseFloat(e.target.value) || 0)}
                            className="w-full bg-gray-700 text-white p-4 text-center text-3xl font-bold rounded-2xl border border-gray-600 focus:ring-4 focus:ring-blue-500/30 focus:border-blue-500 outline-none transition-all"
                            autoFocus
                            onFocus={(e) => e.target.select()}
                        />
                     </div>
                </div>

                <div className="w-full bg-gray-700/30 p-5 rounded-2xl border border-gray-700 mb-4 flex-shrink-0">
                    <h5 className="text-center font-medium text-gray-400 text-sm mb-4 uppercase tracking-wide">Resumo Nutricional</h5>
                    <div className="grid grid-cols-4 gap-2 text-center">
                        <div className="bg-gray-800/80 p-2 rounded-lg">
                            <p className="text-xs text-gray-500 mb-1">Calorias</p>
                            <p className="text-lg sm:text-xl font-bold text-blue-400 leading-none">{calculatedMacros.calories}</p>
                            <span className="text-[10px] text-gray-600">kcal</span>
                        </div>
                        <div className="bg-gray-800/80 p-2 rounded-lg">
                            <p className="text-xs text-gray-500 mb-1">Prot</p>
                            <p className="text-lg sm:text-xl font-bold text-red-400 leading-none">{calculatedMacros.protein}</p>
                            <span className="text-[10px] text-gray-600">g</span>
                        </div>
                        <div className="bg-gray-800/80 p-2 rounded-lg">
                            <p className="text-xs text-gray-500 mb-1">Carb</p>
                            <p className="text-lg sm:text-xl font-bold text-green-400 leading-none">{calculatedMacros.carbs}</p>
                            <span className="text-[10px] text-gray-600">g</span>
                        </div>
                        <div className="bg-gray-800/80 p-2 rounded-lg">
                            <p className="text-xs text-gray-500 mb-1">Gord</p>
                            <p className="text-lg sm:text-xl font-bold text-yellow-400 leading-none">{calculatedMacros.fat}</p>
                            <span className="text-[10px] text-gray-600">g</span>
                        </div>
                    </div>
                </div>
            </div>
        );
    };
    
    const renderContent = () => {
        if (isLoading && foodToEdit && !selectedFood) {
            return (
                <div className="flex-grow flex items-center justify-center">
                    <div className="text-center">
                        <div className="w-10 h-10 border-4 border-blue-500 border-dashed rounded-full animate-spin mx-auto mb-3"></div>
                        <p className="text-gray-400 animate-pulse">Buscando dados...</p>
                    </div>
                </div>
            );
        }
        if (selectedFood) {
            return renderQuantity();
        }
        if (view === 'create') {
            return renderCreate(); // The create view manages its own layout/scroll
        }
        return renderSearch();
    };
    
    const renderFooter = () => {
        if (selectedFood) {
             return (
                 <div className="flex flex-row items-center gap-3 mt-auto pt-4 border-t border-gray-700 flex-shrink-0">
                    <button 
                        onClick={() => { setSelectedFood(null); setSearchTerm(''); }} 
                        className="p-3 rounded-lg bg-gray-700 hover:bg-gray-600 text-white transition-colors flex-shrink-0"
                        title="Voltar"
                    >
                         <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" />
                        </svg>
                    </button>
                    <button 
                        onClick={handleSaveFood} 
                        className="flex-grow py-3 px-6 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold shadow-lg shadow-blue-900/50 transition-all transform active:scale-95"
                    >
                        {foodToEdit ? 'Salvar' : 'Adicionar'}
                    </button>
                </div>
             );
        }
        if (view === 'create') {
            return null; // The form has its own footer buttons
        }
        // Search view - botão fechar removido pois agora temos o X no topo
        return null; 
    }
    
    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={onClose}>
            {/* Modal centralizado com margens visíveis (p-4 no pai) e altura fixa de 80vh no mobile */}
            <div 
                className="bg-gray-800 w-full max-w-lg h-[80vh] sm:h-[600px] rounded-2xl border border-gray-700 flex flex-col shadow-2xl overflow-hidden" 
                onClick={e => e.stopPropagation()}
            >
                <div className="p-4 sm:p-6 border-b border-gray-700 bg-gray-800 z-10 flex-shrink-0 flex justify-between items-center">
                     <h3 className="text-xl font-bold text-white truncate">
                        {selectedFood ? (foodToEdit ? "Editar Alimento" : "Adicionar Quantidade") : (view === 'create' ? 'Cadastro Manual' : 'Buscar Alimento')}
                    </h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-white p-2 rounded-full hover:bg-gray-700 transition-colors">
                         <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>
                
                <div className="flex-grow overflow-hidden flex flex-col p-4 sm:p-6 bg-gray-800">
                    {renderContent()}
                    {renderFooter()}
                </div>
            </div>
        </div>
    );
};

export default AddFoodModal;
