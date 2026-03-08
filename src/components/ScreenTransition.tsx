import React, { useEffect, useState, useRef } from 'react';

interface ScreenTransitionProps {
  children: React.ReactNode;
  transitionKey: string;
  type?: 'fade' | 'slide-up' | 'slide-left' | 'zoom' | 'glitch';
  duration?: number;
}

const ScreenTransition: React.FC<ScreenTransitionProps> = ({
  children,
  transitionKey,
  type = 'fade',
  duration = 350,
}) => {
  const [visible, setVisible] = useState(false);
  const [currentChildren, setCurrentChildren] = useState(children);
  const [currentKey, setCurrentKey] = useState(transitionKey);
  const timeoutRef = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    if (transitionKey !== currentKey) {
      // New screen coming in
      setVisible(false);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      timeoutRef.current = setTimeout(() => {
        setCurrentChildren(children);
        setCurrentKey(transitionKey);
        requestAnimationFrame(() => setVisible(true));
      }, duration * 0.4);
    } else {
      setCurrentChildren(children);
    }
  }, [transitionKey, children, currentKey, duration]);

  useEffect(() => {
    // Initial mount animation
    requestAnimationFrame(() => {
      requestAnimationFrame(() => setVisible(true));
    });
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  const getStyles = (): React.CSSProperties => {
    const base: React.CSSProperties = {
      transition: `opacity ${duration}ms cubic-bezier(0.16, 1, 0.3, 1), transform ${duration}ms cubic-bezier(0.16, 1, 0.3, 1), filter ${duration * 0.6}ms ease-out`,
      willChange: 'opacity, transform, filter',
    };

    switch (type) {
      case 'fade':
        return {
          ...base,
          opacity: visible ? 1 : 0,
          transform: visible ? 'scale(1)' : 'scale(1.03)',
          filter: visible ? 'blur(0px)' : 'blur(6px)',
        };
      case 'slide-up':
        return {
          ...base,
          opacity: visible ? 1 : 0,
          transform: visible ? 'translateY(0)' : 'translateY(30px)',
          filter: visible ? 'blur(0px)' : 'blur(4px)',
        };
      case 'slide-left':
        return {
          ...base,
          opacity: visible ? 1 : 0,
          transform: visible ? 'translateX(0)' : 'translateX(40px)',
          filter: visible ? 'blur(0px)' : 'blur(3px)',
        };
      case 'zoom':
        return {
          ...base,
          opacity: visible ? 1 : 0,
          transform: visible ? 'scale(1)' : 'scale(0.85)',
          filter: visible ? 'blur(0px) brightness(1)' : 'blur(8px) brightness(1.5)',
        };
      case 'glitch':
        return {
          ...base,
          opacity: visible ? 1 : 0,
          transform: visible ? 'scale(1) skewX(0deg)' : 'scale(1.02) skewX(-2deg)',
          filter: visible ? 'blur(0px) hue-rotate(0deg)' : 'blur(3px) hue-rotate(30deg)',
        };
      default:
        return { ...base, opacity: visible ? 1 : 0 };
    }
  };

  return (
    <div style={getStyles()}>
      {currentChildren}
    </div>
  );
};

export default ScreenTransition;
