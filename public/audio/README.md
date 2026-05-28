# public/audio/

MP3-Storage für den sitewide MediaPlayer.

## Track ergänzen

1. MP3 hier ablegen, z.B. `ambient-01.mp3`.
2. In `src/lib/audio-tracks.ts` einen Eintrag in `TRACKS` ergänzen:

   ```ts
   { id: "ambient-01", title: "Sub-Hum · Cogitator Idle", src: "/audio/ambient-01.mp3" }
   ```

3. Done — der Player picked sie auf, sobald neu geladen wird.

## Format-Hinweise

- **MP3** ist die sicherste Wahl (alle Browser, kein Encoding-Overhead beim Server).
- 128–192 kbps für Ambient-Loops reicht völlig und hält den Bundle-Edge schlank.
- Loop-fähige Tracks bevorzugen, da der Player nicht auto-crossfaded.

## Was NICHT hier ablegen

- Keine sehr langen Tracks (>10 MB) — Vercel edge cached gerne kleinere Files.
- Keine Quellen mit unklaren Rechten.
