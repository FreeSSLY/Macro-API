import React, { useState, useRef, useEffect } from 'react';
import { Message, DetailedNutritionalInfo, FoodItem } from '../types';
import * as geminiService from '../services/geminiService';
import { ImageIcon, MicIcon, SendIcon, SparkleIcon, ThinkingIcon, VolumeIcon, StopIcon } from './Icons';
import NutritionalInfoCard from './NutritionalInfoCard';

interface ChatbotProps {
  // FIX: The type of `onFoodAdd`'s parameter was incorrect. It should be `Omit<FoodItem, 'id'>[]` to match the data from the gemini service.
  onFoodAdd: (foods: Omit<FoodItem, 'id'>[]) => void;
}

// Helper function to decode raw PCM audio data from the Gemini API.
async function decodeAudioData(
  data: Uint8Array,
  ctx: AudioContext,
  sampleRate: number,
  numChannels: number,
): Promise<AudioBuffer> {
  // Fix: Corrected Int18Array to Int16Array for 16-bit audio data.
  const dataInt16 = new Int16Array(data.buffer);
  const frameCount = dataInt16.length / numChannels;
  const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);

  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) {
      channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
    }
  }
  return buffer;
}


const Chatbot: React.FC<ChatbotProps> = ({ onFoodAdd }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [image, setImage] = useState<string | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isThinkingMode, setIsThinkingMode] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const recognitionRef = useRef<any | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onloadend = () => {
        setImage(reader.result as string);
        setImagePreview(URL.createObjectURL(file));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() && !image) return;

    const userMessage: Message = { id: crypto.randomUUID(), text: input, sender: 'user', image: imagePreview || undefined };
    setMessages(prev => [...prev, userMessage]);
    
    const aiMessageId = crypto.randomUUID();
    const aiLoadingMessage: Message = { id: aiMessageId, text: '', sender: 'ai', isLoading: true };
    setMessages(prev => [...prev, aiLoadingMessage]);

    setInput('');
    setImage(null);
    setImagePreview(null);

    try {
      const response = await geminiService.getChatResponse(input, image, isThinkingMode);

      if (response.foods && response.foods.length > 0) {
        // FIX: This call now matches the updated prop type.
        onFoodAdd(response.foods);
      }
      
      updateAiMessage(aiMessageId, response.text || 'Desculpe, não consegui processar isso.', response.detailedInfo);

    } catch (error) {
      console.error(error);
      updateAiMessage(aiMessageId, 'Ocorreu um erro. Por favor, tente novamente.');
    }
  };

  const updateAiMessage = (id: string, text: string, detailedInfo?: DetailedNutritionalInfo) => {
    setMessages(prev => prev.map(msg => msg.id === id ? { ...msg, text, isLoading: false, detailedInfo } : msg));
  };

  const handleMicClick = () => {
    if (isRecording) {
      recognitionRef.current?.stop();
      setIsRecording(false);
      return;
    }

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Reconhecimento de fala não é suportado neste navegador.");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = 'pt-BR';
    recognition.interimResults = true;
    recognitionRef.current = recognition;

    recognition.onstart = () => setIsRecording(true);
    recognition.onend = () => setIsRecording(false);
    recognition.onerror = (event: any) => {
        console.error("Erro no reconhecimento de fala", event.error);
        if (event.error === 'not-allowed') {
            alert("A permissão do microfone foi negada. Por favor, habilite o acesso nas configurações do seu navegador para usar esta funcionalidade.");
        }
        setIsRecording(false);
    }
    
    recognition.onresult = (event: any) => {
      let finalTranscript = '';
      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          finalTranscript += event.results[i][0].transcript;
        }
      }
      if(finalTranscript) {
          setInput(prev => (prev + ' ' + finalTranscript).trim());
      }
    };

    recognition.start();
  };

  const playAudio = async (text: string) => {
    try {
        const audioData = await geminiService.textToSpeech(text);
        if (audioData) {
            const AudioContext = (window as any).AudioContext || (window as any).webkitAudioContext;
            const audioContext = new AudioContext({sampleRate: 24000});
            const audioBuffer = await decodeAudioData(
              audioData,
              audioContext,
              24000,
              1,
            );
            const source = audioContext.createBufferSource();
            source.buffer = audioBuffer;
            source.connect(audioContext.destination);
            source.start(0);
        }
    } catch (error) {
        console.error("Erro ao tocar áudio:", error);
        alert("Falha ao tocar o áudio.");
    }
  };

  return (
    <div className="flex flex-col h-[50vh] bg-gray-800 rounded-xl border border-gray-700">
      <div className="flex-grow p-4 overflow-y-auto">
        {messages.map((msg, index) => (
          <div key={index} className={`flex items-end gap-2 mb-4 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
            {msg.sender === 'ai' && <SparkleIcon className="w-6 h-6 text-blue-400 mb-1 flex-shrink-0" />}
            <div className={`max-w-xs md:max-w-md p-3 rounded-2xl ${msg.sender === 'user' ? 'bg-blue-600 text-white rounded-br-none' : 'bg-gray-700 text-gray-200 rounded-bl-none'}`}>
              {msg.isLoading ? (
                <div className="flex items-center justify-center space-x-2">
                    <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
                    <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse delay-75"></div>
                    <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse delay-150"></div>
                </div>
              ) : (
                <>
                  {msg.image && <img src={msg.image} alt="user upload" className="rounded-lg mb-2" />}
                  
                  {msg.text && <p className="whitespace-pre-wrap mb-2">{msg.text}</p>}

                  {msg.detailedInfo && <NutritionalInfoCard info={msg.detailedInfo} />}
                  
                  {msg.sender === 'ai' && msg.text && (
                    <button onClick={() => playAudio(msg.text)} className="mt-2 text-blue-400 hover:text-blue-300" title="Ouvir áudio">
                      <VolumeIcon className="w-4 h-4" />
                    </button>
                  )}
                </>
              )}
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {imagePreview && (
        <div className="p-2 px-4">
            <div className="relative inline-block">
                <img src={imagePreview} alt="preview" className="h-20 w-20 object-cover rounded-lg" />
                <button onClick={() => { setImage(null); setImagePreview(null); }} className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 leading-none h-5 w-5 flex items-center justify-center">&times;</button>
            </div>
        </div>
      )}

      <form onSubmit={handleSendMessage} className="p-4 border-t border-gray-700 flex items-center gap-2">
        <label htmlFor="image-upload" className="p-2 text-gray-400 hover:text-white cursor-pointer rounded-full hover:bg-gray-600 transition-colors" title="Enviar Imagem">
          <ImageIcon className="w-6 h-6" />
        </label>
        <input id="image-upload" type="file" accept="image/*" className="hidden" onChange={handleImageChange} />
        
        <button type="button" onClick={handleMicClick} className={`p-2 rounded-full transition-colors ${isRecording ? 'text-red-500 bg-red-500/20' : 'text-gray-400 hover:text-white hover:bg-gray-600'}`} title={isRecording ? "Parar Gravação" : "Gravar Áudio"}>
          {isRecording ? <StopIcon className="w-6 h-6"/> : <MicIcon className="w-6 h-6" />}
        </button>

        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Adicione comida ou faça uma pergunta..."
          className="flex-grow bg-gray-700 rounded-full py-2 px-4 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />

        <button type="button" onClick={() => setIsThinkingMode(!isThinkingMode)} className={`p-2 rounded-full transition-colors ${isThinkingMode ? 'text-purple-400 bg-purple-500/20' : 'text-gray-400 hover:text-white hover:bg-gray-600'}`} title="Alternar Modo de Raciocínio Profundo">
            <ThinkingIcon className="w-6 h-6"/>
        </button>

        <button type="submit" className="bg-blue-600 text-white p-2 rounded-full hover:bg-blue-700 transition-colors disabled:bg-gray-500" disabled={!input.trim() && !image}>
          <SendIcon className="w-6 h-6" />
        </button>
      </form>
    </div>
  );
};

export default Chatbot;