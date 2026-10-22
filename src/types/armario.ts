export type Tamanho = "P" | "M" | "G";
export type StatusArmario = "LIVRE" | "OCUPADO" | "MANUTENCAO";

export type ModalidadeManutencao =
  | "PADRAO"
  | "MANUTENCAO_EMERGENCIAL"
  | "HIGIENIZACAO"
  | "PREDITIVA_BATERIA";

export type CategoriaProblemaArmario =
  | "TRAVA_EMPERRADA"
  | "PORTA_DANIFICADA"
  | "SUJEIRA"
  | "OUTRO";

export type TipoOrdemManutencao =
  | "CORRETIVA"
  | "PREVENTIVA"
  | "PREDITIVA"
  | "MANUTENCAO_EMERGENCIAL"
  | "HIGIENIZACAO";

export type StatusOrdemManutencao =
  | "ABERTA"
  | "EM_ANDAMENTO"
  | "AGUARDANDO_PECA"
  | "CONCLUIDA";

export type StatusPagamentoUso = "ISENTO" | "PENDENTE" | "PAGO";

export interface Unidade {
  id: string;
  nome: string;
  codigo: string;
  endereco: string | null;
  ativa: boolean;
  createdAt: string;
}

export interface Armario {
  id: string;
  numero: number;
  bloco: string;
  tamanho: Tamanho;
  status: StatusArmario;
  modalidadeManutencao?: string | null;
  totalCiclosAbertura?: number;
  usosDesdeHigienizacao?: number;
  ultimaHigienizacaoEm?: string;
  nivelBateria?: number;
  temperatura?: number;
  portaAberta?: boolean;
  portaAbertaDesde?: string | null;
  unidadeId?: string | null;
  createdAt: string;
}

export interface UsoArmarioResumo {
  id: string;
  userId: string;
  armarioId: string;
  checkIn: string;
  checkOut: string | null;
  pinAcesso?: string | null;
  pinExpiraEm?: string | null;
  abandonado?: boolean;
  arquivado?: boolean;
  justificativaLiberacao?: string | null;
  valorCobrado?: number;
  statusPagamento?: StatusPagamentoUso | string;
  pixTxId?: string | null;
  pixCopiaECola?: string | null;
  armario: Armario;
}

export interface UsoArmarioComUsuario extends UsoArmarioResumo {
  user: {
    id: string;
    nome: string;
    matricula: string | null;
  };
}

export interface ArmarioFiltros {
  bloco?: string;
  tamanho?: Tamanho;
  status?: StatusArmario;
  unidadeId?: string;
}

export interface UsoFiltros {
  userId?: string;
  armarioId?: string;
  ativo?: boolean;
  abandonado?: boolean;
  pagina?: number;
  tamanhoPagina?: number;
}

export interface UsosPaginados {
  dados: UsoArmarioComUsuario[];
  total: number;
  pagina: number;
  totalPaginas: number;
}

export interface RelatoProblemaArmario {
  id: string;
  armarioId: string;
  userId: string;
  categoria: CategoriaProblemaArmario | string;
  descricao: string;
  prioridadeAlta: boolean;
  resolvido: boolean;
  createdAt: string;
  armario?: Pick<Armario, "id" | "numero" | "bloco" | "tamanho" | "status">;
  user?: {
    id: string;
    nome: string;
    matricula: string | null;
  };
}

export interface OrdemManutencao {
  id: string;
  armarioId: string;
  tipo: TipoOrdemManutencao | string;
  status: StatusOrdemManutencao | string;
  descricao: string;
  pecasTrocadas: string | null;
  custo: number;
  testadoAntesReativar: boolean;
  createdAt: string;
  concluidaEm: string | null;
  armario?: Pick<
    Armario,
    | "id"
    | "numero"
    | "bloco"
    | "tamanho"
    | "status"
    | "totalCiclosAbertura"
    | "usosDesdeHigienizacao"
  >;
}

export interface InspecaoFisica {
  id: string;
  bloco: string;
  dataProgramada: string;
  alinhamentoOk: boolean;
  vedacaoOk: boolean;
  sensoresOk: boolean;
  observacoes: string | null;
  concluida: boolean;
  createdAt: string;
}

export interface ArmarioTelemetria {
  id: string;
  armarioId: string;
  nivelBateria: number;
  temperatura: number;
  portaAberta: boolean;
  tempoPortaAbertaSegundos: number;
  criadoEm: string;
  armario?: Pick<Armario, "id" | "numero" | "bloco" | "status">;
}

export interface AuditoriaLog {
  id: string;
  operadorId: string | null;
  acao: string;
  entidade: string;
  entidadeId: string | null;
  detalhes: string | null;
  ip: string;
  userAgent: string;
  criadoEm: string;
  operador?: {
    id: string;
    nome: string;
    email: string;
  } | null;
}

export interface UsuarioResumo {
  id: string;
  nome: string;
  email: string;
  role: "ALUNO" | "ADMIN";
  matricula: string | null;
  bloqueado: boolean;
  anonimizado: boolean;
  unidadeId: string | null;
  createdAt: string;
}

export interface UsuariosPaginados {
  dados: UsuarioResumo[];
  total: number;
  pagina: number;
  totalPaginas: number;
}

export interface DiagnosticoSaude {
  status: "ok" | "degraded" | "down";
  timestamp: string;
  servicos: {
    postgresql: {
      conectado: boolean;
      latenciaMs: number;
    };
    mqtt: {
      conectado: boolean;
      broker: string;
      latenciaMs: number;
    };
  };
}
