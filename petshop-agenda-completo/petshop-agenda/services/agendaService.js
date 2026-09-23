const Cliente = require('../models/Cliente');
const ConfigHorario = require('../models/ConfigHorario');
const Slot = require('../models/Slot');
const Agendamento = require('../models/Agendamento');
const { DIAS_SEMANA, HORARIOS, MAX_SEMANAS_A_FRENTE, CAPACIDADE_MAXIMA } = require('../config/agenda');
const datas = require('../utils/datas');
const cpfUtil = require('../utils/cpf');
const { ErroNegocio } = require('../utils/erros');

const nomeDoDia = (numero) => DIAS_SEMANA.find((d) => d.numero === numero)?.nome ?? '';

/* ------------------------------------------------------------------ */
/* Calendário semanal (cliente)                                        */
/* ------------------------------------------------------------------ */
async function obterCalendarioSemanal(offsetBruto = 0) {
  const offset = Math.min(Math.max(parseInt(offsetBruto, 10) || 0, 0), MAX_SEMANAS_A_FRENTE);
  const segunda = datas.segundaDaSemana(offset);

  const dias = DIAS_SEMANA.map((dia, i) => {
    const d = new Date(segunda);
    d.setDate(segunda.getDate() + i);
    const iso = datas.paraISO(d);
    return { numero: dia.numero, nome: dia.nome, iso, dataBR: datas.paraBR(iso).slice(0, 5) };
  });

  const [configs, slots] = await Promise.all([
    ConfigHorario.find().lean(),
    Slot.find({ data: { $in: dias.map((d) => d.iso) } }).lean(),
  ]);

  const mapaConfig = new Map(configs.map((c) => [`${c.diaSemana}|${c.horario}`, c.capacidade]));
  const mapaSlots = new Map(slots.map((s) => [`${s.data}|${s.horario}`, s.capacidadeDisponivel]));
  const agora = new Date();

  const linhas = HORARIOS.map((horario) => ({
    horario,
    celulas: dias.map((dia) => {
      const chave = `${dia.iso}|${horario}`;
      // Se já existe registro para a data, vale a capacidade restante; senão, a da configuração semanal.
      const vagas = mapaSlots.has(chave) ? mapaSlots.get(chave) : mapaConfig.get(`${dia.numero}|${horario}`) ?? 0;
      const passou = datas.inicioDoAtendimento(dia.iso, horario) <= agora;
      return { data: dia.iso, horario, vagas, disponivel: !passou && vagas > 0 };
    }),
  }));

  return {
    semana: {
      offset,
      anterior: offset - 1,
      proxima: offset + 1,
      temAnterior: offset > 0,
      temProxima: offset < MAX_SEMANAS_A_FRENTE,
      rotulo: `${datas.paraBR(dias[0].iso)} a ${datas.paraBR(dias[dias.length - 1].iso)}`,
    },
    dias,
    linhas,
    temHorarios: linhas.some((l) => l.celulas.some((c) => c.disponivel)),
  };
}

/* ------------------------------------------------------------------ */
/* Agendamento                                                         */
/* ------------------------------------------------------------------ */

// 1ª verificação: leitura das regras e da disponibilidade atual.
async function verificarDisponibilidade(data, horario) {
  if (!datas.dataValida(data)) throw new ErroNegocio('Data inválida.');
  if (!HORARIOS.includes(horario)) throw new ErroNegocio('Horário inválido.');

  const diaSemana = datas.diaDaSemana(data);
  if (!DIAS_SEMANA.some((d) => d.numero === diaSemana)) {
    throw new ErroNegocio('O Pet Shop não atende neste dia.', 409, 'INDISPONIVEL');
  }
  if (datas.inicioDoAtendimento(data, horario) <= new Date()) {
    throw new ErroNegocio('Este horário já passou.', 409, 'INDISPONIVEL');
  }

  const limite = datas.segundaDaSemana(MAX_SEMANAS_A_FRENTE);
  limite.setDate(limite.getDate() + 5);
  if (data > datas.paraISO(limite)) throw new ErroNegocio('Data fora do período de agendamento.');

  const config = await ConfigHorario.findOne({ diaSemana, horario }).lean();
  const capacidadeTotal = config ? config.capacidade : 0;
  if (capacidadeTotal <= 0) {
    throw new ErroNegocio('Não há atendimento neste horário.', 409, 'INDISPONIVEL');
  }

  const slot = await Slot.findOne({ data, horario }).lean();
  const vagas = slot ? slot.capacidadeDisponivel : capacidadeTotal;
  if (vagas <= 0) {
    throw new ErroNegocio('Este horário acabou de ser preenchido. Escolha outro.', 409, 'INDISPONIVEL');
  }

  return { diaSemana, capacidadeTotal };
}

