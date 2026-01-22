import React, { useState } from 'react';
import { Person } from './types';
import { Plus, Search, Phone, MapPin, Calendar, CheckCircle, X, MessageSquare, Clock, History, Trash2 } from 'lucide-react';
import { supabase, isSupabaseConfigured } from './libsupabase';

interface PeopleManagerProps {
  people: Person[];
  setPeople: React.Dispatch<React.SetStateAction<Person[]>>;
}

export const PeopleManager: React.FC<PeopleManagerProps> = ({ people, setPeople }) => {
  const [searchTerm, setSearchTerm] = useState('');
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [name, setName] = useState('');
  const [familySize, setFamilySize] = useState(1);
  const [address, setAddress] = useState('');
  const [phone, setPhone] = useState('');
  const [notes, setNotes] = useState('');

  const [isDeliveryModalOpen, setIsDeliveryModalOpen] = useState(false);
  const [selectedPersonId, setSelectedPersonId] = useState<string | null>(null);
  const [deliveryDate, setDeliveryDate] = useState('');
  const [deliveryNote, setDeliveryNote] = useState('');

  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [viewingHistoryId, setViewingHistoryId] = useState<string | null>(null);

  const handleSave = () => {
    if (!name) return;
    
    const newPerson: Person = {
      id: Date.now().toString(),
      name,
      familySize,
      address,
      phone,
      notes,
      lastBasketDate: undefined,
      history: []
    };

    setPeople(prev => [...prev, newPerson]);
    setIsModalOpen(false);
    resetForm();
  };

  const resetForm = () => {
    setName('');
    setFamilySize(1);
    setAddress('');
    setPhone('');
    setNotes('');
  };

  const handleDeletePerson = async (id: string) => {
    if (window.confirm('Tem certeza que deseja remover esta família? O histórico de entregas será perdido.')) {
        setPeople(prev => prev.filter(p => p.id !== id));

        if (isSupabaseConfigured() && supabase) {
            try {
                const { error } = await supabase.from('beneficiarios').delete().eq('id', id);
                if (error) console.error('Erro ao deletar família do Supabase:', error);
            } catch (err) {
                console.error('Erro de conexão ao deletar família:', err);
            }
        }
    }
  }

  const openDeliveryModal = (id: string) => {
    setSelectedPersonId(id);
    const today = new Date();
    const offset = today.getTimezoneOffset() * 60000;
    const localISOTime = (new Date(today.getTime() - offset)).toISOString().slice(0, 10);
    
    setDeliveryDate(localISOTime);
    setDeliveryNote(''); 
    setIsDeliveryModalOpen(true);
  };

  const confirmDelivery = () => {
    if (!selectedPersonId || !deliveryDate) return;

    setPeople(prev => prev.map(p => {
      if (p.id === selectedPersonId) {
        const newRecord = {
          date: deliveryDate,
          note: deliveryNote.trim() || undefined
        };
        
        const updatedHistory = p.history ? [newRecord, ...p.history] : [newRecord];

        let updatedNotes = p.notes || '';
        if (deliveryNote.trim()) {
          const dateObj = new Date(deliveryDate);
          const userTimezoneOffset = dateObj.getTimezoneOffset() * 60000;
          const displayDate = new Date(dateObj.getTime() + userTimezoneOffset).toLocaleDateString('pt-BR');
          const separator = updatedNotes ? '\n\n' : '';
          updatedNotes = `${updatedNotes}${separator}--- Entrega ${displayDate} ---\n${deliveryNote.trim()}`;
        }

        return { 
          ...p, 
          lastBasketDate: deliveryDate,
          notes: updatedNotes,
          history: updatedHistory
        };
      }
      return p;
    }));

    setIsDeliveryModalOpen(false);
    setSelectedPersonId(null);
    setDeliveryNote('');
  };

  const openHistoryModal = (id: string) => {
    setViewingHistoryId(id);
    setIsHistoryModalOpen(true);
  };

  const filteredPeople = people.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getPersonName = (id: string | null) => {
    if (!id) return '';
    return people.find(p => p.id === id)?.name || '';
  };

  const getPersonHistory = (id: string | null) => {
    if (!id) return [];
    const person = people.find(p => p.id === id);
    return (person?.history || []).sort((a: { date: string | number | Date; }, b: { date: string | number | Date; }) => new Date(b.date).getTime() - new Date(a.date).getTime());
  };

  return (
    <div className="p-6 bg-slate-50 min-h-full">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Beneficiários</h2>
          <p className="text-slate-600">Cadastro de famílias assistidas pela igreja.</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="bg-blue-900 hover:bg-blue-800 text-white px-4 py-2 rounded-lg flex items-center gap-2 shadow-sm transition-colors"
        >
          <Plus size={20} />
          Cadastrar Família
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="col-span-full mb-2">
            <div className="bg-white p-3 rounded-lg border border-slate-200 flex items-center gap-3">
                <Search className="text-slate-400" size={20} />
                <input 
                  type="text" 
                  placeholder="Buscar por nome..." 
                  className="w-full outline-none text-slate-700"
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                />
            </div>
        </div>

        {filteredPeople.map(person => (
          <div key={person.id} className="bg-white rounded-xl shadow-sm border border-slate-200 p-5 hover:shadow-md transition-shadow relative group">
            <div className="flex justify-between items-start mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold">
                  {person.name.charAt(0)}
                </div>
                <div>
                  <h3 className="font-semibold text-slate-800">{person.name}</h3>
                  <p className="text-xs text-slate-500">Família de {person.familySize} pessoas</p>
                </div>
              </div>
              <div className="flex gap-2 relative z-10">
                 <button 
                    type="button"
                    onClick={(e) => { e.stopPropagation(); openHistoryModal(person.id); }}
                    className="text-slate-400 hover:text-blue-600 hover:bg-blue-50 p-2 rounded-lg transition-colors cursor-pointer"
                    title="Ver Histórico de Entregas"
                 >
                    <History size={18} />
                 </button>
                 <button 
                    type="button"
                    onClick={(e) => { e.stopPropagation(); handleDeletePerson(person.id); }}
                    className="text-slate-400 hover:text-red-600 hover:bg-red-50 p-2 rounded-lg transition-colors cursor-pointer"
                    title="Excluir Família"
                 >
                    <Trash2 size={18} />
                 </button>
              </div>
            </div>

            <div className="space-y-2 text-sm text-slate-600 mb-4">
              <div className="flex items-center gap-2">
                <Phone size={14} className="text-slate-400" />
                <span>{person.phone || 'Sem telefone'}</span>
              </div>
              <div className="flex items-center gap-2">
                <MapPin size={14} className="text-slate-400" />
                <span className="truncate">{person.address || 'Sem endereço'}</span>
              </div>
              <div className="flex items-center gap-2">
                <Calendar size={14} className="text-slate-400" />
                <span>Última Cesta: {person.lastBasketDate ? new Date(person.lastBasketDate).toLocaleDateString('pt-BR', {timeZone: 'UTC'}) : 'Nunca'}</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
                <button 
                  onClick={() => openHistoryModal(person.id)}
                  className="py-2 bg-slate-50 text-slate-600 hover:bg-slate-100 rounded-lg text-sm font-medium border border-slate-200 transition-colors flex items-center justify-center gap-2"
                >
                  <Clock size={16} />
                  Histórico
                </button>
                <button 
                  onClick={() => openDeliveryModal(person.id)}
                  className="py-2 bg-green-50 text-green-700 hover:bg-green-100 rounded-lg text-sm font-medium border border-green-200 transition-colors flex items-center justify-center gap-2"
                >
                  <CheckCircle size={16} />
                  Entregar
                </button>
            </div>
          </div>
        ))}
        
        {filteredPeople.length === 0 && (
          <div className="col-span-full text-center py-12 text-slate-500">
            Nenhuma família encontrada.
          </div>
        )}
      </div>

       {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg p-6">
            <h3 className="text-xl font-bold text-slate-800 mb-4">Cadastrar Família</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Nome do Responsável</label>
                <input 
                  type="text" 
                  className="w-full border border-slate-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-500 outline-none"
                  value={name}
                  onChange={e => setName(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Tamanho da Família</label>
                  <input 
                    type="number" 
                    min="1"
                    className="w-full border border-slate-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-500 outline-none"
                    value={familySize}
                    onChange={e => setFamilySize(Number(e.target.value))}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Telefone</label>
                  <input 
                    type="text" 
                    className="w-full border border-slate-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-500 outline-none"
                    value={phone}
                    onChange={e => setPhone(e.target.value)}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Endereço</label>
                <input 
                  type="text" 
                  className="w-full border border-slate-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-500 outline-none"
                  value={address}
                  onChange={e => setAddress(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Observações Gerais</label>
                <textarea 
                  className="w-full border border-slate-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-500 outline-none h-24 resize-none"
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6 justify-end">
              <button 
                onClick={() => { setIsModalOpen(false); resetForm(); }}
                className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg"
              >
                Cancelar
              </button>
              <button 
                onClick={handleSave}
                className="px-4 py-2 bg-blue-900 text-white hover:bg-blue-800 rounded-lg font-medium"
              >
                Salvar Cadastro
              </button>
            </div>
          </div>
        </div>
      )}

      {isDeliveryModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm p-6 relative">
            <button 
              onClick={() => setIsDeliveryModalOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600"
            >
              <X size={20} />
            </button>

            <div className="text-center mb-6">
              <div className="w-12 h-12 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-3">
                <CheckCircle size={24} />
              </div>
              <h3 className="text-lg font-bold text-slate-800">Confirmar Entrega</h3>
              <p className="text-sm text-slate-500 mt-1">
                Família de <span className="font-semibold text-slate-700">{getPersonName(selectedPersonId)}</span>
              </p>
            </div>

            <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 mb-6 space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2 flex items-center gap-2">
                  <Calendar size={16} className="text-blue-900" />
                  Data da Entrega
                </label>
                <input 
                  type="date"
                  value={deliveryDate}
                  onChange={(e) => setDeliveryDate(e.target.value)}
                  className="w-full p-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500 outline-none bg-white text-slate-800"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2 flex items-center gap-2">
                  <MessageSquare size={16} className="text-blue-900" />
                  Observações da Entrega (Opcional)
                </label>
                <textarea 
                  value={deliveryNote}
                  onChange={(e) => setDeliveryNote(e.target.value)}
                  className="w-full p-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500 outline-none bg-white text-slate-800 text-sm resize-none h-20"
                  placeholder="Ex: Entregue para o vizinho; Família precisava de fraldas também..."
                />
              </div>
            </div>

            <button 
              onClick={confirmDelivery}
              className="w-full py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg font-bold shadow-md transition-colors"
            >
              Confirmar Entrega
            </button>
          </div>
        </div>
      )}

      {isHistoryModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md p-6 relative max-h-[80vh] flex flex-col">
            <button 
              onClick={() => setIsHistoryModalOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600"
            >
              <X size={20} />
            </button>
            
            <div className="mb-6 flex items-center gap-3 border-b border-slate-100 pb-4">
                <div className="bg-blue-100 p-2 rounded-full text-blue-600">
                    <History size={24} />
                </div>
                <div>
                    <h3 className="text-xl font-bold text-slate-800">Histórico de Entregas</h3>
                    <p className="text-sm text-slate-500">{getPersonName(viewingHistoryId)}</p>
                </div>
            </div>

            <div className="overflow-y-auto flex-1 pr-2">
                {getPersonHistory(viewingHistoryId).length > 0 ? (
                    <div className="relative border-l-2 border-slate-200 ml-3 space-y-6 pl-6 py-2">
                        {getPersonHistory(viewingHistoryId).map((record, idx) => (
                            <div key={idx} className="relative">
                                <div className="absolute -left-[31px] top-1 w-4 h-4 rounded-full bg-blue-500 border-2 border-white shadow-sm" />
                                
                                <p className="text-sm font-bold text-slate-800">
                                    {new Date(record.date).toLocaleDateString('pt-BR', {timeZone: 'UTC'})}
                                </p>
                                {record.note ? (
                                    <div className="mt-1 text-sm text-slate-600 bg-slate-50 p-3 rounded-lg border border-slate-100 italic">
                                        "{record.note}"
                                    </div>
                                ) : (
                                    <p className="text-xs text-slate-400 mt-1">Entrega padrão (sem observações).</p>
                                )}
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-10 text-slate-400 flex flex-col items-center">
                        <Clock size={48} className="mb-2 opacity-20" />
                        <p>Nenhuma entrega registrada neste histórico.</p>
                    </div>
                )}
            </div>

            <div className="mt-4 pt-4 border-t border-slate-100">
                <button 
                    onClick={() => setIsHistoryModalOpen(false)}
                    className="w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-medium transition-colors"
                >
                    Fechar
                </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};