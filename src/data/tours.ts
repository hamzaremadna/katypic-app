import { TourStep } from "../components/tour/TourOverlay";

/**
 * Tour step definitions.
 * arrowTipX/Y: where the arrow tip points (0–1 of screen W/H)
 * tooltipY:    center of tooltip card (0–1 of screen H)
 * arrowSide:   which edge of the card the arrow departs from
 */

// ─── Tour 1: Découvrir les spots (discover.tsx) ──────────
export const TOUR_DISCOVER: TourStep[] = [
  {
    text: "Découvrez votre espace « Mes activités » pour gérer vos événements et vos spots préférés.",
    arrowTipX: 0.12,
    arrowTipY: 0.93,
    tooltipY: 0.55,
    arrowSide: "bottom",
  },
  {
    text: "Découvrez les meilleurs spots photo sur la carte de votre ville.",
    arrowTipX: 0.25,
    arrowTipY: 0.13,
    tooltipY: 0.52,
    arrowSide: "top",
  },
  {
    text: "Découvrez les événements photo et organisez le vôtre pour partager votre passion.",
    arrowTipX: 0.75,
    arrowTipY: 0.13,
    tooltipY: 0.52,
    arrowSide: "top",
  },
  {
    text: "Swipez à gauche ou à droite pour naviguer entre les emplacements sur la carte.",
    arrowTipX: 0.5,
    arrowTipY: 0.45,
    tooltipY: 0.72,
    arrowSide: "top",
  },
];

// ─── Tour 2: Analyser une photo (analyse/import.tsx) ─────
export const TOUR_ANALYSE: TourStep[] = [
  {
    text: "Importez vos photos depuis votre galerie pour démarrer l'analyse.",
    arrowTipX: 0.25,
    arrowTipY: 0.75,
    tooltipY: 0.42,
    arrowSide: "bottom",
  },
  {
    text: "Utilisez l'assistance IA pour faire une sélection automatique de vos photos et éliminer les moins réussies.",
    arrowTipX: 0.82,
    arrowTipY: 0.22,
    tooltipY: 0.54,
    arrowSide: "top",
  },
  {
    text: "Utilisez la fonction magique pour analyser votre photo et apporter des corrections intelligentes.",
    arrowTipX: 0.88,
    arrowTipY: 0.78,
    tooltipY: 0.45,
    arrowSide: "right",
  },
  {
    text: "Ou soyez le maître et effectuez vous-même les corrections manuellement.",
    arrowTipX: 0.5,
    arrowTipY: 0.85,
    tooltipY: 0.5,
    arrowSide: "bottom",
  },
];

// ─── Tour 3: Prise de photo (tabs/camera.tsx) ────────────
export const TOUR_CAMERA: TourStep[] = [
  {
    text: "Prenez la plus belle photo en utilisant ces outils de retouche en temps réel.",
    arrowTipX: 0.5,
    arrowTipY: 0.82,
    tooltipY: 0.45,
    arrowSide: "bottom",
  },
  {
    text: "Utilisez l'Assistant Magique pour bénéficier d'une aide intégrée pendant la prise de vue.",
    arrowTipX: 0.5,
    arrowTipY: 0.9,
    tooltipY: 0.48,
    arrowSide: "bottom",
  },
  {
    text: "Choisissez le type d'assistance — à l'écrit ou oralement — selon vos préférences.",
    arrowTipX: 0.5,
    arrowTipY: 0.5,
    tooltipY: 0.22,
    arrowSide: "bottom",
  },
];

// ─── Tour 4: Retouche (edit/[photoId].tsx) ───────────────
export const TOUR_EDIT: TourStep[] = [
  {
    text: "Ajustez et calibrez votre photo manuellement grâce aux outils de réglage.",
    arrowTipX: 0.2,
    arrowTipY: 0.15,
    tooltipY: 0.48,
    arrowSide: "top",
  },
  {
    text: "Utilisez la retouche IA pour obtenir des suggestions automatiques. Faites glisser les cartes pour parcourir toutes les propositions.",
    arrowTipX: 0.5,
    arrowTipY: 0.35,
    tooltipY: 0.65,
    arrowSide: "top",
  },
  {
    text: "Utilisez les options de recadrage pour redéfinir la composition de votre photo.",
    arrowTipX: 0.62,
    arrowTipY: 0.15,
    tooltipY: 0.48,
    arrowSide: "top",
  },
  {
    text: "Exportez et partagez votre photo retouchée avec votre communauté !",
    arrowTipX: 0.5,
    arrowTipY: 0.92,
    tooltipY: 0.48,
    arrowSide: "bottom",
  },
];
