const mongoose = require('mongoose');

// Controle de capacidade de UMA data específica (ex.: 29/09/2026 às 09:00).
// É criado sob demanda a partir da ConfigHorario e decrementado de forma atômica a cada agendamento.
const slotSchema = new mongoose.Schema(
  {
    data: { type: String, required: true, match: /^\d{4}-\d{2}-\d{2}$/ }, // YYYY-MM-DD (evita problemas de fuso)
    horario: { type: String, required: true, match: /^\d{2}:\d{2}$/ },
    diaSemana: { type: Number, required: true, min: 1, max: 6 },
    capacidadeTotal: { type: Number, required: true, min: 0 },
    capacidadeDisponivel: { type: Number, required: true, min: 0 },
  },
  { collection: 'slots', versionKey: false }
);

slotSchema.index({ data: 1, horario: 1 }, { unique: true });

module.exports = mongoose.model('Slot', slotSchema);

