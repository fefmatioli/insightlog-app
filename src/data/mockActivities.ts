export type ActivityCategory = 'Estudo' | 'Saúde' | 'Social';

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
  status: ActivityStatus;
  history: ActivityHistoryEntry[];
};

export const mockActivities: Activity[] = [
  {
    id: '1',
    title: 'Leitura de React Native',
    category: 'Estudo',
    description: 'Revisão dos conceitos iniciais.',
    createdAt: '2026-04-22T10:30:00.000Z',
    status: 'Em andamento',
    history: [
      {
        id: 'h1',
        status: 'Pendente',
        changedAt: '2026-04-22T09:00:00.000Z',
      },
      {
        id: 'h2',
        status: 'Em andamento',
        changedAt: '2026-04-22T10:30:00.000Z',
      },
    ],
  },
  {
    id: '2',
    title: 'Corrida matinal',
    category: 'Saúde',
    description: '30 minutos de atividade física.',
    createdAt: '2026-04-21T18:00:00.000Z',
    status: 'Concluída',
    history: [
      {
        id: 'h3',
        status: 'Pendente',
        changedAt: '2026-04-21T17:00:00.000Z',
      },
      {
        id: 'h4',
        status: 'Concluída',
        changedAt: '2026-04-21T18:00:00.000Z',
      },
    ],
  },
  {
    id: '3',
    title: 'Resumo de banco de dados',
    category: 'Estudo',
    description: 'Montar resumo para prova.',
    createdAt: '2026-04-20T14:00:00.000Z',
    status: 'Concluída',
    history: [
      {
        id: 'h5',
        status: 'Pendente',
        changedAt: '2026-04-20T10:00:00.000Z',
      },
      {
        id: 'h6',
        status: 'Concluída',
        changedAt: '2026-04-20T14:00:00.000Z',
      },
    ],
  },
  {
    id: '4',
    title: 'Caminhada no parque',
    category: 'Saúde',
    description: '40 minutos no fim da tarde.',
    createdAt: '2026-04-19T17:40:00.000Z',
    status: 'Pendente',
    history: [
      {
        id: 'h7',
        status: 'Pendente',
        changedAt: '2026-04-19T17:40:00.000Z',
      },
    ],
  },
  {
    id: '5',
    title: 'Encontro com amigas',
    category: 'Social',
    description: 'Café no centro.',
    createdAt: '2026-04-18T19:30:00.000Z',
    status: 'Adiada',
    history: [
      {
        id: 'h8',
        status: 'Pendente',
        changedAt: '2026-04-18T15:00:00.000Z',
      },
      {
        id: 'h9',
        status: 'Adiada',
        changedAt: '2026-04-18T17:00:00.000Z',
        note: 'Conflito de horário.',
        postponedUntil: '2026-04-25T00:00:00.000Z',
      },
    ],
  },
  {
    id: '6',
    title: 'Planejamento semanal',
    category: 'Estudo',
    description: 'Organizar entregas da semana.',
    createdAt: '2026-04-17T08:20:00.000Z',
    status: 'Em andamento',
    history: [
      {
        id: 'h10',
        status: 'Pendente',
        changedAt: '2026-04-17T08:00:00.000Z',
      },
      {
        id: 'h11',
        status: 'Em andamento',
        changedAt: '2026-04-17T08:20:00.000Z',
      },
    ],
  },
  {
    id: '7',
    title: 'Consulta médica',
    category: 'Saúde',
    description: 'Retorno de rotina.',
    createdAt: '2026-04-15T11:00:00.000Z',
    status: 'Concluída',
    history: [
      {
        id: 'h12',
        status: 'Pendente',
        changedAt: '2026-04-15T09:00:00.000Z',
      },
      {
        id: 'h13',
        status: 'Concluída',
        changedAt: '2026-04-15T11:00:00.000Z',
      },
    ],
  },
  {
    id: '8',
    title: 'Responder mensagens atrasadas',
    category: 'Social',
    description: 'Responder contatos do fim de semana.',
    createdAt: '2026-04-14T21:15:00.000Z',
    status: 'Em andamento',
    history: [
      {
        id: 'h14',
        status: 'Pendente',
        changedAt: '2026-04-14T20:00:00.000Z',
      },
      {
        id: 'h15',
        status: 'Em andamento',
        changedAt: '2026-04-14T21:15:00.000Z',
      },
    ],
  },
  {
    id: '9',
    title: 'Leitura de artigo científico',
    category: 'Estudo',
    description: 'Leitura para embasar o projeto.',
    createdAt: '2026-04-12T16:45:00.000Z',
    status: 'Adiada',
    history: [
      {
        id: 'h16',
        status: 'Pendente',
        changedAt: '2026-04-12T10:00:00.000Z',
      },
      {
        id: 'h17',
        status: 'Adiada',
        changedAt: '2026-04-12T16:45:00.000Z',
        note: 'Prioridade mudou no dia.',
        postponedUntil: '2026-04-26T00:00:00.000Z',
      },
    ],
  },
  {
    id: '10',
    title: 'Alongamento matinal',
    category: 'Saúde',
    description: '15 minutos antes do trabalho.',
    createdAt: '2026-04-10T07:15:00.000Z',
    status: 'Concluída',
    history: [
      {
        id: 'h18',
        status: 'Pendente',
        changedAt: '2026-04-10T07:00:00.000Z',
      },
      {
        id: 'h19',
        status: 'Concluída',
        changedAt: '2026-04-10T07:15:00.000Z',
      },
    ],
  },
  {
    id: '11',
    title: 'Organizar fotos',
    category: 'Social',
    description: 'Separar fotos do último passeio.',
    createdAt: '2026-04-08T20:10:00.000Z',
    status: 'Pendente',
    history: [
      {
        id: 'h20',
        status: 'Pendente',
        changedAt: '2026-04-08T20:10:00.000Z',
      },
    ],
  },
  {
    id: '12',
    title: 'Resolver lista da disciplina',
    category: 'Estudo',
    description: 'Exercícios pendentes da semana.',
    createdAt: '2026-04-05T13:30:00.000Z',
    status: 'Concluída',
    history: [
      {
        id: 'h21',
        status: 'Pendente',
        changedAt: '2026-04-05T09:00:00.000Z',
      },
      {
        id: 'h22',
        status: 'Concluída',
        changedAt: '2026-04-05T13:30:00.000Z',
      },
    ],
  },
];