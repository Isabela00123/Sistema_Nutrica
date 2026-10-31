import { GoogleGenerativeAI } from '@google/generative-ai';
import type { IncomingMessage, ServerResponse } from 'http';
import dotenv from 'dotenv';
import path from 'path';

// Ensure .env and .env.local are loaded
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY || '';

export async function handleGerarPlano(req: IncomingMessage, res: ServerResponse) {
  if (req.method !== 'POST') {
    res.statusCode = 405;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ error: 'Método não permitido. Use POST.' }));
    return;
  }

  let bodyStr = '';
  req.on('data', (chunk) => {
    bodyStr += chunk;
  });

  req.on('end', async () => {
    try {
      const { paciente } = JSON.parse(bodyStr || '{}');

      if (!paciente) {
        res.statusCode = 400;
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({ error: 'Dados do paciente são obrigatórios.' }));
        return;
      }

      if (!GEMINI_API_KEY) {
        res.statusCode = 500;
        res.setHeader('Content-Type', 'application/json');
        res.end(
          JSON.stringify({
            error:
              'Chave GEMINI_API_KEY não configurada no servidor. Por favor, adicione GEMINI_API_KEY nas variáveis de ambiente.',
          })
        );
        return;
      }

      const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);

      // Setup Gemini with responseSchema to guarantee Structured Output JSON
      // Helper to create the model with a given version
function createModel(version: string) {
  return genAI.getGenerativeModel({
    model: version,
    generationConfig: {
      responseMimeType: 'application/json'
    }
  });
}

// Retry logic with fallback
async function generateContentWithRetry(prompt: string) {
  const attempts = 3;
  const delay = (ms: number) => new Promise(res => setTimeout(res, ms));
  let lastError: any = null;
  // First try the newer model, then fallback
  const versions = ['gemini-3.8-flash', 'gemini-1.5-flash'];
  for (const version of versions) {
    const model = createModel(version);
    for (let i = 0; i < attempts; i++) {
      try {
        const result = await model.generateContent(prompt);
        return result;
      } catch (err: any) {
        // If it's a 503, retry after backoff
        if (err?.message?.includes('503')) {
          lastError = err;
          await delay(1000 * Math.pow(2, i)); // exponential backoff
          continue;
        }
        // Non-retriable error, rethrow
        throw err;
      }
    }
    // If all attempts for this version failed, move to next version
  }
  // If we get here, all retries failed
  throw lastError;
}

      // Prepare Patient Context summary
      const dadosDoPaciente = `
Nome: ${paciente.nome || 'Paciente'}
Idade: ${paciente.data_nascimento || 'Não informada'}
Sexo: ${paciente.sexo || 'Não informado'}
Peso atual: ${paciente.peso_inicial ? `${paciente.peso_inicial} kg` : 'Não informado'}
Altura: ${paciente.altura ? `${paciente.altura} cm` : 'Não informada'}
Objetivos Clínicos: ${
        paciente.objetivos?.join(', ') || paciente.objetivo_texto || 'Melhora da saúde e hábitos'
      }
Nível de Atividade Física: ${paciente.nivel_atividade || 'Não informado'}
Pratica atividade física: ${
        paciente.atividade_fisica
          ? `Sim (${paciente.atividade_fisica_descricao || 'Regular'})`
          : 'Não'
      }
Patologias diagnosticadas: ${paciente.patologias?.join(', ') || 'Nenhuma'}
Restrições Alimentares: ${paciente.restricoes_alimentares?.join(', ') || 'Nenhuma'}
Alergias Alimentares: ${paciente.alergias?.join(', ') || 'Nenhuma'}
Rotina de sono: Acorda às ${paciente.horario_acorda || '07:00'}, dorme às ${
        paciente.horario_dorme || '22:30'
      }
Consumo de água: ${paciente.litros_agua ? `${paciente.litros_agua}L/dia` : 'Não informado'}
Refeições habituais por dia: ${paciente.refeicoes_por_dia || 5}
Observações gerais: ${paciente.observacoes || 'Nenhuma'}
`.trim();

      const prompt = `
Você é um nutricionista clínico profissional especialista na culinária e rotina brasileira.
Gere um plano alimentar semanal completo, saudável e diversificado com base nos dados do paciente fornecidos abaixo.

Dados do Paciente (Metas, Alergias, Restrições e Histórico):
${dadosDoPaciente}

# Regras Críticas de Execução:
- Você deve responder APENAS e estritamente o objeto JSON solicitado.
- Não inclua blocos de código markdown (como \`\`\`json ... \`\`\`), explicações, introduções ou textos complementares.
- Adapte o cardápio rigorosamente a quaisquer alergias ou restrições descritas nos dados.
- Utilize alimentos comuns, acessíveis e culturalmente aceitos no Brasil.
- Evite repetições monótonas de alimentos nos dias seguidos.

O formato do JSON retornado deve seguir exatamente esta estrutura:
{
  "plano_semanal": [
    {
      "dia": "Segunda-feira",
      "refeicoes": {
        "cafe_da_manha": ["Opção 1", "Opção 2", "Opção 3", "Opção 4", "Opção 5"],
        "lanche_manha": ["Opção 1", "Opção 2", "Opção 3", "Opção 4", "Opção 5"],
        "almoco": ["Opção 1", "Opção 2", "Opção 3", "Opção 4", "Opção 5"],
        "lanche_tarde": ["Opção 1", "Opção 2", "Opção 3", "Opção 4", "Opção 5"],
        "jantar": ["Opção 1", "Opção 2", "Opção 3", "Opção 4", "Opção 5"]
      }
    }
  ]
}
`.trim();

      const result = await generateContentWithRetry(prompt);
      let responseText = result.response.text();
      // If Gemini returns an empty string, treat it as an error to trigger retry logic
      if (!responseText || responseText.trim() === '') {
        throw new Error('Empty response from Gemini model');
      }

      // Ensure valid JSON parsing
      const jsonParsed = JSON.parse(responseText);

      res.statusCode = 200;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify(jsonParsed));
    } catch (err: unknown) {
      console.error('Erro na função gerar-plano:', err);
      res.statusCode = 500;
      res.setHeader('Content-Type', 'application/json');
      const message =
        err instanceof Error ? err.message : 'Falha ao processar solicitação com IA.';
      res.end(JSON.stringify({ error: message }));
    }
  });
}

export default handleGerarPlano;
