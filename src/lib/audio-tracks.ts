/**
 * Audio track manifest for the sitewide MediaPlayer.
 *
 * Tracks are served from Supabase Storage (bucket `Audio`). `src` is an
 * absolute URL; the MediaPlayer hands it to an <audio> element with
 * crossOrigin="anonymous" (CORS is required for the Web-Audio FFT wave —
 * Supabase Storage serves the CORS headers). Order in TRACKS = playlist order.
 *
 * These URLs are SIGNED (object/sign/... ?token=). The token expires
 * around June 2027 (exp = iat + 1 year); after that the links return 400 and
 * the player breaks. Permanent fix: make the `Audio` bucket public and switch
 * the src fields to tokenless URLs:
 *   https://ffdrtdrdptgmqjxgmess.supabase.co/storage/v1/object/public/Audio/<file>.mp3
 *
 * To add tracks: put the file in the Supabase bucket and add its URL here.
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
    src: "https://ffdrtdrdptgmqjxgmess.supabase.co/storage/v1/object/sign/Audio/Templar%20Lexicanum.mp3?token=eyJraWQiOiJzdG9yYWdlLXVybC1zaWduaW5nLWtleV80YjQ5ODZlMy0wOTAzLTQxZjAtOTUyNC02YmIzZDk5NzgyNTQiLCJhbGciOiJIUzI1NiJ9.eyJ1cmwiOiJBdWRpby9UZW1wbGFyIExleGljYW51bS5tcDMiLCJzY29wZSI6ImRvd25sb2FkIiwiaWF0IjoxNzgxOTAyMDg5LCJleHAiOjE4MTM0MzgwODl9.J6yhPHrRAvwajiN8qA6QHCstAwAn6dQr01Kkxo_en20",
  },
  {
    id: "why-do-i-still-live",
    title: "Why Do I Still Live",
    artist: "vox-caster",
    src: "https://ffdrtdrdptgmqjxgmess.supabase.co/storage/v1/object/sign/Audio/Why%20Do%20I%20Still%20Live.mp3?token=eyJraWQiOiJzdG9yYWdlLXVybC1zaWduaW5nLWtleV80YjQ5ODZlMy0wOTAzLTQxZjAtOTUyNC02YmIzZDk5NzgyNTQiLCJhbGciOiJIUzI1NiJ9.eyJ1cmwiOiJBdWRpby9XaHkgRG8gSSBTdGlsbCBMaXZlLm1wMyIsInNjb3BlIjoiZG93bmxvYWQiLCJpYXQiOjE3ODE5MDIxMDcsImV4cCI6MTgxMzQzODEwN30.UBJEC8agR7K9J6QqWPHochNqfvGji8e3HLsdS7k6e_Y",
  },
  {
    id: "peace-at-last",
    title: "Peace At Last",
    artist: "vox-caster",
    src: "https://ffdrtdrdptgmqjxgmess.supabase.co/storage/v1/object/sign/Audio/Peace%20At%20Last.mp3?token=eyJraWQiOiJzdG9yYWdlLXVybC1zaWduaW5nLWtleV80YjQ5ODZlMy0wOTAzLTQxZjAtOTUyNC02YmIzZDk5NzgyNTQiLCJhbGciOiJIUzI1NiJ9.eyJ1cmwiOiJBdWRpby9QZWFjZSBBdCBMYXN0Lm1wMyIsInNjb3BlIjoiZG93bmxvYWQiLCJpYXQiOjE3ODE5MDIwMzEsImV4cCI6MTgxMzQzODAzMX0.1suc5xE-xaPFWg-4vHusEe5hOx59okhEqIMrqDBygsc",
  },
];
