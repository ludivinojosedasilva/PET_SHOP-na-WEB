// Datas trafegam como string "YYYY-MM-DD" e horários como "HH:MM" (sem fuso).
const pad = (n) => String(n).padStart(2, '0');

function paraISO(d) {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function deISO(iso) {
  const [ano, mes, dia] = iso.split('-').map(Number);
  return new Date(ano, mes - 1, dia);
}

function paraBR(iso) {
  const [ano, mes, dia] = iso.split('-');
  return `${dia}/${mes}/${ano}`;
}

function dataValida(iso) {
  if (typeof iso !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(iso)) return false;
  return paraISO(deISO(iso)) === iso;
}

function diaDaSemana(iso) {
  return deISO(iso).getDay(); // 0 = domingo ... 6 = sábado
}

function inicioDoAtendimento(iso, horario) {
  const [h, m] = horario.split(':').map(Number);
  const d = deISO(iso);
  d.setHours(h, m, 0, 0);
  return d;
}

// Segunda-feira da semana exibida. No domingo, a "semana atual" já é a próxima.
function segundaDaSemana(offset = 0) {
  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);
  const dow = hoje.getDay();
  const diff = dow === 0 ? 1 : 1 - dow;
  const segunda = new Date(hoje);
  segunda.setDate(hoje.getDate() + diff + offset * 7);
  return segunda;
}

module.exports = { paraISO, deISO, paraBR, dataValida, diaDaSemana, inicioDoAtendimento, segundaDaSemana };

