export type ActivityCategory = 'Estudo' | 'Saúde' | 'Social';

export type Activity = {
  id: string;
  title: string;
  category: ActivityCategory;
  description?: string;
  dateLabel: string;
};

export const mockActivities: Activity[] = [
  {
    id: '1',
    title: 'Leitura de React Native',
    category: 'Estudo',
    dateLabel: 'Hoje, 10:30',
  },
  {
    id: '2',
    title: 'Corrida matinal',
    category: 'Saúde',
    dateLabel: 'Ontem, 18:00',
  },
  {
    id: '3',
    title: 'Almoço com amigos',
    category: 'Social',
    dateLabel: 'Ontem, 12:30',
  },
  {
    id: '4',
    title: 'Revisão da aula',
    category: 'Estudo',
    dateLabel: 'Seg, 19:20',
  },
  {
    id: '5',
    title: 'Caminhada leve',
    category: 'Saúde',
    dateLabel: 'Dom, 08:10',
  },
];