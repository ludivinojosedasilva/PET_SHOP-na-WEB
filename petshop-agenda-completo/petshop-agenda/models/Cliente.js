const mongoose = require('mongoose');

const clienteSchema = new mongoose.Schema(
  {
    nome: { type: String, required: true, trim: true, minlength: 3, maxlength: 100 },
    // Somente dígitos; o CPF identifica o cliente (índice único).
    cpf: { type: String, required: true, unique: true, match: /^\d{11}$/ },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Cliente', clienteSchema);

