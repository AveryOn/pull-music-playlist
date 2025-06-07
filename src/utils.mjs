import path from 'path'
import { fileURLToPath } from 'url'
import { existsSync } from 'fs'

/**
 * Вытаскивает полный путь корня
 * @returns {string} полный путь корня проекта
 */
export function getBasePath() {
  // ESM-compatible __dirname
  const __filename = typeof __dirname !== 'undefined'
    ? __filename
    : fileURLToPath(import.meta.url)

  let dir = path.dirname(__filename)

  while (dir !== path.parse(dir).root) {
    if (existsSync(path.join(dir, 'package.json'))) {
      return dir
    }
    dir = path.dirname(dir)
  }

  throw new Error('Не удалось найти корень проекта (package.json)')
}

/**
 * Преобразует миллисекунды в формат времени HH:mm:ss
 * @param {number} ms - Количество миллисекунд
 * @returns {string} Строка в формате 'HH:mm:ss'
 * @example
 * formatMsToTime(8638) // '00:00:08'
*/
export function formatMsToTime(ms) {
  if(!ms || typeof ms !== 'number') {
    throw 'invalid ms'
  }
  const totalSeconds = Math.floor(ms / 1000)
  const hours = String(Math.floor(totalSeconds / 3600)).padStart(2, '0')
  const minutes = String(Math.floor((totalSeconds % 3600) / 60)).padStart(2, '0')
  const seconds = String(totalSeconds % 60).padStart(2, '0')
  return `${hours}:${minutes}:${seconds}`
}
