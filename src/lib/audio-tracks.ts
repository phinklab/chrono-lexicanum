/**
 * Audio-Track-Manifest für den sitewide MediaPlayer.
 *
 * Files liegen unter `public/audio/`. Der Pfad in `src` ist absolut ab `/`
 * (Next.js served public/ vom CDN-Edge). Reihenfolge in TRACKS = Playlist-Reihenfolge.
 *
 * Filenames mit Spaces sind erlaubt — Browser dekodieren `%20` automatisch.
 * Format ist egal (MP3, WAV, OGG, etc.), solange der Browser HTMLAudioElement
 * es spielt. WAVs sind groß (~40MB pro 3min) — für deploy lohnt sich später
 * eine Konvertierung zu MP3 ~ 5MB.
 *
 * Tracks ergänzen: Datei in public/audio/ ablegen, hier einen Eintrag dazu.
 */

export type AudioTrack = {
  id: string;
  title: string;
  src: string;
};

export const TRACKS: AudioTrack[] = [
  {
    id: "porta-stellae",
    title: "Porta Stellae",
    src: "/audio/Porta%20Stellae.mp3",
  },
  {
    id: "forge-temple",
    title: "Forge Temple",
    src: "/audio/Forge%20Temple.mp3",
  },
  {
    id: "astronomican-dream",
    title: "Astronomican Dream",
    src: "/audio/Astronomican%20Dream.mp3",
  },
  {
    id: "cathedral-dissonance",
    title: "Cathedral Dissonance",
    src: "/audio/Cathedral%20Dissonance.mp3",
  },
  {
    id: "data-sanctum-canticle",
    title: "Data-Sanctum Canticle",
    src: "/audio/Data-Sanctum%20Canticle.mp3",
  },
];
