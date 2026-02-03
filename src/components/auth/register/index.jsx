import React, { useState } from 'react';
import { Mail, Lock, User, Phone, Briefcase, AlertCircle, Eye, EyeOff, CheckCircle } from 'lucide-react';
import { useAuth } from '../../../contexts/auth';

const Register = ({ onSwitchToLogin }) => {
  const { register, error } = useAuth();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    role: 'assistente'
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [localError, setLocalError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    setLocalError('');
  };

  const validateForm = () => {
    if (!formData.name || !formData.email || !formData.password || !formData.confirmPassword) {
      setLocalError('Preencha todos os campos obrigatórios');
      return false;
    }

    if (formData.password.length < 6) {
      setLocalError('A senha deve ter pelo menos 6 caracteres');
      return false;
    }

    if (formData.password !== formData.confirmPassword) {
      setLocalError('As senhas não coincidem');
      return false;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      setLocalError('E-mail inválido');
      return false;
    }

    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLocalError('');
    setSuccess(false);

    if (!validateForm()) {
      return;
    }

    setLoading(true);

    const { confirmPassword, ...userData } = formData;
    const result = await register(formData.email, formData.password, userData);

    if (result.success) {
      setSuccess(true);
      setTimeout(() => {
        // Redirecionar ou fazer login automático
      }, 2000);
    } else {
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
          <p className="text-gray-300">Crie sua conta gratuitamente</p>
        </div>

        {/* Card de Registro */}
        <div className="bg-background-tertiary rounded-2xl shadow-xl p-8">
          <h2 className="text-2xl font-bold text-white mb-6">Criar conta</h2>

          {/* Sucesso */}
          {success && (
            <div className="mb-6 p-4 bg-green-25 border border-green-200 rounded-lg flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-green-300 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-green-400">Conta criada com sucesso! Redirecionando...</p>
            </div>
          )}

          {/* Erro */}
          {(localError || error) && (
            <div className="mb-6 p-4 bg-red-25 border border-red-200 rounded-lg flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-300 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-400">{localError || error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Nome */}
            <div>
              <label className="block text-sm font-medium text-gray-200 mb-2">
                Nome completo *
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 w-5 h-5" />
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="Seu nome"
                  className="w-full pl-10 pr-4 py-3 border border-surface-medium rounded-lg focus:ring-2 focus:ring-dark-500 focus:border-transparent transition"
                  disabled={loading}
                />
              </div>
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-gray-200 mb-2">
                E-mail *
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

            {/* Telefone */}
            <div>
              <label className="block text-sm font-medium text-gray-200 mb-2">
                Telefone
              </label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 w-5 h-5" />
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="(11) 98765-4321"
                  className="w-full pl-10 pr-4 py-3 border border-surface-medium rounded-lg focus:ring-2 focus:ring-dark-500 focus:border-transparent transition"
                  disabled={loading}
                />
              </div>
            </div>

            {/* Senha */}
            <div>
              <label className="block text-sm font-medium text-gray-200 mb-2">
                Senha *
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 w-5 h-5" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Mínimo 6 caracteres"
                  className="w-full pl-10 pr-12 py-3 border border-surface-medium rounded-lg focus:ring-2 focus:ring-dark-500 focus:border-transparent transition"
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

            {/* Confirmar Senha */}
            <div>
              <label className="block text-sm font-medium text-gray-200 mb-2">
                Confirmar senha *
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 w-5 h-5" />
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  placeholder="Digite a senha novamente"
                  className="w-full pl-10 pr-12 py-3 border border-surface-medium rounded-lg focus:ring-2 focus:ring-dark-500 focus:border-transparent transition"
                  disabled={loading}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-300"
                >
                  {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {/* Botão de Registro */}
            <button
              type="submit"
              disabled={loading || success}
              className="w-full bg-dark-600 text-white py-3 rounded-lg font-semibold hover:bg-dark-700 transition disabled:opacity-50 disabled:cursor-not-allowed mt-6"
            >
              {loading ? 'Criando conta...' : 'Criar conta'}
            </button>
          </form>

          {/* Divider */}
          <div className="my-6 flex items-center">
            <div className="flex-1 border-t border-surface-medium"></div>
            <span className="px-4 text-sm text-gray-400">ou</span>
            <div className="flex-1 border-t border-surface-medium"></div>
          </div>

          {/* Link para Login */}
          <p className="text-center text-gray-300">
            Já tem uma conta?{' '}
            <button
              onClick={onSwitchToLogin}
              className="text-dark-400 hover:text-dark-500 font-semibold"
            >
              Fazer login
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Register;