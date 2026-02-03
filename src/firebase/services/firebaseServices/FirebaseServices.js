import { 
  collection, 
  addDoc, 
  getDocs, 
  getDoc,
  doc, 
  updateDoc, 
  deleteDoc,
  query,
  where,
  orderBy,
  Timestamp 
} from 'firebase/firestore';
import { db } from '../config.ts';

// ==================== CLIENTES ====================
export const clientsService = {
  // Adicionar cliente
  async add(clientData) {
    try {
      const docRef = await addDoc(collection(db, 'clients'), {
        ...clientData,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now()
      });
      return { id: docRef.id, ...clientData };
    } catch (error) {
      console.error('Erro ao adicionar cliente:', error);
      throw error;
    }
  },

  // Buscar todos os clientes
  async getAll() {
    try {
      const querySnapshot = await getDocs(collection(db, 'clients'));
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
    } catch (error) {
      console.error('Erro ao buscar clientes:', error);
      throw error;
    }
  },

  // Buscar cliente por ID
  async getById(id) {
    try {
      const docRef = doc(db, 'clients', id);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        return { id: docSnap.id, ...docSnap.data() };
      }
      return null;
    } catch (error) {
      console.error('Erro ao buscar cliente:', error);
      throw error;
    }
  },

  // Atualizar cliente
  async update(id, clientData) {
    try {
      const docRef = doc(db, 'clients', id);
      await updateDoc(docRef, {
        ...clientData,
        updatedAt: Timestamp.now()
      });
      return { id, ...clientData };
    } catch (error) {
      console.error('Erro ao atualizar cliente:', error);
      throw error;
    }
  },

  // Deletar cliente
  async delete(id) {
    try {
      await deleteDoc(doc(db, 'clients', id));
      return id;
    } catch (error) {
      console.error('Erro ao deletar cliente:', error);
      throw error;
    }
  },

  // Buscar clientes por termo de pesquisa
  async search(searchTerm) {
    try {
      const querySnapshot = await getDocs(collection(db, 'clients'));
      const allClients = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      return allClients.filter(client => 
        client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        client.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        client.cpfCnpj.includes(searchTerm)
      );
    } catch (error) {
      console.error('Erro ao pesquisar clientes:', error);
      throw error;
    }
  }
};

// ==================== CONTRATOS ====================
export const contractsService = {
  // Adicionar contrato
  async add(contractData) {
    try {
      const docRef = await addDoc(collection(db, 'contracts'), {
        ...contractData,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now()
      });
      return { id: docRef.id, ...contractData };
    } catch (error) {
      console.error('Erro ao adicionar contrato:', error);
      throw error;
    }
  },

  // Buscar todos os contratos
  async getAll() {
    try {
      const querySnapshot = await getDocs(collection(db, 'contracts'));
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
    } catch (error) {
      console.error('Erro ao buscar contratos:', error);
      throw error;
    }
  },

  // Buscar contrato por ID
  async getById(id) {
    try {
      const docRef = doc(db, 'contracts', id);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        return { id: docSnap.id, ...docSnap.data() };
      }
      return null;
    } catch (error) {
      console.error('Erro ao buscar contrato:', error);
      throw error;
    }
  },

  // Buscar contratos por cliente
  async getByClientId(clientId) {
    try {
      const q = query(
        collection(db, 'contracts'), 
        where('clientId', '==', clientId),
        orderBy('createdAt', 'desc')
      );
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
    } catch (error) {
      console.error('Erro ao buscar contratos por cliente:', error);
      throw error;
    }
  },

  // Buscar contratos ativos
  async getActive() {
    try {
      const q = query(
        collection(db, 'contracts'), 
        where('status', '==', 'ativo')
      );
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
    } catch (error) {
      console.error('Erro ao buscar contratos ativos:', error);
      throw error;
    }
  },

  // Atualizar contrato
  async update(id, contractData) {
    try {
      const docRef = doc(db, 'contracts', id);
      await updateDoc(docRef, {
        ...contractData,
        updatedAt: Timestamp.now()
      });
      return { id, ...contractData };
    } catch (error) {
      console.error('Erro ao atualizar contrato:', error);
      throw error;
    }
  },

  // Deletar contrato
  async delete(id) {
    try {
      await deleteDoc(doc(db, 'contracts', id));
      return id;
    } catch (error) {
      console.error('Erro ao deletar contrato:', error);
      throw error;
    }
  },

  // Atualizar valores pagos e pendentes
  async updatePaymentValues(id, paid, pending) {
    try {
      const docRef = doc(db, 'contracts', id);
      await updateDoc(docRef, {
        paid: paid,
        pending: pending,
        updatedAt: Timestamp.now()
      });
      return { id, paid, pending };
    } catch (error) {
      console.error('Erro ao atualizar valores de pagamento:', error);
      throw error;
    }
  }
};

