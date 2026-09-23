class ErroNegocio extends Error {
  constructor(mensagem, status = 400, codigo = 'INVALIDO') {
    super(mensagem);
    this.name = 'ErroNegocio';
    this.status = status;
    this.codigo = codigo;
  }
}

function responderErro(res, erro) {
  if (erro instanceof ErroNegocio) {
    return res.status(erro.status).json({ sucesso: false, mensagem: erro.message, codigo: erro.codigo });
  }
  console.error(erro);
  return res.status(500).json({ sucesso: false, mensagem: 'Erro interno do servidor. Tente novamente.' });
}

module.exports = { ErroNegocio, responderErro };

