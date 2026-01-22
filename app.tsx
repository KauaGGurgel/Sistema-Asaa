import React, { useState, useEffect } from 'react';
import { Sidebar } from './Componentssidebar';
import { Dashboard } from './Dashboard';
import { PeopleManager } from './PeopleManager';
import { InventoryManager } from './inventoryManager';
import { BasketCalculator } from './basketCalculator';
import { AiAssistant } from './AiAssistant';
import { ViewState, Person, InventoryItem, BasketConfig, DeliveryEvent } from './types';
import { Menu, Loader2, Database, AlertCircle } from 'lucide-react';
import { supabase, isSupabaseConfigured } from './libsupabase';

const INITIAL_PEOPLE: Person[] = [
  { id: '1', name: 'Maria Silva', familySize: 4, address: 'Rua das Oliveiras, 123', phone: '(11) 99999-8888', notes: 'Criança com alergia a lactose', lastBasketDate: '2023-10-01', history: [] },
];
const INITIAL_INVENTORY: InventoryItem[] = [
  { id: '1', name: 'Arroz Tipo 1', quantity: 150, unit: 'kg', category: 'alimento', minThreshold: 50 },
  { id: '2', name: 'Feijão Carioca', quantity: 80, unit: 'kg', category: 'alimento', minThreshold: 30 },
];
const INITIAL_BASKET_CONFIG: BasketConfig = {
  name: 'Cesta Básica Padrão',
  items: [{ itemId: '1', quantityRequired: 5 }, { itemId: '2', quantityRequired: 2 }]
};
const INITIAL_EVENTS: DeliveryEvent[] = [
  { id: '1', title: 'Sábado Solidário', date: new Date().toISOString().split('T')[0], description: 'Distribuição mensal regular' }
];

