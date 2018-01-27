
import { sendUpdate, delay, either, call } from './loop';

const ROUNDS = 3;

export function* lobby(game) {
    game = yield sendUpdate({
        ...game,
        phase: 'lobby'
    });

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
                name: data.name
            };
        }
    }
}




export function* runGame() {
    console.log('runGame');
    let game = yield* lobby({});
    for (let round = 0; round < ROUNDS; round++) {
        game = yield* runRound(game);
    }
    game = endGame(game);
    yield sendUpdate(game);
}

export function* runRound(game) {
    console.log('runRound');

    const pairs = assignPairs(game.players);
    game = yield sendUpdate({
        ...game,
        phase: 'assignCodenames',
        pairs
    });

    game = yield* assignCodenames(game);
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

function assignPairs(players) {

}

function* assignCodenames() {

}

function setPasswords(game) {

}

function* receivePasswords() {

}

function updateScores(players) {

}

function endGame() {

}

