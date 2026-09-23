const mongoose = require('mongoose');

async function conectarBanco() {
  const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/petshop_agenda';
  await mongoose.connect(uri);
  console.log('MongoDB conectado');
}

module.exports = conectarBanco;

