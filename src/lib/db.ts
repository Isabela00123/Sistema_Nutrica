import { neon } from '@neondatabase/serverless';

const DATABASE_URL = import.meta.env.VITE_NEON_DATABASE_URL || '';

// Create Neon serverless HTTP client
export const sql = neon(DATABASE_URL);

export interface OverduePatient {
  id: string;
  nome: string;
  email: string | null;
  whatsapp: string | null;
  ultima_consulta: string;
  proximo_retorno: string | null;
  dias_desde_ultima: number;
}

export interface DashboardStats {
  totalPacientes: number;
  consultasSemana: number;
  pacientesSemRetorno: OverduePatient[];
}

export interface Paciente {
  id: string;
  nutricionista_id: string;
  nome: string;
  data_nascimento?: string;
  sexo?: string;
  whatsapp?: string;
  email?: string;
  peso_inicial?: number;
  altura?: number;
  objetivos?: string[];
  objetivo_texto?: string;
  nivel_atividade?: string;
  patologias?: string[];
  restricoes_alimentares?: string[];
  alergias?: string[];
  medicamentos?: string;
  suplementos?: string;
  refeicoes_por_dia?: number;
  horario_acorda?: string;
  horario_dorme?: string;
  litros_agua?: number;
  atividade_fisica?: boolean;
  atividade_fisica_descricao?: string;
  observacoes?: string;
  created_at?: string;
}

export interface Consulta {
  id: string;
  paciente_id: string;
  data_consulta: string;
  peso?: number;
  cintura?: number;
  quadril?: number;
  percentual_gordura?: number;
  observacoes?: string;
  proximo_retorno?: string;
  created_at?: string;
}

/**
 * Finds or ensures a nutricionista record exists in the public.nutricionistas table
 * matching the authenticated user.
 */
export async function getOrCreateNutricionistaId(userId: string, userEmail: string, userName: string): Promise<string> {
  try {
    // 1. Try finding by email
    const rowsByEmail = await sql.query(
      'SELECT id FROM nutricionistas WHERE LOWER(email) = LOWER($1) LIMIT 1',
      [userEmail]
    ) as { id: string }[];

    if (rowsByEmail && rowsByEmail.length > 0) {
      return rowsByEmail[0].id;
    }

    // 2. Try finding by id
    const rowsById = await sql.query(
      'SELECT id FROM nutricionistas WHERE id::text = $1 LIMIT 1',
      [userId]
    ) as { id: string }[];

    if (rowsById && rowsById.length > 0) {
      return rowsById[0].id;
    }

    // 3. Insert new record
    const inserted = await sql.query(
      'INSERT INTO nutricionistas (nome, email) VALUES ($1, $2) RETURNING id',
      [userName || 'Nutricionista', userEmail]
    ) as { id: string }[];

    if (inserted && inserted.length > 0) {
      return inserted[0].id;
    }
  } catch (error) {
    console.warn('Erro ao verificar/inserir nutricionista:', error);
  }

  return userId;
}

/**
 * Loads real-time Dashboard statistics for the authenticated nutritionist.
 */
