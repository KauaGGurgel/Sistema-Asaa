import { GoogleGenAI } from "@google/genai";
import { InventoryItem } from "./types";

// Safety check for API Key
const apiKey = process.env.API_KEY;
const ai = apiKey ? new GoogleGenAI({ apiKey }) : null;

export const generateSpiritualMessage = async (familyContext: string): Promise<string> => {
  if (!ai) {
    console.warn("API Key do Gemini não encontrada. Retornando mensagem padrão.");
    return "Deus é o nosso refúgio e fortaleza, socorro bem presente na angústia. (Salmos 46:1) [Modo Offline]";
  }

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Escreva uma mensagem curta, encorajadora e espiritual (baseada na Bíblia e no estilo da Igreja Adventista do Sétimo Dia) para uma família que está recebendo uma cesta básica. Contexto da família: ${familyContext}. A mensagem deve ter no máximo 300 caracteres.`,
    });
    return response.text || "Deus proverá todas as suas necessidades.";
  } catch (error) {
    console.error("Erro ao gerar mensagem:", error);
    return "Que a paz de Deus esteja com sua família.";
  }
};

export const suggestRecipe = async (inventory: InventoryItem[]): Promise<string> => {
  if (!ai) {
    return "Receita indisponível (Configure a API Key no arquivo .env)";
  }

  try {
    const availableItems = inventory.map(i => `${i.quantity} ${i.unit} de ${i.name}`).join(', ');
    
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Com base nos seguintes itens disponíveis no estoque da igreja: ${availableItems}. Sugira uma receita simples, nutritiva e econômica que podemos imprimir para colocar dentro da cesta básica. Inclua um título e modo de preparo resumido.`,
    });
    return response.text || "Receita não disponível no momento.";
  } catch (error) {
    console.error("Erro ao gerar receita:", error);
    return "Consulte a equipe de cozinha para sugestões.";
  }
};