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
      // RESTAURAMOS EL TRUCO: Oculta el fondo blanco sobre fondo blanco de la web
      className={`mix-blend-multiply select-none ${className}`} 
      // ELIMINAMOS EL RESPLANDOR DIFUMINADO EXTERNO.
      // POTENCIAMOS EL "DESTELLO" INTERNO: Saturate y Contrast recuperan la fuerza de los colores ante el Multiply.
      style={{ filter: 'brightness(1.1) contrast(1.2) saturate(1.4)' }}
      {...props}
    />
  );
};

export default BrandLogo;
