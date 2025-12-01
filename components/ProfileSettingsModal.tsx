
import React, { useState, useEffect } from 'react';
import { UserProfile } from '../types';
import { supabase } from '../supabaseClient';
import { PrinterIcon } from './Icons';

interface ProfileSettingsModalProps {
  initialProfile: UserProfile;
  onUpdateProfile: (updates: Partial<UserProfile>) => Promise<void>;
  onClose: () => void;
  onOpenReport: () => void;
}

const ProfileSettingsModal: React.FC<ProfileSettingsModalProps> = ({ initialProfile, onUpdateProfile, onClose, onOpenReport }) => {
  const [profile, setProfile] = useState<Partial<UserProfile>>({ ...initialProfile });
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  useEffect(() => {
    // Reset message when opening/closing or changing tabs conceptually
    setMessage(null);
  }, []);

  const handleProfileChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setProfile(prev => ({
      ...prev,
      [name]: ['weight', 'height', 'age', 'neck', 'waist', 'hip'].includes(name) ? parseFloat(value) : value,
    }));
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage(null);

    try {
        await onUpdateProfile(profile);
        setMessage({ type: 'success', text: 'Dados atualizados com sucesso!' });
        setTimeout(onClose, 1500);
    } catch (error) {
        setMessage({ type: 'error', text: 'Erro ao atualizar perfil.' });
    } finally {
        setIsLoading(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
      e.preventDefault();
      if (password !== confirmPassword) {
          setMessage({ type: 'error', text: 'As senhas não conferem.' });
          return;
      }
      if (password.length < 6) {
          setMessage({ type: 'error', text: 'A senha deve ter pelo menos 6 caracteres.' });
          return;
      }

      setIsLoading(true);
      setMessage(null);

      try {
          const { error } = await supabase.auth.updateUser({ password: password });
          if (error) throw error;
          setMessage({ type: 'success', text: 'Senha alterada com sucesso!' });
          setPassword('');
          setConfirmPassword('');
      } catch (error: any) {
          setMessage({ type: 'error', text: error.message || 'Erro ao alterar senha.' });
      } finally {
          setIsLoading(false);
      }
  };

  const formFields = [
    { name: 'name', label: 'Nome', type: 'text' },
    { name: 'weight', label: 'Peso Inicial (kg)', type: 'number' },
    { name: 'height', label: 'Altura (cm)', type: 'number' },
    { name: 'age', label: 'Idade', type: 'number' },
    { name: 'neck', label: 'Pescoço (cm)', type: 'number' },
    { name: 'waist', label: 'Cintura (cm)', type: 'number' },
  ];

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-gray-800 w-full max-w-2xl rounded-2xl border border-gray-700 shadow-2xl flex flex-col max-h-[90vh]" onClick={e => e.stopPropagation()}>
        <div className="p-4 sm:p-6 border-b border-gray-700 flex justify-between items-center bg-gray-800 rounded-t-2xl">
            <h2 className="text-xl font-bold text-white">Configurações do Perfil</h2>
            <button onClick={onClose} className="text-gray-400 hover:text-white p-2 rounded-full hover:bg-gray-700 transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                </svg>
            </button>
        </div>

        <div className="flex-grow overflow-y-auto p-4 sm:p-6 space-y-8 custom-scrollbar">
            {message && (
                <div className={`p-4 rounded-lg text-center ${message.type === 'success' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                    {message.text}
                </div>
            )}

            {/* Dados Cadastrais */}
            <form onSubmit={handleSaveProfile} className="space-y-4">
                <h3 className="text-lg font-semibold text-blue-400 border-b border-gray-700 pb-2 mb-4">Dados Cadastrais</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {formFields.map(field => (
                         <div key={field.name}>
                            <label className="block text-sm font-medium text-gray-400 mb-1">{field.label}</label>
                            <input
                                type={field.type}
                                name={field.name}
                                // @ts-ignore
                                value={profile[field.name]}
                                onChange={handleProfileChange}
                                className="w-full bg-gray-700 border border-gray-600 rounded-lg p-2.5 text-white focus:ring-2 focus:ring-blue-500 outline-none"
                            />
                        </div>
                    ))}
                     <div>
                        <label className="block text-sm font-medium text-gray-400 mb-1">Sexo</label>
                        <select
                            name="sex"
                            value={profile.sex}
                            onChange={handleProfileChange}
                            className="w-full bg-gray-700 border border-gray-600 rounded-lg p-2.5 text-white focus:ring-2 focus:ring-blue-500 outline-none"
                        >
                            <option value="male">Masculino</option>
                            <option value="female">Feminino</option>
                        </select>
                    </div>
                    {profile.sex === 'female' && (
                        <div>
                            <label className="block text-sm font-medium text-gray-400 mb-1">Quadril (cm)</label>
                            <input
                                type="number"
                                name="hip"
                                value={profile.hip}
                                onChange={handleProfileChange}
                                className="w-full bg-gray-700 border border-gray-600 rounded-lg p-2.5 text-white focus:ring-2 focus:ring-blue-500 outline-none"
                            />
                        </div>
                    )}
                     <div className="sm:col-span-2">
                        <label className="block text-sm font-medium text-gray-400 mb-1">Nível de Atividade</label>
                        <select
                            name="activityLevel"
                            value={profile.activityLevel}
                            onChange={handleProfileChange}
                            className="w-full bg-gray-700 border border-gray-600 rounded-lg p-2.5 text-white focus:ring-2 focus:ring-blue-500 outline-none"
                        >
                            <option value="sedentary">Sedentário</option>
                            <option value="light">Levemente Ativo</option>
                            <option value="moderate">Moderadamente Ativo</option>
                            <option value="active">Ativo</option>
                            <option value="very_active">Muito Ativo</option>
                        </select>
                    </div>
                     <div className="sm:col-span-2">
                        <label className="block text-sm font-medium text-gray-400 mb-1">Objetivo</label>
                        <select
                            name="goal"
                            value={profile.goal}
                            onChange={handleProfileChange}
                            className="w-full bg-gray-700 border border-gray-600 rounded-lg p-2.5 text-white focus:ring-2 focus:ring-blue-500 outline-none"
                        >
                            <option value="lose">Perder Peso</option>
                            <option value="maintain">Manter Peso</option>
                            <option value="gain">Ganhar Músculo</option>
                        </select>
                    </div>
                </div>
                <div className="flex justify-end pt-2">
                    <button type="submit" disabled={isLoading} className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 px-6 rounded-lg transition-colors disabled:opacity-50">
                        Salvar Alterações
                    </button>
                </div>
            </form>

            {/* Troca de Senha */}
            <form onSubmit={handleChangePassword} className="space-y-4 pt-4 border-t border-gray-700">
                <h3 className="text-lg font-semibold text-yellow-400 border-b border-gray-700 pb-2 mb-4">Segurança / Trocar Senha</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-400 mb-1">Nova Senha</label>
                        <input
                            type="password"
                            value={password}
                            onChange={e => setPassword(e.target.value)}
                            placeholder="Mínimo 6 caracteres"
                            className="w-full bg-gray-700 border border-gray-600 rounded-lg p-2.5 text-white focus:ring-2 focus:ring-yellow-500 outline-none"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-400 mb-1">Confirmar Nova Senha</label>
                        <input
                            type="password"
                            value={confirmPassword}
                            onChange={e => setConfirmPassword(e.target.value)}
                            placeholder="Repita a senha"
                            className="w-full bg-gray-700 border border-gray-600 rounded-lg p-2.5 text-white focus:ring-2 focus:ring-yellow-500 outline-none"
                        />
                    </div>
                </div>
                <div className="flex justify-end pt-2">
                     <button type="submit" disabled={isLoading || !password} className="bg-gray-700 hover:bg-gray-600 text-yellow-400 border border-gray-600 font-bold py-2.5 px-6 rounded-lg transition-colors disabled:opacity-50">
                        Atualizar Senha
                    </button>
                </div>
            </form>

            {/* Impressão de Relatório */}
            <div className="pt-4 border-t border-gray-700">
                <h3 className="text-lg font-semibold text-white border-b border-gray-700 pb-2 mb-4">Relatórios</h3>
                <div className="flex justify-between items-center p-4 bg-gray-700/30 rounded-lg border border-gray-600">
                    <div>
                        <p className="font-medium text-gray-200">Relatório de Progresso (ABNT)</p>
                        <p className="text-sm text-gray-400">Gere um documento formatado com seus dados, evolução e cálculos.</p>
                    </div>
                    <button 
                        onClick={onOpenReport}
                        className="flex items-center gap-2 bg-gray-200 hover:bg-white text-gray-900 font-bold py-2.5 px-4 rounded-lg transition-colors"
                    >
                        <PrinterIcon className="w-5 h-5" />
                        Imprimir
                    </button>
                </div>
            </div>
        </div>
      </div>
    </div>
  );
};

export default ProfileSettingsModal;
