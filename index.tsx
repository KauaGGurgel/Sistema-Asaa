import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './app';
import './index.css';

console.log('Iniciando aplicação ASA...');

const rootElement = document.getElementById('root');
if (!rootElement) {
  console.error("ERRO CRÍTICO: Elemento 'root' não encontrado no HTML.");
  throw new Error("Could not find root element to mount to");
}

try {
  const root = ReactDOM.createRoot(rootElement);
  root.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
  console.log('Aplicação renderizada com sucesso.');
} catch (error) {
  console.error('Erro ao renderizar a aplicação:', error);
}