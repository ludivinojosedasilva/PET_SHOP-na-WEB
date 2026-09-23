const express = require('express');
const agendaService = require('../services/agendaService');
const { responderErro } = require('../utils/erros');
const { dataValida } = require('../utils/datas');

const router = express.Router();

// Visualização da agenda
router.get('/listaPetAgenda', async (req, res, next) => {
  try {
    const filtroData = dataValida(req.query.data) ? req.query.data : '';
    const agendamentos = await agendaService.listarAgendamentos({ data: filtroData });
    res.render('listaPetAgenda', {
      titulo: 'Agenda do Pet Shop',
      agendamentos,
      total: agendamentos.length,
      filtroData,
    });
  } catch (erro) {
    next(erro);
  }
});

// Configuração da agenda: interface
router.get('/ajustaPetAgenda', async (req, res, next) => {
  try {
    const configuracao = await agendaService.obterConfiguracao();
    res.render('ajustaPetAgenda', {
      titulo: 'Configurar agenda',
      script: '/js/admin.js',
      ...configuracao,
    });
  } catch (erro) {
    next(erro);
  }
});

// Configuração da agenda: salvar (fetch + JSON)
router.post('/ajustaPetAgenda', async (req, res) => {
  try {
    const { atualizados } = await agendaService.salvarConfiguracao(req.body?.configuracoes);
    res.json({
      sucesso: true,
      mensagem:
        atualizados === 0
          ? 'Nenhuma alteração: os valores já estavam salvos.'
          : `Configuração salva com sucesso! ${atualizados} horário(s) alterado(s).`,
    });
  } catch (erro) {
    responderErro(res, erro);
  }
});

module.exports = router;

