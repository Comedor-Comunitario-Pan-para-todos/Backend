const calendarioBogota = new Intl.DateTimeFormat('sv-SE', {
  timeZone: 'America/Bogota',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
});

export function clasificarEdad(
  fechaNacimiento: string,
): 'menor' | 'adulto' | 'desconocida' {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(fechaNacimiento)) return 'desconocida';
  const fecha = new Date(fechaNacimiento);
  const hoy = calendarioBogota.format(new Date());
  if (
    !Number.isFinite(fecha.getTime()) ||
    fecha.toISOString().slice(0, 10) !== fechaNacimiento ||
    fechaNacimiento > hoy
  )
    return 'desconocida';
  const limite = String(Number(hoy.slice(0, 4)) - 18) + hoy.slice(4);
  return fechaNacimiento > limite ? 'menor' : 'adulto';
}