export async function fetchDashboardData(nutricionistaId: string): Promise<DashboardStats> {
  try {
    // 1. Card 1 — Total de pacientes ativos cadastrados pela nutricionista logada
    const pacientesCountResult = await sql.query(
      'SELECT COUNT(*)::int AS total FROM pacientes WHERE nutricionista_id = $1',
      [nutricionistaId]
    ) as { total: number }[];

    const totalPacientes = pacientesCountResult[0]?.total ?? 0;

    // 2. Card 2 — Consultas da semana atual
    // Neon/PostgreSQL: date_trunc('week', CURRENT_DATE) till end of week
    const consultasSemanaResult = await sql.query(
      `SELECT COUNT(c.id)::int AS total
       FROM consultas c
       INNER JOIN pacientes p ON p.id = c.paciente_id
       WHERE p.nutricionista_id = $1
         AND c.data_consulta >= date_trunc('week', CURRENT_DATE)
         AND c.data_consulta < date_trunc('week', CURRENT_DATE) + INTERVAL '7 days'`,
      [nutricionistaId]
    ) as { total: number }[];

    const consultasSemana = consultasSemanaResult[0]?.total ?? 0;

    // 3. Card 3 — Pacientes sem retorno:
    // última consulta foi há mais de 30 dias e não possuem próximo retorno agendado (ou retorno já expirou)
    const overdueResult = await sql.query(
      `SELECT 
         p.id,
         p.nome,
         p.email,
         p.whatsapp,
         TO_CHAR(MAX(c.data_consulta), 'YYYY-MM-DD') AS ultima_consulta,
         TO_CHAR(MAX(c.proximo_retorno), 'YYYY-MM-DD') AS proximo_retorno,
         (CURRENT_DATE - MAX(c.data_consulta))::int AS dias_desde_ultima
       FROM pacientes p
       INNER JOIN consultas c ON c.paciente_id = p.id
       WHERE p.nutricionista_id = $1
       GROUP BY p.id, p.nome, p.email, p.whatsapp
       HAVING 
         MAX(c.data_consulta) < CURRENT_DATE - INTERVAL '30 days'
         AND (MAX(c.proximo_retorno) IS NULL OR MAX(c.proximo_retorno) < CURRENT_DATE)
       ORDER BY dias_desde_ultima DESC`,
      [nutricionistaId]
    ) as {
      id: string;
      nome: string;
      email: string | null;
      whatsapp: string | null;
      ultima_consulta: string;
      proximo_retorno: string | null;
      dias_desde_ultima: number;
    }[];

    const pacientesSemRetorno: OverduePatient[] = overdueResult.map((r) => ({
      id: r.id,
      nome: r.nome,
      email: r.email,
      whatsapp: r.whatsapp,
      ultima_consulta: r.ultima_consulta,
      proximo_retorno: r.proximo_retorno,
      dias_desde_ultima: Number(r.dias_desde_ultima || 0),
    }));

    return {
      totalPacientes,
      consultasSemana,
      pacientesSemRetorno,
    };
  } catch (error) {
    console.error('Falha ao carregar métricas do dashboard no Neon:', error);
    throw error;
  }
}

export interface PacienteComUltimaConsulta extends Paciente {
  ultima_consulta?: string | null;
}

/**
 * Fetches all patients for this nutritionist along with the date of their last consultation
 */
export async function fetchPacientes(nutricionistaId: string): Promise<PacienteComUltimaConsulta[]> {
  const result = await sql.query(
    `SELECT 
       p.*,
       TO_CHAR(p.data_nascimento, 'YYYY-MM-DD') AS data_nascimento,
       TO_CHAR(MAX(c.data_consulta), 'YYYY-MM-DD') AS ultima_consulta
     FROM pacientes p
     LEFT JOIN consultas c ON c.paciente_id = p.id
     WHERE p.nutricionista_id = $1
     GROUP BY p.id
     ORDER BY p.nome ASC`,
    [nutricionistaId]
  );
  return result as PacienteComUltimaConsulta[];
}

/**
 * Creates a new patient linked to the authenticated nutritionist
 */
