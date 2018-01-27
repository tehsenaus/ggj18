
export const CODE_NAMES = '😀 😁 😂 🤣 😃 😄 😅 😆 😉 😊 😋 😎 😍 😘 😗 😙 😚 🙂 🤗 🤔 😐 😑 😶 🙄 😏 😣 😥 😮 🤐 😯 😪 😫 😴 😌 😛 😜 😝 🤤 😒 😓 😔 😕 🙃 🤑 😲 ☹️ 🙁 😖 😞 😟 😤 😢 😭 😦 😧 😨 😩 😬 😰 😱 😳 😵 😡 😠 😷 🤒 🤕 🤢 🤧 😇 🤠 🤡 🤥 🤓 😈 👿 👹 👺 💀 👻 👽 🤖 💩 😺 😸 😹 😻 😼 😽 🙀 😿 😾'.split(' ');

export const GAME_TITLE = [5,3,9].map(i => CODE_NAMES[i]).join('') +
    ' CODEFACES ' + [8, 2, 5].map(i => CODE_NAMES[i]).join('')

export const HOST_ID = 'HOST';

/**
 * Phase when players are signing up, entering their real names.
 */
export const LOBBY_PHASE = 'lobby';

/**
 * Player's own codename is revealed.
 */
export const YOUR_CODENAME_PHASE = 'yourCodename';

/**
 * Partner's codename is revealed.
 */
export const PARTNER_CODENAME_PHASE = 'partnerCodename';

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
 * Start the game - once enough players have joined
 */
export const START_GAME_INPUT = 'startGame';

/**
 * After game end, reset all scores and return to the lobby (keep players).
 */
export const RESET_GAME_INPUT = 'resetGame';
