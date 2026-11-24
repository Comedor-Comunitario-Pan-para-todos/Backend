const calendarioBogota = new Intl.DateTimeFormat('sv-SE', {
  timeZone: 'America/Bogota',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
});

export function requiereTutorParaImagen(fechaNacimiento: string): boolean {
  const hoy = calendarioBogota.format(new Date());
  const limite = String(Number(hoy.slice(0, 4)) - 18) + hoy.slice(4);
  return (
    !/^\d{4}-\d{2}-\d{2}$/.test(fechaNacimiento) ||
    !Number.isFinite(Date.parse(fechaNacimiento)) ||
    fechaNacimiento > limite
  );
}
