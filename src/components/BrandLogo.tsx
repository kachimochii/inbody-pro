import React from 'react';
import { useTheme } from '../context/ThemeContext';

interface BrandLogoProps {
  className?: string;
  /** Altura visual (Tailwind). Default: h-10 */
  sizeClassName?: string;
  /**
   * auto = según tema de la app
   * dark-bg = logo blanco (fondos oscuros)
   * light-bg = logo negro (fondos claros)
   */
  variant?: 'auto' | 'dark-bg' | 'light-bg';
}

/** Logo PNG limpio (sin marco cuadrado) */
export const BrandLogo: React.FC<BrandLogoProps> = ({
  className = '',
  sizeClassName = 'h-10',
  variant = 'auto',
}) => {
  const { isDark } = useTheme();
  const useWhite =
    variant === 'dark-bg' ? true : variant === 'light-bg' ? false : isDark;

  return (
    <img
      src={useWhite ? '/logos/logo-white.webp' : '/logos/logo-black.webp'}
      alt="InBody"
      className={`${sizeClassName} w-auto object-contain drop-shadow-sm ${className}`}
      decoding="async"
    />
  );
};
