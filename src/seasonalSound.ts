/**
 * Säsongs-ljud – klippfiler spelade via den delade AudioContext:en.
 *
 * Halloween: ulvsskrik (public/wolf-howl.mp3).
 * Christmas: "Jingle Bells" (public/jingle-bells.mp3, Pixabay #439615,
 *   DRAGON-STUDIO – Pixabay Content License, ingen attribution krävs).
 *
 * Varje fil fetchas + decodas EN GÅNG, buffern cachas per sökväg, och
 * senare anrop spelar direkt. Saknas filen → tyst no-op.
 *
 * Mobilbrowsers (särskilt iOS Safari) kräver att AudioContext skapas/
 * resumeras INUTI en användargest. Därför:
 *   1. `warmUpAudio()`  – anropa synkront i klick-handlaren
 *   2. `playSeasonalSound(season)` – anropa efter att händelsen lyckats
 */

import type { ThemeName } from "./theme";

const SEASON_SOUND_PATHS: Record<"halloween" | "christmas", string> = {
  halloween: "/wolf-howl.mp3",
  christmas: "/jingle-bells.mp3",
};

let sharedContext: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  if (typeof window === "undefined") return null;

  const Ctor: typeof AudioContext | undefined =
    window.AudioContext ??
    (
      window as Window & { webkitAudioContext?: typeof AudioContext }
    ).webkitAudioContext;

  if (!Ctor) return null;

  try {
    if (!sharedContext) sharedContext = new Ctor();
    return sharedContext;
  } catch {
    return null;
  }
}

/**
 * Skapa/resumera den delade AudioContext:en och **prefetchar** säsongens
 * klippfil – anropa synkront i klick-handlaren. Prefetchen gör att ljudet
 * kan spelas direkt efter loggen (viktigt för iOS Safaris gesture-vindo).
 */
export function warmUpAudio(season: ThemeName = "light"): void {
  const ctx = getAudioContext();
  if (!ctx) return;
  if (ctx.state === "suspended") {
    void ctx.resume().catch(() => {
      // Kan ske på vissa enheter – ljudet försöks vid nästa anrop
    });
  }
  if (season === "halloween" || season === "christmas") {
    void loadSoundBuffer(ctx, SEASON_SOUND_PATHS[season]);
  }
}

/**
 * Laddar en ljudfil och cachar den avkodade buffern per sökväg.
 * Senare anrop med samma sökväg spelar direkt från buffern.
 */
const soundBuffers = new Map<string, AudioBuffer | null>();
const soundLoading = new Map<string, Promise<AudioBuffer | null>>();

function loadSoundBuffer(
  ctx: AudioContext,
  path: string,
): Promise<AudioBuffer | null> {
  const cached = soundBuffers.get(path);
  if (cached !== undefined) return Promise.resolve(cached);

  let loading = soundLoading.get(path);
  if (!loading) {
    loading = (async () => {
      try {
        const response = await fetch(path);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const data = await response.arrayBuffer();
        const buffer = await ctx.decodeAudioData(data);
        soundBuffers.set(path, buffer);
        return buffer;
      } catch (error) {
        // Filen saknas eller kunde inte decodas – ljudet hoppas över.
        // Varnar i konsollen så att felet inte försvinner tyst.
        console.warn(`Seasonal sound: failed to load/decode ${path}`, error);
        soundBuffers.set(path, null);
        return null;
      } finally {
        soundLoading.delete(path);
      }
    })();
    soundLoading.set(path, loading);
  }
  return loading;
}

/**
 * Endast ETT ljud i taget: den aktuella källan (om någon spelar) fadeas
 * ut snabbt innan den nya startar – inga överlapp vid snabba loggar.
 */
let activeSource: AudioBufferSourceNode | null = null;
let activeGain: GainNode | null = null;

function stopActiveSound(ctx: AudioContext): void {
  if (!activeSource || !activeGain) return;

  const now = ctx.currentTime;
  activeGain.gain.cancelScheduledValues(now);
  activeGain.gain.setValueAtTime(Math.max(activeGain.gain.value, 0.0001), now);
  activeGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.08);

  try {
    activeSource.stop(now + 0.1);
  } catch {
    // Källan var redan stoppad – ignorera
  }
  activeSource = null;
  activeGain = null;
}

/**
 * Spelar en cachelad klippfil via den delade AudioContext:en.
 * `offset` = sekunder in i klippet att börja spela (t.ex. för att
 * hoppa över tystnad i början).
 */
function playClip(
  ctx: AudioContext,
  path: string,
  volume: number,
  offset = 0,
): void {
  void loadSoundBuffer(ctx, path).then((buffer) => {
    if (!buffer) {
      console.warn(`Seasonal sound: skipping ${path} (not loaded)`);
      return;
    }

    // Stoppa ett pågående ljud först (enda ljudet i taget)
    stopActiveSound(ctx);

    const source = ctx.createBufferSource();
    source.buffer = buffer;

    const gain = ctx.createGain();
    gain.gain.value = volume;

    source.connect(gain);
    gain.connect(ctx.destination);

    activeSource = source;
    activeGain = gain;
    source.onended = () => {
      if (activeSource === source) {
        activeSource = null;
        activeGain = null;
      }
    };

    // Håll oss inom buffern om offset skulle vara längre än klippet
    const startAt = Math.min(offset, Math.max(0, buffer.duration - 0.05));
    source.start(0, startAt);
  });
}

/** Halloween: ulvsskrik (public/wolf-howl.mp3), startar 0,2 s in. */
function playHalloweenHowl(ctx: AudioContext): void {
  playClip(ctx, "/wolf-howl.mp3", 0.9, 0.2);
}

/** Christmas: "Jingle Bells" (public/jingle-bells.mp3). */
function playChristmasJingle(ctx: AudioContext): void {
  playClip(ctx, "/jingle-bells.mp3", 0.9);
}

/** Spela säsongens belöningsljud. Tyst no-op utan AudioContext. */
export function playSeasonalSound(season: "halloween" | "christmas"): void {
  const ctx = getAudioContext();
  if (!ctx) return;

  if (ctx.state === "suspended") {
    void ctx.resume().catch(() => {
      // Se ovan
    });
  }

  try {
    if (season === "halloween") {
      playHalloweenHowl(ctx);
    } else {
      playChristmasJingle(ctx);
    }
  } catch {
    // Ljudet är en extra – fel ignoreras tyst
  }
}
