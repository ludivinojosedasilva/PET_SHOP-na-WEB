const mongoose = require('mongoose');

// Configuração semanal: "toda segunda às 08:00 comporta N atendimentos simultâneos".
const configHorarioSchema = new mongoose.Schema(
  {
    diaSemana: { type: Number, required: true, min: 1, max: 6 }, // 1 = segunda ... 6 = sábado
    horario: { type: String, required: true, match: /^\d{2}:\d{2}$/ },
    capacidade: {
      type: Number,
      required: true,
      min: 0,
      default: 0,
      validate: { validator: Number.isInteger, message: 'A capacidade deve ser um número inteiro.' },
    },
  },
  { timestamps: true, collection: 'configuracao_horarios' }
);

configHorarioSchema.index({ diaSemana: 1, horario: 1 }, { unique: true });

module.exports = mongoose.model('ConfigHorario', configHorarioSchema);

