"use client";

// Client-side root that wraps the Cartographer port — provider + hologram +
// world panel + floating control rail (right) + tweaks panel (gear in the
// bottom-right, secondary settings only). The server route file mounts this
// and passes the auth-derived isAdmin flag.

import { useEffect, useSyncExternalStore } from "react";

import { getTheme } from "@/lib/galaxy/themes";

import { GalaxyProvider, useGalaxy } from "./context";
import GalaxyHologram from "./GalaxyHologram";
import MapControlRail from "./MapControlRail";
import TweaksPanel from "./tweaks/TweaksPanel";
import WorldPanel from "./WorldPanel";

interface MapRootProps {
  initialIsAdmin: boolean;
}

function subscribeMounted() {
  return () => {};
}

function getMountedSnapshot() {
  return true;
}

function getMountedServerSnapshot() {
  return false;
}

function PanelHost() {
  // The panel reads its own theme via the active tweaks. Centralized here so
  // hologram + panel agree on the palette without prop-drilling.
  const state = useGalaxy();
  const theme = getTheme(state.tweaks.theme);
  return <WorldPanel theme={theme} />;
}

function ScrollGuard() {
  // The hologram is fixed-position full-bleed; the underlying <main> would
  // still bounce-scroll on touchpads / overscroll. Lock the document while
  // /map is mounted, restore on unmount.
  useEffect(() => {
    if (typeof document === "undefined") return;
    const prevHtml = document.documentElement.style.overflow;
    const prevBody = document.body.style.overflow;
    document.documentElement.style.overflow = "hidden";
    document.body.style.overflow = "hidden";
    return () => {
      document.documentElement.style.overflow = prevHtml;
      document.body.style.overflow = prevBody;
    };
  }, []);
  return null;
}

export default function MapRoot({ initialIsAdmin }: MapRootProps) {
  const mounted = useSyncExternalStore(
    subscribeMounted,
    getMountedSnapshot,
    getMountedServerSnapshot,
  );
  if (!mounted) return null;

  return (
    <GalaxyProvider initialIsAdmin={initialIsAdmin}>
      <ScrollGuard />
      <GalaxyHologram />
      <PanelHost />
      <MapControlRail />
      <TweaksPanel />
    </GalaxyProvider>
  );
}