export async function createPaciente(paciente: {
  nutricionista_id: string;
  nome: string;
  data_nascimento?: string | null;
  sexo?: string | null;
  whatsapp?: string | null;
  email?: string | null;
  peso_inicial?: number | null;
  altura?: number | null;
  objetivos?: string[] | null;
  objetivo_texto?: string | null;
  nivel_atividade?: string | null;
  patologias?: string[] | null;
  restricoes_alimentares?: string[] | null;
  alergias?: string[] | null;
  medicamentos?: string | null;
  suplementos?: string | null;
  refeicoes_por_dia?: number | null;
  horario_acorda?: string | null;
  horario_dorme?: string | null;
  litros_agua?: number | null;
  atividade_fisica?: boolean | null;
  atividade_fisica_descricao?: string | null;
  observacoes?: string | null;
}): Promise<Paciente> {
  const result = await sql.query(
    `INSERT INTO pacientes (
      nutricionista_id,
      nome,
      data_nascimento,
      sexo,
      whatsapp,
      email,
      peso_inicial,
      altura,
      objetivos,
      objetivo_texto,
      nivel_atividade,
      patologias,
      restricoes_alimentares,
      alergias,
      medicamentos,
      suplementos,
      refeicoes_por_dia,
      horario_acorda,
      horario_dorme,
      litros_agua,
      atividade_fisica,
      atividade_fisica_descricao,
      observacoes
    ) VALUES (
      $1, $2, $3, $4, $5, $6, $7, $8, $9, $10,
      $11, $12, $13, $14, $15, $16, $17, $18, $19, $20,
      $21, $22, $23
    ) RETURNING 
      *,
      TO_CHAR(data_nascimento, 'YYYY-MM-DD') AS data_nascimento`,
    [
      paciente.nutricionista_id,
      paciente.nome,
      paciente.data_nascimento || null,
      paciente.sexo || null,
      paciente.whatsapp || null,
      paciente.email || null,
      paciente.peso_inicial || null,
      paciente.altura || null,
      paciente.objetivos || null,
      paciente.objetivo_texto || null,
      paciente.nivel_atividade || null,
      paciente.patologias || null,
      paciente.restricoes_alimentares || null,
      paciente.alergias || null,
      paciente.medicamentos || null,
      paciente.suplementos || null,
      paciente.refeicoes_por_dia || null,
      paciente.horario_acorda || null,
      paciente.horario_dorme || null,
      paciente.litros_agua || null,
      paciente.atividade_fisica ?? null,
      paciente.atividade_fisica_descricao || null,
      paciente.observacoes || null,
    ]
  ) as Paciente[];

  return result[0];
}

/**
 * Updates an existing patient record
 */
export async function updatePaciente(
  pacienteId: string,
  nutricionistaId: string,
  paciente: {
    nome: string;
    data_nascimento?: string | null;
    sexo?: string | null;
    whatsapp?: string | null;
    email?: string | null;
    peso_inicial?: number | null;
    altura?: number | null;
    objetivos?: string[] | null;
    objetivo_texto?: string | null;
    nivel_atividade?: string | null;
    patologias?: string[] | null;
    restricoes_alimentares?: string[] | null;
    alergias?: string[] | null;
    medicamentos?: string | null;
    suplementos?: string | null;
    refeicoes_por_dia?: number | null;
    horario_acorda?: string | null;
    horario_dorme?: string | null;
    litros_agua?: number | null;
    atividade_fisica?: boolean | null;
    atividade_fisica_descricao?: string | null;
    observacoes?: string | null;
  }
): Promise<Paciente> {
  const result = await sql.query(
    `UPDATE pacientes SET
      nome = $1,
      data_nascimento = $2,
      sexo = $3,
      whatsapp = $4,
      email = $5,
      peso_inicial = $6,
      altura = $7,
      objetivos = $8,
      objetivo_texto = $9,
      nivel_atividade = $10,
      patologias = $11,
      restricoes_alimentares = $12,
      alergias = $13,
      medicamentos = $14,
      suplementos = $15,
      refeicoes_por_dia = $16,
      horario_acorda = $17,
      horario_dorme = $18,
      litros_agua = $19,
      atividade_fisica = $20,
      atividade_fisica_descricao = $21,
      observacoes = $22
    WHERE id = $23 AND nutricionista_id = $24
    RETURNING 
      *,
      TO_CHAR(data_nascimento, 'YYYY-MM-DD') AS data_nascimento`,
    [
      paciente.nome,
      paciente.data_nascimento || null,
      paciente.sexo || null,
      paciente.whatsapp || null,
      paciente.email || null,
      paciente.peso_inicial || null,
      paciente.altura || null,
      paciente.objetivos || null,
      paciente.objetivo_texto || null,
      paciente.nivel_atividade || null,
      paciente.patologias || null,
      paciente.restricoes_alimentares || null,
      paciente.alergias || null,
      paciente.medicamentos || null,
      paciente.suplementos || null,
      paciente.refeicoes_por_dia || null,
      paciente.horario_acorda || null,
      paciente.horario_dorme || null,
      paciente.litros_agua || null,
      paciente.atividade_fisica ?? null,
      paciente.atividade_fisica_descricao || null,
      paciente.observacoes || null,
      pacienteId,
      nutricionistaId,
    ]
  ) as Paciente[];

  if (!result || result.length === 0) {
    throw new Error('Paciente não encontrado ou sem permissão para atualizar.');
  }

  return result[0];
}

/**
 * Fetches a single patient with consultation history
 */
