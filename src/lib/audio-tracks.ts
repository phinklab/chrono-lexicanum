/**
 * Audio track manifest for the sitewide MediaPlayer.
 *
 * Tracks are served from Supabase Storage (bucket `Audio`, PUBLIC). `src` is
 * an absolute tokenless public-bucket URL; the MediaPlayer hands it to an
 * <audio> element with crossOrigin="anonymous" (CORS is required for the
 * Web-Audio FFT wave — Supabase Storage answers with
 * `Access-Control-Allow-Origin: *` and supports Range requests; both verified
 * 2026-07-12, Launch S3b). Order in TRACKS = playlist order.
 *
 * The previous SIGNED URLs (object/sign/…?token=, JWT exp June 2027) would
 * have expired and broken the player; tokenless public URLs never expire.
 *
 * To add tracks: upload the file to the `Audio` bucket and add
 *   https://ffdrtdrdptgmqjxgmess.supabase.co/storage/v1/object/public/Audio/<file>.mp3
 * here (URL-encode spaces as %20).
 */

export type AudioTrack = {
  id: string;
  title: string;
  /** Performer / Interpret — shown after the title in the player. */
  artist: string;
  src: string;
};

/** Channel of the artist behind every current track (linked from the playlist). */
export const ARTIST_YOUTUBE_URL = "https://www.youtube.com/@vox-caster1843";

export const TRACKS: AudioTrack[] = [
  {
    id: "templar-lexicanum",
    title: "Templar Lexicanum",
    artist: "vox-caster",
    src: "https://ffdrtdrdptgmqjxgmess.supabase.co/storage/v1/object/public/Audio/Templar%20Lexicanum.mp3",
  },
  {
    id: "why-do-i-still-live",
    title: "Why Do I Still Live",
    artist: "vox-caster",
    src: "https://ffdrtdrdptgmqjxgmess.supabase.co/storage/v1/object/public/Audio/Why%20Do%20I%20Still%20Live.mp3",
  },
  {
    id: "peace-at-last",
    title: "Peace At Last",
    artist: "vox-caster",
    src: "https://ffdrtdrdptgmqjxgmess.supabase.co/storage/v1/object/public/Audio/Peace%20At%20Last.mp3",
  },
];
