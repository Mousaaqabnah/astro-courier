export const CONFIG = {
  CANVAS_WIDTH: 400,
  CANVAS_HEIGHT: 600,

  // Physics constants
GRAVITY: 0.08,
JUMP_FORCE: -4.2,
MAX_FALL_SPEED: 4.2,
DRONE_RADIUS: 14,
DRONE_START_X: 100,
DRONE_START_Y: 280,

  // Obstacle (Energy Pylon) settings
  OBSTACLE_WIDTH: 54,
  OBSTACLE_GAP: 150,
  MIN_OBSTACLE_HEIGHT: 60,
  SPAWN_INTERVAL: 1350, // milliseconds
  INITIAL_SPEED: 2.2,
  SPEED_INCREMENT: 0.05,
  MAX_SPEED: 5.0,

  // Color theme
  COLORS: {
    BG_TOP: '#0b0f19',
    BG_BOTTOM: '#15192c',
    GRID_LINE: 'rgba(0, 243, 255, 0.06)',
    DRONE_BODY: '#00f3ff',
    DRONE_CORE: '#ffffff',
    DRONE_GLOW: 'rgba(0, 243, 255, 0.6)',
    PYLON: '#9d4edd',
    PYLON_CAP: '#c77dff',
    PYLON_GLOW: 'rgba(157, 78, 221, 0.4)',
    PARTICLE: '#00f3ff',
    STAR: 'rgba(255, 255, 255, 0.7)'
  },

  // Local storage keys
  STORAGE: {
    HIGH_SCORE: 'astro_courier_highscore'
  },

  // Video element ID
  VIDEO_ELEMENT_ID: 'ambient-video'
};
