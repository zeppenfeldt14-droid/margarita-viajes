import React from 'react';
import { useGlobalData as useGlobal } from '../../context/GlobalContext';

interface BrandLogoProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  className?: string;
}

const BrandLogo: React.FC<BrandLogoProps> = ({ className = "h-16 w-auto object-contain", ...props }) => {
  const { config } = useGlobal();
  const logoUrl = config?.logoImage || '/assets/img/logo.png';

  return (
    <img 
      src={logoUrl} 
      alt="Margarita Viajes" 
      className={`bg-transparent ${className}`} 
      {...props}
    />
  );
};

export default BrandLogo;
