function somenteDigitos(valor) {
  return String(valor ?? '').replace(/\D/g, '');
}

function validarCPF(valor) {
  const cpf = somenteDigitos(valor);
  if (cpf.length !== 11 || /^(\d)\1{10}$/.test(cpf)) return false;

  const digito = (qtd) => {
    let soma = 0;
    for (let i = 0; i < qtd; i++) soma += Number(cpf[i]) * (qtd + 1 - i);
    const resto = (soma * 10) % 11;
    return resto === 10 ? 0 : resto;
  };

  return digito(9) === Number(cpf[9]) && digito(10) === Number(cpf[10]);
}

// Regra usada pelo sistema: valida dígitos verificadores, a menos que VALIDAR_DIGITO_CPF=false.
function cpfAceito(valor) {
  const cpf = somenteDigitos(valor);
  if (cpf.length !== 11) return false;
  return process.env.VALIDAR_DIGITO_CPF === 'false' ? true : validarCPF(cpf);
}

function formatarCPF(valor) {
  return somenteDigitos(valor).replace(/^(\d{3})(\d{3})(\d{3})(\d{2})$/, '$1.$2.$3-$4');
}

module.exports = { somenteDigitos, validarCPF, cpfAceito, formatarCPF };

