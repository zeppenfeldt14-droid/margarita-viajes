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
      // mix-blend-multiply: Hace que el blanco de la imagen sea transparente.
      // filter: Recuperamos la fuerza del naranja y el amarillo.
      className={`mix-blend-multiply select-none border-none outline-none ${className}`} 
      style={{ 
        filter: 'contrast(1.2) saturate(1.3) brightness(1.05)',
        backgroundColor: 'transparent' 
      }}
      {...props}
    />
  );
};

export default BrandLogo;