function loadLocalState<T>(key: string, fallback: T): T {
  try {
    const saved = localStorage.getItem(key);
    if (!saved) return fallback;
    const parsed = JSON.parse(saved);
    if (Array.isArray(fallback) && !Array.isArray(parsed)) return fallback;
    return parsed;
  } catch (e) {
    console.warn(`Erro ao carregar ${key}`, e);
    return fallback;
  }
}

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<ViewState>('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);

  const [people, setPeople] = useState<Person[]>([]);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [basketConfig, setBasketConfig] = useState<BasketConfig>(INITIAL_BASKET_CONFIG);
  const [assembledBaskets, setAssembledBaskets] = useState<number>(0);
  const [events, setEvents] = useState<DeliveryEvent[]>([]);

  const hasSupabase = isSupabaseConfigured();

  useEffect(() => {
    const initData = async () => {
      setIsLoading(true);

      if (hasSupabase && supabase) {
        console.log("Verificando dados no Supabase...");
        try {
          const { data: peopleData } = await supabase.from('beneficiarios').select('*');
          if (peopleData && peopleData.length > 0) {
            setPeople(peopleData as unknown as Person[]);
          } else {
            setPeople(loadLocalState('asa_people', INITIAL_PEOPLE));
          }

          const { data: invData } = await supabase.from('estoque').select('*');
          if (invData && invData.length > 0) {
            setInventory(invData as unknown as InventoryItem[]);
          } else {
            setInventory(loadLocalState('asa_inventory', INITIAL_INVENTORY));
          }

          const { data: eventData } = await supabase.from('eventos_entrega').select('*');
          if (eventData && eventData.length > 0) {
            setEvents(eventData as unknown as DeliveryEvent[]);
          } else {
            setEvents(loadLocalState('asa_events', INITIAL_EVENTS));
          }

          const { data: settingsData } = await supabase.from('configuracoes').select('*');
          let loadedConfig = false;
          let loadedCount = false;

          if (settingsData && settingsData.length > 0) {
const config = settingsData.find((s: { key: string; value: unknown }) => s.key === 'basket_config')?.value;
 const count = settingsData.find((s: { key: string; value: unknown }) => s.key === 'assembled_baskets')?.value;
            
            if (config && typeof config === 'object') {
              setBasketConfig(config as BasketConfig);
              loadedConfig = true;
            }
            if (count !== undefined && count !== null) {
              setAssembledBaskets(Number(count));
              loadedCount = true;
            }
          }

          if (!loadedConfig) setBasketConfig(loadLocalState('asa_basket_config', INITIAL_BASKET_CONFIG));
          if (!loadedCount) setAssembledBaskets(loadLocalState('asa_assembled_baskets', 12));

        } catch (error) {
          console.error("Erro ao conectar com Supabase:", error);
          setPeople(loadLocalState('asa_people', INITIAL_PEOPLE));
          setInventory(loadLocalState('asa_inventory', INITIAL_INVENTORY));
          setBasketConfig(loadLocalState('asa_basket_config', INITIAL_BASKET_CONFIG));
        }
      } else {
        console.log("Supabase não configurado. Usando LocalStorage.");
        setPeople(loadLocalState('asa_people', INITIAL_PEOPLE));
        setInventory(loadLocalState('asa_inventory', INITIAL_INVENTORY));
        setBasketConfig(loadLocalState('asa_basket_config', INITIAL_BASKET_CONFIG));
        setAssembledBaskets(loadLocalState('asa_assembled_baskets', 12));
        setEvents(loadLocalState('asa_events', INITIAL_EVENTS));
      }
      setIsLoading(false);
    };

    initData();
  }, [hasSupabase]);

  useEffect(() => {
    if (isLoading) return;
    
    const saveData = async () => {
      if (hasSupabase && supabase) {
        setIsSyncing(true);
        try {
          if (people.length > 0) {
            await supabase.from('beneficiarios').upsert(people.map(p => ({
              ...p,
              history: p.history || []
            }))); 
          }
          
          if (inventory.length > 0) {
            await supabase.from('estoque').upsert(inventory);
          }

          if (events.length > 0) {
            await supabase.from('eventos_entrega').upsert(events);
          }

          await supabase.from('configuracoes').upsert([
            { key: 'basket_config', value: basketConfig },
            { key: 'assembled_baskets', value: assembledBaskets }
          ]);

        } catch (err) {
          console.error("Erro ao salvar dados:", err);
        } finally {
          setIsSyncing(false);
        }
      } else {
        localStorage.setItem('asa_people', JSON.stringify(people));
        localStorage.setItem('asa_inventory', JSON.stringify(inventory));
        localStorage.setItem('asa_basket_config', JSON.stringify(basketConfig));
        localStorage.setItem('asa_assembled_baskets', JSON.stringify(assembledBaskets));
        localStorage.setItem('asa_events', JSON.stringify(events));
      }
    };

    const timeoutId = setTimeout(saveData, 1000);
    return () => clearTimeout(timeoutId);

  }, [people, inventory, basketConfig, assembledBaskets, events, hasSupabase, isLoading]);


  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="flex h-full items-center justify-center flex-col gap-4 text-slate-500">
          <Loader2 size={48} className="animate-spin text-blue-900" />
          <p>Carregando sistema...</p>
        </div>
      );
    }

    switch (currentView) {
      case 'dashboard':
        return <Dashboard people={people} inventory={inventory} events={events} setEvents={setEvents} />;
      case 'people':
        return <PeopleManager people={people} setPeople={setPeople} />;
      case 'inventory':
        return <InventoryManager inventory={inventory} setInventory={setInventory} />;
      case 'baskets':
        return (
          <BasketCalculator 
            inventory={inventory} 
            setInventory={setInventory}
            basketConfig={basketConfig}
            setBasketConfig={setBasketConfig}
            assembledBaskets={assembledBaskets}
            setAssembledBaskets={setAssembledBaskets}
          />
        );
      case 'ai-assistant':
        return <AiAssistant inventory={inventory} people={people} />;
      default:
        return <Dashboard people={people} inventory={inventory} events={events} setEvents={setEvents} />;
    }
  };

  return (
    <div className="flex h-screen bg-slate-100 font-sans text-slate-900 overflow-hidden">
      <Sidebar 
        currentView={currentView} 
        setCurrentView={setCurrentView} 
        isOpen={isSidebarOpen}
        setIsOpen={setIsSidebarOpen}
      />
      
      <div className="flex-1 flex flex-col h-full overflow-hidden relative">
        {hasSupabase && (
          <div className="absolute top-4 right-4 z-50 pointer-events-none">
            {isSyncing ? (
               <span className="flex items-center gap-2 bg-white/80 backdrop-blur px-3 py-1 rounded-full text-xs font-medium text-blue-600 shadow-sm border border-blue-100">
                  <Loader2 size={12} className="animate-spin" /> Salvando...
               </span>
            ) : (
               <span className="flex items-center gap-2 bg-white/50 backdrop-blur px-3 py-1 rounded-full text-xs font-medium text-green-600 border border-green-100 opacity-0 transition-opacity duration-1000 data-[saved=true]:opacity-100">
                  <Database size={12} /> Salvo
               </span>
            )}
          </div>
        )}

        {!hasSupabase && !isLoading && (
          <div className="bg-yellow-50 px-4 py-2 text-xs text-yellow-800 border-b border-yellow-200 flex justify-center items-center gap-2">
            <AlertCircle size={14} />
            <span>Modo Offline (LocalStorage). Configure o Supabase e o .env para backup na nuvem.</span>
          </div>
        )}

        <header className="md:hidden bg-blue-900 text-white p-4 flex items-center justify-between shadow-md">
          <div className="flex items-center gap-2">
             <div className="font-bold text-lg text-yellow-400">ASA</div>
             <div className="text-sm opacity-80">Gestão Assistencial</div>
          </div>
          <button onClick={() => setIsSidebarOpen(true)}>
            <Menu size={24} />
          </button>
        </header>

        <main className="flex-1 overflow-y-auto">
          {renderContent()}
        </main>
      </div>
    </div>
  );
};

export default App;