// ==================== PARCELAS ====================
export const installmentsService = {
  // Adicionar parcela
  async add(installmentData) {
    try {
      const docRef = await addDoc(collection(db, 'installments'), {
        ...installmentData,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now()
      });
      return { id: docRef.id, ...installmentData };
    } catch (error) {
      console.error('Erro ao adicionar parcela:', error);
      throw error;
    }
  },

  // Buscar todas as parcelas
  async getAll() {
    try {
      const querySnapshot = await getDocs(collection(db, 'installments'));
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
    } catch (error) {
      console.error('Erro ao buscar parcelas:', error);
      throw error;
    }
  },

  // Buscar parcela por ID
  async getById(id) {
    try {
      const docRef = doc(db, 'installments', id);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        return { id: docSnap.id, ...docSnap.data() };
      }
      return null;
    } catch (error) {
      console.error('Erro ao buscar parcela:', error);
      throw error;
    }
  },

  // Buscar parcelas por contrato
  async getByContractId(contractId) {
    try {
      const q = query(
        collection(db, 'installments'),
        where('contractId', '==', contractId),
        orderBy('number', 'asc')
      );
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
    } catch (error) {
      console.error('Erro ao buscar parcelas por contrato:', error);
      throw error;
    }
  },

  // Buscar parcelas pendentes
  async getPending() {
    try {
      const q = query(
        collection(db, 'installments'),
        where('status', '==', 'pendente'),
        orderBy('dueDate', 'asc')
      );
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
    } catch (error) {
      console.error('Erro ao buscar parcelas pendentes:', error);
      throw error;
    }
  },

  // Buscar parcelas vencidas
  async getOverdue() {
    try {
      const today = new Date().toISOString().split('T')[0];
      const querySnapshot = await getDocs(collection(db, 'installments'));
      const allInstallments = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      return allInstallments.filter(inst => 
        inst.status === 'pendente' && inst.dueDate < today
      );
    } catch (error) {
      console.error('Erro ao buscar parcelas vencidas:', error);
      throw error;
    }
  },

  // Atualizar parcela
  async update(id, installmentData) {
    try {
      const docRef = doc(db, 'installments', id);
      await updateDoc(docRef, {
        ...installmentData,
        updatedAt: Timestamp.now()
      });
      return { id, ...installmentData };
    } catch (error) {
      console.error('Erro ao atualizar parcela:', error);
      throw error;
    }
  },

  // Marcar parcela como paga
  async markAsPaid(id, paidValue, paidDate) {
    try {
      const docRef = doc(db, 'installments', id);
      await updateDoc(docRef, {
        status: 'pago',
        paidValue: paidValue,
        paidDate: paidDate,
        updatedAt: Timestamp.now()
      });
      return { id, status: 'pago', paidValue, paidDate };
    } catch (error) {
      console.error('Erro ao marcar parcela como paga:', error);
      throw error;
    }
  },

  // Marcar parcela como parcialmente paga
  async markAsPartiallyPaid(id, paidValue, paidDate) {
    try {
      const docRef = doc(db, 'installments', id);
      await updateDoc(docRef, {
        status: 'parcial',
        paidValue: paidValue,
        paidDate: paidDate,
        updatedAt: Timestamp.now()
      });
      return { id, status: 'parcial', paidValue, paidDate };
    } catch (error) {
      console.error('Erro ao marcar parcela como parcialmente paga:', error);
      throw error;
    }
  },

  // Deletar parcela
  async delete(id) {
    try {
      await deleteDoc(doc(db, 'installments', id));
      return id;
    } catch (error) {
      console.error('Erro ao deletar parcela:', error);
      throw error;
    }
  },

  // Deletar todas as parcelas de um contrato
  async deleteByContractId(contractId) {
    try {
      const q = query(
        collection(db, 'installments'),
        where('contractId', '==', contractId)
      );
      const querySnapshot = await getDocs(q);
      
      const deletePromises = querySnapshot.docs.map(doc => deleteDoc(doc.ref));
      await Promise.all(deletePromises);
      
      return contractId;
    } catch (error) {
      console.error('Erro ao deletar parcelas do contrato:', error);
      throw error;
    }
  }
};

