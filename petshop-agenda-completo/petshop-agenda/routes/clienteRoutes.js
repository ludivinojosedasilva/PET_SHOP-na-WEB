const express = require('express');
const agendaService = require('../services/agendaService');
const { responderErro } = require('../utils/erros');

const router = express.Router();

// Página principal: calendário semanal renderizado com Handlebars
router.get('/', async (req, res, next) => {
  try {
    const calendario = await agendaService.obterCalendarioSemanal(req.query.semana);
    res.render('index', { titulo: 'Agendar banho e tosa', script: '/js/index.js', ...calendario });
  } catch (erro) {
    next(erro);
  }
});

// Consultar horários disponíveis (JSON)
router.get('/api/horarios', async (req, res) => {
  try {
    const calendario = await agendaService.obterCalendarioSemanal(req.query.semana);
    res.json({ sucesso: true, ...calendario });
  } catch (erro) {
    responderErro(res, erro);
  }
});

// Realizar agendamento
router.post('/api/agendamentos', async (req, res) => {
  try {
    const agendamento = await agendaService.agendar(req.body || {});
    res.status(201).json({
      sucesso: true,
      mensagem: `Agendamento confirmado para ${agendamento.diaNome}, ${agendamento.dataBR} às ${agendamento.horario}.`,
      agendamento,
    });
  } catch (erro) {
    responderErro(res, erro);
  }
});

// Consultar agendamentos de um cliente: GET /api/agendamentos?cpf=12345678909
router.get('/api/agendamentos', async (req, res) => {
  try {
    const agendamentos = await agendaService.consultarPorCpf(req.query.cpf);
    res.json({ sucesso: true, agendamentos });
  } catch (erro) {
    responderErro(res, erro);
  }
});

module.exports = router;

