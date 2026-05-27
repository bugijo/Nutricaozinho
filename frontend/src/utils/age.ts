// Calcula a idade a partir da data de nascimento, sempre em relação a HOJE
// (recalcula a cada renderização, então "envelhece" sozinho com o passar do tempo).
export function formatAge(birthDate?: string | null): string {
  if (!birthDate) return 'Idade não informada';
  const nasc = new Date(birthDate);
  if (isNaN(nasc.getTime())) return 'Idade não informada';

  const hoje = new Date();
  if (nasc > hoje) return 'Data futura';

  let anos = hoje.getFullYear() - nasc.getFullYear();
  let meses = hoje.getMonth() - nasc.getMonth();
  if (hoje.getDate() < nasc.getDate()) meses -= 1;
  if (meses < 0) {
    anos -= 1;
    meses += 12;
  }

  const parteAnos = anos > 0 ? `${anos} ${anos === 1 ? 'ano' : 'anos'}` : '';
  const parteMeses = meses > 0 ? `${meses} ${meses === 1 ? 'mês' : 'meses'}` : '';

  if (anos === 0 && meses === 0) return 'Recém-nascido';
  if (parteAnos && parteMeses) return `${parteAnos} e ${parteMeses}`;
  return parteAnos || parteMeses;
}
