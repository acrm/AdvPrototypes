/**
 * In-game accelerated clock logic.
 * Pure functions — no React, no Canvas, no side effects.
 */

import { InGameClock } from '../types/game'
import { GAME_SETTINGS } from '../config/gameSettings'

const { minutesPerRealSecond, startDay, startHour, startMinute } = GAME_SETTINGS.time

export function makeInitialClock(): InGameClock {
  return { day: startDay, hour: startHour, minute: startMinute }
}

/**
 * Advance the clock by `deltaRealSeconds` real-world seconds.
 * Each real second = minutesPerRealSecond in-game minutes.
 */
export function tickClock(clock: InGameClock, deltaRealSeconds: number): InGameClock {
  const totalMinutes =
    clock.day * 1440 + clock.hour * 60 + clock.minute + deltaRealSeconds * minutesPerRealSecond

  const totalMinutesInt = Math.floor(totalMinutes)
  const day = Math.floor(totalMinutesInt / 1440)
  const hour = Math.floor((totalMinutesInt % 1440) / 60)
  const minute = totalMinutesInt % 60

  return { day, hour, minute }
}

/**
 * Compute clock from total elapsed real seconds since session start.
 * This avoids losing fractional minutes between ticks.
 */
export function clockFromElapsedRealSeconds(elapsedRealSeconds: number): InGameClock {
  const baseMinutes = startDay * 1440 + startHour * 60 + startMinute
  const totalMinutes = baseMinutes + elapsedRealSeconds * minutesPerRealSecond
  const totalMinutesInt = Math.floor(totalMinutes)
  const day = Math.floor(totalMinutesInt / 1440)
  const hour = Math.floor((totalMinutesInt % 1440) / 60)
  const minute = totalMinutesInt % 60

  return { day, hour, minute }
}

/** Format clock as "Day D  HH:MM". */
export function formatClock(clock: InGameClock): string {
  const hh = String(clock.hour).padStart(2, '0')
  const mm = String(clock.minute).padStart(2, '0')
  return `Day ${clock.day}  ${hh}:${mm}`
}
