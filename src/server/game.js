
import { sendUpdate, delay, either, call, getInput } from './loop';
const shuffle = require('shuffle-array');
const randomWords = require('random-words');
const _ = require('lodash');

const ROUNDS = 3;
const CODE_NAMES = ['PIG', 'CHICKEN', 'COW'];

export function* lobby(game) {
    game = yield sendUpdate({
        ...game,
        phase: 'lobby'
    });

    console.log('lobby GAME', game);

    let players = {};

    yield either(
        call(getPlayers),
        delay(10000),
    );

    return yield sendUpdate({
        ...game,
        players
    });

    function* getPlayers() {
        while ( true ) {
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
    console.log('runRound');

    game = assignPairs(game);
    game = yield sendUpdate({
        ...game,
        phase: 'assignCodenames'
    });

    game = assignCodenames(game);
    game = setPasswords(game);
    game = yield sendUpdate({
        ...game,
        phase: 'recvPasswords'
    });
    game = yield* receivePasswords(game);
    game = updateScores(game);
    game = yield sendUpdate({
        ...game,
    });
    return game;
}

function assignPairs(game) {
  console.log('Assigning pairs...');
  const players = _.values(game.players);

  const pairs = {}; // Holds pairId -> a pair of playerIds
  const playerPairMapping = {}; // Holds playerId -> playerId

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
    playerPairMapping[player1.id] = player2.id;
    playerPairMapping[player2.id] = player1.id;
  });

  console.log('Assigned pairs:', pairedPlayers);
  return {
    ...game,
    pairs,
    playerPairMapping
  }
}

function assignCodenames(game) {
  console.log('Assigning codenames...');

  const players = _.values(game.players);
  const codeNames = {};
  players.forEach(player => {
    codeNames[player.id] = shuffle.pick(CODE_NAMES);
  });

  console.log('Assigned codenames:', codeNames);
  return {...game, codeNames};
}

function setPasswords(game) {
  console.log('Assigning passwords...');

  const players = _.values(game.players);
  const passwords = {};
  players.forEach(player => {
    passwords[player.id] = randomWords();
  });

  console.log('Assigned passwords:', passwords);
  return {...game, passwords};
}

function* receivePasswords(game) {
  return game;
}

function updateScores(game) {
  return game;
}

function endGame(game) {
  return game;
}
