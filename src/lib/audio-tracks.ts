/**
 * Audio-Track-Manifest für den sitewide MediaPlayer.
 *
 * Tracks werden aus Supabase Storage (Bucket `Audio`) ausgeliefert. `src` ist
 * eine absolute URL; der MediaPlayer reicht sie an ein <audio>-Element mit
 * crossOrigin="anonymous" weiter (CORS nötig für die Web-Audio-FFT-Wave —
 * Supabase Storage liefert die CORS-Header). Reihenfolge in TRACKS = Playlist.
 *
 * ⚠ Diese URLs sind SIGNIERT (object/sign/... ?token=). Das Token läuft
 * ~Juni 2027 ab (exp = iat + 1 Jahr); danach liefern die Links 400 und der
 * Player bricht. Dauerhafte Lösung: Bucket `Audio` auf public stellen und die
 * src-Felder auf tokenlose URLs umstellen:
 *   https://ffdrtdrdptgmqjxgmess.supabase.co/storage/v1/object/public/Audio/<datei>.mp3
 *
 * Tracks ergänzen: Datei in den Supabase-Bucket legen, URL hier eintragen.
 */

export type AudioTrack = {
  id: string;
  title: string;
  src: string;
};

export const TRACKS: AudioTrack[] = [
  {
    id: "peace-at-last",
    title: "Peace At Last",
    src: "https://ffdrtdrdptgmqjxgmess.supabase.co/storage/v1/object/sign/Audio/Peace%20At%20Last.mp3?token=eyJraWQiOiJzdG9yYWdlLXVybC1zaWduaW5nLWtleV80YjQ5ODZlMy0wOTAzLTQxZjAtOTUyNC02YmIzZDk5NzgyNTQiLCJhbGciOiJIUzI1NiJ9.eyJ1cmwiOiJBdWRpby9QZWFjZSBBdCBMYXN0Lm1wMyIsInNjb3BlIjoiZG93bmxvYWQiLCJpYXQiOjE3ODE5MDIwMzEsImV4cCI6MTgxMzQzODAzMX0.1suc5xE-xaPFWg-4vHusEe5hOx59okhEqIMrqDBygsc",
  },
  {
    id: "templar-lexicanum",
    title: "Templar Lexicanum",
    src: "https://ffdrtdrdptgmqjxgmess.supabase.co/storage/v1/object/sign/Audio/Templar%20Lexicanum.mp3?token=eyJraWQiOiJzdG9yYWdlLXVybC1zaWduaW5nLWtleV80YjQ5ODZlMy0wOTAzLTQxZjAtOTUyNC02YmIzZDk5NzgyNTQiLCJhbGciOiJIUzI1NiJ9.eyJ1cmwiOiJBdWRpby9UZW1wbGFyIExleGljYW51bS5tcDMiLCJzY29wZSI6ImRvd25sb2FkIiwiaWF0IjoxNzgxOTAyMDg5LCJleHAiOjE4MTM0MzgwODl9.J6yhPHrRAvwajiN8qA6QHCstAwAn6dQr01Kkxo_en20",
  },
  {
    id: "why-do-i-still-live",
    title: "Why Do I Still Live",
    src: "https://ffdrtdrdptgmqjxgmess.supabase.co/storage/v1/object/sign/Audio/Why%20Do%20I%20Still%20Live.mp3?token=eyJraWQiOiJzdG9yYWdlLXVybC1zaWduaW5nLWtleV80YjQ5ODZlMy0wOTAzLTQxZjAtOTUyNC02YmIzZDk5NzgyNTQiLCJhbGciOiJIUzI1NiJ9.eyJ1cmwiOiJBdWRpby9XaHkgRG8gSSBTdGlsbCBMaXZlLm1wMyIsInNjb3BlIjoiZG93bmxvYWQiLCJpYXQiOjE3ODE5MDIxMDcsImV4cCI6MTgxMzQzODEwN30.UBJEC8agR7K9J6QqWPHochNqfvGji8e3HLsdS7k6e_Y",
  },
];
