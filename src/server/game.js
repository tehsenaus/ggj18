
import { sendUpdate, delay, either, call, getInput } from './loop';
const shuffle = require('shuffle-array');
const randomWords = require('random-words');
const _ = require('lodash');

const ROUNDS = 3;
const MIN_NUM_PLAYERS = 3;
const CODE_NAMES = '😀 😁 😂 🤣 😃 😄 😅 😆 😉 😊 😋 😎 😍 😘 😗 😙 😚 🙂 🤗 🤔 😐 😑 😶 🙄 😏 😣 😥 😮 🤐 😯 😪 😫 😴 😌 😛 😜 😝 🤤 😒 😓 😔 😕 🙃 🤑 😲 ☹️ 🙁 😖 😞 😟 😤 😢 😭 😦 😧 😨 😩 😬 😰 😱 😳 😵 😡 😠 😷 🤒 🤕 🤢 🤧 😇 🤠 🤡 🤥 🤓 😈 👿 👹 👺 💀 👻 👽 🤖 💩 😺 😸 😹 😻 😼 😽 🙀 😿 😾'.split(' ');

export function* lobby(game) {
    game = yield sendUpdate({
        ...game,
        phase: 'lobby'
    });

    console.log('lobby GAME', game);

    let players = {};

    yield either(
        call(getPlayer),
        delay(300000000),
    );

    return yield sendUpdate({
        ...game,
        players
    });

    function* getPlayer() {
        while (Object.keys(players).length < MIN_NUM_PLAYERS) {
            const { clientId, data } = yield getInput('addPlayer');
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
}


export function* runGame() {
    console.log('runGame');
    let game = yield* lobby({});
    for (let round = 0; round < ROUNDS; round++) {
        game = yield* runRound(game);
        console.log('End of round %d. Current game state: %o', round, game);
    }
    game = endGame(game);
    yield sendUpdate(game);
}

export function* runRound(game) {
    game = assignPairs(game);
    game = yield sendUpdate({
        ...game,
        phase: 'assignedPairs'
    });

    game = assignCodenames(game);
    game = yield sendUpdate({
        ...game,
        phase: 'assignedCodenames'
    });

    game = assignPasswords(game);
    game = yield sendUpdate({
        ...game,
        phase: 'assignedPasswords'
    });

    game = yield sendUpdate({
        ...game,
        phase: 'receivePasswords'
    });
    game = yield* receivePasswords(game);

    game = updateScores(game);
    game = yield sendUpdate({
        ...game,
        phase: 'endOfRound'
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
  game = {...game, guesses: {}};

  let winningPair;
  while (!winningPair) {
    const { playerId, data } = yield getInput('guessPassword');
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

    const isWinningPair = game.guesses[playerId].correct && game.guesses[otherPlayerId].correct;
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
  const [player1, player2] = game.pairs[game.winningPair].pair;
  const previousScores = game.scores || {};

  const scores = {
    ...previousScores,
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
