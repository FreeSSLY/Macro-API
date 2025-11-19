
import { GeminiChatResponse } from '../types';

// A funcionalidade de IA foi desativada para permitir o funcionamento sem API KEY.
// As funções abaixo são stubs (mocks) para manter a integridade da tipagem.

export const getChatResponse = async (
    prompt: string, 
    base64Image: string | null,
    isThinkingMode: boolean
): Promise<GeminiChatResponse> => {
    // Retorna uma resposta padrão indicando que a IA está desligada
    return {
        queryType: 'general',
        foods: [],
        text: "O módulo de Inteligência Artificial está desativado nesta versão."
    };
};

export const textToSpeech = async (text: string): Promise<Uint8Array | null> => {
    return null;
};