async function garantirSlot(data, horario, diaSemana, capacidadeTotal) {
  try {
    await Slot.updateOne(
      { data, horario },
      { $setOnInsert: { diaSemana, capacidadeTotal, capacidadeDisponivel: capacidadeTotal } },
      { upsert: true }
    );
  } catch (erro) {
    // Duas requisições criaram o slot ao mesmo tempo: o índice único barrou uma delas, e está tudo certo.
    if (erro.code !== 11000) throw erro;
  }
}

async function identificarCliente(nome, cpf) {
  const opcoes = { upsert: true, new: true };
  try {
    return await Cliente.findOneAndUpdate({ cpf }, { $set: { nome } }, opcoes);
  } catch (erro) {
    if (erro.code === 11000) return Cliente.findOneAndUpdate({ cpf }, { $set: { nome } }, opcoes);
    throw erro;
  }
}

async function agendar({ data, horario, nome, cpf } = {}) {
  nome = String(nome ?? '').trim().replace(/\s+/g, ' ');
  data = String(data ?? '');
  horario = String(horario ?? '');
  const cpfLimpo = cpfUtil.somenteDigitos(cpf);

  if (nome.length < 3 || nome.length > 100) throw new ErroNegocio('Informe um nome válido (3 a 100 caracteres).');
  if (!cpfUtil.cpfAceito(cpfLimpo)) throw new ErroNegocio('CPF inválido.');

  // (1) Primeira verificação de disponibilidade
  const { diaSemana, capacidadeTotal } = await verificarDisponibilidade(data, horario);

  // Cadastra ou identifica o cliente pelo CPF
  const cliente = await identificarCliente(nome, cpfLimpo);

  // (2) Segunda verificação, ATÔMICA: só decrementa se ainda houver vaga.
  // Se dois clientes confirmam ao mesmo tempo para a última vaga, apenas um passa.
  await garantirSlot(data, horario, diaSemana, capacidadeTotal);
  const slot = await Slot.findOneAndUpdate(
    { data, horario, capacidadeDisponivel: { $gt: 0 } },
    { $inc: { capacidadeDisponivel: -1 } },
    { new: true }
  );
  if (!slot) {
    throw new ErroNegocio('Este horário acabou de ser preenchido. Escolha outro.', 409, 'INDISPONIVEL');
  }

  // (3) Registra o agendamento associado ao cliente
  let agendamento;
  try {
    agendamento = await Agendamento.create({
      cliente: cliente._id,
      slot: slot._id,
      data,
      horario,
      diaSemana,
      capacidadeTotal: slot.capacidadeTotal,
      vagasRestantesApos: slot.capacidadeDisponivel,
    });
  } catch (erro) {
    // Compensação: devolve a vaga reservada se o registro falhar.
    await Slot.updateOne({ _id: slot._id }, { $inc: { capacidadeDisponivel: 1 } });
    if (erro.code === 11000) {
      throw new ErroNegocio('Este CPF já possui agendamento neste horário.', 409, 'DUPLICADO');
    }
    throw erro;
  }

  return {
    id: agendamento._id,
    data,
    dataBR: datas.paraBR(data),
    diaNome: nomeDoDia(diaSemana),
    horario,
    nome: cliente.nome,
    cpf: cpfUtil.formatarCPF(cliente.cpf),
    vagasRestantes: slot.capacidadeDisponivel,
    capacidadeTotal: slot.capacidadeTotal,
  };
}

/* ------------------------------------------------------------------ */
/* Consultas                                                           */
/* ------------------------------------------------------------------ */
function mapearAgendamento(a) {
  return {
    id: a._id,
    data: a.data,
    dataBR: datas.paraBR(a.data),
    diaNome: nomeDoDia(a.diaSemana),
    horario: a.horario,
    nome: a.cliente?.nome ?? '(cliente removido)',
    cpf: cpfUtil.formatarCPF(a.cliente?.cpf ?? ''),
  };
}

