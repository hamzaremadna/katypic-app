export interface OnboardingOption {
    id: string;
    label: string;
    description?: string;
    emoji?: string;
  }
  
  export interface OnboardingQuestion {
    id: string;
    step: number;
    totalSteps: number;
    question: string;
    options: OnboardingOption[];
    multiSelect?: boolean;
  }
  
  export interface OnboardingAnswers {
    level?: string;
    subjects?: string[];
    style?: string;
    ambition?: string;
  }
  
  export const ONBOARDING_QUESTIONS: OnboardingQuestion[] = [
    {
      id: 'level',
      step: 1,
      totalSteps: 4,
      question: 'Quel est votre niveau\nen photographie ?',
      options: [
        { id: 'beginner', label: 'Débutant complet', description: 'Je découvre tout juste l\'appareil.' },
        { id: 'basics', label: 'J\'ai des bases', description: 'Je connais les réglages simples.' },
        { id: 'amateur', label: 'Amateur confirmé', description: 'Je maîtrise l\'exposition.' },
        { id: 'advanced', label: 'Passionné avancé', description: 'La photo n\'a plus de secrets.' },
      ],
    },
    {
      id: 'subjects',
      step: 2,
      totalSteps: 4,
      question: 'Que souhaitez-vous\nphotographier ?',
      options: [
        { id: 'travel', label: 'Voyages & Paysages', description: 'Je connais les réglages simples.' },
        { id: 'portrait', label: 'Portraits & Personnes', description: 'Capturer les émotions.' },
        { id: 'street', label: 'Street & Urbain', description: 'La vie de la ville.' },
        { id: 'nature', label: 'Nature & Macro', description: 'Les détails du vivant.' },
      ],
    },
    {
      id: 'style',
      step: 3,
      totalSteps: 4,
      question: 'Vous préférez\nphotographier ?',
      options: [
        { id: 'travel_landscape', label: 'Voyages & Paysages', description: 'Je connais les réglages simples.' },
        { id: 'confirmed', label: 'Amateur confirmé', description: 'Je maîtrise l\'exposition.' },
        { id: 'advanced', label: 'Passionné avancé', description: 'La photo n\'a plus de secrets.' },
      ],
    },
    {
      id: 'ambition',
      step: 4,
      totalSteps: 4,
      question: 'Quel est votre objectif\nprincipal ?',
      options: [
        { id: 'improve', label: 'M\'améliorer progressivement', description: 'Des conseils au quotidien.' },
        { id: 'share', label: 'Partager mes photos', description: 'Réseaux sociaux & communauté.' },
        { id: 'pro', label: 'Devenir professionnel', description: 'Bâtir une carrière.' },
        { id: 'memories', label: 'Garder des souvenirs', description: 'Immortaliser les moments.' },
      ],
    },
  ];