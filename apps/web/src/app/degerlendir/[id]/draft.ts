/** Değerlendirme formu taslak durumu (sunucu ve istemci bileşenleri paylaşır). */
export interface DraftData {
  rating: number | null;
  criteria: Record<string, number>;
  title: string;
  body: string;
  experienceMonth: string;
  usageDuration: string;
  visitContext: string;
  ownExperience: boolean;
  noConflict: boolean;
  incentivized: boolean | null;
}

export const EMPTY_DRAFT: DraftData = {
  rating: null,
  criteria: {},
  title: '',
  body: '',
  experienceMonth: '',
  usageDuration: '',
  visitContext: '',
  ownExperience: false,
  noConflict: false,
  incentivized: null,
};
