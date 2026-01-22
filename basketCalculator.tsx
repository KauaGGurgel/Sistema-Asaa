import React, { useState, useMemo, useEffect } from 'react';
import { InventoryItem, BasketConfig } from './types';
import { Package, ShoppingBag, AlertCircle, Plus, Trash2, RefreshCw, Calculator, Check, ArrowRight, Edit2, Save, X } from 'lucide-react';

interface BasketCalculatorProps {
  inventory: InventoryItem[];
  setInventory: (items: InventoryItem[]) => void;
  basketConfig: BasketConfig;
  setBasketConfig: (config: BasketConfig) => void;
  assembledBaskets: number;
  setAssembledBaskets: (count: number) => void;
}

export const BasketCalculator: React.FC<BasketCalculatorProps> = ({ 
  inventory, 
  setInventory, 
  basketConfig, 
  setBasketConfig,
  assembledBaskets,
  setAssembledBaskets
}) => {
  const [amountToAssemble, setAmountToAssemble] = useState<number>(1);
  const [selectedAddItem, setSelectedAddItem] = useState<string>('');
  const [showSuccess, setShowSuccess] = useState(false);

  const [isEditingCount, setIsEditingCount] = useState(false);
  const [manualCount, setManualCount] = useState(assembledBaskets);

  useEffect(() => {
    setManualCount(assembledBaskets);
  }, [assembledBaskets]);

  const handleSaveManualCount = () => {
    const newCount = Math.max(0, manualCount);
    setAssembledBaskets(newCount);
    setIsEditingCount(false);
  };

  const basketStats = useMemo(() => {
    if (basketConfig.items.length === 0) return { maxPossible: 0, limitingItem: null, itemDetails: [] };

    const details = basketConfig.items.map((configItem: typeof basketConfig.items[0]) => {
      const inventoryItem = inventory.find(i => i.id === configItem.itemId);
      const stock = inventoryItem?.quantity || 0;
      const required = configItem.quantityRequired;
      const supportable = required > 0 ? Math.floor(stock / required) : 999999;
      
      return {
        ...configItem,
        name: inventoryItem?.name || 'Item desconhecido',
        unit: inventoryItem?.unit || '',
        currentStock: stock,
        supportable
      };
    });

    const maxPossible = Math.min(...details.map((d: typeof details[0]) => d.supportable));
    const limitingItem = details.find((d: typeof details[0]) => d.supportable === maxPossible);

    return { maxPossible, limitingItem, itemDetails: details };
  }, [basketConfig, inventory]);

  const handleUpdateQuantity = (itemId: string, newQty: number) => {
    const updatedItems = basketConfig.items.map((item: typeof basketConfig.items[0]) => 
      item.itemId === itemId ? { ...item, quantityRequired: Math.max(0.1, newQty) } : item
    );
    setBasketConfig({ ...basketConfig, items: updatedItems });
  };

  const handleRemoveItem = (itemId: string) => {
    if (window.confirm('Remover este item da configuração da cesta?')) {
      setBasketConfig({
        ...basketConfig,
        items: basketConfig.items.filter((item: typeof basketConfig.items[0]) => item.itemId !== itemId)
      });
    }
  };

  const handleClearBasket = () => {
    if (window.confirm('Tem certeza que deseja remover todos os itens da configuração da cesta?')) {
      setBasketConfig({ ...basketConfig, items: [] });
    }
  };

  const handleAddItem = () => {
    if (!selectedAddItem) return;
    setBasketConfig({
      ...basketConfig,
      items: [...basketConfig.items, { itemId: selectedAddItem, quantityRequired: 1 }]
    });
    setSelectedAddItem('');
  };

  const handleAssemble = () => {
    const count = Number(amountToAssemble);
    if (count <= 0 || count > basketStats.maxPossible) return;

    const newInventory = inventory.map(invItem => {
      const configItem = basketConfig.items.find((ci: typeof basketConfig.items[0]) => ci.itemId === invItem.id);
      if (configItem) {
        return { ...invItem, quantity: invItem.quantity - (configItem.quantityRequired * count) };
      }
      return invItem;
    });

    setInventory(newInventory);
    setAssembledBaskets(assembledBaskets + count);
    setAmountToAssemble(1);
    
    setShowSuccess(true);
    setTimeout(() => setShowSuccess(false), 2000);
  };

  const availableToAdd = inventory.filter(
    i => !basketConfig.items.some((b: typeof basketConfig.items[0]) => b.itemId === i.id)
  );

  return (
    <div className="p-6 bg-slate-50 min-h-full">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
          <ShoppingBag className="text-blue-900" /> 
          Montagem de Cestas
        </h2>
        <p className="text-slate-600">Configure a cesta padrão e registre a montagem deduzindo do estoque.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        <div className="lg:col-span-7 space-y-6">
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            
            <div className="p-4 bg-slate-100 border-b border-slate-200 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div className="flex items-center gap-2 w-full sm:w-auto flex-1">
                 <div className="p-1.5 bg-white rounded text-slate-400 shadow-sm shrink-0">
                    <Edit2 size={16} />
                 </div>
                 <input 
                    type="text" 
                    value={basketConfig.name}
                    onChange={(e) => setBasketConfig({...basketConfig, name: e.target.value})}
                    placeholder="Nome da Cesta (ex: Cesta Padrão)"
                    className="font-bold text-slate-700 bg-transparent border-b-2 border-transparent focus:border-blue-500 hover:border-slate-300 outline-none transition-all w-full sm:max-w-md placeholder-slate-400"
                 />
              </div>

              <div className="flex items-center gap-2 self-end sm:self-auto">
                {basketConfig.items.length > 0 && (
                  <button 
                    type="button"
                    onClick={(e) => { e.stopPropagation(); handleClearBasket(); }}
                    className="text-xs font-bold text-red-600 hover:text-red-800 hover:bg-red-50 px-3 py-1 rounded-lg transition-colors border border-transparent hover:border-red-200 cursor-pointer"
                  >
                    Limpar Tudo
                  </button>
                )}
                <span className="text-xs font-medium text-slate-500 bg-white px-2 py-1 rounded border border-slate-200 whitespace-nowrap">
                  {basketConfig.items.length} itens
                </span>
              </div>
            </div>
            
            <div className="divide-y divide-slate-100">
              {basketStats.itemDetails.map((item: typeof basketStats.itemDetails[0]) => (
                <div key={item.itemId} className="p-4 flex items-center gap-4 hover:bg-slate-50 transition-colors group">
                  <div className={`w-1.5 h-12 rounded-full ${item.supportable === basketStats.maxPossible ? 'bg-orange-400' : 'bg-green-400'}`} title={item.supportable === basketStats.maxPossible ? "Item Limitante" : "Estoque Saudável"} />
                  
                  <div className="flex-1">
                    <div className="flex justify-between items-start mb-1">
                      <span className="font-semibold text-slate-800">{item.name}</span>
                      <span className="text-xs text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                        Estoque: {item.currentStock} {item.unit}
                      </span>
                    </div>
                    
                    <div className="flex items-center gap-4 text-sm">
                      <div className="flex items-center gap-2 bg-white border border-slate-300 rounded-lg px-2 py-1">
                        <span className="text-slate-500 text-xs">Qtd na cesta:</span>
                        <input 
                          type="number" 
                          min="0.1" 
                          step="0.5"
                          value={item.quantityRequired}
                          onChange={(e) => handleUpdateQuantity(item.itemId, Number(e.target.value))}
                          className="w-16 font-bold text-slate-800 outline-none text-right bg-transparent"
                        />
                        <span className="text-slate-400 text-xs">{item.unit}</span>
                      </div>
                      
                      <span className={`text-xs font-medium ${item.supportable === basketStats.maxPossible ? 'text-orange-600' : 'text-green-600'}`}>
                        Dá para {item.supportable} cestas
                      </span>
                    </div>
                  </div>

                  <button 
                    type="button"
                    onClick={(e) => { e.stopPropagation(); handleRemoveItem(item.itemId); }}
                    className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors cursor-pointer"
                    title="Remover item da cesta"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              ))}

              {basketConfig.items.length === 0 && (
                <div className="p-8 text-center text-slate-400">
                  <ShoppingBag size={48} className="mx-auto mb-2 opacity-20" />
                  <p>Nenhum item definido na cesta.</p>
                </div>
              )}

              <div className="p-4 bg-white border-t border-slate-100 flex gap-2">
                <select 
                  value={selectedAddItem}
                  onChange={(e) => setSelectedAddItem(e.target.value)}
                  className="flex-1 border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                >
                  <option value="">Adicionar produto à cesta...</option>
                  {availableToAdd.map(i => (
                    <option key={i.id} value={i.id}>{i.name} ({i.unit})</option>
                  ))}
                </select>
                <button 
                  onClick={handleAddItem}
                  disabled={!selectedAddItem}
                  className="bg-blue-900 text-white px-4 py-2 rounded-lg hover:bg-blue-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <Plus size={20} />
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="lg:col-span-5 space-y-6">
          
          <div className="grid grid-cols-2 gap-4">
             <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 flex flex-col justify-between">
                <p className="text-xs text-slate-500 font-semibold uppercase">Cestas Prontas</p>
                
                {isEditingCount ? (
                   <div className="mt-2 animate-fadeIn">
                      <input 
                        type="number" 
                        min="0"
                        className="w-full border border-blue-300 rounded p-1 text-2xl font-bold text-slate-800 mb-2 focus:ring-2 focus:ring-blue-500 outline-none"
                        value={manualCount}
                        onChange={(e) => setManualCount(Number(e.target.value))}
                      />
                      <div className="flex gap-2">
                         <button onClick={handleSaveManualCount} className="flex-1 bg-green-100 text-green-700 hover:bg-green-200 py-1 rounded text-xs font-bold flex items-center justify-center">
                            <Save size={14} className="mr-1" /> Salvar
                         </button>
                         <button onClick={() => setIsEditingCount(false)} className="flex-1 bg-slate-100 text-slate-700 hover:bg-slate-200 py-1 rounded text-xs font-bold flex items-center justify-center">
                            <X size={14} className="mr-1" /> Cancelar
                         </button>
                      </div>
                   </div>
                ) : (
                   <div className="flex items-end justify-between mt-1 group cursor-pointer" onClick={() => setIsEditingCount(true)} title="Clique para editar manualmente">
                      <div className="flex items-end gap-2">
                         <span className="text-3xl font-bold text-slate-800">{assembledBaskets}</span>
                         <Package className="text-blue-500 mb-1" size={20} />
                      </div>
                      <div className="opacity-0 group-hover:opacity-100 transition-opacity bg-slate-100 p-1.5 rounded-full text-slate-400 hover:text-blue-600">
                         <Edit2 size={14} />
                      </div>
                   </div>
                )}
             </div>

             <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
                <p className="text-xs text-slate-500 font-semibold uppercase">Pode Montar</p>
                <div className="flex items-end gap-2 mt-1">
                   <span className="text-3xl font-bold text-green-600">{basketStats.maxPossible}</span>
                   <Calculator className="text-green-500 mb-1" size={20} />
                </div>
             </div>
          </div>

          {basketStats.limitingItem && basketStats.maxPossible < 100 && (
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-3 flex items-start gap-3">
              <AlertCircle className="text-orange-500 shrink-0 mt-0.5" size={18} />
              <div>
                <p className="text-sm font-bold text-orange-800">Estoque Limitante</p>
                <p className="text-xs text-orange-700 mt-1">
                  O item <strong>{basketStats.limitingItem.name}</strong> é o que impede a montagem de mais cestas no momento.
                </p>
              </div>
            </div>
          )}

          <div className="bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden">
             <div className="p-4 bg-slate-900 text-white">
                <h3 className="font-bold flex items-center gap-2">
                   <RefreshCw size={18} className="text-yellow-400" /> 
                   Produção: <span className="font-normal opacity-90 text-sm ml-auto">{basketConfig.name}</span>
                </h3>
             </div>
             <div className="p-6">
                <label className="block text-sm font-medium text-slate-600 mb-2">Quantas cestas deseja montar?</label>
                <div className="flex items-center gap-2 mb-4">
                   <button 
                     onClick={() => setAmountToAssemble(Math.max(1, amountToAssemble - 1))}
                     className="w-10 h-10 rounded-lg border border-slate-300 flex items-center justify-center hover:bg-slate-50 bg-white"
                   >
                     -
                   </button>
                   <input 
                     type="number" 
                     className="flex-1 h-10 text-center border border-slate-300 rounded-lg font-bold text-lg bg-white"
                     value={amountToAssemble}
                     onChange={(e) => setAmountToAssemble(Number(e.target.value))}
                   />
                   <button 
                     onClick={() => setAmountToAssemble(amountToAssemble + 1)}
                     className="w-10 h-10 rounded-lg border border-slate-300 flex items-center justify-center hover:bg-slate-50 bg-white"
                   >
                     +
                   </button>
                </div>
                
                <button 
                  onClick={handleAssemble}
                  disabled={amountToAssemble <= 0 || amountToAssemble > basketStats.maxPossible}
                  className={`
                    w-full py-3 rounded-lg font-bold shadow-md disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2
                    ${showSuccess ? 'bg-green-500 text-white scale-105' : 'bg-green-600 hover:bg-green-700 text-white'}
                  `}
                >
                  {showSuccess ? (
                    <>Montada com Sucesso! <Check size={20} /></>
                  ) : (
                    <>Confirmar Montagem <ArrowRight size={20} /></>
                  )}
                </button>
                <p className="text-center text-xs text-slate-400 mt-3">
                  Clique para deduzir itens do estoque e contabilizar cesta pronta.
                </p>
             </div>
          </div>

        </div>
      </div>
    </div>
  );
};