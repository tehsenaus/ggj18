
export const HOST_ID = 'HOST';

/**
 * Phase when players are signing up, entering their real names.
 */
export const LOBBY_PHASE = 'lobby';

/**
 * Main gameplay phase - players have to find their partner and
 * exchange passwords.
 */
export const INPUT_PASSWORDS_PHASE = 'inputPasswords';

/**
 * At the end of each round, we show the leaderboard, and count
 * down to the next round.
 */
export const ROUND_END_PHASE = 'roundEnd';

/**
 * End of the game. All rounds done.
 */
export const GAME_END_PHASE = 'gameEnd';

/**
 * Player guesses password.
 */
export const GUESS_PASSWORD_INPUT = 'guessPassword';

/**
 * New player joins.
 */
export const ADD_PLAYER_INPUT = 'addPlayer';

/**
 * Start new game.
 */
export const START_GAME_INPUT = 'startGame';
