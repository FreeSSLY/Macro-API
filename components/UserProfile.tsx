import React, { useState } from 'react';
import { UserProfile as UserProfileType } from '../types';
import { LogoIcon } from './Icons';

interface UserProfileProps {
  onSave: (profile: Omit<UserProfileType, 'id'>) => void;
}

const UserProfile: React.FC<UserProfileProps> = ({ onSave }) => {
  const [profile, setProfile] = useState<Omit<UserProfileType, 'id'>>({
    name: '',
    weight: 70,
    height: 175,
    age: 25,
    sex: 'male',
    activityLevel: 'moderate',
    goal: 'maintain',
    neck: 38,
    waist: 85,
    hip: 95,
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setProfile(prev => ({
      ...prev,
      [name]: ['weight', 'height', 'age', 'neck', 'waist', 'hip'].includes(name) ? parseFloat(value) : value,
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (profile.name.trim() === '') {
        alert("Por favor, insira seu nome.");
        return;
    }
    onSave(profile);
  };

  const formFields = [
    { name: 'name', label: 'Nome', type: 'text', placeholder: 'Ex: Alex' },
    { name: 'weight', label: 'Peso (kg)', type: 'number' },
    { name: 'height', label: 'Altura (cm)', type: 'number' },
    { name: 'age', label: 'Idade', type: 'number' },
    { name: 'neck', label: 'Pescoço (cm)', type: 'number' },
    { name: 'waist', label: 'Cintura (cm)', type: 'number' },
  ];

  const selectFields = [
    { name: 'sex', label: 'Sexo', options: [{value: 'male', label: 'Masculino'}, {value: 'female', label: 'Feminino'}] },
    { name: 'activityLevel', label: 'Nível de Atividade', options: [
        {value: 'sedentary', label: 'Sedentário'}, {value: 'light', label: 'Levemente Ativo'}, {value: 'moderate', label: 'Moderadamente Ativo'}, {value: 'active', label: 'Ativo'}, {value: 'very_active', label: 'Muito Ativo'}
    ]},
    { name: 'goal', label: 'Objetivo', options: [{value: 'lose', label: 'Perder Peso'}, {value: 'maintain', label: 'Manter Peso'}, {value: 'gain', label: 'Ganhar Músculo'}] },
  ];

  return (
    <div className="min-h-screen bg-gray-900 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md bg-gray-800 p-8 rounded-2xl shadow-lg border border-gray-700">
        <div className="flex flex-col items-center mb-6">
          <LogoIcon className="w-16 h-16 text-blue-500 mb-3" />
          <h1 className="text-3xl font-bold text-white">Último Passo!</h1>
          <p className="text-gray-400 mt-1">Complete seu perfil para personalizarmos sua experiência.</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          {formFields.map(field => (
             <div key={field.name}>
                <label htmlFor={field.name} className="block text-sm font-medium text-gray-300">{field.label}</label>
                <input
                    type={field.type}
                    id={field.name}
                    name={field.name}
                    // FIX: The type assertion for the key was too broad and included object types not suitable for an input's `value` prop. It's now correctly narrowed.
                    value={profile[field.name as keyof Omit<UserProfileType, 'id' | 'sex'|'activityLevel'|'goal'|'customGoals'>]}
                    onChange={handleChange}
                    placeholder={field.placeholder}
                    className="mt-1 block w-full bg-gray-700 border border-gray-600 rounded-md shadow-sm py-2 px-3 text-white focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    required
                />
            </div>
          ))}
          {profile.sex === 'female' && (
            <div>
                <label htmlFor="hip" className="block text-sm font-medium text-gray-300">Quadril (cm)</label>
                <input
                    type="number"
                    id="hip"
                    name="hip"
                    value={profile.hip}
                    onChange={handleChange}
                    className="mt-1 block w-full bg-gray-700 border border-gray-600 rounded-md shadow-sm py-2 px-3 text-white focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    required
                />
            </div>
          )}
          {selectFields.map(field => (
            <div key={field.name}>
              <label htmlFor={field.name} className="block text-sm font-medium text-gray-300">{field.label}</label>
              <select
                id={field.name}
                name={field.name}
                value={profile[field.name as keyof Pick<UserProfileType, 'sex'|'activityLevel'|'goal'>]}
                onChange={handleChange}
                className="mt-1 block w-full bg-gray-700 border border-gray-600 rounded-md shadow-sm py-2 px-3 text-white focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              >
                {field.options.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
              </select>
            </div>
          ))}
          <button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-lg transition duration-300 ease-in-out transform hover:scale-105 mt-6">
            Salvar Perfil e Começar
          </button>
        </form>
      </div>
    </div>
  );
};

export default UserProfile;