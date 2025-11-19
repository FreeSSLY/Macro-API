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
        <>
            <div className="flex items-center gap-2 mb-4">
                <input
                    type="text"
                    placeholder="Buscar alimento..."
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    className="w-full bg-gray-700 p-2 rounded-md"
                    autoFocus
                />
                <button onClick={() => setView('create')} className="flex-shrink-0 bg-gray-600 hover:bg-gray-500 text-white font-semibold py-2 px-3 rounded-lg transition-colors text-sm">
                    Novo
                </button>
            </div>
            <ul ref={listContainerRef} onScroll={handleScroll} className="flex-grow overflow-y-auto space-y-2 pr-2">
                 {error && (
                    <li className="p-4 text-center text-red-400 bg-red-500/10 rounded-lg">
                        <p className="font-semibold">Ocorreu um Erro</p>
                        <p className="text-sm mt-1">{error}</p>
                    </li>
                )}
                 {!error && displayedFoods.map(food => (
                    <li key={food.id} onClick={() => handleSelectFood(food)} className="p-3 bg-gray-700 rounded-lg cursor-pointer hover:bg-gray-600 transition-colors">
                        <p className="font-medium">{food.name}</p>
                        <p className="text-xs text-gray-400">{food.calories} kcal por {food.servingSize}{food.servingUnit} ({food.unitName})</p>
                    </li>
                ))}
                {isLoading && <li className="p-3 text-center text-gray-400">Carregando...</li>}
                {!error && !hasMore && !searchTerm && <li className="p-3 text-center text-xs text-gray-500">Fim da lista.</li>}
                {!error && debouncedSearchTerm && displayedFoods.length === 0 && !isLoading && <p className="text-gray-400 text-center py-4">Nenhum alimento encontrado.</p>}
            </ul>
        </>
    );
    
    const renderCreate = () => (
        <form onSubmit={handleCreateFoodSubmit} className="flex-grow flex flex-col space-y-3 overflow-y-auto pr-2">
            <h4 className="text-lg font-semibold text-center mb-2">Criar Novo Alimento</h4>
            {error && <p className="text-red-400 bg-red-500/10 p-2 rounded-md text-sm text-center">{error}</p>}
            <div>
                <label className="text-sm font-medium">Nome do Alimento</label>
                <input type="text" name="name" value={newFoodData.name} onChange={handleCreateFoodChange} className="w-full bg-gray-700 p-2 rounded-md mt-1" required autoFocus />
            </div>
            
            <div className="border-t border-gray-700 pt-3">
                <h5 className="text-sm font-semibold text-center mb-3 text-gray-400">Definição da Porção (Obrigatório)</h5>
                <div className="grid grid-cols-2 gap-3">
                    <div>
                        <label className="text-sm font-medium">Nome da Unidade</label>
                        <input
                            type="text"
                            name="unitName"
                            placeholder="Ex: Fatia, Unidade"
                            value={newFoodData.unitName}
                            onChange={handleCreateFoodChange}
                            className="w-full bg-gray-700 p-2 rounded-md mt-1"
                            required
                        />
                    </div>
                    <div>
                        <label className="text-sm font-medium">Quantidade em gramas (g)</label>
                        <input
                            type="number"
                            step="0.1"
                            name="servingSize"
                            placeholder="Ex: 25"
                            value={newFoodData.servingSize}
                            onChange={handleCreateFoodChange}
                            className="w-full bg-gray-700 p-2 rounded-md mt-1"
                            required
                        />
                    </div>
                </div>
            </div>

            <p className="text-xs text-gray-400 text-center pt-2">Insira os valores nutricionais para a porção informada acima</p>
            <div className="grid grid-cols-2 gap-3">
                <div>
                    <label className="text-sm font-medium">Calorias (kcal)</label>
                    <input type="number" name="calories" value={newFoodData.calories} onChange={handleCreateFoodChange} className="w-full bg-gray-700 p-2 rounded-md mt-1" required />
                </div>
                 <div>
                    <label className="text-sm font-medium">Proteínas (g)</label>
                    <input type="number" step="0.1" name="protein" value={newFoodData.protein} onChange={handleCreateFoodChange} className="w-full bg-gray-700 p-2 rounded-md mt-1" required />
                </div>
                 <div>
                    <label className="text-sm font-medium">Carboidratos (g)</label>
                    <input type="number" step="0.1" name="carbs" value={newFoodData.carbs} onChange={handleCreateFoodChange} className="w-full bg-gray-700 p-2 rounded-md mt-1" required />
                </div>
                 <div>
                    <label className="text-sm font-medium">Gorduras (g)</label>
                    <input type="number" step="0.1" name="fat" value={newFoodData.fat} onChange={handleCreateFoodChange} className="w-full bg-gray-700 p-2 rounded-md mt-1" required />
                </div>
            </div>

             <div className="flex justify-end gap-3 pt-4">
                 <button type="button" onClick={() => { setView('search'); setError(null); }} className="px-4 py-2 rounded-md bg-gray-600 hover:bg-gray-500">Voltar</button>
                 <button type="submit" disabled={isSubmitting} className="px-6 py-2 rounded-md bg-blue-600 hover:bg-blue-700 disabled:bg-gray-500">
                    {isSubmitting ? 'Salvando...' : 'Salvar e Selecionar'}
                 </button>
             </div>
        </form>
    );

    const renderQuantity = () => {
         const unitOptions = ['unidade', 'g'];
         if (selectedFood?.mlToGRatio) unitOptions.splice(1, 0, 'ml');

        return (
            <div className="flex-grow flex flex-col items-center py-4">
                <h4 className="text-2xl font-bold mb-2 text-center">{selectedFood!.name}</h4>
                <p className="text-gray-400 mb-4 text-center text-sm">
                    Macros por porção de {selectedFood!.servingSize}g ({selectedFood!.unitName || 'porção'}): 
                    P: {selectedFood!.protein}g, C: {selectedFood!.carbs}g, F: {selectedFood!.fat}g
                </p>
                
                <div className="flex items-center justify-center gap-2 my-4">
                    {unitOptions.map(unit => (
                        <button
                            key={unit}
                            onClick={() => setSelectedUnit(unit as any)}
                            className={`px-4 py-2 rounded-full text-sm font-semibold transition-colors ${
                                selectedUnit === unit ? 'bg-blue-600 text-white' : 'bg-gray-600 text-gray-300 hover:bg-gray-500'
                            }`}
                        >
                            {unit === 'unidade' ? selectedFood!.unitName || 'unidade' : unit}
                        </button>
                    ))}
                </div>

                <div className="w-full max-w-xs mt-4">
                     <label className="block text-sm font-medium text-gray-300 text-center">
                        Quantidade ({selectedUnit === 'unidade' ? selectedFood!.unitName || 'unidade' : selectedUnit})
                     </label>
                     <input
                        type="number"
                        value={quantity}
                        onChange={e => setQuantity(parseFloat(e.target.value) || 0)}
                        className="mt-1 w-full bg-gray-700 p-3 text-center text-xl rounded-md"
                        autoFocus
                        onFocus={(e) => e.target.select()}
                     />
                </div>

                <div className="w-full max-w-md bg-gray-700/50 p-4 rounded-lg mt-6">
                    <h5 className="text-center font-bold text-lg mb-3">Valores Nutricionais Calculados</h5>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-center">
                        <div>
                            <p className="text-xs text-gray-400">Calorias</p>
                            <p className="text-xl font-bold text-blue-400">{calculatedMacros.calories} <span className="text-sm">kcal</span></p>
                        </div>
                        <div>
                            <p className="text-xs text-gray-400">Proteínas</p>
                            <p className="text-xl font-bold text-red-400">{calculatedMacros.protein} <span className="text-sm">g</span></p>
                        </div>
                        <div>
                            <p className="text-xs text-gray-400">Carbs</p>
                            <p className="text-xl font-bold text-green-400">{calculatedMacros.carbs} <span className="text-sm">g</span></p>
                        </div>
                        <div>
                            <p className="text-xs text-gray-400">Gorduras</p>
                            <p className="text-xl font-bold text-yellow-400">{calculatedMacros.fat} <span className="text-sm">g</span></p>
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
                        <div className="w-8 h-8 border-2 border-blue-400 border-dashed rounded-full animate-spin mx-auto"></div>
                        <p className="mt-2 text-gray-400">Carregando dados do alimento...</p>
                    </div>
                </div>
            );
        }
        if (selectedFood) {
            return renderQuantity();
        }
        if (view === 'create') {
            return renderCreate();
        }
        return renderSearch();
    };
    
    const renderFooter = () => {
        if (selectedFood) {
             return (
                 <div className="flex justify-end gap-3 mt-6 border-t border-gray-700 pt-4">
                     <button onClick={onClose} className="px-4 py-2 rounded-md bg-gray-600 hover:bg-gray-500">Cancelar</button>
                    <button onClick={() => { setSelectedFood(null); setSearchTerm(''); }} className="px-4 py-2 rounded-md bg-gray-600 hover:bg-gray-500">Voltar à Busca</button>
                    <button onClick={handleSaveFood} className="px-6 py-2 rounded-md bg-blue-600 hover:bg-blue-700">
                        {foodToEdit ? 'Salvar Alterações' : 'Adicionar'}
                    </button>
                </div>
             );
        }
        if (view === 'create') {
            return null; // The form has its own footer buttons
        }
        // Search view footer
        return (
            <div className="flex justify-end gap-3 mt-6 border-t border-gray-700 pt-4">
                <button onClick={onClose} className="px-4 py-2 rounded-md bg-gray-600 hover:bg-gray-500">Fechar</button>
            </div>
        );
    }
    
    return (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4" onClick={onClose}>
            <div className="bg-gray-800 rounded-xl p-6 w-full max-w-lg border border-gray-700 flex flex-col h-[600px]" onClick={e => e.stopPropagation()}>
                <h3 className="text-xl font-bold mb-4">
                    {selectedFood ? (foodToEdit ? "Editar Alimento" : "Adicionar Alimento") : (view === 'create' ? 'Adicionar Novo Alimento' : 'Buscar Alimento')}
                </h3>
                {renderContent()}
                {renderFooter()}
            </div>
        </div>
    );
};

export default AddFoodModal;
