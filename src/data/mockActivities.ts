/**
 * No TP3 as categorias deixaram de ser fixas: agora são ids vindos do
 * banco (tabela `categories`). Mantemos o alias por compatibilidade,
 * mas o tipo real é string.
 */
export type ActivityCategory = string;

export type ActivityStatus =
  | 'Pendente'
  | 'Em andamento'
  | 'Concluída'
  | 'Adiada';

export type ActivityHistoryEntry = {
  id: string;
  status: ActivityStatus;
  changedAt: string;
  note?: string;
  postponedUntil?: string;
};

export type Activity = {
  id: string;
  title: string;
  category: ActivityCategory;
  description?: string;
  createdAt: string;
  activityTime?: string;
  status: ActivityStatus;
  reminderEnabled: boolean;
  reminderOffsetMinutes?: number;
  notificationId?: string;
  photoUri?: string;
  latitude?: number;
  longitude?: number;
  locationLabel?: string;
  /** Avaliação de 1 a 5 estrelas (opcional). */
  rating?: number;
  history: ActivityHistoryEntry[];
};

export const mockActivities: Activity[] = [
  {
    id: '1',
    title: 'Leitura de React Native',
    category: 'Estudo',
    description: 'Revisão dos conceitos iniciais.',
    createdAt: '2026-06-03T00:00:00',
    status: 'Em andamento',
    reminderEnabled: false,
    history: [
      { id: 'h1', status: 'Pendente', changedAt: '2026-06-03T00:00:00' },
      { id: 'h2', status: 'Em andamento', changedAt: '2026-06-03T00:00:00' },
    ],
  },
  {
    id: '2',
    title: 'Corrida matinal',
    category: 'Saúde',
    description: '30 minutos de atividade física.',
    createdAt: '2026-06-03T00:00:00',
    status: 'Concluída',
    reminderEnabled: false,
    history: [
      { id: 'h3', status: 'Pendente', changedAt: '2026-06-03T00:00:00' },
      { id: 'h4', status: 'Concluída', changedAt: '2026-06-03T00:00:00' },
    ],
  },
  {
    id: '3',
    title: 'Resumo de banco de dados',
    category: 'Estudo',
    description: 'Montar resumo para prova.',
    createdAt: '2026-06-02T00:00:00',
    status: 'Concluída',
    reminderEnabled: false,
    history: [
      { id: 'h5', status: 'Pendente', changedAt: '2026-06-02T00:00:00' },
      { id: 'h6', status: 'Concluída', changedAt: '2026-06-02T00:00:00' },
    ],
  },
  {
    id: '4',
    title: 'Caminhada no parque',
    category: 'Saúde',
    description: '40 minutos no fim da tarde.',
    createdAt: '2026-06-02T00:00:00',
    status: 'Pendente',
    reminderEnabled: false,
    history: [
      { id: 'h7', status: 'Pendente', changedAt: '2026-06-02T00:00:00' },
    ],
  },
  {
    id: '5',
    title: 'Encontro com amigas',
    category: 'Social',
    description: 'Café no centro.',
    createdAt: '2026-06-01T00:00:00',
    status: 'Adiada',
    reminderEnabled: false,
    history: [
      { id: 'h8', status: 'Pendente', changedAt: '2026-06-01T00:00:00' },
      {
        id: 'h9',
        status: 'Adiada',
        changedAt: '2026-06-01T00:00:00',
        note: 'Conflito de horário.',
        postponedUntil: '2026-06-10T00:00:00',
      },
    ],
  },
  {
    id: '6',
    title: 'Planejamento semanal',
    category: 'Estudo',
    description: 'Organizar entregas da semana.',
    createdAt: '2026-05-30T00:00:00',
    status: 'Concluída',
    reminderEnabled: false,
    history: [
      { id: 'h10', status: 'Pendente', changedAt: '2026-05-30T00:00:00' },
      { id: 'h11', status: 'Em andamento', changedAt: '2026-05-30T00:00:00' },
      { id: 'h11b', status: 'Concluída', changedAt: '2026-05-31T00:00:00' },
    ],
  },
  {
    id: '7',
    title: 'Consulta médica',
    category: 'Saúde',
    description: 'Retorno de rotina.',
    createdAt: '2026-05-28T00:00:00',
    status: 'Concluída',
    reminderEnabled: false,
    history: [
      { id: 'h12', status: 'Pendente', changedAt: '2026-05-28T00:00:00' },
      { id: 'h13', status: 'Concluída', changedAt: '2026-05-28T00:00:00' },
    ],
  },
  {
    id: '8',
    title: 'Responder mensagens atrasadas',
    category: 'Social',
    description: 'Responder contatos do fim de semana.',
    createdAt: '2026-05-26T00:00:00',
    status: 'Em andamento',
    reminderEnabled: false,
    history: [
      { id: 'h14', status: 'Pendente', changedAt: '2026-05-26T00:00:00' },
      { id: 'h15', status: 'Em andamento', changedAt: '2026-05-26T00:00:00' },
    ],
  },
  {
    id: '9',
    title: 'Leitura de artigo científico',
    category: 'Estudo',
    description: 'Leitura para embasar o projeto.',
    createdAt: '2026-05-21T00:00:00',
    status: 'Adiada',
    reminderEnabled: false,
    history: [
      { id: 'h16', status: 'Pendente', changedAt: '2026-05-21T00:00:00' },
      {
        id: 'h17',
        status: 'Adiada',
        changedAt: '2026-05-21T00:00:00',
        note: 'Prioridade mudou no dia.',
        postponedUntil: '2026-06-05T00:00:00',
      },
    ],
  },
  {
    id: '10',
    title: 'Alongamento matinal',
    category: 'Saúde',
    description: '15 minutos antes do trabalho.',
    createdAt: '2026-05-19T00:00:00',
    status: 'Concluída',
    reminderEnabled: false,
    history: [
      { id: 'h18', status: 'Pendente', changedAt: '2026-05-19T00:00:00' },
      { id: 'h19', status: 'Concluída', changedAt: '2026-05-19T00:00:00' },
    ],
  },
  {
    id: '11',
    title: 'Organizar fotos',
    category: 'Social',
    description: 'Separar fotos do último passeio.',
    createdAt: '2026-05-14T00:00:00',
    status: 'Pendente',
    reminderEnabled: false,
    history: [
      { id: 'h20', status: 'Pendente', changedAt: '2026-05-14T00:00:00' },
    ],
  },
  {
    id: '12',
    title: 'Resolver lista da disciplina',
    category: 'Estudo',
    description: 'Exercícios pendentes da semana.',
    createdAt: '2026-05-09T00:00:00',
    status: 'Concluída',
    reminderEnabled: false,
    history: [
      { id: 'h21', status: 'Pendente', changedAt: '2026-05-09T00:00:00' },
      { id: 'h22', status: 'Concluída', changedAt: '2026-05-09T00:00:00' },
    ],
  },
];
