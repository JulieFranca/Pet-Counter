export const calculateAgeInMonths = (birthDate: Date, adoptionDate?: Date): number => {
  const referenceDate = birthDate || adoptionDate;
  if (!referenceDate) return 0;

  const today = new Date();
  const diffTime = Math.abs(today.getTime() - referenceDate.getTime());
  const diffMonths = Math.floor(diffTime / (1000 * 60 * 60 * 24 * 30.44)); // Média de dias por mês
  return diffMonths;
};

export const formatAge = (months: number): string => {
  if (months < 1) return 'Menos de 1 mês';
  
  const years = Math.floor(months / 12);
  const remainingMonths = months % 12;

  if (years === 0) {
    return `${months} ${months === 1 ? 'mês' : 'meses'}`;
  }

  if (remainingMonths === 0) {
    return `${years} ${years === 1 ? 'ano' : 'anos'}`;
  }

  return `${years} ${years === 1 ? 'ano' : 'anos'} e ${remainingMonths} ${remainingMonths === 1 ? 'mês' : 'meses'}`;
};

export const formatDate = (date: Date): string => {
  return date.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
};

export const parseDate = (dateString: string): Date | undefined => {
  if (!dateString) return undefined;
  
  const [day, month, year] = dateString.split('/').map(Number);
  const date = new Date(year, month - 1, day);
  
  return isNaN(date.getTime()) ? undefined : date;
}; 