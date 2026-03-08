<!-- Registre aqui contextos e memórias importantes do projeto para manter consistência entre sessões. -->

## FrotaTech - Sistema de Gestão de Frota

**Criado em:** 2026-03-08
**Stack:** React + TypeScript + Vite + Tailwind CSS + shadcn/ui + recharts

### Estrutura implementada
- `src/types/index.ts` — tipos TypeScript (User, Caminhao, Motorista, Viagem, Despesa, etc.)
- `src/data/mockData.ts` — dados de demonstração (3 caminhões, 3 motoristas, 4 viagens, 8 despesas)
- `src/utils/formatters.ts` — utilitários: formatarMoeda, formatarKm, formatarTempo, etc.
- `src/contexts/AuthContext.tsx` — contexto de autenticação (admin/motorista)
- `src/layouts/AdminLayout.tsx` — layout do painel admin com sidebar azul escuro
- `src/pages/Login.tsx` — página de login com acesso demo
- `src/pages/admin/Dashboard.tsx` — dashboard com KPIs, gráficos (recharts)
- `src/pages/admin/Caminhoes.tsx` — CRUD de caminhões
- `src/pages/admin/Motoristas.tsx` — CRUD de motoristas
- `src/pages/admin/Viagens.tsx` — listagem + detalhes com mapa visual de rota SVG
- `src/pages/admin/Despesas.tsx` — CRUD despesas admin
- `src/pages/admin/Relatorios.tsx` — relatórios com gráficos e export (demo)
- `src/pages/motorista/AppMotorista.tsx` — app mobile do motorista com GPS (Geolocation API)
- `src/App.tsx` — rotas React Router (admin/motorista separados por tipo de usuário)

### Credenciais demo
- Admin: admin@frotatech.com / admin123
- Motorista: joao@frotatech.com / moto123

### Rotas
- `/login` — tela de login
- `/admin` — dashboard admin
- `/admin/caminhoes`, `/admin/motoristas`, `/admin/viagens`, `/admin/despesas`, `/admin/pagamentos`, `/admin/relatorios`
- `/motorista` — app do motorista

### Tema: Sky (azul escuro na sidebar, azul como primary)

### Funcionalidade de Pagamentos (adicionada em 08/03/2026)
- `src/pages/admin/Pagamentos.tsx` — aba de pagamentos com dashboard financeiro, ciclos semanais, histórico
- `src/hooks/usePagamentos.ts` — hook com CRUD de config_pagamentos e ciclos_pagamento
- `src/types/index.ts` — tipos ConfigPagamento, CicloPagamento, StatusPagamento adicionados
- Tabelas Supabase criadas e verificadas: `config_pagamentos`, `ciclos_pagamento`; coluna `valor_frete` em `viagens`
- Lógica: semanas de sábado a sexta, pagamento na sexta-feira, divisão configurável por porcentagem
- Migration: `supabase/migrations/20260308105045_pagamentos.sql` (executada via management API)
- Para exec SQL direto: usar env.SUPABASE_ACCESS_TOKEN (sbp_...) com /v1/projects/{ref}/database/query
- TypeScript: zero erros confirmados
