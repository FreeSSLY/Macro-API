import { supabase } from '../supabaseClient';
import { UserProfile, DailyLog, BodyCompositionLog } from '../types';

// UTILITY FUNCTIONS for case conversion
const toCamel = (s: string) => s.replace(/([-_][a-z])/ig, ($1) => $1.toUpperCase().replace('-', '').replace('_', ''));
const toSnake = (s: string) => s.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);

const isObject = (o: any) => o === Object(o) && !Array.isArray(o) && typeof o !== 'function';

const keysToCamel = (o: any): any => {
  if (isObject(o)) {
    const n: { [key: string]: any } = {};
    Object.keys(o).forEach((k) => {
      n[toCamel(k)] = keysToCamel(o[k]);
    });
    return n;
  } else if (Array.isArray(o)) {
    return o.map((i) => keysToCamel(i));
  }
  return o;
};

const keysToSnake = (o: any): any => {
  if (isObject(o)) {
    const n: { [key: string]: any } = {};
    Object.keys(o).forEach((k) => {
      n[toSnake(k)] = keysToSnake(o[k]);
    });
    return n;
  } else if (Array.isArray(o)) {
    return o.map((i) => keysToSnake(i));
  }
  return o;
};

// PROFILE FUNCTIONS
export const getProfile = async (userId: string): Promise<UserProfile | null> => {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();

  if (error && error.code !== 'PGRST116') { // PGRST116 = no rows found
    console.error('Error fetching profile:', error.message);
    return null;
  }
  return data ? keysToCamel(data) : null;
};

export const createProfile = async (userId: string, profileData: Omit<UserProfile, 'id'>): Promise<UserProfile | null> => {
    const profileToInsert = {
        ...profileData,
        id: userId,
        currentWeight: profileData.weight, // Set initial current_weight
    };
    const { data, error } = await supabase
        .from('profiles')
        .insert(keysToSnake(profileToInsert))
        .select()
        .single();
    
    if (error) {
        console.error('Error creating profile:', error.message);
        return null;
    }
    return data ? keysToCamel(data) : null;
};

export const updateProfile = async (userId: string, updates: Partial<UserProfile>): Promise<UserProfile | null> => {
    const { data, error } = await supabase
        .from('profiles')
        .update(keysToSnake(updates))
        .eq('id', userId)
        .select()
        .single();
    
    if (error) {
        console.error('Error updating profile:', error.message);
        return null;
    }
    return data ? keysToCamel(data) : null;
};

// DAILY LOG FUNCTIONS
export const getLogs = async (userId: string): Promise<Record<string, DailyLog>> => {
    const { data, error } = await supabase
        .from('daily_logs')
        .select('date, foods, calories, protein, carbs, fat')
        .eq('user_id', userId);
    
    if (error) {
        console.error('Error fetching logs:', error.message);
        return {};
    }

    return data.reduce((acc, log) => {
        acc[log.date] = {
            foods: log.foods,
            calories: log.calories,
            protein: log.protein,
            carbs: log.carbs,
            fat: log.fat,
        };
        return acc;
    }, {} as Record<string, DailyLog>);
};

export const upsertLog = async (userId: string, date: string, logData: DailyLog) => {
    const { error } = await supabase
        .from('daily_logs')
        .upsert({ user_id: userId, date, ...logData }, { onConflict: 'user_id,date' });
    
    if (error) {
        console.error('Error upserting log:', error.message);
    }
};

// BODY COMPOSITION HISTORY FUNCTIONS
export const getHistory = async (userId: string): Promise<BodyCompositionLog[]> => {
    const { data, error } = await supabase
        .from('body_composition_history')
        .select('*')
        .eq('user_id', userId)
        .order('date', { ascending: true });
        
    if (error) {
        console.error('Error fetching history:', error.message);
        return [];
    }
    return keysToCamel(data);
};

export const upsertHistory = async (userId: string, historyEntry: BodyCompositionLog) => {
    const entryToUpsert = { ...historyEntry, user_id: userId };
    const { error } = await supabase
        .from('body_composition_history')
        .upsert(keysToSnake(entryToUpsert), { onConflict: 'user_id,date' });
        
    if (error) {
        console.error('Error upserting history entry:', error.message);
    }
};

// MIGRATION FUNCTION
export const migrateFromLocalStorage = async (userId: string): Promise<boolean> => {
    try {
        const localProfile = localStorage.getItem('user-profile');
        if (!localProfile) return false;

        console.log("Starting migration from localStorage for user:", userId);

        const profile: UserProfile = JSON.parse(localProfile);
        const completeProfile: Omit<UserProfile, 'id'> = {
            name: profile.name || 'Usuário Migrado',
            weight: profile.weight || 0,
            height: profile.height || 0,
            age: profile.age || 0,
            sex: profile.sex || 'male',
            activityLevel: profile.activityLevel || 'sedentary',
            goal: profile.goal || 'maintain',
            neck: profile.neck || 0,
            waist: profile.waist || 0,
            hip: profile.hip || 0,
        };
        await createProfile(userId, completeProfile);

        const localLogs = localStorage.getItem('daily-logs');
        if (localLogs) {
            const logs: Record<string, DailyLog> = JSON.parse(localLogs);
            for (const date in logs) {
                await upsertLog(userId, date, logs[date]);
            }
        }

        const localHistory = localStorage.getItem('body-comp-history');
        if (localHistory) {
            const history: BodyCompositionLog[] = JSON.parse(localHistory);
            for (const entry of history) {
                await upsertHistory(userId, entry);
            }
        }
        
        const localCustomGoals = localStorage.getItem('custom-macro-goals');
        const localCurrentWeight = localStorage.getItem('current-weight');
        const updates: Partial<UserProfile> = {};
        if (localCustomGoals) updates.customGoals = JSON.parse(localCustomGoals);
        if (localCurrentWeight) updates.currentWeight = JSON.parse(localCurrentWeight);
        if (Object.keys(updates).length > 0) {
            await updateProfile(userId, updates);
        }

        // Clear local storage after successful migration
        localStorage.removeItem('user-profile');
        localStorage.removeItem('daily-logs');
        localStorage.removeItem('body-comp-history');
        localStorage.removeItem('custom-macro-goals');
        localStorage.removeItem('current-weight');
        
        console.log("Migration successful.");
        return true;

    } catch (error: any) {
        console.error("Migration failed:", error.message);
        return false;
    }
};