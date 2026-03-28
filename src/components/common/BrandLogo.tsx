import React, { useState, useEffect } from 'react';
import { useGlobalData as useGlobal } from '../../context/GlobalContext';

interface BrandLogoProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  className?: string;
}

const BrandLogo: React.FC<BrandLogoProps> = ({ className = "", ...props }) => {
  const { config } = useGlobal();
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Leer clave bifurcada según dispositivo (igual que getConf() en Home.tsx)
  // El admin guarda: pc_logoImage o mobile_logoImage
  const prefix = isMobile ? 'mobile_' : 'pc_';
  const logoUrl =
    config?.[`${prefix}logoImage`] ||   // clave bifurcada (pc_logoImage / mobile_logoImage)
    config?.logoImage ||                  // fallback: clave genérica legacy
    '/assets/img/logo.png';              // fallback: asset estático

  return (
    <img
      src={logoUrl}
      alt="Margarita Viajes"
      className={`select-none border-none outline-none ${className}`}
      style={{ background: 'transparent' }}
      {...props}
    />
  );
};

export default BrandLogo;
