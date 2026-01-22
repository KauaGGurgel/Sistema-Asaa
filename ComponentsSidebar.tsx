import React, { useState } from 'react';
import { LayoutDashboard, Users, Package, ShoppingBasket, HeartHandshake, X } from 'lucide-react';
import { ViewState } from './types';

interface SidebarProps {
  currentView: ViewState;
  setCurrentView: (view: ViewState) => void;
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ currentView, setCurrentView, isOpen, setIsOpen }) => {
  const [imgError, setImgError] = useState(false);

  const menuItems = [
    { id: 'dashboard', label: 'Visão Geral', icon: LayoutDashboard },
    { id: 'people', label: 'Beneficiários', icon: Users },
    { id: 'inventory', label: 'Estoque (Despensa)', icon: Package },
    { id: 'baskets', label: 'Cestas Básicas', icon: ShoppingBasket },
    { id: 'ai-assistant', label: 'Assistente ASA', icon: HeartHandshake },
  ];

  const logoUrl = "https://www.adventistas.org/pt/asa/wp-content/uploads/sites/6/2013/05/logo_asa_cor.png";

  return (
    <>
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-20 md:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      <div className={`
        fixed inset-y-0 left-0 z-30 w-64 bg-slate-900 text-white transform transition-transform duration-300 ease-in-out
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
        md:relative md:translate-x-0 flex flex-col h-full border-r border-slate-700 shadow-xl
      `}>
        <div className="p-6 flex items-center justify-between border-b border-slate-700 bg-slate-950">
          <div className="flex items-center gap-3">
            <div className="relative w-12 h-12 flex items-center justify-center bg-white rounded-lg p-1 overflow-hidden shadow-md shrink-0">
               {!imgError ? (
                 <img 
                   src={logoUrl}
                   alt="Logo ASA"
                   className="w-full h-full object-contain"
                   onError={() => setImgError(true)}
                 />
               ) : (
                 <HeartHandshake className="text-yellow-500" size={32} />
               )}
            </div>
            <div>
              <h1 className="font-bold text-lg text-white leading-tight">ASA</h1>
              <p className="text-xs text-slate-400">Gestão Solidária</p>
            </div>
          </div>
          <button onClick={() => setIsOpen(false)} className="md:hidden text-slate-400 hover:text-white">
            <X size={24} />
          </button>
        </div>

        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentView === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  setCurrentView(item.id as ViewState);
                  setIsOpen(false);
                }}
                className={`
                  w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200
                  ${isActive 
                    ? 'bg-blue-900 text-yellow-400 font-medium shadow-md' 
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                  }
                `}
              >
                <Icon size={20} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        <div className="p-4 border-t border-slate-700 bg-slate-950 text-center">
          <p className="text-xs text-slate-500">
            "Sempre que o fizestes a um destes meus pequeninos irmãos, a mim o fizestes."
            <br/>Mateus 25:40
          </p>
        </div>
      </div>
    </>
  );
};