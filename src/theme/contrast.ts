/**
 * Escolhe a cor de texto/ícone (escura ou clara) que melhor contrasta com
 * um fundo arbitrário, com base na luminância percebida. Usado em chips,
 * cards e badges que têm cor de fundo própria — assim a legibilidade não
 * depende do tema (claro/escuro).
 */
export function readableTextOn(background: string): string {
  const hex = background.trim().replace('#', '');
  if (hex.length < 6) return '#2F2A33';

  const r = parseInt(hex.slice(0, 2), 16);
  const g = parseInt(hex.slice(2, 4), 16);
  const b = parseInt(hex.slice(4, 6), 16);
  if ([r, g, b].some(Number.isNaN)) return '#2F2A33';

  // Luminância percebida (0 = escuro, 1 = claro).
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.6 ? '#2F2A33' : '#FFFFFF';
}
