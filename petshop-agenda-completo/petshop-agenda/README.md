# PetShop Agenda — Agendamento de Banho e Tosa

**Nome:** Ludivino José da Silva
**Matrícula:** 24250045
**Data:** 15/09/2026
**Disciplina:** 1º Trabalho de Programação WEB — UFSC Campus Araranguá

Plataforma Web para agendamento de banho e tosa. O Pet Shop configura a capacidade de
atendimento simultâneo por dia da semana e horário; os clientes consultam o calendário semanal e
agendam informando nome e CPF.

## Tecnologias
Node.js · Express · MongoDB (Mongoose) · Handlebars (express-handlebars) · HTML · CSS · JavaScript (fetch/JSON)

## Como executar
1. Instale o Node.js 18+ e tenha um MongoDB rodando (local em `mongodb://127.0.0.1:27017` ou Atlas).
2. Instale as dependências:
   ```bash
   npm install
   ```
3. (Opcional) copie `.env.example` para `.env` e ajuste `MONGODB_URI` e `PORT`.
4. Inicie:
   ```bash
   npm start
   ```
5. Acesse http://localhost:3000

Na primeira execução a configuração semanal do enunciado é criada automaticamente.

## Rotas
| Método | Rota | Descrição |
|---|---|---|
| GET | `/` | Calendário semanal (Handlebars). `?semana=N` navega entre semanas |
| GET | `/api/horarios` | Horários disponíveis (JSON) |
| POST | `/api/agendamentos` | Realiza o agendamento (JSON) |
| GET | `/api/agendamentos?cpf=` | Consulta os agendamentos de um cliente |
| GET | `/listaPetAgenda` | Tabela de agendamentos (Data, Horário, Cliente, CPF) |
| GET | `/ajustaPetAgenda` | Interface de configuração da capacidade por dia/horário |
| POST | `/ajustaPetAgenda` | Salva a configuração (JSON via fetch) |

## Modelagem (MongoDB)
- **clientes**: `nome`, `cpf` (único, só dígitos).
- **configuracao_horarios**: `diaSemana` (1–6), `horario` ("HH:MM"), `capacidade`. Índice único (dia, horário).
- **agendamentos**: `cliente`, `slot`, `data`, `horario`, `diaSemana`, `capacidadeTotal`, `vagasRestantesApos`.
  Índice único (cliente, data, horário).
- **slots**: controle da capacidade de uma data específica (`data`, `horario`, `capacidadeTotal`,
  `capacidadeDisponivel`). É criado sob demanda a partir da configuração semanal.

## Regras de negócio e concorrência
Ao confirmar, o servidor: (1) verifica a disponibilidade; (2) identifica/cadastra o cliente pelo CPF;
(3) reduz a capacidade do slot com uma operação **atômica** (`findOneAndUpdate` com filtro
`capacidadeDisponivel > 0` + `$inc: -1`); (4) registra o agendamento associado ao cliente;
(5) devolve JSON de sucesso ou falha. Se dois clientes disputam a última vaga, o filtro atômico
garante que só um consiga. Se o registro do agendamento falhar após a reserva, a vaga é devolvida.

Horários com capacidade 0 e horários já passados não são exibidos como opção.
Ao alterar a capacidade na administração, datas futuras já reservadas são recalculadas
preservando os agendamentos existentes.

## Observações
- O CPF tem os dígitos verificadores validados. Para testes com CPFs fictícios, use
  `VALIDAR_DIGITO_CPF=false` no `.env`.
- A área de administração não possui autenticação (não exigida no enunciado).



## Melhorias incluídas nesta versão

- Rota `GET /health` para diagnóstico rápido do servidor.
- Encerramento gracioso do servidor e da conexão MongoDB.
- `.gitignore` para não versionar `node_modules` e `.env`.
- Validações de entrada no servidor e proteção contra excesso de capacidade.
- Controle atômico de vagas com MongoDB para evitar ultrapassar a capacidade em concorrência.
- Interface responsiva e mensagens de feedback para o cliente.
- Código organizado por responsabilidades: rotas, modelos, serviço de negócio e utilitários.

## Preparação para a defesa

Você deve conseguir explicar pelo menos:
1. Por que o Express é usado.
2. Como o Handlebars renderiza as páginas.
3. O papel de cada coleção MongoDB.
4. Como o CPF identifica um cliente.
5. Como a operação atômica impede duas reservas de consumirem a mesma última vaga.
6. Por que a capacidade semanal e o `Slot` por data ficam separados.
7. Como `/listaPetAgenda` e `/ajustaPetAgenda` atendem ao enunciado.

## Observação sobre segurança

O enunciado não exige autenticação na área administrativa. Portanto, `/listaPetAgenda` e `/ajustaPetAgenda` permanecem abertas, como no projeto-base. Em um sistema real, essas rotas deveriam ter autenticação e autorização.
