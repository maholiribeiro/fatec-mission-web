import { Award, Brain, CalendarDays, Compass, Flag, Flame, MapPin, Monitor, Zap } from 'lucide-react';

/** Ícone por tipo de missão (os tipos são genéricos na API: Tipo 1..4). */
export const ICONE_TIPO = {
  'Tipo 1': MapPin,
  'Tipo 2': Brain,
  'Tipo 3': CalendarDays,
  'Tipo 4': Monitor,
};

/** Ícone da conquista a partir do formato do requisito. */
export function iconeConquista(requisito) {
  const tipo = (requisito || '').split(':')[0];
  return { missoes: Flag, xp: Zap, dificuldade: Flame, tipo: Compass }[tipo] || Award;
}
