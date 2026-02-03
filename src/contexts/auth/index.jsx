import React, { createContext, useState, useEffect, useContext } from 'react';
import { 
  signOut as firebaseSignOut, 
  onAuthStateChanged
} from 'firebase/auth';
import { auth } from '../../firebase/services/config';
import { authService } from '../../firebase/auth';

const AuthContext = createContext({});

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Monitorar estado de autenticação
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        // Buscar dados adicionais do usuário no Firestore
        try {
          const userData = await authService.getUserData(firebaseUser.uid);
          setUser({
            uid: firebaseUser.uid,
            email: firebaseUser.email,
            ...userData
          });
        } catch (err) {
          console.error('Erro ao buscar dados do usuário:', err);
          setUser({
            uid: firebaseUser.uid,
            email: firebaseUser.email
          });
        }
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  // Função de Login
  const login = async (email, password) => {
    try {
      setError(null);
      setLoading(true);
      const userData = await authService.signIn(email, password);
      setUser(userData);
      return { success: true, user: userData };
    } catch (err) {
      const errorMessage = getErrorMessage(err.code);
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  // Função de Registro
  const register = async (email, password, userData) => {
    try {
      setError(null);
      setLoading(true);
      const newUser = await authService.signUp(email, password, userData);
      setUser(newUser);
      return { success: true, user: newUser };
    } catch (err) {
      const errorMessage = getErrorMessage(err.code);
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  // Função de Logout
  const logout = async () => {
    try {
      await firebaseSignOut(auth);
      setUser(null);
      return { success: true };
    } catch (err) {
      const errorMessage = 'Erro ao fazer logout';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    }
  };

  // Atualizar dados do usuário
  const updateUserProfile = async (userData) => {
    try {
      setError(null);
      await authService.updateUserData(user.uid, userData);
      setUser(prev => ({ ...prev, ...userData }));
      return { success: true };
    } catch (err) {
      const errorMessage = 'Erro ao atualizar perfil';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    }
  };

  // Mensagens de erro amigáveis
  const getErrorMessage = (errorCode) => {
    const errorMessages = {
      'auth/email-already-in-use': 'Este e-mail já está cadastrado',
      'auth/invalid-email': 'E-mail inválido',
      'auth/operation-not-allowed': 'Operação não permitida',
      'auth/weak-password': 'A senha deve ter pelo menos 6 caracteres',
      'auth/user-disabled': 'Esta conta foi desabilitada',
      'auth/user-not-found': 'Usuário não encontrado',
      'auth/wrong-password': 'Senha incorreta',
      'auth/invalid-credential': 'Credenciais inválidas',
      'auth/too-many-requests': 'Muitas tentativas. Tente novamente mais tarde',
      'auth/network-request-failed': 'Erro de conexão. Verifique sua internet'
    };
    return errorMessages[errorCode] || 'Erro ao autenticar. Tente novamente';
  };

  const value = {
    user,
    loading,
    error,
    login,
    register,
    logout,
    updateUserProfile,
    isAuthenticated: !!user
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

// Hook para usar o contexto
// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth deve ser usado dentro de um AuthProvider');
  }
  return context;
};