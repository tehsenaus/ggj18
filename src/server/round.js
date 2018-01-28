import { sendUpdate, delay, either, call, getInput } from './loop';
import {countdown} from './utils';
import {CODE_NAMES, YOUR_CODENAME_PHASE, PARTNER_CODENAME_PHASE, INPUT_PASSWORDS_PHASE, GUESS_PASSWORD_INPUT} from '../common/constants';
const shuffle = require('shuffle-array');
const _ = require('lodash');

const INPUT_PASSWORDS_TIMEOUT_MS = 30000;
const PHASE_DELAY = 5000;

export function* runRound(players, roundNumber) {
  const round = createRound(players, roundNumber);
  yield sendUpdate({round})

  yield sendUpdate({phase: YOUR_CODENAME_PHASE});
  yield* countdown(PHASE_DELAY);

  yield sendUpdate({phase: PARTNER_CODENAME_PHASE});
  yield* countdown(PHASE_DELAY);

  yield sendUpdate({phase: INPUT_PASSWORDS_PHASE});

  yield either(
      call(() => receiveGuesses(round)),
      call(() => countdown(INPUT_PASSWORDS_TIMEOUT_MS)),
  );
}

function createRound(players, roundNumber) {
  const pairedPlayers = assignPairs(players);

  const playerConfig = {};
  pairedPlayers.forEach((pair, index) => {
    const [player1, player2] = pair;

    if (!player2) {
      playerConfig[player1] = configurePlayer(player1);
      return;
    }

    const pairId = index;
    playerConfig[player1] = configurePlayer(player1, player2, pairId);
    playerConfig[player2] = configurePlayer(player2, player1, pairId);
  });

  return {
    players: playerConfig,
    roundNumber
  };
}

function assignPairs(players) {
  return _.chunk(shuffle(players, {copy: true}), 2);
}

function configurePlayer(playerId, otherPlayerId, pairId) {
  return {
    playerId,
    otherPlayerId,
    codeName: shuffle.pick(CODE_NAMES),
    password: randomPin(),
    pairId
  };
}

function randomPin() {
  return [0,0,0].map(() => Math.floor(Math.random() * 10).toString()[0]).join('');
}

function* receiveGuesses(round) {
  while (!isRoundFinished(round)) {
    const { clientId, data } = yield getInput(GUESS_PASSWORD_INPUT);
    round = receiveGuess(clientId, data.password, round);
    yield sendUpdate({round});
  }
}

function isRoundFinished(round) {
  const numberCorrectPairs = _.values(round.players)
      .filter(player => {
        if (!isPlayerFinished(player)) {
          return false;
        }

        const otherPlayer = round.players[player.otherPlayerId];
        return isPlayerFinished(otherPlayer);
      })
      .length / 2;
  return numberCorrectPairs > 0;
}

export function isPlayerFinished(player) {
  return player.guess && player.guess.correct;
}

function receiveGuess(playerId, password, round) {
  const player = round.players[playerId];
  const otherPlayer = round.players[player.otherPlayerId];

  const updatedPlayer = {
    ...player,
    guess: {
      password,
      correct: password === otherPlayer.password
    }
  };

  const updatedPlayers = {
    ...round.players,
    [playerId]: updatedPlayer
  }

  return {
    ...round,
    players: updatedPlayers
  }
}