// ==================== TRANSAÇÕES ====================
export const transactionsService = {
  // Adicionar transação
  async add(transactionData) {
    try {
      const docRef = await addDoc(collection(db, 'transactions'), {
        ...transactionData,
        createdAt: Timestamp.now()
      });
      return { id: docRef.id, ...transactionData };
    } catch (error) {
      console.error('Erro ao adicionar transação:', error);
      throw error;
    }
  },

  // Buscar todas as transações
  async getAll() {
    try {
      const q = query(
        collection(db, 'transactions'),
        orderBy('date', 'desc')
      );
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
    } catch (error) {
      console.error('Erro ao buscar transações:', error);
      throw error;
    }
  },

  // Buscar transação por ID
  async getById(id) {
    try {
      const docRef = doc(db, 'transactions', id);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        return { id: docSnap.id, ...docSnap.data() };
      }
      return null;
    } catch (error) {
      console.error('Erro ao buscar transação:', error);
      throw error;
    }
  },

  // Buscar transações por tipo
  async getByType(type) {
    try {
      const q = query(
        collection(db, 'transactions'),
        where('type', '==', type),
        orderBy('date', 'desc')
      );
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
    } catch (error) {
      console.error('Erro ao buscar transações por tipo:', error);
      throw error;
    }
  },

  // Buscar transações por período
  async getByPeriod(startDate, endDate) {
    try {
      const querySnapshot = await getDocs(collection(db, 'transactions'));
      const allTransactions = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      return allTransactions.filter(trans => 
        trans.date >= startDate && trans.date <= endDate
      );
    } catch (error) {
      console.error('Erro ao buscar transações por período:', error);
      throw error;
    }
  },

  // Buscar transações por categoria
  async getByCategory(category) {
    try {
      const q = query(
        collection(db, 'transactions'),
        where('category', '==', category),
        orderBy('date', 'desc')
      );
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
    } catch (error) {
      console.error('Erro ao buscar transações por categoria:', error);
      throw error;
    }
  },

  // Buscar transações por contrato
  async getByContractId(contractId) {
    try {
      const q = query(
        collection(db, 'transactions'),
        where('contractId', '==', contractId),
        orderBy('date', 'desc')
      );
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
    } catch (error) {
      console.error('Erro ao buscar transações por contrato:', error);
      throw error;
    }
  },

  // Atualizar transação
  async update(id, transactionData) {
    try {
      const docRef = doc(db, 'transactions', id);
      await updateDoc(docRef, {
        ...transactionData,
        updatedAt: Timestamp.now()
      });
      return { id, ...transactionData };
    } catch (error) {
      console.error('Erro ao atualizar transação:', error);
      throw error;
    }
  },

  // Deletar transação
  async delete(id) {
    try {
      await deleteDoc(doc(db, 'transactions', id));
      return id;
    } catch (error) {
      console.error('Erro ao deletar transação:', error);
      throw error;
    }
  },

  // Calcular total de entradas
  async getTotalEntradas() {
    try {
      const q = query(
        collection(db, 'transactions'),
        where('type', '==', 'entrada')
      );
      const querySnapshot = await getDocs(q);
      const transactions = querySnapshot.docs.map(doc => doc.data());
      return transactions.reduce((sum, trans) => sum + trans.value, 0);
    } catch (error) {
      console.error('Erro ao calcular total de entradas:', error);
      throw error;
    }
  },

  // Calcular total de saídas
  async getTotalSaidas() {
    try {
      const q = query(
        collection(db, 'transactions'),
        where('type', '==', 'saida')
      );
      const querySnapshot = await getDocs(q);
      const transactions = querySnapshot.docs.map(doc => doc.data());
      return transactions.reduce((sum, trans) => sum + trans.value, 0);
    } catch (error) {
      console.error('Erro ao calcular total de saídas:', error);
      throw error;
    }
  },

  // Calcular saldo
  async getSaldo() {
    try {
      const [entradas, saidas] = await Promise.all([
        this.getTotalEntradas(),
        this.getTotalSaidas()
      ]);
      return entradas - saidas;
    } catch (error) {
      console.error('Erro ao calcular saldo:', error);
      throw error;
    }
  }
};

