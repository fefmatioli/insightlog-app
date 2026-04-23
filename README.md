# InsightLog

Aplicativo mobile desenvolvido para a disciplina de Desenvolvimento Mobile, com foco no registro e acompanhamento de atividades por meio de uma interface simples, visual e organizada.

## Sobre o projeto

O `InsightLog` é um projeto acadêmico construído em React Native com Expo. A proposta é desenvolver, ao longo de três avaliações, um aplicativo mobile capaz de cadastrar atividades, organizá-las por categoria e status, e apresentar métricas que ajudem o usuário a acompanhar seu próprio comportamento.

Este repositório corresponde à `1ª avaliação`, cuja ênfase está totalmente na `interface da aplicação`. Nesta etapa, o objetivo principal é estruturar a navegação, as telas, os componentes visuais e a experiência de uso, ainda utilizando dados locais e simulados.

## Estrutura das avaliações

### 1ª avaliação - Interface

Etapa atual do projeto.

Foco principal:

- prototipação e construção da interface mobile
- organização das telas e componentes
- navegação entre páginas
- apresentação visual de dados e métricas
- uso de dados mockados para simular o funcionamento do app

### 2ª avaliação - Regras de negócio e persistência

Etapa prevista para evolução do projeto.

Possíveis entregas:

- tratamento mais completo dos dados cadastrados
- persistência local
- melhorias nas validações
- refinamento do fluxo de criação, edição e acompanhamento das atividades

### 3ª avaliação - Integração e evolução final

Etapa futura de consolidação do projeto.

Possíveis entregas:

- integração com API ou backend
- armazenamento externo dos dados
- melhorias finais de usabilidade
- amadurecimento geral da aplicação

## Objetivo

Permitir que o usuário registre atividades e acompanhe informações relevantes sobre elas por meio de uma experiência visual clara, intuitiva e agradável.

Além do aspecto funcional, o projeto também busca aplicar, na prática, conceitos importantes da disciplina, como:

- organização de interface mobile
- componentização
- navegação entre telas
- tipagem com TypeScript
- construção de dashboards e indicadores visuais

## Funcionalidades da etapa atual

Na versão atual, o aplicativo já apresenta:

- tela inicial com identidade visual do projeto
- cadastro de atividades
- edição de atividades existentes
- listagem de atividades
- filtros por busca, status, categoria e data
- alteração de status das atividades
- dashboard com métricas visuais
- uso de dados simulados para representar o comportamento do app

## Tecnologias utilizadas

- React Native
- Expo
- TypeScript
- React Navigation

## Estrutura do projeto

```bash
src/
  assets/        # Recursos visuais da aplicação
  components/    # Componentes reutilizáveis
  context/       # Contextos e gerenciamento local de estado
  data/          # Dados mockados da fase atual
  navigation/    # Configuração das rotas e navegação
  screens/       # Telas principais do aplicativo
  theme/         # Cores, espaçamentos e estilos base
  utils/         # Funções auxiliares
```

## Como executar o projeto

### Pré-requisitos

- Node.js instalado
- npm instalado
- Expo CLI disponível via `npx`
- emulador Android/iOS ou aplicativo Expo Go

### Instalação

```bash
npm install
```

### Execução

```bash
npm start
```

Ou, se preferir:

```bash
npm run android
npm run ios
npm run web
```

Se houver necessidade de limpar o cache do Expo:

```bash
npx expo start --clear
```

## Observações

- Nesta fase, o projeto ainda não depende de API externa.
- Os dados utilizados são locais e simulados, com foco exclusivo na construção da interface.
- Algumas funcionalidades podem evoluir nas próximas avaliações, conforme o andamento da disciplina.

## Autoria

Projeto desenvolvido para fins acadêmicos na disciplina de Mobile, como parte de uma aplicação dividida em três etapas avaliativas.