export async function fetchPacienteComConsultas(pacienteId: string, nutricionistaId: string) {
  const pacienteResult = await sql.query(
    `SELECT 
       p.*,
       TO_CHAR(p.data_nascimento, 'YYYY-MM-DD') AS data_nascimento
     FROM pacientes p
     WHERE p.id = $1 AND p.nutricionista_id = $2
     LIMIT 1`,
    [pacienteId, nutricionistaId]
  ) as Paciente[];

  if (!pacienteResult || pacienteResult.length === 0) {
    return null;
  }

  const consultasResult = await sql.query(
    `SELECT 
       c.*,
       TO_CHAR(c.data_consulta, 'YYYY-MM-DD') AS data_consulta,
       TO_CHAR(c.proximo_retorno, 'YYYY-MM-DD') AS proximo_retorno
     FROM consultas c
     WHERE c.paciente_id = $1
     ORDER BY c.data_consulta DESC`,
    [pacienteId]
  ) as Consulta[];

  return {
    paciente: pacienteResult[0],
    consultas: consultasResult,
  };
}

/**
 * Creates a new consultation for a patient
 */
export async function createConsulta(data: {
  paciente_id: string;
  data_consulta: string;
  peso?: number | null;
  cintura?: number | null;
  quadril?: number | null;
  percentual_gordura?: number | null;
  observacoes?: string | null;
  proximo_retorno?: string | null;
}): Promise<Consulta> {
  const result = await sql.query(
    `INSERT INTO consultas (
       paciente_id,
       data_consulta,
       peso,
       cintura,
       quadril,
       percentual_gordura,
       observacoes,
       proximo_retorno
     )
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
     RETURNING 
       id,
       paciente_id,
       TO_CHAR(data_consulta, 'YYYY-MM-DD') AS data_consulta,
       peso,
       cintura,
       quadril,
       percentual_gordura,
       observacoes,
       TO_CHAR(proximo_retorno, 'YYYY-MM-DD') AS proximo_retorno,
       created_at`,
    [
      data.paciente_id,
      data.data_consulta,
      data.peso || null,
      data.cintura || null,
      data.quadril || null,
      data.percentual_gordura || null,
      data.observacoes || null,
      data.proximo_retorno || null,
    ]
  ) as Consulta[];

  if (!result || result.length === 0) {
    throw new Error('Falha ao cadastrar consulta.');
  }

  return result[0];
}

export interface RefeicoesDia {
  cafe_da_manha: string[];
  lanche_manha: string[];
  almoco: string[];
  lanche_tarde: string[];
  jantar: string[];
}

export interface DiaPlano {
  dia: string;
  refeicoes: RefeicoesDia;
}

export interface ConteudoPlanoAlimentar {
  plano_semanal: DiaPlano[];
}

export interface PlanoAlimentar {
  id: string;
  paciente_id: string;
  conteudo: ConteudoPlanoAlimentar;
  created_at: string;
}

/**
 * Fetches all dietary plans for a patient, ordered by creation date desc
 */
export async function fetchPlanosAlimentares(pacienteId: string): Promise<PlanoAlimentar[]> {
  const result = await sql.query(
    `SELECT 
       id, 
       paciente_id, 
       conteudo, 
       TO_CHAR(created_at, 'YYYY-MM-DD HH24:MI:SS') as created_at
     FROM planos_alimentares
     WHERE paciente_id = $1
     ORDER BY created_at DESC`,
    [pacienteId]
  ) as PlanoAlimentar[];

  return result || [];
}

/**
 * Saves a new dietary plan for a patient
 */
export async function createPlanoAlimentar(
  pacienteId: string,
  conteudo: ConteudoPlanoAlimentar
): Promise<PlanoAlimentar> {
  const result = await sql.query(
    `INSERT INTO planos_alimentares (paciente_id, conteudo)
     VALUES ($1, $2)
     RETURNING 
       id, 
       paciente_id, 
       conteudo, 
       TO_CHAR(created_at, 'YYYY-MM-DD HH24:MI:SS') as created_at`,
    [pacienteId, JSON.stringify(conteudo)]
  ) as PlanoAlimentar[];

  if (!result || result.length === 0) {
    throw new Error('Falha ao persistir plano alimentar.');
  }

  return result[0];
}