async function listarAgendamentos({ data } = {}) {
  const filtro = {};
  if (data && datas.dataValida(data)) filtro.data = data;
  const itens = await Agendamento.find(filtro)
    .populate('cliente', 'nome cpf')
    .sort({ data: 1, horario: 1, createdAt: 1 })
    .lean();
  return itens.map(mapearAgendamento);
}

async function consultarPorCpf(cpf) {
  const cpfLimpo = cpfUtil.somenteDigitos(cpf);
  if (cpfLimpo.length !== 11) throw new ErroNegocio('Informe um CPF com 11 dígitos.');
  const cliente = await Cliente.findOne({ cpf: cpfLimpo }).lean();
  if (!cliente) return [];
  const itens = await Agendamento.find({ cliente: cliente._id })
    .populate('cliente', 'nome cpf')
    .sort({ data: 1, horario: 1 })
    .lean();
  return itens.map(mapearAgendamento);
}

/* ------------------------------------------------------------------ */
/* Configuração (administração)                                        */
/* ------------------------------------------------------------------ */
async function obterConfiguracao() {
  const configs = await ConfigHorario.find().lean();
  const mapa = new Map(configs.map((c) => [`${c.diaSemana}|${c.horario}`, c.capacidade]));
  return {
    dias: DIAS_SEMANA,
    capacidadeMaxima: CAPACIDADE_MAXIMA,
    linhas: HORARIOS.map((horario) => ({
      horario,
      celulas: DIAS_SEMANA.map((dia) => ({
        dia: dia.numero,
        horario,
        capacidade: mapa.get(`${dia.numero}|${horario}`) ?? 0,
      })),
    })),
  };
}

async function salvarConfiguracao(itens) {
  if (!Array.isArray(itens) || itens.length === 0) throw new ErroNegocio('Nenhuma configuração recebida.');

  const validados = itens.map((item) => {
    const diaSemana = Number(item?.diaSemana);
    const horario = String(item?.horario ?? '');
    const capacidade = Number(item?.capacidade);
    if (!DIAS_SEMANA.some((d) => d.numero === diaSemana) || !HORARIOS.includes(horario)) {
      throw new ErroNegocio('Dia da semana ou horário inválido na configuração.');
    }
    if (!Number.isInteger(capacidade) || capacidade < 0 || capacidade > CAPACIDADE_MAXIMA) {
      throw new ErroNegocio(`A capacidade deve ser um inteiro entre 0 e ${CAPACIDADE_MAXIMA}.`);
    }
    return { diaSemana, horario, capacidade };
  });

  const anteriores = await ConfigHorario.find().lean();
  const mapaAnterior = new Map(anteriores.map((c) => [`${c.diaSemana}|${c.horario}`, c.capacidade]));

  await ConfigHorario.bulkWrite(
    validados.map((v) => ({
      updateOne: {
        filter: { diaSemana: v.diaSemana, horario: v.horario },
        update: { $set: { capacidade: v.capacidade } },
        upsert: true,
      },
    }))
  );

  // Propaga a nova capacidade para datas futuras que já têm slot criado,
  // preservando os agendamentos já feitos (vagas restantes = nova capacidade - agendados).
  const hoje = datas.paraISO(new Date());
  const alterados = validados.filter((v) => mapaAnterior.get(`${v.diaSemana}|${v.horario}`) !== v.capacidade);
  await Promise.all(
    alterados.map((v) =>
      Slot.updateMany({ diaSemana: v.diaSemana, horario: v.horario, data: { $gte: hoje } }, [
        {
          $set: {
            capacidadeDisponivel: {
              $max: [0, { $subtract: [v.capacidade, { $subtract: ['$capacidadeTotal', '$capacidadeDisponivel'] }] }],
            },
            capacidadeTotal: v.capacidade,
          },
        },
      ])
    )
  );

  return { atualizados: alterados.length };
}

module.exports = {
  obterCalendarioSemanal,
  agendar,
  listarAgendamentos,
  consultarPorCpf,
  obterConfiguracao,
  salvarConfiguracao,
};

