import { useState, useEffect } from 'react';
import { useGlobalData } from '../../context/GlobalContext';

interface BrandLogoProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  // Add any specific props if needed
}

export default function BrandLogo({ className, ...props }: BrandLogoProps) {
  const { config } = useGlobalData();
  const [isMobile, setIsMobile] = useState(typeof window !== 'undefined' ? window.innerWidth <= 768 : false);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const getLogoSrc = () => {
    if (!config) return '/assets/img/logo.png';
    
    const prefix = isMobile ? 'mobile_' : 'pc_';
    const dynamicLogo = config[prefix + 'logoImage'] || config['logoImage'];
    
    return dynamicLogo || '/assets/img/logo.png';
  };

  return (
    <img 
      src={getLogoSrc()} 
      alt={config?.agencyName || 'Margarita Viajes'} 
      className={className}
      style={{ ...props.style }}
      {...props}
    />
  );
}
