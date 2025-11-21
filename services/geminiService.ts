
import { GeminiChatResponse } from '../types';

// A funcionalidade de IA foi totalmente desativada para permitir o funcionamento sem API KEY.
// As funções abaixo são stubs (mocks) seguros que retornam valores vazios para não quebrar a UI.

export const getChatResponse = async (
    prompt: string, 
    base64Image: string | null,
    isThinkingMode: boolean
): Promise<GeminiChatResponse> => {
    // Simula um pequeno delay para UX, mas retorna aviso de desativação
    await new Promise(resolve => setTimeout(resolve, 500));
    
    return {
        queryType: 'general',
        foods: [],
        text: "O módulo de Inteligência Artificial está desativado nesta versão (Modo Offline/Sem Chave)."
    };
};

export const textToSpeech = async (text: string): Promise<Uint8Array | null> => {
    return null;
};
