/**
 * Constantes del motor de video — derivadas del PRD del prototipo local.
 *
 * Reglas duras:
 *   - 30 fps siempre. Si cambia, ZOOM_PUNCH_FRAMES y Sequences se rompen.
 *   - 1080×1920 vertical (9:16). Posiciones del overlay están calibradas a esta resolución.
 *   - Volume boost del video original 1.4x (max 2.0 — distorsiona arriba).
 *   - Whisper language SIEMPRE explícito ('es' o 'en'). Nunca autodetect.
 */

export const VIDEO_FPS = 30 as const

export const VIDEO_RESOLUTION_VERTICAL = { width: 1080, height: 1920 } as const

export const VIDEO_VOLUME_BOOST_DEFAULT = 1.4
export const VIDEO_VOLUME_BOOST_MAX = 2.0

export const WHISPER_DEFAULT_MODEL = 'whisper-1' as const
export const WHISPER_DEFAULT_LANGUAGE = 'es' as const

export type VideoGrade = 'canon' | 'cinematic' | 'warm' | 'raw'

export const VIDEO_GRADES: Record<VideoGrade, string> = {
  canon: 'brightness(1.04) contrast(1.18) saturate(0.92) hue-rotate(-4deg)',
  cinematic: 'brightness(0.96) contrast(1.28) saturate(0.80) sepia(0.12)',
  warm: 'brightness(1.06) contrast(1.10) saturate(1.15) hue-rotate(6deg)',
  raw: 'none',
}

export type Brand = 'rentmies' | 'nocomiss' | 'startco'

/**
 * Correcciones automáticas de Whisper.
 * Whisper escucha mal nombres de marca — siempre reemplazar antes del render.
 * Aplica a: transcript.text, segments[].text, captions[].word
 */
export const BRAND_TYPO_CORRECTIONS: Array<{ from: string; to: string; brand: Brand[] }> = [
  { from: 'Renmis',     to: 'Rentmies', brand: ['rentmies'] },
  { from: 'Renmies',    to: 'Rentmies', brand: ['rentmies'] },
  { from: 'Rendmis',    to: 'Rentmies', brand: ['rentmies'] },
  { from: 'Rentmiez',   to: 'Rentmies', brand: ['rentmies'] },
  { from: 'Estarco',    to: 'StartCo',  brand: ['startco'] },
  { from: 'Estar Co',   to: 'StartCo',  brand: ['startco'] },
]

export interface CaptionWord {
  word: string
  start: number
  end: number
}

/**
 * Aplica las correcciones a una lista de captions palabra-por-palabra.
 * No muta el array original.
 */
export function applyBrandCorrections(
  captions: CaptionWord[],
  brand: Brand = 'rentmies'
): CaptionWord[] {
  const rules = BRAND_TYPO_CORRECTIONS.filter((r) => r.brand.includes(brand))
  if (rules.length === 0) return captions
  return captions.map((c) => {
    const match = rules.find((r) => r.from.toLowerCase() === c.word.toLowerCase())
    return match ? { ...c, word: match.to } : c
  })
}

/**
 * Tokens de marca para el render.
 * Cuando productizemos el motor (PRD §9), esto se mueve a DB.
 */
export const BRAND_TOKENS: Record<Brand, {
  primary: string
  bg: string
  text: string
  captionActiveBg: string
  captionActiveColor: string
  captionBaseBg: string
  captionBaseColor: string
  vignetteIntensity: number
}> = {
  rentmies: {
    primary: '#40d99d',
    bg: '#1a2035',
    text: '#ffffff',
    captionActiveBg: '#FFE500',
    captionActiveColor: '#0d0d0d',
    captionBaseBg: 'rgba(0,0,0,0.7)',
    captionBaseColor: '#ffffff',
    vignetteIntensity: 0.65,
  },
  nocomiss: {
    primary: '#ff6b47',
    bg: '#0f1729',
    text: '#fbf9f6',
    captionActiveBg: '#ff6b47',
    captionActiveColor: '#fbf9f6',
    captionBaseBg: 'rgba(15,23,41,0.86)',
    captionBaseColor: '#fbf9f6',
    vignetteIntensity: 0.42,
  },
  startco: {
    primary: '#3b82f6',
    bg: '#0a0e27',
    text: '#ffffff',
    captionActiveBg: '#3b82f6',
    captionActiveColor: '#ffffff',
    captionBaseBg: 'rgba(0,0,0,0.7)',
    captionBaseColor: '#ffffff',
    vignetteIntensity: 0.55,
  },
}
