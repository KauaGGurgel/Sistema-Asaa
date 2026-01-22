import React, { useState, useEffect, useRef } from 'react';
import { InventoryItem } from './types';
import { Plus, Trash2, Edit2, Search, AlertTriangle, ArrowDown, MinusCircle, PlusCircle, BellRing, X } from 'lucide-react';
import { supabase, isSupabaseConfigured } from './libsupabase';

interface InventoryManagerProps {
  inventory: InventoryItem[];
  setInventory: React.Dispatch<React.SetStateAction<InventoryItem[]>>;
}

export const InventoryManager: React.FC<InventoryManagerProps> = ({ inventory, setInventory }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);
  
  const [showToast, setShowToast] = useState(false);
  const prevCriticalCountRef = useRef(0);

  const [name, setName] = useState('');
  const [quantity, setQuantity] = useState(0);
  const [unit, setUnit] = useState<InventoryItem['unit']>('kg');
  const [category, setCategory] = useState<InventoryItem['category']>('alimento');
  const [minThreshold, setMinThreshold] = useState(10);

  const playAlertSound = () => {
    try {
      const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContext) return;
      
      const ctx = new AudioContext();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.type = 'sine';
      osc.frequency.setValueAtTime(440, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.1);
      
      gain.gain.setValueAtTime(0.1, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5);

      osc.start();
      osc.stop(ctx.currentTime + 0.5);
    } catch (e) {
      console.error("Audio playback failed", e);
    }
  };

  useEffect(() => {
    const currentCriticalItems = inventory.filter(i => i.quantity <= i.minThreshold);
    const count = currentCriticalItems.length;

    if (count > 0 && (count > prevCriticalCountRef.current || prevCriticalCountRef.current === 0)) {
      setShowToast(true);
      playAlertSound();
      const timer = setTimeout(() => setShowToast(false), 5000);
      return () => clearTimeout(timer);
    }
    
    prevCriticalCountRef.current = count;
  }, [inventory]);

  const handleOpenModal = (item?: InventoryItem) => {
    if (item) {
      setEditingItem(item);
      setName(item.name);
      setQuantity(item.quantity);
      setUnit(item.unit);
      setCategory(item.category);
      setMinThreshold(item.minThreshold);
    } else {
      setEditingItem(null);
      setName('');
      setQuantity(0);
      setUnit('kg');
      setCategory('alimento');
      setMinThreshold(10);
    }
    setIsModalOpen(true);
  };

  const handleSave = () => {
    if (!name) return;

    if (editingItem) {
      setInventory(prev => prev.map(item => 
        item.id === editingItem.id 
          ? { ...item, name, quantity, unit, category, minThreshold }
          : item
      ));
    } else {
      const newItem: InventoryItem = {
        id: Date.now().toString(),
        name,
        quantity,
        unit,
        category,
        minThreshold
      };
      setInventory(prev => [...prev, newItem]);
    }
    setIsModalOpen(false);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Tem certeza que deseja remover este item?')) {
      setInventory(prev => prev.filter(item => item.id !== id));

      if (isSupabaseConfigured() && supabase) {
        try {
          const { error } = await supabase.from('estoque').delete().eq('id', id);
          if (error) console.error('Erro ao deletar do Supabase:', error);
        } catch (err) {
          console.error('Erro de conexão ao deletar:', err);
        }
      }
    }
  };

  const handleQuickAdjust = (id: string, amount: number) => {
    setInventory(prev => prev.map(item => {
      if (item.id === id) {
        const newQuantity = Math.max(0, item.quantity + amount);
        return { ...item, quantity: newQuantity };
      }
      return item;
    }));
  };

  const filteredInventory = inventory.filter(item => 
    item.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const criticalItems = inventory.filter(i => i.quantity <= i.minThreshold);

  return (
    <div className="p-6 bg-slate-50 min-h-full relative">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Despensa (Estoque)</h2>
          <p className="text-slate-600">Gerencie os alimentos e itens doados. Adicione ou ajuste conforme a necessidade.</p>
        </div>
        <button 
          onClick={() => handleOpenModal()}
          className="bg-blue-900 hover:bg-blue-800 text-white px-4 py-2 rounded-lg flex items-center gap-2 shadow-sm transition-colors"
        >
          <Plus size={20} />
          Adicionar Novo Produto
        </button>
      </div>

      {criticalItems.length > 0 && (
        <div className="mb-6 bg-red-50 border border-red-200 rounded-xl p-4 flex flex-col md:flex-row items-start md:items-center gap-4 animate-fadeIn">
           <div className="bg-red-100 p-2 rounded-full text-red-600">
             <AlertTriangle size={24} />
           </div>
           <div className="flex-1">
             <h3 className="font-bold text-red-900 text-lg">Atenção Necessária: {criticalItems.length} Itens com Estoque Baixo</h3>
             <p className="text-red-700 text-sm">
                Os seguintes itens estão abaixo do limite mínimo e precisam de reposição urgente: 
                <span className="font-semibold ml-1">
                  {criticalItems.map(i => i.name).slice(0, 3).join(', ')}
                  {criticalItems.length > 3 && ` e mais ${criticalItems.length - 3}...`}
                </span>
             </p>
           </div>
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-4 border-b border-slate-100 bg-white flex items-center gap-3">
            <Search className="text-slate-400" size={20} />
            <input 
              type="text" 
              placeholder="Buscar produto por nome..." 
              className="bg-transparent border-none outline-none text-slate-700 w-full"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-100 text-slate-600 text-sm font-semibold uppercase tracking-wider">
                <th className="p-4">Produto</th>
                <th className="p-4">Categoria</th>
                <th className="p-4">Quantidade (Ajuste Rápido)</th>
                <th className="p-4">Alerta Mínimo</th>
                <th className="p-4 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredInventory.map(item => {
                const isLowStock = item.quantity <= item.minThreshold;
                const deficit = Math.max(0, item.minThreshold - item.quantity);

                return (
                  <tr 
                    key={item.id} 
                    className={`transition-all duration-300 
                      ${isLowStock ? 'bg-red-50 hover:bg-red-100 border-l-4 border-l-red-500' : 'hover:bg-slate-50 border-l-4 border-l-transparent'}
                    `}
                  >
                    <td className="p-4">
                        <div className="font-medium text-slate-800 flex items-center gap-2">
                          {item.name}
                          {isLowStock && <span className="animate-pulse text-red-500 text-xs font-bold px-2 py-0.5 bg-red-100 rounded-full">CRÍTICO</span>}
                        </div>
                        {isLowStock && (
                            <div className="text-xs text-red-600 font-semibold flex items-center gap-1 mt-1">
                                <ArrowDown size={12} /> Repor estoque
                            </div>
                        )}
                    </td>
                    <td className="p-4">
                      <span className={`
                        px-2 py-1 rounded-full text-xs font-semibold
                        ${item.category === 'alimento' ? 'bg-green-100 text-green-700' : 
                          item.category === 'higiene' ? 'bg-purple-100 text-purple-700' : 
                          'bg-orange-100 text-orange-700'}
                      `}>
                        {item.category}
                      </span>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <button 
                          onClick={() => handleQuickAdjust(item.id, -1)}
                          className="text-slate-400 hover:text-red-600 transition-colors"
                          title="Reduzir quantidade"
                        >
                          <MinusCircle size={20} />
                        </button>
                        
                        <div className="flex flex-col items-center min-w-[80px]">
                            <span className={`font-bold text-lg ${isLowStock ? 'text-red-700' : 'text-slate-700'}`}>
                            {item.quantity} <span className="text-sm font-normal text-slate-500">{item.unit}</span>
                            </span>
                            {isLowStock && (
                            <span className="text-xs text-red-500 font-medium">
                                Faltam {deficit}
                            </span>
                            )}
                        </div>

                        <button 
                          onClick={() => handleQuickAdjust(item.id, 1)}
                          className="text-slate-400 hover:text-green-600 transition-colors"
                          title="Aumentar quantidade"
                        >
                          <PlusCircle size={20} />
                        </button>
                      </div>
                    </td>
                    <td className="p-4">
                        <div className="flex items-center gap-2 text-slate-500 text-sm">
                            {isLowStock ? (
                                <AlertTriangle size={16} className="text-red-500 animate-bounce" />
                            ) : (
                                <div className="w-4" /> 
                            )}
                            Mín: {item.minThreshold}
                        </div>
                    </td>
                    <td className="p-4 text-right space-x-2">
                      <button 
                        type="button"
                        onClick={(e) => { e.stopPropagation(); handleOpenModal(item); }}
                        className="p-2 hover:bg-blue-50 text-blue-600 rounded-lg cursor-pointer"
                        title="Editar detalhes do produto"
                      >
                        <Edit2 size={18} />
                      </button>
                      <button 
                        type="button"
                        onClick={(e) => { e.stopPropagation(); handleDelete(item.id); }}
                        className="p-2 hover:bg-red-200 text-red-600 rounded-lg cursor-pointer"
                        title="Remover produto do sistema"
                      >
                        <Trash2 size={18} />
                      </button>
                    </td>
                  </tr>
                );
              })}
              {filteredInventory.length === 0 && (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-slate-500">
                    Nenhum produto cadastrado. Use o botão acima para adicionar.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showToast && (
        <div className="fixed bottom-6 right-6 z-50 animate-bounce">
          <div className="bg-slate-900 text-white p-4 rounded-xl shadow-2xl flex items-center gap-4 max-w-sm border-l-4 border-red-500">
            <div className="bg-red-500 p-2 rounded-full animate-pulse">
              <BellRing size={24} className="text-white" />
            </div>
            <div className="flex-1">
              <h4 className="font-bold text-sm">Alerta de Estoque!</h4>
              <p className="text-xs text-slate-300 mt-1">
                {criticalItems.length} itens estão abaixo do nível mínimo.
              </p>
            </div>
            <button onClick={() => setShowToast(false)} className="text-slate-400 hover:text-white">
              <X size={18} />
            </button>
          </div>
        </div>
      )}

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md p-6">
            <h3 className="text-xl font-bold text-slate-800 mb-4">
              {editingItem ? 'Editar Produto' : 'Novo Produto'}
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Nome do Produto</label>
                <input 
                  type="text" 
                  className="w-full border border-slate-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-500 outline-none"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="Ex: Arroz Tipo 1"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Quantidade</label>
                  <input 
                    type="number" 
                    className="w-full border border-slate-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-500 outline-none"
                    value={quantity}
                    onChange={e => setQuantity(Number(e.target.value))}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Unidade</label>
                  <select 
                    className="w-full border border-slate-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-500 outline-none"
                    value={unit}
                    onChange={e => setUnit(e.target.value as any)}
                  >
                    <option value="kg">Quilos (kg)</option>
                    <option value="unidade">Unidade</option>
                    <option value="litro">Litro</option>
                    <option value="pacote">Pacote</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Categoria</label>
                  <select 
                    className="w-full border border-slate-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-500 outline-none"
                    value={category}
                    onChange={e => setCategory(e.target.value as any)}
                  >
                    <option value="alimento">Alimento</option>
                    <option value="higiene">Higiene</option>
                    <option value="vestuario">Vestuário</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Estoque Mínimo</label>
                  <input 
                    type="number" 
                    className="w-full border border-slate-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-500 outline-none"
                    value={minThreshold}
                    onChange={e => setMinThreshold(Number(e.target.value))}
                  />
                </div>
              </div>
            </div>

            <div className="flex gap-3 mt-6 justify-end">
              <button 
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg"
              >
                Cancelar
              </button>
              <button 
                onClick={handleSave}
                className="px-4 py-2 bg-blue-900 text-white hover:bg-blue-800 rounded-lg font-medium"
              >
                Salvar Produto
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};