export interface UserProfile {
  id?: string;
  name: string;
  weight: number;
  height: number;
  age: number;
  sex: 'male' | 'female';
  activityLevel: 'sedentary' | 'light' | 'moderate' | 'active' | 'very_active';
  goal: 'lose' | 'maintain' | 'gain';
  neck: number;
  waist: number;
  hip: number; // Required for female body fat calculation
  currentWeight?: number;
  customGoals?: MacroGoals | null;
}

export interface FoodItem {
  id: string;
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  // Fields for editing functionality
  baseFoodName?: string;
  grams?: number;
}

export interface DailyLog {
  foods: FoodItem[];
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

export interface MacroGoals {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

export interface DetailedNutritionalInfo {
  foodName: string;
  servingSize: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  vitamins: { name: string; amount: string }[];
  minerals: { name: string; amount: string }[];
}

export interface Message {
  id: string;
  text: string;
  sender: 'user' | 'ai';
  image?: string;
  isLoading?: boolean;
  detailedInfo?: DetailedNutritionalInfo;
}

export interface GeminiChatResponse {
  queryType: 'log' | 'info' | 'both' | 'general';
  foods: Omit<FoodItem, 'id'>[];
  detailedInfo?: DetailedNutritionalInfo;
  text: string;
}


export interface BodyCompositionLog {
  date: string;
  weight: number;
  neck: number;
  waist: number;
  hip: number;
  lbm: number;
  fatPercentage: number;
}

export interface FoodDatabaseItem {
  id?: number;
  name: string;
  calories: number; // por servingSize
  protein: number;  // por servingSize
  carbs: number;    // por servingSize
  fat: number;      // por servingSize
  servingUnit: 'g'; // a unidade do servingSize é sempre 'g'
  servingSize: number; // o tamanho da porção em gramas
  mlToGRatio?: number; // ex: para leite, 1ml é ~1.03g
  unitName?: string; // ex: 'unidade', 'fatia'
  unitToGRatio?: number; // ex: para um ovo, são ~55g. Deve ser igual ao servingSize se unitName for definido.
}