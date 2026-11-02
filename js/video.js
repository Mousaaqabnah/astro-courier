import { CONFIG } from './config.js';

let player = null;

/**
 * Initializes the Video.js player using the modern Video.js CDN global `videojs`.
 */
export function initVideoPlayer() {
  const element = document.getElementById(CONFIG.VIDEO_ELEMENT_ID);
  if (!element) return null;

  if (typeof window.videojs === 'function') {
    // Retrieve existing Video.js instance if web component already created it, or instantiate
    player = window.videojs.getPlayer(CONFIG.VIDEO_ELEMENT_ID) || window.videojs(element);
  }

  return player;
}

/**
 * Synchronizes Video.js playback according to active game state.
 * @param {'MENU' | 'PLAYING' | 'PAUSED' | 'GAMEOVER'} state
 */
export function syncVideoWithGameState(state) {
  if (!player) return;

  player.ready(() => {
    if (state === 'PLAYING') {
      // Pause video during active gameplay to maximize canvas performance & reduce distraction
      player.pause();
    } else if (state === 'MENU' || state === 'GAMEOVER' || state === 'PAUSED') {
      // Resume subtle background video on menu / pause / game-over
      const promise = player.play();
      if (promise !== undefined) {
        promise.catch(() => {
          // Autoplay policy or media load restriction handling
        });
      }
    }
  });
}

/**
 * Toggles Video.js audio mute state.
 * @returns {boolean} true if muted, false if unmuted
 */
export function toggleVideoMute() {
  if (!player) return true;
  const muted = !player.muted();
  player.muted(muted);
  return muted;
}
