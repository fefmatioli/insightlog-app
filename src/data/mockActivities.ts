export type ActivityCategory = 'Estudo' | 'Saúde' | 'Social';

export type Activity = {
  id: string;
  title: string;
  category: ActivityCategory;
  description?: string;
  createdAt: string;
};

export const mockActivities: Activity[] = [
  {
    id: '1',
    title: 'Leitura de React Native',
    category: 'Estudo',
    description: 'Revisão dos conceitos iniciais.',
    createdAt: '2026-04-22T10:30:00.000Z',
  },
  {
    id: '2',
    title: 'Corrida matinal',
    category: 'Saúde',
    description: '30 minutos de atividade física.',
    createdAt: '2026-04-21T18:00:00.000Z',
  },
  {
    id: '3',
    title: 'Almoço com amigos',
    category: 'Social',
    description: 'Encontro no centro.',
    createdAt: '2026-04-21T12:30:00.000Z',
  },
  {
    id: '4',
    title: 'Revisão da aula',
    category: 'Estudo',
    description: 'Resumo do conteúdo do dia.',
    createdAt: '2026-04-20T19:20:00.000Z',
  },
  {
    id: '5',
    title: 'Caminhada leve',
    category: 'Saúde',
    description: 'Atividade ao ar livre.',
    createdAt: '2026-04-19T08:10:00.000Z',
  },
];