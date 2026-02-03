import React, { useState } from 'react';
import { Mail, Lock, AlertCircle, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../../../contexts/auth';

const Login = ({ onSwitchToRegister }) => {
  const { login, error } = useAuth();
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [localError, setLocalError] = useState('');

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    setLocalError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLocalError('');

    // Validações
    if (!formData.email || !formData.password) {
      setLocalError('Preencha todos os campos');
      return;
    }

    setLoading(true);

    const result = await login(formData.email, formData.password);

    if (!result.success) {
      setLocalError(result.error);
    }

    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-dark-500/10 to-purple-600 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-dark-600 text-white rounded-2xl mb-4">
            <span className="text-3xl font-bold">J</span>
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">JusCash</h1>
          <p className="text-gray-300">Gestão Jurídica Inteligente</p>
        </div>

        {/* Card de Login */}
        <div className="bg-background-tertiary rounded-2xl shadow-xl p-8">
          <h2 className="text-2xl font-bold text-white mb-6">Entrar na sua conta</h2>

          {/* Erro */}
          {(localError || error) && (
            <div className="mb-6 p-4 bg-red-25 border border-red-200 rounded-lg flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-300 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-400">{localError || error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-gray-200 mb-2">
                E-mail
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 w-5 h-5" />
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="seu@email.com"
                  className="w-full pl-10 pr-4 py-3 border border-surface-medium rounded-lg focus:ring-2 focus:ring-dark-500 focus:border-transparent transition text-gray-500"
                  disabled={loading}
                />
              </div>
            </div>

            {/* Senha */}
            <div>
              <label className="block text-sm font-medium text-gray-200 mb-2">
                Senha
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 w-5 h-5" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-12 py-3 border border-surface-medium rounded-lg focus:ring-2 focus:ring-dark-500 focus:border-transparent transition text-gray-500"
                  disabled={loading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-300"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {/* Esqueci a senha */}
            <div className="text-right">
              <button
                type="button"
                className="text-sm text-dark-600 hover:text-dark-700 font-medium"
              >
                Esqueci minha senha
              </button>
            </div>

            {/* Botão de Login */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-dark-600 text-white py-3 rounded-lg font-semibold hover:bg-dark-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Entrando...' : 'Entrar'}
            </button>
          </form>

          {/* Divider */}
          <div className="my-6 flex items-center">
            <div className="flex-1 border-t border-surface-medium"></div>
            <span className="px-4 text-sm text-gray-400">ou</span>
            <div className="flex-1 border-t border-surface-medium"></div>
          </div>

          {/* Link para Registro */}
          <p className="text-center text-gray-300">
            Não tem uma conta?{' '}
            <button
              onClick={onSwitchToRegister}
              className="text-dark-600 hover:text-dark-700 font-semibold"
            >
              Criar conta
            </button>
          </p>
        </div>

        {/* Footer */}
        <p className="text-center text-sm text-gray-400 mt-8">
          © 2025 JusCash. Todos os direitos reservados.
        </p>
      </div>
    </div>
  );
};

export default Login;