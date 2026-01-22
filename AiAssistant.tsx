import React, { useState } from 'react';
import { generateSpiritualMessage, suggestRecipe } from './servicesgeminiService';
import { InventoryItem, Person } from './types';
import { Sparkles, BookOpen, Utensils, Loader2, Copy, Check } from 'lucide-react';

interface AiAssistantProps {
  inventory: InventoryItem[];
  people: Person[];
}

export const AiAssistant: React.FC<AiAssistantProps> = ({ inventory, people }) => {
  const [activeTab, setActiveTab] = useState<'message' | 'recipe'>('message');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState('');
  const [selectedPersonId, setSelectedPersonId] = useState('');
  const [copied, setCopied] = useState(false);

  const handleGenerateMessage = async () => {
    if (!selectedPersonId) return;
    const person = people.find(p => p.id === selectedPersonId);
    if (!person) return;

    setLoading(true);
    setResult('');
    const context = `Família de ${person.name}, ${person.familySize} pessoas. Observações: ${person.notes || 'Nenhuma'}.`;
    
    try {
      const msg = await generateSpiritualMessage(context);
      setResult(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateRecipe = async () => {
    setLoading(true);
    setResult('');
    try {
      const recipe = await suggestRecipe(inventory);
      setResult(recipe);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(result);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="p-6 bg-slate-50 min-h-full">
      <div className="mb-6 flex items-center gap-3">
        <div className="bg-yellow-100 p-2 rounded-lg">
            <Sparkles className="text-yellow-600" size={24} />
        </div>
        <div>
            <h2 className="text-2xl font-bold text-slate-800">Assistente Inteligente ASA</h2>
            <p className="text-slate-600">Utilize IA para enriquecer o atendimento às famílias.</p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden min-h-[500px] flex flex-col md:flex-row">
        <div className="w-full md:w-1/3 border-r border-slate-100 bg-slate-50 p-6 flex flex-col gap-6">
            
            <div className="flex gap-2 p-1 bg-slate-200 rounded-lg">
                <button 
                    onClick={() => { setActiveTab('message'); setResult(''); }}
                    className={`flex-1 flex items-center justify-center gap-2 py-2 text-sm font-medium rounded-md transition-all ${activeTab === 'message' ? 'bg-white text-blue-900 shadow' : 'text-slate-600'}`}
                >
                    <BookOpen size={16} /> Mensagem
                </button>
                <button 
                    onClick={() => { setActiveTab('recipe'); setResult(''); }}
                    className={`flex-1 flex items-center justify-center gap-2 py-2 text-sm font-medium rounded-md transition-all ${activeTab === 'recipe' ? 'bg-white text-blue-900 shadow' : 'text-slate-600'}`}
                >
                    <Utensils size={16} /> Receita
                </button>
            </div>

            <div className="flex-1">
                {activeTab === 'message' ? (
                    <div className="space-y-4 animate-fadeIn">
                        <label className="block text-sm font-medium text-slate-700">Selecione a Família</label>
                        <select 
                            className="w-full border border-slate-300 rounded-lg p-2.5 bg-white focus:ring-2 focus:ring-blue-500 outline-none"
                            value={selectedPersonId}
                            onChange={(e) => setSelectedPersonId(e.target.value)}
                        >
                            <option value="">Selecione...</option>
                            {people.map(p => (
                                <option key={p.id} value={p.id}>{p.name} ({p.familySize} pessoas)</option>
                            ))}
                        </select>
                        <p className="text-xs text-slate-500">
                            A IA irá gerar uma mensagem espiritual personalizada baseada no contexto da família para ser entregue junto com a cesta.
                        </p>
                        <button 
                            disabled={!selectedPersonId || loading}
                            onClick={handleGenerateMessage}
                            className="w-full py-3 bg-blue-900 text-white rounded-lg font-medium hover:bg-blue-800 disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center gap-2"
                        >
                            {loading ? <Loader2 className="animate-spin" /> : <Sparkles size={18} />}
                            Gerar Mensagem
                        </button>
                    </div>
                ) : (
                    <div className="space-y-4 animate-fadeIn">
                        <p className="text-sm text-slate-600">
                            A IA irá analisar os itens disponíveis no estoque atual ({inventory.length} tipos de itens) e sugerir uma receita econômica e nutritiva.
                        </p>
                         <button 
                            disabled={loading || inventory.length === 0}
                            onClick={handleGenerateRecipe}
                            className="w-full py-3 bg-blue-900 text-white rounded-lg font-medium hover:bg-blue-800 disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center gap-2"
                        >
                            {loading ? <Loader2 className="animate-spin" /> : <Utensils size={18} />}
                            Sugerir Receita
                        </button>
                    </div>
                )}
            </div>
        </div>

        <div className="flex-1 p-8 bg-white flex flex-col relative">
            {result ? (
                <>
                    <div className="absolute top-4 right-4">
                        <button 
                            onClick={copyToClipboard}
                            className="p-2 hover:bg-slate-100 rounded-full text-slate-500 transition-colors"
                            title="Copiar texto"
                        >
                            {copied ? <Check className="text-green-600" /> : <Copy />}
                        </button>
                    </div>
                    <div className="prose max-w-none text-slate-800 leading-relaxed whitespace-pre-wrap">
                        {result}
                    </div>
                    {activeTab === 'message' && (
                        <div className="mt-8 pt-6 border-t border-slate-100 text-center">
                            <p className="text-sm text-slate-400 italic">"Pois eu tive fome, e me destes de comer..." - Mateus 25:35</p>
                        </div>
                    )}
                </>
            ) : (
                <div className="h-full flex flex-col items-center justify-center text-slate-300">
                    {loading ? (
                        <div className="text-center">
                            <Loader2 size={48} className="animate-spin text-blue-900 mx-auto mb-4" />
                            <p className="text-slate-500">Consultando inteligência...</p>
                        </div>
                    ) : (
                        <>
                            <div className="mb-4 p-4 bg-slate-50 rounded-full">
                                <Sparkles size={32} />
                            </div>
                            <p>O resultado aparecerá aqui</p>
                        </>
                    )}
                </div>
            )}
        </div>
      </div>
    </div>
  );
};
