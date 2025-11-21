
import { UserProfile } from '../types';

const activityMultipliers: Record<UserProfile['activityLevel'], number> = {
  sedentary: 1.2,
  light: 1.375,
  moderate: 1.55,
  active: 1.725,
  very_active: 1.9,
};

// Equação de Harris-Benedict para BMR
export const calculateBMR = (profile: UserProfile): number => {
  if (profile.sex === 'male') {
    return 88.362 + (13.397 * profile.weight) + (4.799 * profile.height) - (5.677 * profile.age);
  } else {
    return 447.593 + (9.247 * profile.weight) + (3.098 * profile.height) - (4.330 * profile.age);
  }
};

export const calculateTDEE = (profile: UserProfile): number => {
  const bmr = calculateBMR(profile);
  const multiplier = activityMultipliers[profile.activityLevel];
  const tdee = bmr * multiplier;

  switch (profile.goal) {
    case 'lose':
      return tdee - 500; // Déficit calórico
    case 'gain':
      return tdee + 500; // Superávit calórico
    case 'maintain':
    default:
      return tdee;
  }
};

// Fórmula da Marinha dos EUA para Gordura Corporal
export const calculateBodyComposition = (profile: UserProfile): { lbm: number; fatPercentage: number } => {
  let fatPercentage = 0;
  
  if (profile.sex === 'male') {
      const waistNeckLog = Math.log10(profile.waist - profile.neck);
      const heightLog = Math.log10(profile.height);
      if (waistNeckLog > 0 && heightLog > 0) {
        fatPercentage = 86.010 * waistNeckLog - 70.041 * heightLog + 36.76;
      }
  } else {
      const waistHipNeckLog = Math.log10(profile.waist + profile.hip - profile.neck);
      const heightLog = Math.log10(profile.height);
      if (waistHipNeckLog > 0 && heightLog > 0) {
        fatPercentage = 163.205 * waistHipNeckLog - 97.684 * heightLog - 78.387;
      }
  }

  fatPercentage = Math.max(0, fatPercentage); // Garante que não seja negativo
  const fatMass = profile.weight * (fatPercentage / 100);
  const lbm = profile.weight - fatMass;

  return { lbm: parseFloat(lbm.toFixed(2)), fatPercentage: parseFloat(fatPercentage.toFixed(2)) };
};
