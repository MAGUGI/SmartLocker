export const LIMITE_HORAS_ABANDONO = 3;
const MS_POR_HORA = 60 * 60 * 1000;
const MS_POR_MINUTO = 60 * 1000;

export function formatarDataHora(iso: string) {
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(iso));
}

export function calcularMinutosDecorridos(
  checkInIso: string | Date,
  referencia: Date = new Date()
): number {
  const inicio = new Date(checkInIso).getTime();
  const diferencaMs = Math.max(0, referencia.getTime() - inicio);
  return Math.floor(diferencaMs / MS_POR_MINUTO);
}

export function calcularHorasDecorridas(
  checkInIso: string | Date,
  referencia: Date = new Date()
): number {
  const inicio = new Date(checkInIso).getTime();
  const diferencaMs = Math.max(0, referencia.getTime() - inicio);
  return Number((diferencaMs / MS_POR_HORA).toFixed(2));
}

export function ultrapassouLimiteAbandono(
  checkInIso: string | Date,
  limiteHoras: number = LIMITE_HORAS_ABANDONO,
  referencia: Date = new Date()
): boolean {
  return calcularHorasDecorridas(checkInIso, referencia) >= limiteHoras;
}

export function formatarTempoDecorrido(
  checkInIso: string | Date,
  referencia: Date = new Date()
): string {
  const totalMinutos = calcularMinutosDecorridos(checkInIso, referencia);
  const horas = Math.floor(totalMinutos / 60);
  const minutos = totalMinutos % 60;

  if (horas === 0) return `${minutos}min`;
  return `${horas}h ${String(minutos).padStart(2, "0")}min`;
}
