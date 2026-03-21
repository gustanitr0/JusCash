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
  Timestamp,
} from 'firebase/firestore'
import { db } from '../firebase/config.ts'
import { clientSchema } from '../schemas/clientSchema.js'
import { contractSchema } from '../schemas/contractSchema.js'
import { installmentSchema } from '../schemas/InstallmentSchema.js'
import { transactionSchema } from '../schemas/transactionSchema.js'

// Helper para obter caminho da subcoleção
const getUserCollection = (userId, collectionName) => {
  return collection(db, 'users', userId, collectionName)
}

// ==================== CLIENTES ====================
export const clientsService = {
  async add(userId, clientData) {
    const validatedData = clientSchema.parse(clientData)

    const docRef = await addDoc(getUserCollection(userId, 'clients'), {
      ...validatedData,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    })
    return { id: docRef.id, ...validatedData }
  },

  async getAll(userId) {
    const querySnapshot = await getDocs(getUserCollection(userId, 'clients'))
    return querySnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }))
  },

  async getById(userId, clientId) {
    const docRef = doc(db, 'users', userId, 'clients', clientId)
    const docSnap = await getDoc(docRef)
    return docSnap.exists() ? { id: docSnap.id, ...docSnap.data() } : null
  },

  async update(userId, clientId, clientData) {
    const docRef = doc(db, 'users', userId, 'clients', clientId)
    await updateDoc(docRef, { ...clientData, updatedAt: Timestamp.now() })
    return { id: clientId, ...clientData }
  },

  async delete(userId, clientId) {
    await deleteDoc(doc(db, 'users', userId, 'clients', clientId))
    return clientId
  },
}

// ==================== CONTRATOS ====================
export const contractsService = {
  async add(userId, contractData) {
    const validatedData = contractSchema.parse(contractData)

    const docRef = await addDoc(getUserCollection(userId, 'contracts'), {
      ...validatedData,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    })
    return { id: docRef.id, ...validatedData }
  },

  async getAll(userId) {
    const querySnapshot = await getDocs(getUserCollection(userId, 'contracts'))
    return querySnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }))
  },

  async getById(userId, contractId) {
    const docRef = doc(db, 'users', userId, 'contracts', contractId)
    const docSnap = await getDoc(docRef)
    return docSnap.exists() ? { id: docSnap.id, ...docSnap.data() } : null
  },

  async update(userId, contractId, contractData) {
    const docRef = doc(db, 'users', userId, 'contracts', contractId)
    await updateDoc(docRef, { ...contractData, updatedAt: Timestamp.now() })
    return { id: contractId, ...contractData }
  },

  async delete(userId, contractId) {
    await deleteDoc(doc(db, 'users', userId, 'contracts', contractId))
    return contractId
  },
}

// ==================== PARCELAS ====================
export const installmentsService = {
  async add(userId, installmentData) {
    const validatedData = installmentSchema.parse(installmentData)

    const docRef = await addDoc(getUserCollection(userId, 'installments'), {
      ...validatedData,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    })
    return { id: docRef.id, ...validatedData }
  },

  async getAll(userId) {
    const querySnapshot = await getDocs(getUserCollection(userId, 'installments'))
    return querySnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }))
  },

  async getByContractId(userId, contractId) {
    const q = query(
      getUserCollection(userId, 'installments'),
      where('contractId', '==', contractId),
      orderBy('number', 'asc')
    )
    const querySnapshot = await getDocs(q)
    return querySnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }))
  },

  async update(userId, installmentId, installmentData) {
    const docRef = doc(db, 'users', userId, 'installments', installmentId)
    await updateDoc(docRef, { ...installmentData, updatedAt: Timestamp.now() })
    return { id: installmentId, ...installmentData }
  },

  async markAsPaid(userId, installmentId, paidValue, paidDate) {
    const docRef = doc(db, 'users', userId, 'installments', installmentId)
    await updateDoc(docRef, {
      status: 'pago',
      paidValue,
      paidDate,
      updatedAt: Timestamp.now(),
    })
    return { id: installmentId, status: 'pago', paidValue, paidDate }
  },

  async delete(userId, installmentId) {
    await deleteDoc(doc(db, 'users', userId, 'installments', installmentId))
    return installmentId
  },
}

// ==================== TRANSAÇÕES ====================
export const transactionsService = {
  async add(userId, transactionData) {
    const validatedData = transactionSchema.parse(transactionData)

    const docRef = await addDoc(getUserCollection(userId, 'transactions'), {
      ...validatedData,
      createdAt: Timestamp.now(),
    })
    return { id: docRef.id, ...validatedData }
  },

  async getAll(userId) {
    const q = query(getUserCollection(userId, 'transactions'), orderBy('date', 'desc'))
    const querySnapshot = await getDocs(q)
    return querySnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }))
  },

  async delete(userId, transactionId) {
    await deleteDoc(doc(db, 'users', userId, 'transactions', transactionId))
    return transactionId
  },
}

export default {
  clients: clientsService,
  contracts: contractsService,
  installments: installmentsService,
  transactions: transactionsService,
}
