(() => {
  'use strict';

  const form = document.getElementById('form-config');
  const mensagem = document.getElementById('mensagem');
  const btnSalvar = document.getElementById('btn-salvar');

  function mostrarMensagem(texto, tipo) {
    mensagem.textContent = texto;
    mensagem.className = `mensagem ${tipo}`;
    mensagem.hidden = false;
    mensagem.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }

  form.addEventListener('submit', async (ev) => {
    ev.preventDefault();

    const configuracoes = [];
    let invalido = false;

    form.querySelectorAll('input[data-dia]').forEach((campo) => {
      const texto = campo.value.trim();
      const valor = Number(texto);
      const max = Number(campo.max);
      const ok = texto !== '' && Number.isInteger(valor) && valor >= 0 && valor <= max;
      campo.classList.toggle('invalido', !ok);
      if (!ok) {
        invalido = true;
        return;
      }
      configuracoes.push({
        diaSemana: Number(campo.dataset.dia),
        horario: campo.dataset.horario,
        capacidade: valor,
      });
    });

    if (invalido) {
      return mostrarMensagem('Use apenas números inteiros entre 0 e o limite permitido em todos os campos.', 'erro');
    }

    btnSalvar.disabled = true;
    btnSalvar.textContent = 'Salvando...';

    try {
      const resposta = await fetch('/ajustaPetAgenda', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ configuracoes }),
      });
      const json = await resposta.json().catch(() => ({ sucesso: false, mensagem: 'Resposta inválida do servidor.' }));
      mostrarMensagem(json.mensagem || 'Operação concluída.', resposta.ok && json.sucesso ? 'sucesso' : 'erro');
    } catch (erro) {
      mostrarMensagem('Falha de comunicação com o servidor. Tente novamente.', 'erro');
    } finally {
      btnSalvar.disabled = false;
      btnSalvar.textContent = 'Salvar configuração';
    }
  });
})();

