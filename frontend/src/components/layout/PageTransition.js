'use client';
import { useRef, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { gsap } from 'gsap';

export default function PageTransition({ children }) {
  const pageRef = useRef(null);
  const pathname = usePathname();

  useEffect(() => {
    if (pageRef.current) {
      gsap.set(pageRef.current, { opacity: 0, y: 12 });
      gsap.to(pageRef.current, {
        opacity: 1, y: 0, duration: 0.45, ease: 'power3.out',
        clearProps: 'opacity,transform',
      });
    }
    window.scrollTo(0, 0);
  }, [pathname]);

  return (
    <div ref={pageRef} className="flex-1">
      {children}
    </div>
  );
}
