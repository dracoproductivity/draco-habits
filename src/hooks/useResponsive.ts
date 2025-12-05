import { useState, useEffect } from 'react';

type DeviceType = 'mobile' | 'tablet' | 'desktop';

export const useResponsive = () => {
  const [deviceType, setDeviceType] = useState<DeviceType>('mobile');
  const [windowWidth, setWindowWidth] = useState(typeof window !== 'undefined' ? window.innerWidth : 0);

  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      setWindowWidth(width);
      
      if (width >= 1024) {
        setDeviceType('desktop');
      } else if (width >= 768) {
        setDeviceType('tablet');
      } else {
        setDeviceType('mobile');
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return {
    deviceType,
    windowWidth,
    isMobile: deviceType === 'mobile',
    isTablet: deviceType === 'tablet',
    isDesktop: deviceType === 'desktop',
  };
};
