import React from 'react';
import { useGlobalData as useGlobal } from '../../context/GlobalContext';

interface BrandLogoProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  className?: string;
}

const BrandLogo: React.FC<BrandLogoProps> = ({ className = "", ...props }) => {
  const { config } = useGlobal();
  const logoUrl = config?.logoImage || '/assets/img/logo.png';

  return (
    <img 
      src={logoUrl} 
      alt="Margarita Viajes" 
      // TRANSPARENCIA ABSOLUTA: Eliminamos el truco de multiply ya que el PNG es nativamente transparente.
      // Forzamos bg-transparent y shadow-none para evitar recuadros blancos.
      className={`BrandLogo bg-transparent shadow-none border-none select-none ${className}`} 
      // POTENCIAMOS LA VIBRANCIA: Saturate y Contrast mantienen la fuerza de los colores.
      style={{ filter: 'brightness(1.1) contrast(1.2) saturate(1.4)' }}
      {...props}
    />
  );
};

export default BrandLogo;
