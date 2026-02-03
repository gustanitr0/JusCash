import { 
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
  updateProfile
} from 'firebase/auth';
import { 
  doc, 
  setDoc, 
  getDoc, 
  updateDoc,
  Timestamp 
} from 'firebase/firestore';
import { auth, db } from './services/config';

export const authService = {
  // Registrar novo usuário
  async signUp(email, password, userData) {
    try {
      // Criar usuário no Firebase Auth
      const userCredential = await createUserWithEmailAndPassword(
        auth, 
        email, 
        password
      );
      const user = userCredential.user;

      // Atualizar perfil do Firebase Auth
      await updateProfile(user, {
        displayName: userData.name
      });

      // Salvar dados adicionais no Firestore
      const userDocData = {
        uid: user.uid,
        email: user.email,
        name: userData.name,
        role: userData.role || 'assistente', // advogado, assistente, financeiro
        phone: userData.phone || '',
        active: true,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now()
      };

      await setDoc(doc(db, 'users', user.uid), userDocData);

      return {
        uid: user.uid,
        email: user.email,
        ...userDocData
      };
    } catch (error) {
      console.error('Erro no registro:', error);
      throw error;
    }
  },

  // Login
  async signIn(email, password) {
    try {
      const userCredential = await signInWithEmailAndPassword(
        auth, 
        email, 
        password
      );
      const user = userCredential.user;

      // Buscar dados do Firestore
      const userData = await this.getUserData(user.uid);

      return {
        uid: user.uid,
        email: user.email,
        ...userData
      };
    } catch (error) {
      console.error('Erro no login:', error);
      throw error;
    }
  },

  // Buscar dados do usuário no Firestore
  async getUserData(uid) {
    try {
      const userDoc = await getDoc(doc(db, 'users', uid));
      
      if (userDoc.exists()) {
        return userDoc.data();
      } else {
        throw new Error('Dados do usuário não encontrados');
      }
    } catch (error) {
      console.error('Erro ao buscar dados do usuário:', error);
      throw error;
    }
  },

  // Atualizar dados do usuário
  async updateUserData(uid, userData) {
    try {
      await updateDoc(doc(db, 'users', uid), {
        ...userData,
        updatedAt: Timestamp.now()
      });
      return true;
    } catch (error) {
      console.error('Erro ao atualizar dados:', error);
      throw error;
    }
  },

  // Recuperar senha
  async resetPassword(email) {
    try {
      await sendPasswordResetEmail(auth, email);
      return { success: true };
    } catch (error) {
      console.error('Erro ao enviar e-mail de recuperação:', error);
      throw error;
    }
  }
};