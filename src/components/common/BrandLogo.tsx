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
      // POTENCIAMOS EL "DESTELLO" INTERNO: Brightness y Contrast hacen que los naranjas/amarillos brillen con más fuerza.
      style={{ filter: 'brightness(1.2) contrast(1.1)' }}
      {...props}
    />
  );
};

export default BrandLogo;
