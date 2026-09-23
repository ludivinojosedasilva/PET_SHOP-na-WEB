(() => {
  'use strict';

  const calendario = document.getElementById('calendario');
  const painel = document.getElementById('painel');
  const form = document.getElementById('form-agendamento');
  const resumo = document.getElementById('resumo-slot');
  const mensagem = document.getElementById('mensagem');
  const campoNome = document.getElementById('nome');
  const campoCpf = document.getElementById('cpf');
  const btnConfirmar = document.getElementById('btn-confirmar');
  const btnCancelar = document.getElementById('btn-cancelar');

  let botaoSelecionado = null;

  function mostrarMensagem(texto, tipo) {
    mensagem.textContent = texto;
    mensagem.className = `mensagem ${tipo}`;
    mensagem.hidden = false;
    mensagem.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }

  function formatarDataExtenso(iso) {
    const [ano, mes, dia] = iso.split('-').map(Number);
    return new Date(ano, mes - 1, dia).toLocaleDateString('pt-BR', {
      weekday: 'long', day: '2-digit', month: '2-digit', year: 'numeric',
    });
  }

  function mascararCPF(valor) {
    return valor
      .replace(/\D/g, '')
      .slice(0, 11)
      .replace(/^(\d{3})(\d)/, '$1.$2')
      .replace(/^(\d{3})\.(\d{3})(\d)/, '$1.$2.$3')
      .replace(/\.(\d{3})(\d)/, '.$1-$2');
  }

  function selecionar(botao) {
    if (botaoSelecionado) botaoSelecionado.classList.remove('selecionado');
    botaoSelecionado = botao;
    botao.classList.add('selecionado');
    resumo.textContent = `${formatarDataExtenso(botao.dataset.data)} às ${botao.dataset.horario}`;
    painel.hidden = false;
    campoNome.focus();
    painel.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }

  function fecharPainel() {
    if (botaoSelecionado) botaoSelecionado.classList.remove('selecionado');
    botaoSelecionado = null;
    painel.hidden = true;
    form.reset();
  }

  function removerSlot(botao) {
    botao.closest('td').innerHTML = '<span class="indisponivel">—</span>';
  }

  function atualizarSlot(botao, vagasRestantes) {
    if (vagasRestantes <= 0) return removerSlot(botao);
    botao.querySelector('.slot-vagas').textContent = `Vagas: ${vagasRestantes}`;
  }

  calendario.addEventListener('click', (ev) => {
    const botao = ev.target.closest('.slot');
    if (botao) selecionar(botao);
  });

  campoCpf.addEventListener('input', () => {
    campoCpf.value = mascararCPF(campoCpf.value);
  });

  btnCancelar.addEventListener('click', fecharPainel);

  form.addEventListener('submit', async (ev) => {
    ev.preventDefault();
    if (!botaoSelecionado) return mostrarMensagem('Selecione um horário no calendário.', 'erro');

    const nome = campoNome.value.trim();
    const cpf = campoCpf.value.trim();
    if (nome.length < 3) return mostrarMensagem('Informe seu nome completo.', 'erro');
    if (cpf.replace(/\D/g, '').length !== 11) return mostrarMensagem('Informe um CPF com 11 dígitos.', 'erro');

    const botao = botaoSelecionado;
    const { data, horario } = botao.dataset;

    btnConfirmar.disabled = true;
    btnConfirmar.textContent = 'Enviando...';

    try {
      const resposta = await fetch('/api/agendamentos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ data, horario, nome, cpf }),
      });
      const json = await resposta.json().catch(() => ({ sucesso: false, mensagem: 'Resposta inválida do servidor.' }));

      if (resposta.ok && json.sucesso) {
        atualizarSlot(botao, json.agendamento.vagasRestantes);
        fecharPainel();
        mostrarMensagem(json.mensagem, 'sucesso');
      } else {
        if (json.codigo === 'INDISPONIVEL') {
          removerSlot(botao);
          fecharPainel();
        }
        mostrarMensagem(json.mensagem || 'Não foi possível concluir o agendamento.', 'erro');
      }
    } catch (erro) {
      mostrarMensagem('Falha de comunicação com o servidor. Tente novamente.', 'erro');
    } finally {
      btnConfirmar.disabled = false;
      btnConfirmar.textContent = 'Confirmar agendamento';
    }
  });
})();

