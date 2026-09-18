import React from 'react';

interface MedicalDisclaimerProps {
  isDark?: boolean;
}

/** Aviso final, sin recuadro: centrado y en negrita. */
export const MedicalDisclaimer: React.FC<MedicalDisclaimerProps> = ({ isDark = true }) => (
  <p
    className={`text-center text-[11px] sm:text-xs font-bold leading-relaxed px-2 ${
      isDark ? 'text-amber-200/90' : 'text-amber-800'
    }`}
  >
    Contenido orientativo. No reemplaza la valoración médica, nutricional o fisioterapéutica
    individual.
  </p>
);
