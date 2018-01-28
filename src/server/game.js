
import { sendUpdate, delay, either, call, getInput } from './loop';
import {countdown} from './utils';
import {CODE_NAMES, RESET_GAME_INPUT, YOUR_CODENAME_PHASE, PARTNER_CODENAME_PHASE, INPUT_PASSWORDS_PHASE, ROUND_END_PHASE, GAME_END_PHASE, LOBBY_PHASE, GUESS_PASSWORD_INPUT, ADD_PLAYER_INPUT, START_GAME_INPUT} from '../common/constants';
const shuffle = require('shuffle-array');
const _ = require('lodash');
import {runRound, isPlayerFinished} from './round';

const ROUNDS = 3;
const MIN_NUM_PLAYERS = 2;
const INPUT_PASSWORDS_TIMEOUT_MS = 30000;
const PHASE_DELAY = 5000;
const SCORES = [3,2,1];

export function* lobby() {
    let players = {};

    yield sendUpdate({
        scores: {},
        players: players,
        phase: LOBBY_PHASE
    });

    let gameStarted = false;
    while (!gameStarted) {
      yield either(
          call(getPlayer),
          call(startGame),
      );
    }
    return yield sendUpdate({players});

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
              playerId: clientId,
              name: data.name
          }
      };
      yield sendUpdate({players});
    }
}


export function* runGame() {
  while (true) {
    let game = yield* lobby();
    const players = _.values(game.players).map(player => player.playerId);

    for (let round = 0; round < ROUNDS; round++) {
        yield sendUpdate({round});
        yield* runRound(players, round);

        game = yield sendUpdate({phase: ROUND_END_PHASE});
        yield sendUpdate({scores: getUpdatedScores(game)});
        yield* countdown(PHASE_DELAY);
    }

    yield sendUpdate({phase: GAME_END_PHASE});
    yield* countdown(PHASE_DELAY);
    yield getInput(RESET_GAME_INPUT);
  }
}

function getUpdatedScores(game) {
  let scores = game.scores;
  _.values(game.round.players).forEach(player => {
    if (!isPlayerFinished(player)) {
      return;
    }

    const playerId = player.playerId;
    scores = {
      ...scores,
      [playerId]: (scores[playerId] || 0) + 1
    };
  });

  return scores;
}
