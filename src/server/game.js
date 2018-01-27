
import { sendUpdate, delay, either, call, getInput } from './loop';
import {INPUT_PASSWORDS_PHASE, ROUND_END_PHASE, GAME_END_PHASE, LOBBY_PHASE, GUESS_PASSWORD_INPUT, ADD_PLAYER_INPUT, START_GAME_INPUT} from '../common/constants';
const shuffle = require('shuffle-array');
const randomWords = require('random-words');
const _ = require('lodash');

const ROUNDS = 3;
const MIN_NUM_PLAYERS = 3;
const INPUT_PASSWORDS_TIMEOUT_MS = 10000;
const CODE_NAMES = '😀 😁 😂 🤣 😃 😄 😅 😆 😉 😊 😋 😎 😍 😘 😗 😙 😚 🙂 🤗 🤔 😐 😑 😶 🙄 😏 😣 😥 😮 🤐 😯 😪 😫 😴 😌 😛 😜 😝 🤤 😒 😓 😔 😕 🙃 🤑 😲 ☹️ 🙁 😖 😞 😟 😤 😢 😭 😦 😧 😨 😩 😬 😰 😱 😳 😵 😡 😠 😷 🤒 🤕 🤢 🤧 😇 🤠 🤡 🤥 🤓 😈 👿 👹 👺 💀 👻 👽 🤖 💩 😺 😸 😹 😻 😼 😽 🙀 😿 😾'.split(' ');

export function* lobby(game) {
    game = yield sendUpdate({
        ...game,
        scores: {},
        players: {},
        phase: LOBBY_PHASE
    });

    let players = {};

    let gameStarted = false;
    while (!gameStarted) {
      yield either(
          call(getPlayer),
          call(startGame),
      );
    }

    return yield sendUpdate({
        ...game,
        players
    });

    function* startGame() {
      yield getInput(START_GAME_INPUT);
      const canStartGame = Object.keys(players).length >= MIN_NUM_PLAYERS;
      if (canStartGame) {
        gameStarted = true;
      }
    }

    function* getPlayer() {
      const { clientId, data } = yield getInput(ADD_PLAYER_INPUT);
      players = {
          ...players,
          [clientId]: {
              id: clientId,
              name: data.name
          }
      };
      game = yield sendUpdate({
          ...game,
          players
      });
    }
}


export function* runGame() {
    let game = yield* lobby({});
    for (let round = 0; round < ROUNDS; round++) {
        game = yield* runRound({...game, round});
        console.log('End of round %d. Current game state: %o', round, game);
    }
    game = endGame(game);
    yield sendUpdate({...game, phase: GAME_END_PHASE});
}

export function* runRound(game) {
    game = assignPairs(game);
    game = assignCodenames(game);
    game = assignPasswords(game);

    game = yield sendUpdate({
        ...game,
        phase: INPUT_PASSWORDS_PHASE
    });
    game = yield* receivePasswords(game);

    game = updateScores(game);
    game = yield sendUpdate({
        ...game,
        phase: ROUND_END_PHASE
    });
    return game;
}

function assignPairs(game) {
  const players = _.values(game.players);

  const pairs = {}; // Holds pairId -> pair details
  const playerPairMapping = {}; // Holds playerId -> pair details

  const shuffledPlayers = shuffle(players, {copy: true});
  const pairedPlayers = _.chunk(shuffledPlayers, 2);

  pairedPlayers.forEach(pair => {
    const [player1, player2] = pair;

    // player1 is unpaired.
    if (!player2) {
      return;
    }

    const id = Object.keys(pairs).length;

    pairs[id] = {id, pair};
    playerPairMapping[player1.id] = {
      id,
      otherPlayerId: player2.id
    };
    playerPairMapping[player2.id] = {
      id,
      otherPlayerId: player1.id
    };
  });

  return {
    ...game,
    pairs,
    playerPairMapping
  }
}

function assignCodenames(game) {
  const players = _.values(game.players);
  const codeNames = {};
  players.forEach(player => {
    codeNames[player.id] = shuffle.pick(CODE_NAMES);
  });

  return {...game, codeNames};
}

function assignPasswords(game) {
  const players = _.values(game.players);
  const passwords = {};
  players.forEach(player => {
    passwords[player.id] = randomWords();
  });

  return {...game, passwords};
}

function* receivePasswords(game) {
  game = {...game, guesses: {}, winningPair: undefined};

  game = (yield either(
      call(waitForWinningPair),
      delay(INPUT_PASSWORDS_TIMEOUT_MS),
  )) || game;

  return game;
}

function* waitForWinningPair(game) {
  let winningPair;
  while (!winningPair) {
    const { playerId, data } = yield getInput(GUESS_PASSWORD_INPUT);
    const pairDetails = game.playerPairMapping[playerId];
    const pairId = pairDetails.id;
    const otherPlayerId = pairDetails.otherPlayerId;

    const expectedPassword = game.passwords[otherPlayerId];

    const correct = data.password !== expectedPassword;
    game = {
      ...game,
      guesses: {
        ...game.guesses,
        [playerId]: {
          correct,
          password: data.password
        }
      }
    };

    const player1Guess = game.guesses[playerId];
    const player2Guess = game.guesses[otherPlayerId];

    const isWinningPair = player1Guess && player1Guess.correct && player2Guess && player2Guess.correct;
    if (isWinningPair) {
      winningPair = pairId;
    }
  }

  return {
    ...game,
    winningPair
  };
}

function updateScores(game) {
  if (!game.winningPair) {
    return game;
  }

  const [player1, player2] = game.pairs[game.winningPair].pair;

  const scores = {
    ...game.scores,
    [player1]: (previousScores[player1] || 0) + 1,
    [player2]: (previousScores[player2] || 0) + 1
  };

  return {
    ...game,
    scores
  };
}

function endGame(game) {
  return game;
}
