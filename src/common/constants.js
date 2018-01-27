
export const HOST_ID = 'HOST';

/**
 * Phase when players are signing up, entering their real names.
 */
export const LOBBY_PHASE = 'lobby';

/**
 * Main gameplay phase - players have to find their partner and
 * exchange passwords.
 */
export const INPUT_PASSWORDS_PHASE = 'receivePasswords';

/**
 * At the end of each round, we show the leaderboard, and count
 * down to the next round.
 */
export const ROUND_END_PHASE = 'roundEnd';

/**
 * End of the game. All rounds done.
 */
export const GAME_END_PHASE = 'gameEnd';
