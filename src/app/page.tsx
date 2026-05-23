import { count, eq } from "drizzle-orm";
import { db } from "@/db/client";
import { works } from "@/db/schema";
import BottomConsole from "@/components/chrono/BottomConsole";
import FloatingCoord from "@/components/chrono/FloatingCoord";
import GhostReadout from "@/components/chrono/GhostReadout";
import MainAuspex from "@/components/chrono/MainAuspex";
import SiteBackground from "@/components/chrome/SiteBackground";

export const revalidate = 3600;

async function getBookCount(): Promise<number> {
  try {
    const [row] = await db
      .select({ value: count() })
      .from(works)
      .where(eq(works.kind, "book"));
    return Number(row?.value ?? 0);
  } catch {
    return 0;
  }
}

const READOUT_LINES = [
  "· AUSPEX HANDSHAKE OK",
  "· CHRONO-INDEX MOUNTED",
  "· NOVELLAE LOADED",
  "· SCAN · SEGMENTUM ULTIMA",
  "· SCAN · SEGMENTUM OBSCURUS",
  "· COGNITIO LINK STABLE",
  "· STAMP M42.347 · SEALED",
  "· WARP TIDES · CALM · SHIFT +0.04",
  "· VOLT · 4.72 kV NOMINAL",
  "· INDEX · 7 ERAS · 5 SEGMENTA",
  "· OVERLAY · CICATRIX MALEDICTUM",
  "· OVERLAY · HIVE FLEET LEVIATHAN",
  "· COGITATOR-1011 · ONLINE",
  "· LECTIO PROFVNDA · READY",
];

export default async function HubPage() {
  const novelCount = await getBookCount();
  const stats = `${novelCount} NOVELS · 7 ERAS · 5 SEGMENTA`;

  return (
    <main className="hub">
      <SiteBackground variant="vista" />

      <div className="hub-auspex hub-auspex--main" aria-hidden>
        <MainAuspex size={620} spinDur={240} spinRevDur={320} sweepDur={28} />
      </div>
      <div className="hub-auspex hub-auspex--secondary" aria-hidden>
        <MainAuspex size={341} spinDur={360} spinRevDur={440} sweepDur={36} />
      </div>

      <div className="hub-title-block">
        <div className="hub-title-eyebrow">
          {"// ARCHIVE-CONSOLE · COGITATOR ACTIVUS"}
        </div>
        <h1 className="hub-title">
          CHRONO <span aria-hidden>◆</span> LEXICANUM
        </h1>
        <p className="hub-title-sub">
          The 41st Millennium novel archive — by era, faction, world, and mood.
        </p>
        <p className="hub-title-stats">{stats}</p>
      </div>

      <FloatingCoord x="62vw" y="44vh" label="R 1.075 · A −38.6°" delay={0.4} lifetime={5.2} color="var(--cl-cyan)" opacity={0.55} />
      <FloatingCoord x="56vw" y="62vh" label="SECTOR · MALEDICTUM" delay={2.4} lifetime={5.2} color="var(--cl-cyan)" opacity={0.55} />
      <FloatingCoord x="20vw" y="74vh" label="HIT · NOVA TERRA · M42.347" delay={3.8} lifetime={5.2} color="var(--cl-cyan)" opacity={0.55} />
      <FloatingCoord x="6vw" y="90vh" label="ROUTE · SEGMENTVM ULTIMA" delay={5.0} lifetime={5.2} color="var(--cl-cyan)" opacity={0.55} />

      <div className="hub-ghost">
        <GhostReadout
          color="var(--cl-cyan)"
          opacity={0.32}
          lineMs={5200}
          typeSpeed={85}
          max={4}
          lines={READOUT_LINES}
        />
      </div>

      <BottomConsole withCards novelCountText={stats} />
    </main>
  );
}
