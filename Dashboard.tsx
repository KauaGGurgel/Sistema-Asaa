import React, { useState } from 'react';
import { Person, InventoryItem, DeliveryEvent } from './types';
import { Users, Package, TrendingUp, AlertTriangle, Calendar, Plus, Clock, Trash2 } from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { supabase, isSupabaseConfigured } from './libsupabase';

interface DashboardProps {
  people: Person[];
  inventory: InventoryItem[];
  events: DeliveryEvent[];
  setEvents: React.Dispatch<React.SetStateAction<DeliveryEvent[]>>;
}

export const Dashboard: React.FC<DashboardProps> = ({ people, inventory, events, setEvents }) => {
  const [isEventModalOpen, setIsEventModalOpen] = useState(false);
  const [newEventTitle, setNewEventTitle] = useState('');
  const [newEventDate, setNewEventDate] = useState('');
  const [newEventDesc, setNewEventDesc] = useState('');

  const totalFamilies = people.length;
  const totalBeneficiaries = people.reduce((acc, curr) => acc + curr.familySize, 0);
  const totalItems = inventory.reduce((acc, curr) => acc + curr.quantity, 0);
  
  const lowStockItemsList = inventory.filter(i => i.quantity <= i.minThreshold);
  const lowStockCount = lowStockItemsList.length;

  const chartData = inventory.slice(0, 5).map(i => ({
    name: i.name,
    qtd: i.quantity
  }));

  const today = new Date().toISOString().split('T')[0];
  const upcomingEvents = events
    .filter(e => e.date >= today)
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  
  const nextEvent = upcomingEvents[0];

  const handleAddEvent = () => {
    if (!newEventTitle || !newEventDate) return;

    const newEvent: DeliveryEvent = {
      id: Date.now().toString(),
      title: newEventTitle,
      date: newEventDate,
      description: newEventDesc
    };

    setEvents(prev => [...prev, newEvent]);
    setIsEventModalOpen(false);
    setNewEventTitle('');
    setNewEventDate('');
    setNewEventDesc('');
  };

  const handleDeleteEvent = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation(); 
    
    if (window.confirm('Tem certeza que deseja remover este evento?')) {
      setEvents(prev => prev.filter(ev => ev.id !== id));

      if (isSupabaseConfigured() && supabase) {
        try {
          const { error } = await supabase.from('eventos_entrega').delete().eq('id', id);
          if (error) console.error('Erro ao deletar evento do Supabase:', error);
        } catch (err) {
          console.error('Erro de conexão ao deletar evento:', err);
        }
      }
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return '--';
    const date = new Date(dateString);
    const userTimezoneOffset = date.getTimezoneOffset() * 60000;
    const adjustedDate = new Date(date.getTime() + userTimezoneOffset);
    return new Intl.DateTimeFormat('pt-BR', { day: 'numeric', month: 'short' }).format(adjustedDate);
  };

  const StatCard = ({ title, value, sub, icon: Icon, color, onClick, actionIcon: ActionIcon }: any) => (
    <div 
      onClick={onClick}
      className={`bg-white p-6 rounded-xl shadow-sm border border-slate-200 relative group transition-all ${onClick ? 'cursor-pointer hover:shadow-md hover:border-blue-200' : ''}`}
    >
      <div className="flex justify-between items-start">
        <div>
          <p className="text-slate-500 text-sm font-medium">{title}</p>
          <h3 className="text-3xl font-bold text-slate-800 mt-2">{value}</h3>
          <p className={`text-xs mt-1 ${color}`}>{sub}</p>
        </div>
        <div className={`p-3 rounded-lg bg-opacity-10 ${color.replace('text-', 'bg-')}`}>
           <Icon className={color} size={24} />
        </div>
      </div>
      {onClick && ActionIcon && (
        <div className="absolute top-4 right-14 opacity-0 group-hover:opacity-100 transition-opacity bg-slate-100 p-1 rounded-full text-slate-500">
          <ActionIcon size={16} />
        </div>
      )}
    </div>
  );

  return (
    <div className="p-6 bg-slate-50 min-h-full space-y-6">
      <div className="flex justify-between items-center mb-2">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Visão Geral</h2>
          <p className="text-slate-600">Painel de controle da Ação Solidária Adventista.</p>
        </div>
        <button 
          onClick={() => setIsEventModalOpen(true)}
          className="bg-white border border-slate-300 text-slate-700 px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-slate-50 text-sm font-medium shadow-sm"
        >
          <Calendar size={16} />
          Agendar Entrega
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          title="Famílias Atendidas" 
          value={totalFamilies} 
          sub={`${totalBeneficiaries} pessoas no total`}
          icon={Users}
          color="text-blue-600"
        />
        <StatCard 
          title="Itens em Estoque" 
          value={totalItems} 
          sub="Total de unidades/kg"
          icon={Package}
          color="text-green-600"
        />
        <StatCard 
          title="Estoque Baixo" 
          value={lowStockCount} 
          sub="Itens precisando de reposição"
          icon={TrendingUp}
          color="text-red-500"
        />
        <StatCard 
          title="Próxima Entrega" 
          value={nextEvent ? formatDate(nextEvent.date) : "--"} 
          sub={nextEvent ? nextEvent.title : "Nenhuma agendada"}
          icon={Calendar}
          color="text-yellow-600"
          onClick={() => setIsEventModalOpen(true)}
          actionIcon={Plus}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
           <h3 className="font-bold text-slate-800 mb-6">Principais Itens em Estoque</h3>
           <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#64748b'}} />
                  <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b'}} />
                  <Tooltip 
                    contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}}
                    cursor={{fill: '#f1f5f9'}}
                  />
                  <Bar dataKey="qtd" fill="#1e3a8a" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
           </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 flex flex-col">
           <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-slate-800">Alertas e Eventos</h3>
              {lowStockCount > 0 && (
                <span className="bg-red-100 text-red-700 text-xs font-bold px-2 py-1 rounded-full">
                  {lowStockCount} críticos
                </span>
              )}
           </div>
           
           <div className="space-y-3 flex-1 overflow-y-auto max-h-[300px] pr-2">
              
              {events.length > 0 ? (
                events
                  .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
                  .map(event => {
                    const isPast = event.date < today;
                    return (
                      <div key={event.id} className={`p-3 border rounded-lg flex items-center gap-3 group relative ${isPast ? 'bg-slate-50 border-slate-100 opacity-60' : 'bg-yellow-50 border-yellow-100'}`}>
                        <div className={`p-2 rounded-full shadow-sm ${isPast ? 'bg-slate-200 text-slate-500' : 'bg-white text-yellow-600'}`}>
                            <Clock size={20} />
                        </div>
                        <div className="flex-1">
                            <h4 className={`font-bold text-sm ${isPast ? 'text-slate-700' : 'text-yellow-900'}`}>{event.title}</h4>
                            <p className={`text-xs ${isPast ? 'text-slate-500' : 'text-yellow-700'}`}>{formatDate(event.date)} - {event.description || 'Sem descrição'}</p>
                        </div>
                        <button 
                          type="button"
                          onClick={(e) => handleDeleteEvent(event.id, e)}
                          className="opacity-0 group-hover:opacity-100 absolute right-2 top-1/2 -translate-y-1/2 p-2 text-slate-400 hover:text-red-500 hover:bg-white rounded-full transition-all cursor-pointer z-10 shadow-sm border border-slate-100"
                          title="Excluir evento"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    )
                  })
              ) : (
                 lowStockCount === 0 && (
                    <div className="p-4 text-center text-slate-400 text-sm italic">
                       Nenhum evento agendado.
                    </div>
                 )
              )}

              {lowStockCount > 0 && (
                <>
                  <div className="text-xs font-bold text-slate-400 uppercase mt-4 mb-2">Reposição Necessária</div>
                  {lowStockItemsList.map(item => (
                    <div key={item.id} className="p-3 bg-red-50 border border-red-100 rounded-lg flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="bg-white p-2 rounded-full shadow-sm">
                          <AlertTriangle size={16} className="text-red-500" />
                        </div>
                        <div>
                          <h4 className="font-bold text-red-900 text-sm">{item.name}</h4>
                          <p className="text-red-600 text-xs">Mínimo: {item.minThreshold} {item.unit}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="block font-bold text-red-800 text-lg">
                          {item.quantity} <span className="text-xs font-normal">{item.unit}</span>
                        </span>
                        <span className="text-xs text-red-500 font-medium">
                          Faltam {Math.max(0, item.minThreshold - item.quantity)} {item.unit}
                        </span>
                      </div>
                    </div>
                  ))}
                </>
              )}
              
              {!nextEvent && lowStockCount === 0 && events.length === 0 && (
                  <div className="h-full flex flex-col items-center justify-center text-center p-6 bg-slate-50 rounded-lg border border-slate-100 border-dashed">
                    <p className="text-slate-500 text-sm mt-1">Tudo em dia! Nenhum alerta ou evento.</p>
                  </div>
              )}
              
              <div className="pt-3 mt-3 border-t border-slate-100">
                <button onClick={() => setIsEventModalOpen(true)} className="w-full py-2 text-xs text-blue-600 font-medium hover:bg-blue-50 rounded-lg transition-colors">
                   + Adicionar novo evento
                </button>
              </div>
           </div>
        </div>
      </div>

      {isEventModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md p-6">
            <h3 className="text-xl font-bold text-slate-800 mb-4 flex items-center gap-2">
              <Calendar className="text-blue-900" /> Agendar Evento
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Título do Evento</label>
                <input 
                  type="text" 
                  className="w-full border border-slate-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-500 outline-none"
                  value={newEventTitle}
                  onChange={e => setNewEventTitle(e.target.value)}
                  placeholder="Ex: Sábado Solidário"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Data</label>
                <input 
                  type="date" 
                  className="w-full border border-slate-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-500 outline-none"
                  value={newEventDate}
                  onChange={e => setNewEventDate(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Descrição (Opcional)</label>
                <textarea 
                  className="w-full border border-slate-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-500 outline-none h-24 resize-none"
                  value={newEventDesc}
                  onChange={e => setNewEventDesc(e.target.value)}
                  placeholder="Detalhes sobre a entrega..."
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6 justify-end">
              <button 
                onClick={() => setIsEventModalOpen(false)}
                className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg"
              >
                Cancelar
              </button>
              <button 
                onClick={handleAddEvent}
                className="px-4 py-2 bg-blue-900 text-white hover:bg-blue-800 rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={!newEventTitle || !newEventDate}
              >
                Salvar Evento
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};