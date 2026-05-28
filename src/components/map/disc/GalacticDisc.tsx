"use client";

// The big SVG. viewBox 0 0 100 100, composes all SVG-rendered layers in
// rendering order. The HTML overlays (SegmentumLabels, LandmarkLabels,
// SegmentumDetail/WorldLabels) sit outside this component, alongside it in
// the scaled disc wrapper.

import { useMemo } from "react";

import { regenerateBackgroundStars, silhouettePathD } from "@/lib/galaxy/stars";
import type {
  FactionFilter,
  GalaxyData,
  RiftPattern,
  Segmentum,
  SegmentumId,
  Theme,
} from "@/lib/galaxy/types";
import CicatrixSpine from "./CicatrixSpine";
import DiscStars from "./DiscStars";
import DiscWedges from "./DiscWedges";
import Landmarks from "./Landmarks";
import Nebulae from "./Nebulae";
import NecronZones from "./NecronZones";
import SpiralArms from "./SpiralArms";
import TyranidZones from "./TyranidZones";

interface GalacticDiscProps {
  theme: Theme;
  segments: readonly Segmentum[];
  data: GalaxyData;
  factionFilter: FactionFilter;
  riftPattern: RiftPattern;
  astronomican: boolean;
  onDive: (segId: SegmentumId) => void;
  dived: boolean;
  divedSeg: SegmentumId | null;
  hoveredSeg: SegmentumId | null;
  setHoveredSeg: (id: SegmentumId | null) => void;
  hoveredLandmark: string | null;
  setHoveredLandmark: (id: string | null) => void;
  userZoom: number;
  pan: { x: number; y: number };
  discSize: number;
  starSeed: number;
  animsOn: boolean;
}

export default function GalacticDisc({
  theme,
  segments,
  data,
  factionFilter,
  riftPattern,
  astronomican,
  onDive,
  dived,
  divedSeg,
  hoveredSeg,
  setHoveredSeg,
  hoveredLandmark,
  setHoveredLandmark,
  userZoom,
  pan,
  discSize,
  starSeed,
  animsOn,
}: GalacticDiscProps) {
  const t = theme;

  // Cheap parallax lag for the in-disc background stars.
  const lagFactor = 0.10;
  const parX = (-lagFactor * pan.x * 100) / Math.max(1, discSize);
  const parY = (-lagFactor * pan.y * 100) / Math.max(1, discSize);

  // Deterministic regen — keyed on the live segment dimensions, so a slider
  // drag-end triggers exactly one regen and Strict-Mode double-mount is
  // identical input → identical output → no flicker.
  const segKey = segments.map((s) => `${s.id}:${s.outer}:${s.a0}:${s.a1}`).join("|");
  const { stars: bgStars, halo: haloStars } = useMemo(
    () => regenerateBackgroundStars(segments, starSeed),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [starSeed, segKey],
  );

  const silhouette = useMemo(
    () => silhouettePathD(segments, 1.0),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [segKey],
  );

  return (
    <svg viewBox="0 0 100 100" style={{ width: "100%", height: "100%", overflow: "visible" }}>
      <defs>
        <radialGradient id="mapDiscGrad" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor={t.primary} stopOpacity="0.22" />
          <stop offset="55%" stopColor={t.primary} stopOpacity="0.08" />
          <stop offset="100%" stopColor={t.primary} stopOpacity="0" />
        </radialGradient>
        <radialGradient id="mapAstronomicanGrad" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#fff2c0" stopOpacity="0.72" />
          <stop offset="14%" stopColor="#ffd560" stopOpacity="0.46" />
          <stop offset="40%" stopColor="#f0a830" stopOpacity="0.18" />
          <stop offset="75%" stopColor="#a06010" stopOpacity="0.05" />
          <stop offset="100%" stopColor="#5a3000" stopOpacity="0" />
        </radialGradient>
        <radialGradient id="mapCoreGlow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor={t.accent} stopOpacity="0.95" />
          <stop offset="40%" stopColor={t.primary} stopOpacity="0.4" />
          <stop offset="100%" stopColor={t.primary} stopOpacity="0" />
        </radialGradient>
        <radialGradient id="mapNebWarp" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor={t.danger} stopOpacity="0.55" />
          <stop offset="45%" stopColor={t.danger} stopOpacity="0.22" />
          <stop offset="100%" stopColor={t.danger} stopOpacity="0" />
        </radialGradient>
        <radialGradient id="mapNebForb" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#cce4ff" stopOpacity="0.55" />
          <stop offset="40%" stopColor="#7ab0e8" stopOpacity="0.35" />
          <stop offset="100%" stopColor="#3366aa" stopOpacity="0" />
        </radialGradient>
        <radialGradient id="mapSweepFan" cx="50%" cy="50%" r="50%" fx="50%" fy="50%">
          <stop offset="0%" stopColor={t.primary} stopOpacity="0.35" />
          <stop offset="60%" stopColor={t.primary} stopOpacity="0.1" />
          <stop offset="100%" stopColor={t.primary} stopOpacity="0" />
        </radialGradient>
        <clipPath id="mapDiscClip">
          <path d={silhouette} />
        </clipPath>
      </defs>

      <DiscWedges
        theme={t}
        segments={segments}
        dived={dived}
        divedSeg={divedSeg}
        hoveredSeg={hoveredSeg}
        setHoveredSeg={setHoveredSeg}
        onDive={onDive}
        userZoom={userZoom}
        astronomican={astronomican}
        animsOn={animsOn}
      />

      <SpiralArms theme={t} segments={segments} dived={dived} />

      <DiscStars
        theme={t}
        stars={bgStars}
        halo={haloStars}
        dived={dived}
        divedSeg={divedSeg}
        factionFilter={factionFilter}
        parX={parX}
        parY={parY}
      />

      <Nebulae
        theme={t}
        nebulae={data.nebulae}
        segments={segments}
        dived={dived}
        divedSeg={divedSeg}
        animsOn={animsOn}
      />

      <NecronZones theme={t} dynasties={data.necron} dived={dived} animsOn={animsOn} />
      <TyranidZones theme={t} swarms={data.tyranid} dived={dived} animsOn={animsOn} />

      <CicatrixSpine theme={t} pts={data.cicatrix} pattern={riftPattern} dived={dived} animsOn={animsOn} />

      <Landmarks
        theme={t}
        landmarks={data.landmarks}
        factionFilter={factionFilter}
        dived={dived}
        hoveredLandmark={hoveredLandmark}
        setHoveredLandmark={setHoveredLandmark}
      />
    </svg>
  );
}
