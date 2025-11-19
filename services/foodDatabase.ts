import { FoodDatabaseItem } from '../types';

// FIX: Renamed all snake_case properties to camelCase to match the FoodDatabaseItem type.
export const foodDatabase: FoodDatabaseItem[] = [
  // Carnes e Aves
  { name: 'Frango (Peito, Grelhado)', calories: 165, protein: 31, carbs: 0, fat: 3.6, servingUnit: 'g', servingSize: 100 },
  { name: 'Carne Bovina (Patinho, Grelhado)', calories: 219, protein: 36, carbs: 0, fat: 7.5, servingUnit: 'g', servingSize: 100 },
  { name: 'Carne Bovina (Filé Mignon, Grelhado)', calories: 271, protein: 30, carbs: 0, fat: 16.5, servingUnit: 'g', servingSize: 100 },
  { name: 'Carne de Porco (Lombo, Assado)', calories: 143, protein: 26, carbs: 0, fat: 3.5, servingUnit: 'g', servingSize: 100 },
  { name: 'Salmão (Grelhado)', calories: 208, protein: 20, carbs: 0, fat: 13, servingUnit: 'g', servingSize: 100 },
  { name: 'Tilápia (Assada)', calories: 128, protein: 26, carbs: 0, fat: 2.6, servingUnit: 'g', servingSize: 100 },
  { name: 'Atum (em Água)', calories: 116, protein: 26, carbs: 0, fat: 0.8, servingUnit: 'g', servingSize: 100 },
  
  // Ovos e Laticínios
  { name: 'Ovo (Cozido)', calories: 155, protein: 13, carbs: 1.1, fat: 11, servingUnit: 'g', servingSize: 100, unitName: 'unidade', unitToGRatio: 55 },
  { name: 'Clara de Ovo', calories: 52, protein: 11, carbs: 0.7, fat: 0.2, servingUnit: 'g', servingSize: 100 },
  { name: 'Leite Integral', calories: 61, protein: 3.2, carbs: 4.8, fat: 3.3, servingUnit: 'g', servingSize: 100, mlToGRatio: 1.03 },
  { name: 'Iogurte Grego (Natural)', calories: 59, protein: 10, carbs: 3.6, fat: 0.4, servingUnit: 'g', servingSize: 100 },
  { name: 'Queijo Cottage', calories: 98, protein: 11, carbs: 3.4, fat: 4.3, servingUnit: 'g', servingSize: 100 },
  { name: 'Queijo Mussarela', calories: 280, protein: 22, carbs: 2.2, fat: 20, servingUnit: 'g', servingSize: 100, unitName: 'fatia', unitToGRatio: 25 },
  { name: 'Queijo Minas Frescal', calories: 264, protein: 17, carbs: 1.2, fat: 20, servingUnit: 'g', servingSize: 100 },

  // Carboidratos
  { name: 'Arroz Branco (Cozido)', calories: 130, protein: 2.7, carbs: 28, fat: 0.3, servingUnit: 'g', servingSize: 100 },
  { name: 'Arroz Integral (Cozido)', calories: 111, protein: 2.6, carbs: 23, fat: 0.9, servingUnit: 'g', servingSize: 100 },
  { name: 'Batata Doce (Cozida)', calories: 86, protein: 1.6, carbs: 20, fat: 0.1, servingUnit: 'g', servingSize: 100 },
  { name: 'Batata Inglesa (Assada)', calories: 93, protein: 2.5, carbs: 21, fat: 0.1, servingUnit: 'g', servingSize: 100 },
  { name: 'Mandioca (Aipim/Macaxeira, Cozida)', calories: 160, protein: 1.4, carbs: 38, fat: 0.3, servingUnit: 'g', servingSize: 100 },
  { name: 'Aveia em Flocos', calories: 389, protein: 17, carbs: 66, fat: 7, servingUnit: 'g', servingSize: 100 },
  { name: 'Pão Francês', calories: 289, protein: 9.4, carbs: 58, fat: 2.2, servingUnit: 'g', servingSize: 100, unitName: 'unidade', unitToGRatio: 50 },
  { name: 'Pão Integral', calories: 247, protein: 13, carbs: 41, fat: 4.2, servingUnit: 'g', servingSize: 100, unitName: 'fatia', unitToGRatio: 25 },
  { name: 'Macarrão (Cozido)', calories: 131, protein: 5, carbs: 25, fat: 1.1, servingUnit: 'g', servingSize: 100 },
  { name: 'Tapioca (Goma)', calories: 240, protein: 0, carbs: 59, fat: 0, servingUnit: 'g', servingSize: 100 },
  
  // Leguminosas
  { name: 'Feijão Carioca (Cozido)', calories: 76, protein: 5, carbs: 14, fat: 0.5, servingUnit: 'g', servingSize: 100 },
  { name: 'Feijão Preto (Cozido)', calories: 132, protein: 8.9, carbs: 24, fat: 0.5, servingUnit: 'g', servingSize: 100 },
  { name: 'Lentilha (Cozida)', calories: 116, protein: 9, carbs: 20, fat: 0.4, servingUnit: 'g', servingSize: 100 },
  { name: 'Grão de Bico (Cozido)', calories: 164, protein: 8.9, carbs: 27, fat: 2.6, servingUnit: 'g', servingSize: 100 },

  // Frutas
  { name: 'Banana', calories: 89, protein: 1.1, carbs: 23, fat: 0.3, servingUnit: 'g', servingSize: 100, unitName: 'unidade', unitToGRatio: 120 },
  { name: 'Maçã', calories: 52, protein: 0.3, carbs: 14, fat: 0.2, servingUnit: 'g', servingSize: 100, unitName: 'unidade', unitToGRatio: 180 },
  { name: 'Laranja', calories: 47, protein: 0.9, carbs: 12, fat: 0.1, servingUnit: 'g', servingSize: 100, unitName: 'unidade', unitToGRatio: 150 },
  { name: 'Mamão', calories: 43, protein: 0.5, carbs: 11, fat: 0.3, servingUnit: 'g', servingSize: 100 },
  { name: 'Manga', calories: 60, protein: 0.8, carbs: 15, fat: 0.4, servingUnit: 'g', servingSize: 100 },
  { name: 'Abacate', calories: 160, protein: 2, carbs: 9, fat: 15, servingUnit: 'g', servingSize: 100 },
  { name: 'Morango', calories: 32, protein: 0.7, carbs: 8, fat: 0.3, servingUnit: 'g', servingSize: 100 },
  { name: 'Uva', calories: 69, protein: 0.7, carbs: 18, fat: 0.2, servingUnit: 'g', servingSize: 100 },

  // Verduras e Legumes
  { name: 'Brócolis (Cozido)', calories: 34, protein: 2.8, carbs: 7, fat: 0.4, servingUnit: 'g', servingSize: 100 },
  { name: 'Couve-flor (Cozida)', calories: 25, protein: 1.9, carbs: 5, fat: 0.3, servingUnit: 'g', servingSize: 100 },
  { name: 'Cenoura (Crua)', calories: 41, protein: 0.9, carbs: 10, fat: 0.2, servingUnit: 'g', servingSize: 100 },
  { name: 'Alface', calories: 15, protein: 1.4, carbs: 2.9, fat: 0.2, servingUnit: 'g', servingSize: 100 },
  { name: 'Tomate', calories: 18, protein: 0.9, carbs: 3.9, fat: 0.2, servingUnit: 'g', servingSize: 100, unitName: 'unidade', unitToGRatio: 120 },
  { name: 'Espinafre (Cozido)', calories: 23, protein: 3, carbs: 3.6, fat: 0.3, servingUnit: 'g', servingSize: 100 },
  { name: 'Abobrinha (Cozida)', calories: 17, protein: 1.2, carbs: 3.1, fat: 0.3, servingUnit: 'g', servingSize: 100 },
  { name: 'Beterraba (Cozida)', calories: 44, protein: 1.7, carbs: 10, fat: 0.2, servingUnit: 'g', servingSize: 100 },
  
  // Gorduras e Oleaginosas
  { name: 'Azeite de Oliva Extra Virgem', calories: 884, protein: 0, carbs: 0, fat: 100, servingUnit: 'g', servingSize: 100, mlToGRatio: 0.92 },
  { name: 'Castanha do Pará', calories: 656, protein: 14, carbs: 12, fat: 66, servingUnit: 'g', servingSize: 100, unitName: 'unidade', unitToGRatio: 5 },
  { name: 'Amêndoas', calories: 579, protein: 21, carbs: 22, fat: 49, servingUnit: 'g', servingSize: 100 },
  { name: 'Amendoim', calories: 567, protein: 26, carbs: 16, fat: 49, servingUnit: 'g', servingSize: 100 },
  { name: 'Pasta de Amendoim Integral', calories: 588, protein: 25, carbs: 20, fat: 50, servingUnit: 'g', servingSize: 100 },
  
  // Suplementos
  { name: 'Whey Protein (Concentrado)', calories: 400, protein: 80, carbs: 5, fat: 7, servingUnit: 'g', servingSize: 100 },
  { name: 'Creatina', calories: 0, protein: 0, carbs: 0, fat: 0, servingUnit: 'g', servingSize: 100 },
];