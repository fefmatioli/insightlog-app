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
    createdAt: new Date().toISOString(),
  },
  {
    id: '2',
    title: 'Corrida matinal',
    category: 'Saúde',
    description: '30 minutos de atividade física.',
    createdAt: new Date().toISOString(),
  },
  {
    id: '3',
    title: 'Almoço com amigos',
    category: 'Social',
    description: 'Encontro no centro.',
    createdAt: new Date().toISOString(),
  },
  {
    id: '4',
    title: 'Revisão da aula',
    category: 'Estudo',
    description: 'Resumo do conteúdo do dia.',
    createdAt: new Date().toISOString() ,
  },
  {
    id: '5',
    title: 'Caminhada leve',
    category: 'Saúde',
    description: 'Atividade ao ar livre.',
    createdAt: new Date().toISOString(),
  },
];