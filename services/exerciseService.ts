
import { exerciseDatabase } from './exerciseDatabase';
import { ExerciseDatabaseItem } from '../types';

export const searchExercises = async (term: string): Promise<ExerciseDatabaseItem[]> => {
    if (!term) return exerciseDatabase;
    
    const lowerTerm = term.toLowerCase();
    return exerciseDatabase.filter(ex => 
        ex.name.toLowerCase().includes(lowerTerm) || 
        ex.muscleGroup.toLowerCase().includes(lowerTerm)
    );
};
