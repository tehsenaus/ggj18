
import { sendUpdate, delay, either, getInput } from './loop';
import {call} from 'redux-saga/effects';
import {countdown} from './utils';
import {CODE_NAMES, RESET_GAME_INPUT, YOUR_CODENAME_PHASE, PARTNER_CODENAME_PHASE, INPUT_PASSWORDS_PHASE, ROUND_END_PHASE, GAME_END_PHASE, LOBBY_PHASE, GUESS_PASSWORD_INPUT, ADD_PLAYER_INPUT, START_GAME_INPUT} from '../common/constants';
const shuffle = require('shuffle-array');
const _ = require('lodash');
import {runRound, isPlayerFinished} from './round';

const ROUNDS = 3;
const MIN_NUM_PLAYERS = 2;
const GAME_EXPIRY_MS = 60000;
const GAME_END_EXPIRY_MS = 120000;
const INPUT_PASSWORDS_TIMEOUT_MS = 30000;
const BETWEEN_ROUNDS_DELAY = 10000;
const SCORES = [3,2,1];

export function* lobby() {
    let players = {};

    yield sendUpdate({
        scores: {},
        players: players,
        phase: LOBBY_PHASE
    });

    let gameStarted = false;
    let expired = false;
    while (!gameStarted && !expired) {
      yield either(
          call(getPlayer),
          call(startGame),
          call(function *() {
            yield* countdown(GAME_EXPIRY_MS);
            expired = true;
          })
      );
    }
    return yield sendUpdate({ expired, players });

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
  let expired = false;
  while (!expired) {
    let game = yield* lobby();
    
    if (game.expired) {
      console.log('GAME EXPIRED');
      return;
    }

    const players = _.values(game.players).map(player => player.playerId);

    yield sendUpdate({ phase: ROUND_END_PHASE });
    yield* countdown(BETWEEN_ROUNDS_DELAY);

    for (let round = 0; round < ROUNDS; round++) {
        yield sendUpdate({round});
        game = yield* runRound(players, round);

        if (round === ROUNDS - 1) {
          continue;
        }

        yield sendUpdate({ phase: ROUND_END_PHASE, scores: getUpdatedScores(game) });
        yield* countdown(BETWEEN_ROUNDS_DELAY);
    }

    yield sendUpdate({ phase: GAME_END_PHASE, scores: getUpdatedScores(game)});

    yield either(
        getInput(RESET_GAME_INPUT),
        call(function *() {
          yield* countdown(GAME_END_EXPIRY_MS);
          expired = true;
        })
    );
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
