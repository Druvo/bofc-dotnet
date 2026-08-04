import { useEffect, useState } from 'react';

// Tracks whether the viewport is at/below a mobile breakpoint (default 576px,
// matching Ant Design's `xs`). Updates on resize.
export default function useIsMobile(breakpoint = 576): boolean {
  const [isMobile, setIsMobile] = useState(
    typeof window !== 'undefined' ? window.innerWidth <= breakpoint : false
  );

  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth <= breakpoint);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, [breakpoint]);

  return isMobile;
}
