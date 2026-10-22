# Mapeamento de Manutenções e Evolução Arquitetural (MNT-01 a MNT-22)

Este documento consolida o levantamento de engenharia de requisitos e o plano técnico de manutenção corretiva, preventiva, preditiva, adaptativa e evolutiva do ecossistema **SmartLocker** (Equipe **MAGUGI**).

---

## 1. Catálogo de Manutenções Mapeadas

| ID | Tipo de Manutenção | Descrição do Problema / Melhoria | Prioridade | Camada / Escopo |
| :--- | :--- | :--- | :--- | :--- |
| **MNT-01** | Corretiva | Bloqueio ao enviar armário `OCUPADO` para manutenção quando a trava emperra com pertences dentro: rotina de Abertura de Emergência, desocupação assistida (`MANUTENCAO_EMERGENCIAL`) e geração automática de OS. | Crítica | Full-Stack |
| **MNT-02** | Corretiva | Inconsistência transacional ao liberar armário ocupado no painel admin (mantém `UsoArmario` aberto e bloqueia o aluno): endpoint `POST /api/armarios/[id]/forcar-liberacao` com transação Prisma e modal de justificativa. | Crítica | Backend / Admin |
| **MNT-03** | Corretiva / Evolutiva | Ausência de controle de abandono de armários (`RN1`): calcular tempo decorrido, exibir alerta visual após 3h de uso e criar Cron Job diário (`/api/cron/verificar-armarios-abandonados`) para marcar armários retidos. | Alta | Backend / UI |
| **MNT-04** | Corretiva / Evolutiva | Falta de canal para relato de avarias: botão "Reportar problema no armário" na interface do aluno (trava emperrada, porta danificada, sujeira) com alerta prioritário no dashboard admin. | Alta | Full-Stack |
| **MNT-05** | Evolutiva | Ausência de gestão de Ordens de Serviço (OS): tela `/dashboard/manutencao` e modelos `OrdemManutencao` e `RelatoProblemaArmario` para controlar status de reparo, peças trocadas, custos e reativação após teste. | Alta | Full-Stack |
| **MNT-06** | Preventiva (Qualidade) | Cobertura de testes automatizados em 0% (`RNF07`): suíte de testes unitários e de integração no Vitest (`usoService`, `limiteDeTaxaService`, schemas Zod e rotas de API) com cobertura mínima de 80%. | Crítica | Backend / QA |
| **MNT-07** | Preventiva | Desgaste mecânico e fadiga de solenoides/travas: contador `totalCiclosAbertura` no modelo `Armario` e alerta amarelo de Inspeção Mecânica Preventiva ao atingir limiares (1.000 e 5.000 ciclos). | Média | Backend / Admin |
| **MNT-08** | Preditiva | Risco de pane por bateria arriada com armário trancado: monitorar telemetria de tensão das fechaduras, gerando alerta preventivo em `<= 25%` e bloqueio automático para `MANUTENCAO` em `<= 10%`. | Alta | IoT / Backend |
| **MNT-09** | Preventiva | Controle de higienização periódica de vestiário: agendar sanitização obrigatória a cada 30 usos ou 7 dias, disponibilizando interface mobile com leitura de QR Code para a equipe de limpeza. | Média | Full-Stack |
| **MNT-10** | Preventiva | Falta de calendário de inspeções físicas: visualização mensal de preventivas programadas por bloco na interface administrativa com checklist padronizado de alinhamento, vedação e sensores. | Baixa | Frontend / Admin |
| **MNT-11** | Preventiva (Banco de Dados) | Acúmulo infinito de registros na tabela `TentativaAcesso` e logs antigos: job noturno de expurgo (`purge > 2 dias`) e política de retenção/arquivamento de histórico (90 a 180 dias). | Média | DBA / Backend |
| **MNT-12** | Preventiva (Infraestrutura) | Falta de observabilidade e diagnóstico de disponibilidade: endpoint `GET /api/health` verificando latência do PostgreSQL e conexão MQTT para integração com monitores externos. | Média | DevOps / Backend |
| **MNT-13** | Preventiva (Infraestrutura) | Risco de perda de dados e registros órfãos: scripts de backup automatizado com retenção escalonada e rotina semanal de verificação de integridade referencial entre `Armario` e `UsoArmario`. | Alta | DevOps / DBA |
| **MNT-14** | Evolutiva | Gestão de perfil incompleta (`RF01`): integrar menu dropdown ao Avatar no cabeçalho e criar página `/perfil` com dados cadastrais, alteração de senha (`bcrypt`/`Zod`) e histórico pessoal do aluno. | Média | Frontend / API |
| **MNT-15** | Evolutiva | Ausência de gestão administrativa de usuários (`RF06`): painel `/dashboard/usuarios` e rotas `GET/PATCH /api/usuarios` para listagem paginada, busca, redefinição de senha e bloqueio de matrícula. | Média | Full-Stack |
| **MNT-16** | Evolutiva / Adaptativa | Falta de credencial física de abertura (`RF04`): gerar PIN temporário de 6 dígitos e QR Code na tela `/meu-armario`, além do endpoint `POST /api/armarios/validar-acesso` para acionamento do hardware. | Alta | Full-Stack |
| **MNT-17** | Evolutiva / Preditiva | Ausência de telemetria em tempo real (`RF08` / `RNF04`): modelo `ArmarioTelemetria` e rota `POST /api/iot/telemetria` para monitorar sensor de porta aberta (`> 5 min`), nível de bateria e temperatura. | Média | IoT / Backend |
| **MNT-18** | Preventiva / Evolutiva | Ausência de rastreabilidade de ações críticas (`RF13`): tabela imutável `AuditoriaLog` (append-only) capturando operador, IP e User-Agent, com tela de consulta em `/dashboard/auditoria`. | Alta | Backend / Admin |
| **MNT-19** | Adaptativa (Segurança) | Adequação à LGPD e privacidade (`RNF06`): exportação de dados pessoais do aluno em JSON e rotina de anonimização do histórico de `UsoArmario` em caso de exclusão de conta. | Média | Backend / Perfil |
| **MNT-20** | Adaptativa / Evolutiva | Indisponibilidade em vestiários com sinal oscilante (`RNF05`): manifesto PWA e Service Worker para cache offline da tela "Meu Armário" (consulta de número e PIN sem internet). | Média | Frontend / PWA |
| **MNT-21** | Evolutiva | Escopo global único sem suporte a redes de academias (`RF12`): implementar Multi-tenancy introduzindo a entidade `Unidade` e isolando armários, usuários e consultas por filial. | Baixa | Arquitetura / Backend |
| **MNT-22** | Evolutiva | Ausência de tarifação por tempo excedido (`RF10` / `RF11`): motor de cálculo de franquia gratuita e cobrança de horas adicionais com integração PIX e liberação via webhook (`/api/webhooks/pagamentos`). | Baixa | Backend |

