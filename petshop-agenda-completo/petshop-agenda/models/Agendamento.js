const mongoose = require('mongoose');

const agendamentoSchema = new mongoose.Schema(
  {
    cliente: { type: mongoose.Schema.Types.ObjectId, ref: 'Cliente', required: true },
    slot: { type: mongoose.Schema.Types.ObjectId, ref: 'Slot', required: true },
    data: { type: String, required: true, match: /^\d{4}-\d{2}-\d{2}$/ },
    horario: { type: String, required: true, match: /^\d{2}:\d{2}$/ },
    diaSemana: { type: Number, required: true, min: 1, max: 6 },
    
    capacidadeTotal: { type: Number, required: true, min: 0 },
    vagasRestantesApos: { type: Number, required: true, min: 0 },
  },
  { timestamps: true }
);

// O mesmo cliente não pode marcar duas vezes o mesmo horário.
agendamentoSchema.index({ cliente: 1, data: 1, horario: 1 }, { unique: true });
agendamentoSchema.index({ data: 1, horario: 1 });

module.exports = mongoose.model('Agendamento', agendamentoSchema);

