export interface BibColor {
  id: string;
  name: string;
  shortName: string;
  hex: string;
  bgGradient: string;
  textColor: string;
  borderColor: string;
  glowColor: string;
}

export const BIB_COLORS: BibColor[] = [
  {
    id: 'orange',
    name: 'Colete Laranja',
    shortName: 'Laranja',
    hex: '#F97316',
    bgGradient: 'linear-gradient(135deg, #FB923C, #EA580C)',
    textColor: '#FFFFFF',
    borderColor: '#F97316',
    glowColor: 'rgba(249, 115, 22, 0.45)',
  },
  {
    id: 'yellow',
    name: 'Colete Amarelo',
    shortName: 'Amarelo',
    hex: '#EAB308',
    bgGradient: 'linear-gradient(135deg, #FDE047, #CA8A04)',
    textColor: '#1E293B',
    borderColor: '#EAB308',
    glowColor: 'rgba(234, 179, 8, 0.45)',
  },
  {
    id: 'green',
    name: 'Colete Verde',
    shortName: 'Verde',
    hex: '#10B981',
    bgGradient: 'linear-gradient(135deg, #34D399, #059669)',
    textColor: '#FFFFFF',
    borderColor: '#10B981',
    glowColor: 'rgba(16, 185, 129, 0.45)',
  },
  {
    id: 'blue',
    name: 'Colete Azul',
    shortName: 'Azul',
    hex: '#3B82F6',
    bgGradient: 'linear-gradient(135deg, #60A5FA, #2563EB)',
    textColor: '#FFFFFF',
    borderColor: '#3B82F6',
    glowColor: 'rgba(59, 130, 246, 0.45)',
  },
  {
    id: 'red',
    name: 'Colete Vermelho',
    shortName: 'Vermelho',
    hex: '#EF4444',
    bgGradient: 'linear-gradient(135deg, #F87171, #DC2626)',
    textColor: '#FFFFFF',
    borderColor: '#EF4444',
    glowColor: 'rgba(239, 68, 68, 0.45)',
  },
  {
    id: 'black',
    name: 'Colete Preto',
    shortName: 'Preto',
    hex: '#1E293B',
    bgGradient: 'linear-gradient(135deg, #334155, #0F172A)',
    textColor: '#FFFFFF',
    borderColor: '#475569',
    glowColor: 'rgba(51, 65, 85, 0.5)',
  },
  {
    id: 'white',
    name: 'Colete Branco',
    shortName: 'Branco',
    hex: '#F8FAFC',
    bgGradient: 'linear-gradient(135deg, #FFFFFF, #CBD5E1)',
    textColor: '#0F172A',
    borderColor: '#E2E8F0',
    glowColor: 'rgba(248, 250, 252, 0.35)',
  },
  {
    id: 'purple',
    name: 'Colete Roxo',
    shortName: 'Roxo',
    hex: '#8B5CF6',
    bgGradient: 'linear-gradient(135deg, #A78BFA, #6D28D9)',
    textColor: '#FFFFFF',
    borderColor: '#8B5CF6',
    glowColor: 'rgba(139, 92, 246, 0.45)',
  },
];

export function findBibColor(hexOrName?: string | null): BibColor {
  if (!hexOrName) return BIB_COLORS[0];
  const query = hexOrName.trim().toLowerCase();
  
  const byHex = BIB_COLORS.find((c) => c.hex.toLowerCase() === query);
  if (byHex) return byHex;

  const byName = BIB_COLORS.find(
    (c) =>
      c.name.toLowerCase().includes(query) ||
      query.includes(c.shortName.toLowerCase()) ||
      c.id.toLowerCase() === query,
  );
  if (byName) return byName;

  // Fallback with custom hex
  return {
    id: 'custom',
    name: 'Colete Personalizado',
    shortName: 'Time',
    hex: hexOrName,
    bgGradient: `linear-gradient(135deg, ${hexOrName}, #111827)`,
    textColor: '#FFFFFF',
    borderColor: hexOrName,
    glowColor: `${hexOrName}66`,
  };
}
