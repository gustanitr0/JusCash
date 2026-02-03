import React, { useState, useEffect } from 'react';
import { Plus, Search, Eye, Edit, Trash2, Mail, Phone, FileText, AlertCircle, CheckCircle } from 'lucide-react';
import { clientsService } from '../../firebase/services/firebaseServices/FirebaseServices';
import { useAuth } from '../../contexts/auth';
import Modal from '../../components/Modal/Modal';

const Clients = () => {
  const { user } = useAuth();
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [selectedClient, setSelectedClient] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    cpfCnpj: '',
    address: '',
    city: '',
    state: '',
    zipCode: '',
    notes: ''
  });
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadClients();
  }, []);

  const loadClients = async () => {
    try {
      setLoading(true);
      const data = await clientsService.getAll();
      setClients(data);
    } catch (error) {
      console.error('Erro ao carregar clientes:', error);
      alert('Erro ao carregar clientes');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (client = null) => {
    if (client) {
      setSelectedClient(client);
      setFormData(client);
    } else {
      setSelectedClient(null);
      setFormData({
        name: '',
        email: '',
        phone: '',
        cpf: '',
        rg: '',
        zipCode: '',
        address: '',
        city: '',
        state: '',
        number: '',
        complement: '',
        notes: ''
      });
    }
    setFormError('');
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setSelectedClient(null);
    setFormError('');
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    setFormError('');
  };

  const validateForm = () => {
    if (!formData.name.trim()) {
      setFormError('Nome é obrigatório');
      return false;
    }
    if (!formData.email.trim()) {
      setFormError('E-mail é obrigatório');
      return false;
    }
    if (!formData.cpf.trim()) {
      setFormError('CPF/CNPJ é obrigatório');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setSubmitting(true);

    try {
      const clientData = {
        ...formData,
        createdBy: user.uid
      };

      if (selectedClient) {
        await clientsService.update(selectedClient.id, clientData);
        alert('Cliente atualizado com sucesso!');
      } else {
        await clientsService.add(clientData);
        alert('Cliente cadastrado com sucesso!');
      }
      
      handleCloseModal();
      loadClients();
    } catch (error) {
      console.error('Erro ao salvar cliente:', error);
      setFormError('Erro ao salvar cliente. Tente novamente.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Deseja realmente excluir este cliente? Esta ação não pode ser desfeita.')) {
      return;
    }

    try {
      await clientsService.delete(id);
      alert('Cliente excluído com sucesso!');
      loadClients();
    } catch (error) {
      console.error('Erro ao excluir cliente:', error);
      alert('Erro ao excluir cliente');
    }
  };

  const filteredClients = clients.filter(client => 
    client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    client.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    client.cpfCnpj.includes(searchTerm)
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-300">Carregando clientes...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-white">Clientes</h1>
        <button 
          onClick={() => handleOpenModal()}
          className="bg-dark-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700 transition"
        >
          <Plus className="w-5 h-5" />
          Novo Cliente
        </button>
      </div>

      <div className="bg-background-tertiary rounded-lg shadow">
        <div className="p-6 border-b">
          <div className="flex gap-4">
            <div className="flex-1 relative">
              <Search className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500" />
              <input
                type="text"
                placeholder="Buscar por nome, e-mail ou CPF/CNPJ..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-dark-200 border border-surface-medium rounded-lg focus:ring-2 focus:ring-dark-500 focus:border-transparent"
              />
            </div>
          </div>
        </div>

        {filteredClients.length === 0 ? (
          <div className="p-12 text-center">
            <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-300 text-lg mb-2">Nenhum cliente encontrado</p>
            <p className="text-gray-500 text-sm mb-6">
              {searchTerm ? 'Tente ajustar sua busca' : 'Comece cadastrando seu primeiro cliente'}
            </p>
            {!searchTerm && (
              <button 
                onClick={() => handleOpenModal()}
                className="bg-dark-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition"
              >
                Cadastrar Cliente
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-surface-dark">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cliente</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Contato</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tipo</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cadastrado em</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ações</th>
                </tr>
              </thead>
              <tbody className="bg-background-tertiary divide-y divide-surface-dark">
                {filteredClients.map(client => (
                  <tr key={client.id} className="hover:bg-surface-dark">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-dark-600 to-dark-500 rounded-full flex items-center justify-center text-white font-semibold">
                          {client.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div className="font-medium text-white">{client.name}</div>
                          <div className="text-sm text-gray-500">{client.address}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-2 text-sm text-white">
                          <Mail className="w-4 h-4 text-gray-500" />
                          {client.email}
                        </div>
                        {client.phone && (
                          <div className="flex items-center gap-2 text-sm text-gray-300">
                            <Phone className="w-4 h-4 text-gray-500" />
                            {client.phone}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-white font-mono">{client.cpfCnpj}</td>
                    <td className="px-6 py-4 text-sm text-gray-300">
                      {client.city && client.state ? `${client.city}, ${client.state}` : '-'}
                    </td>
                    { /*<td className='px-6 py-4 text-sm text-white- font-mono'>{client.createdAt}</td> */ }
                    <td className="px-6 py-4">
                      <div className="flex gap-2">
                        <button 
                          onClick={() => handleOpenModal(client)}
                          className="text-dark-400 hover:text-blue-400 p-2 hover:bg-dark-500 rounded transition"
                          title="Editar"
                        >
                          <Edit className="w-5 h-5" />
                        </button>
                        <button 
                          onClick={() => handleDelete(client.id)}
                          className="text-red-600 hover:text-red-400 p-2 hover:bg-red-250 rounded transition"
                          title="Excluir"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal de Cadastro/Edição */}
      {showModal && (
        <Modal 
          title={selectedClient ? 'Editar Cliente' : 'Novo Cliente'}
          onClose={handleCloseModal}
          size="default"
        >
          <form onSubmit={handleSubmit} className="space-y-4">
            {formError && (
              <div className="p-4 bg-red-250 border border-red-200 rounded-lg flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-red-400">{formError}</p>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-200 mb-2">
                  Nome Completo *
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="Nome do cliente"
                  className="w-full px-4 py-2 border border-surface-medium rounded-lg focus:ring-2 focus:ring-dark-500 focus:border-transparent bg-background-tertiary"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-200 mb-2">
                  E-mail *
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="email@exemplo.com"
                  className="w-full px-4 py-2 border border-surface-medium rounded-lg focus:ring-2 focus:ring-dark-500 focus:border-transparent bg-background-tertiary"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-200 mb-2">
                  Telefone
                </label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="(11) 98765-4321"
                  className="w-full px-4 py-2 border border-surface-medium rounded-lg focus:ring-2 focus:ring-dark-500 focus:border-transparent bg-background-tertiary"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-200 mb-2">
                  CPF *
                </label>
                <input
                  type="text"
                  name="cpf"
                  value={formData.cpf}
                  onChange={handleChange}
                  placeholder="000.000.000-00"
                  className="w-full px-4 py-2 border border-surface-medium rounded-lg focus:ring-2 focus:ring-dark-500 focus:border-transparent bg-background-tertiary"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-200 mb-2">
                  RG *
                </label>
                <input
                  type="text"
                  name="rg"
                  value={formData.rg}
                  onChange={handleChange}
                  placeholder="00.000.000-0"
                  className="w-full px-4 py-2 border border-surface-medium rounded-lg focus:ring-2 focus:ring-dark-500 focus:border-transparent bg-background-tertiary"
                  required
                />
              </div>              

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-200 mb-2">
                  CEP
                </label>
                <input
                  type="text"
                  name="zipCode"
                  value={formData.zipCode}
                  onChange={handleChange}
                  placeholder="00000-000"
                  className="w-full px-4 py-2 border border-surface-medium rounded-lg focus:ring-2 focus:ring-dark-500 focus:border-transparent bg-background-tertiary"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-200 mb-2">
                  Rua / Logradouro
                </label>
                <input
                  type="text"
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                  placeholder="Rua"
                  className="w-full px-4 py-2 border border-surface-medium rounded-lg focus:ring-2 focus:ring-dark-500 focus:border-transparent bg-background-tertiary"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-200 mb-2">
                  Cidade
                </label>
                <input
                  type="text"
                  name="city"
                  value={formData.city}
                  onChange={handleChange}
                  placeholder="Salvador"
                  className="w-full px-4 py-2 border border-surface-medium rounded-lg focus:ring-2 focus:ring-dark-500 focus:border-transparent bg-background-tertiary"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-200 mb-2">
                  Estado
                </label>
                <input
                  type="text"
                  name="state"
                  value={formData.state}
                  onChange={handleChange}
                  placeholder="UF"
                  maxLength="2"
                  className="w-full px-4 py-2 border border-surface-medium rounded-lg focus:ring-2 focus:ring-dark-500 focus:border-transparent bg-background-tertiary"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-200 mb-2">
                  Numero
                </label>
                <input
                  type="text"
                  name="number"
                  value={formData.number}
                  onChange={handleChange}
                  placeholder="123"
                  className="w-full px-4 py-2 border border-surface-medium rounded-lg focus:ring-2 focus:ring-dark-500 focus:border-transparent bg-background-tertiary"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-200 mb-2">
                  Complemento
                </label>
                <input
                  type="text"
                  name="complement"
                  value={formData.complement}
                  onChange={handleChange}
                  placeholder="Apt. 101"
                  maxLength="2"
                  className="w-full px-4 py-2 border border-surface-medium rounded-lg focus:ring-2 focus:ring-dark-500 focus:border-transparent bg-background-tertiary"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-200 mb-2">
                  Observações
                </label>
                <textarea
                  name="notes"
                  value={formData.notes}
                  onChange={handleChange}
                  rows="3"
                  placeholder="Informações adicionais sobre o cliente..."
                  className="w-full px-4 py-2 border border-surface-medium rounded-lg focus:ring-2 focus:ring-dark-500 focus:border-transparent resize-none bg-background-tertiary"
                />
              </div>
            </div>

            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={handleCloseModal}
                className="flex-1 px-6 py-3 border border-surface-medium text-gray-200 rounded-lg hover:bg-surface-dark transition font-medium"
                disabled={submitting}
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="flex-1 px-6 py-3 bg-dark-600 text-white rounded-lg hover:bg-dark-700 transition font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={submitting}
              >
                {submitting ? 'Salvando...' : selectedClient ? 'Atualizar' : 'Cadastrar'}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};

export default Clients;