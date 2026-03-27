import React from 'react';
import { useGlobalData as useGlobal } from '../../context/GlobalContext';

interface BrandLogoProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  className?: string;
}

const BrandLogo: React.FC<BrandLogoProps> = ({ className = "", ...props }) => {
  const { config } = useGlobal();
  const rawUrl = config?.logoImage || '/assets/img/logo.png';
  
  // Rompe-caché para forzar la carga del PNG transparente
  const logoUrl = rawUrl.includes('?') ? rawUrl : `${rawUrl}?v=clean`;

  return (
    <img 
      src={logoUrl} 
      alt="Margarita Viajes" 
      className={`bg-transparent select-none ${className}`} 
      style={{ filter: 'drop-shadow(0 0 15px rgba(235, 90, 12, 0.7))' }}
      {...props}
    />
  );
};

export default BrandLogo;
