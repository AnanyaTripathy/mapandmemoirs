import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect, Suspense, lazy } from "react";

// Move lazy loading outside the component to keep it stable
const WorldCanvas = lazy(() => import("../components/WorldCanvas"));

export const Route = createFileRoute("/")({
  component: HomePage,
});

function HomePage() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="h-screen w-screen bg-[#0b0e14] flex items-center justify-center">
        <div className="text-white/20 animate-pulse tracking-widest uppercase text-xl font-sans font-light">
          Canvas Initializing...
        </div>
      </div>
    );
  }

  return (
    <Suspense fallback={
        <div className="h-screen w-screen bg-[#0b0e14] flex items-center justify-center">
            <div className="text-white/20 animate-pulse tracking-widest uppercase text-xl font-sans font-light">
            Loading Assets...
            </div>
        </div>
    }>
      <WorldCanvas />
    </Suspense>
  );
}
