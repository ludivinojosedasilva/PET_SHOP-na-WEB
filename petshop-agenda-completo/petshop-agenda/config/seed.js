const ConfigHorario = require('../models/ConfigHorario');
const { DIAS_SEMANA, HORARIOS } = require('./agenda');


const CAPACIDADE_MANHA = { 1: 1, 2: 2, 3: 1, 4: 2, 5: 2, 6: 1 };
const CAPACIDADE_TARDE = { 1: 1, 2: 2, 3: 1, 4: 2, 5: 2, 6: 0 };

async function popularConfiguracaoInicial() {
  if ((await ConfigHorario.estimatedDocumentCount()) > 0) return;

  const documentos = [];
  for (const dia of DIAS_SEMANA) {
    for (const horario of HORARIOS) {
      const manha = Number(horario.split(':')[0]) < 12;
      documentos.push({
        diaSemana: dia.numero,
        horario,
        capacidade: (manha ? CAPACIDADE_MANHA : CAPACIDADE_TARDE)[dia.numero],
      });
    }
  }
  await ConfigHorario.insertMany(documentos);
  console.log('Configuração inicial de horários criada.');
}

module.exports = popularConfiguracaoInicial;