---

## 2. Regras de Negócio Detalhadas (RN)

### RN1 — Rotatividade Diária e Abandono
- Cada aluno só pode manter **1 uso ativo** (`checkOut = null`) por vez.
- A franquia regular de uso diário é de **3 horas (180 minutos)**.
- Usos ativos com duração superior a **3 horas** são sinalizados com alerta visual de retenção/abandono e processados pelo job `/api/cron/verificar-armarios-abandonados` (`abandonado = true`).

### RN2 — Manutenção Corretiva, Preventiva e Preditiva
- **Abertura de Emergência (`MNT-01`):** Quando um armário `OCUPADO` apresenta falha física na trava, o administrador executa a rotina de emergência, que encerra a sessão ativa do aluno, coloca o armário em `MANUTENCAO` (`modalidadeManutencao = "MANUTENCAO_EMERGENCIAL"`) e gera automaticamente uma `OrdemManutencao` prioritária.
- **Liberação Forçada (`MNT-02`):** A liberação administrativa exige justificativa formal registrada em transação atômica que fecha o `UsoArmario` aberto e devolve o status `LIVRE` ao armário.
- **Fadiga de Solenoide (`MNT-07`):** A cada abertura (`check-in` ou validação física de acesso), `totalCiclosAbertura` é incrementado. Ao atingir **1.000 ciclos** (inspeção preventiva) ou **5.000 ciclos** (substituição recomendada), o sistema emite alerta mecânico.
- **Telemetria e Bateria (`MNT-08` / `MNT-17`):** Leituras de bateria `<= 25%` disparam alerta preventivo; leituras `<= 10%` bloqueiam automaticamente o armário para `MANUTENCAO` e abrem OS preditiva. Portas abertas por mais de **5 minutos (300 segundos)** geram alerta operacional imediato.
- **Higienização Periódica (`MNT-09`):** A cada **30 usos acumulados** (`usosDesdeHigienizacao >= 30`) ou **7 dias** desde `ultimaHigienizacaoEm`, o armário requer sanitização antes de novo ciclo.

### RN3 — Tarifação Excedente, Segurança e LGPD
- **Franquia e Tarifação PIX (`MNT-22`):** As primeiras 3 horas de uso são gratuitas (`ISENTO`). Horas adicionais iniciadas são tarifadas conforme o porte do armário (`P`: R$ 5,00/h, `M`: R$ 8,00/h, `G`: R$ 12,00/h), gerando cobrança PIX (`PENDENTE`) liquidada via webhook (`/api/webhooks/pagamentos`).
- **Trilha de Auditoria (`MNT-18`):** Toda operação crítica administrativa ou de segurança gera registro imutável (`AuditoriaLog`) contendo operador, ação, entidade, IP e User-Agent.
- **Direitos do Titular LGPD (`MNT-19`):** O aluno pode exportar todos os seus dados em formato JSON estruturado e solicitar a exclusão/anonimização da conta, substituindo dados pessoais identificáveis por hashes anônimos sem corromper as métricas históricas de ocupação (`UsoArmario`).
