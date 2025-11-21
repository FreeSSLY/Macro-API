import React, { useState } from 'react';
import { supabase } from '../supabaseClient';
import { LogoIcon } from './Icons';

const Auth: React.FC = () => {
  const [isLoginView, setIsLoginView] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAuthAction = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      let response;
      if (isLoginView) {
        response = await supabase.auth.signInWithPassword({ email, password });
      } else {
        response = await supabase.auth.signUp({ email, password });
      }
      if (response.error) {
        throw response.error;
      }
      if(!isLoginView) {
        alert("Cadastro realizado! Verifique seu e-mail para confirmar a conta.")
      }
    } catch (err: any) {
      setError(err.error_description || err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-sm bg-gray-800 p-8 rounded-2xl shadow-lg border border-gray-700">
        <div className="flex flex-col items-center mb-6">
          <LogoIcon className="w-16 h-16 text-blue-500 mb-3" />
          <h1 className="text-3xl font-bold text-white">Macro Tracker AI</h1>
          <p className="text-gray-400 mt-1">{isLoginView ? 'Faça login para continuar' : 'Crie sua conta'}</p>
        </div>
        
        {error && <p className="bg-red-500/20 text-red-400 text-center p-3 rounded-md mb-4 text-sm">{error}</p>}

        <form onSubmit={handleAuthAction} className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-300">Email</label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 block w-full bg-gray-700 border border-gray-600 rounded-md shadow-sm py-2 px-3 text-white focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              required
            />
          </div>
          <div>
            <label htmlFor="password"className="block text-sm font-medium text-gray-300">Senha</label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 block w-full bg-gray-700 border border-gray-600 rounded-md shadow-sm py-2 px-3 text-white focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              required
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-lg transition duration-300 ease-in-out transform hover:scale-105 mt-6 disabled:bg-gray-500 disabled:scale-100"
          >
            {loading ? 'Carregando...' : (isLoginView ? 'Entrar' : 'Cadastrar')}
          </button>
        </form>

        <p className="text-center text-sm text-gray-400 mt-6">
          {isLoginView ? 'Não tem uma conta?' : 'Já tem uma conta?'}
          <button onClick={() => { setIsLoginView(!isLoginView); setError(null); }} className="font-medium text-blue-500 hover:text-blue-400 ml-1">
            {isLoginView ? 'Cadastre-se' : 'Faça login'}
          </button>
        </p>
      </div>
    </div>
  );
};

export default Auth;
