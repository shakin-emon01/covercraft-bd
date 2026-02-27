import { useEffect, useState } from "react";

const MOBILE_BREAKPOINT = 768;
const TABLET_BREAKPOINT = 1024;

export function useViewport() {
  const getSize = () => ({
    width: typeof window !== "undefined" ? window.innerWidth : 1280,
    height: typeof window !== "undefined" ? window.innerHeight : 720,
  });

  const [viewport, setViewport] = useState(getSize);

  useEffect(() => {
    const onResize = () => setViewport(getSize());
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  return {
    ...viewport,
    isMobile: viewport.width < MOBILE_BREAKPOINT,
    isTablet: viewport.width >= MOBILE_BREAKPOINT && viewport.width < TABLET_BREAKPOINT,
  };
}
