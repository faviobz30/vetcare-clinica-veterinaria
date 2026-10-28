// Una aplicación conserva su recomendación, pero su dosis hija es la programación operable.
export function pendingDoseRows(rows) {
  const parents=new Set(rows.filter(v=>v.idVacunaOrigen!=null).map(v=>String(v.idVacunaOrigen)))
  return rows.filter(v=>v.proximaDosis&&!parents.has(String(v.idVacuna)))
}
