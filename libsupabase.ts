import { createClient } from '@supabase/supabase-js';

// Credenciais fornecidas manualmente para migração (Backup)
const PROVIDED_URL = 'https://zdqrbjgtawigfzrlctsj.supabase.co';
const PROVIDED_KEY = 'sb_publishable_vP_QL9QGPmz2OdXA4xQZgw_4gzuhzTL';

// Função segura para ler variáveis de ambiente sem quebrar a aplicação
const getEnv = (key: string) => {
  try {
    // @ts-ignore
    if (typeof import.meta !== 'undefined' && import.meta.env) {
      // @ts-ignore
      return import.meta.env[key];
    }
  } catch (e) {
    // Ignora erros de acesso
  }
  
  try {
    if (typeof process !== 'undefined' && process.env) {
      return process.env[key];
    }
  } catch (e) {
    // Ignora erros de acesso
  }

  return '';
};

// Usa a credencial fornecida OU a variável de ambiente
const SUPABASE_URL = PROVIDED_URL || getEnv('VITE_SUPABASE_URL') || ''; 
const SUPABASE_ANON_KEY = PROVIDED_KEY || getEnv('VITE_SUPABASE_ANON_KEY') || '';

const isValidConfig = SUPABASE_URL.startsWith('http') && SUPABASE_ANON_KEY.length > 0;

if (!isValidConfig) {
  console.warn('⚠️ Supabase não conectado corretamente.');
}

// Exporta a instância ou null se não configurado
export const supabase = isValidConfig
  ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
  : null;

// Helper para verificar se está ativo
export const isSupabaseConfigured = () => !!supabase;