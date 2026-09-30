
process.env.TZ = process.env.TZ || 'America/Sao_Paulo';
require('dotenv').config();

const path = require('path');
const express = require('express');
const { engine } = require('express-handlebars');

const conectarBanco = require('./config/db');
const popularConfiguracaoInicial = require('./config/seed');
const Cliente = require('./models/Cliente');
const ConfigHorario = require('./models/ConfigHorario');
const Slot = require('./models/Slot');
const Agendamento = require('./models/Agendamento');
const clienteRoutes = require('./routes/clienteRoutes');
const adminRoutes = require('./routes/adminRoutes');

const app = express();
const PORT = process.env.PORT || 3000;

// Handlebars
app.engine(
  'hbs',
  engine({
    extname: '.hbs',
    defaultLayout: 'main',
    layoutsDir: path.join(__dirname, 'views', 'layouts'),
    partialsDir: path.join(__dirname, 'views', 'partials'),
  })
);
app.set('view engine', 'hbs');
app.set('views', path.join(__dirname, 'views'));

// Middlewares
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));


app.get('/health', (req, res) => {
  res.json({ sucesso: true, servico: 'petshop-agenda' });
});


app.use('/', clienteRoutes);
app.use('/', adminRoutes);


app.use((req, res) => {
  if (req.path.startsWith('/api/')) {
    return res.status(404).json({ sucesso: false, mensagem: 'Rota não encontrada.' });
  }
  res.status(404).render('erro', {
    titulo: 'Página não encontrada',
    mensagem: 'A página que você procura não existe.',
  });
});


app.use((erro, req, res, next) => {
  console.error(erro);
  if (req.path.startsWith('/api/')) {
    return res.status(500).json({ sucesso: false, mensagem: 'Erro interno do servidor.' });
  }
  res.status(500).render('erro', {
    titulo: 'Erro interno',
    mensagem: 'Ocorreu um erro inesperado. Tente novamente em instantes.',
  });
});

(async () => {
  try {
    await conectarBanco();
    
    await Promise.all([Cliente.init(), ConfigHorario.init(), Slot.init(), Agendamento.init()]);
    await popularConfiguracaoInicial();
    const servidor = app.listen(PORT, () => console.log(`Servidor em http://localhost:${PORT}`));

    
    const encerrar = async (sinal) => {
      console.log(`\\nRecebido ${sinal}. Encerrando servidor...`);
      servidor.close(async () => {
        try {
          await require('mongoose').connection.close();
          console.log('MongoDB desconectado.');
          process.exit(0);
        } catch (erro) {
          console.error('Erro ao encerrar:', erro.message);
          process.exit(1);
        }
      });
    };

    process.on('SIGINT', () => encerrar('SIGINT'));
    process.on('SIGTERM', () => encerrar('SIGTERM'));
  } catch (erro) {
    console.error('Falha ao iniciar a aplicação:', erro.message);
    process.exit(1);
  }
})();

