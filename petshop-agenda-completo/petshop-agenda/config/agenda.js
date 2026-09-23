// Constantes de domínio da agenda.
const DIAS_SEMANA = [
  { numero: 1, nome: 'Segunda' },
  { numero: 2, nome: 'Terça' },
  { numero: 3, nome: 'Quarta' },
  { numero: 4, nome: 'Quinta' },
  { numero: 5, nome: 'Sexta' },
  { numero: 6, nome: 'Sábado' },
];

const HORARIOS = ['08:00', '09:00', '10:00', '11:00', '14:00', '15:00', '16:00', '17:00'];

const MAX_SEMANAS_A_FRENTE = 8; // até quantas semanas o cliente pode navegar
const CAPACIDADE_MAXIMA = 20; // limite de sanidade para a configuração

module.exports = { DIAS_SEMANA, HORARIOS, MAX_SEMANAS_A_FRENTE, CAPACIDADE_MAXIMA };