// ==================== USUÁRIOS (Complementar ao authService) ====================
export const usersService = {
  // Buscar todos os usuários
  async getAll() {
    try {
      const querySnapshot = await getDocs(collection(db, 'users'));
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
    } catch (error) {
      console.error('Erro ao buscar usuários:', error);
      throw error;
    }
  },

  // Buscar usuário por ID
  async getById(id) {
    try {
      const docRef = doc(db, 'users', id);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        return { id: docSnap.id, ...docSnap.data() };
      }
      return null;
    } catch (error) {
      console.error('Erro ao buscar usuário:', error);
      throw error;
    }
  },

  // Buscar usuários por role
  async getByRole(role) {
    try {
      const q = query(
        collection(db, 'users'),
        where('role', '==', role)
      );
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
    } catch (error) {
      console.error('Erro ao buscar usuários por role:', error);
      throw error;
    }
  },

  // Atualizar usuário
  async update(id, userData) {
    try {
      const docRef = doc(db, 'users', id);
      await updateDoc(docRef, {
        ...userData,
        updatedAt: Timestamp.now()
      });
      return { id, ...userData };
    } catch (error) {
      console.error('Erro ao atualizar usuário:', error);
      throw error;
    }
  },

  // Desativar usuário
  async deactivate(id) {
    try {
      const docRef = doc(db, 'users', id);
      await updateDoc(docRef, {
        active: false,
        updatedAt: Timestamp.now()
      });
      return id;
    } catch (error) {
      console.error('Erro ao desativar usuário:', error);
      throw error;
    }
  },

  // Ativar usuário
  async activate(id) {
    try {
      const docRef = doc(db, 'users', id);
      await updateDoc(docRef, {
        active: true,
        updatedAt: Timestamp.now()
      });
      return id;
    } catch (error) {
      console.error('Erro ao ativar usuário:', error);
      throw error;
    }
  }
};

// ==================== ESTATÍSTICAS ====================
export const statsService = {
  // Obter estatísticas gerais do dashboard
  async getDashboardStats() {
    try {
      const [contracts, transactions, installments] = await Promise.all([
        contractsService.getAll(),
        transactionsService.getAll(),
        installmentsService.getAll()
      ]);

      const totalReceived = contracts.reduce((sum, c) => sum + (c.paid || 0), 0);
      const totalReceivable = contracts.reduce((sum, c) => sum + (c.pending || 0), 0);
      const activeContracts = contracts.filter(c => c.status === 'ativo').length;
      
      const today = new Date().toISOString().split('T')[0];
      const overdueInstallments = installments.filter(i => 
        i.status === 'pendente' && i.dueDate < today
      ).length;

      const balance = transactions.reduce((sum, t) => 
        t.type === 'entrada' ? sum + t.value : sum - t.value
      , 0);

      return {
        totalReceived,
        totalReceivable,
        activeContracts,
        overdueInstallments,
        balance,
        totalContracts: contracts.length,
        totalClients: (await clientsService.getAll()).length
      };
    } catch (error) {
      console.error('Erro ao obter estatísticas:', error);
      throw error;
    }
  },

  // Obter receitas por mês
  async getMonthlyRevenue(year) {
    try {
      const transactions = await transactionsService.getByType('entrada');
      const monthlyData = {};

      transactions.forEach(trans => {
        const transYear = new Date(trans.date).getFullYear();
        if (transYear === year) {
          const month = new Date(trans.date).toLocaleDateString('pt-BR', { 
            year: 'numeric', 
            month: 'long' 
          });
          monthlyData[month] = (monthlyData[month] || 0) + trans.value;
        }
      });

      return monthlyData;
    } catch (error) {
      console.error('Erro ao obter receitas mensais:', error);
      throw error;
    }
  }
};

export default {
  clients: clientsService,
  contracts: contractsService,
  installments: installmentsService,
  transactions: transactionsService,
  users: usersService,
  stats: statsService
};
