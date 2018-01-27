
const ROUNDS = 3;

let latestGameState = {};
let players = {};
let nextId = 0;
let seqNo = 0;
let nextStatePromise = Promise.resolve({});
let _sendUpdate;

export function* lobby(game) {
    game = yield sendUpdate({
        ...game,
        phase: 'lobby'
    });

    yield delay(10000);

    return game;
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



/**
 * Gets the next state update to send to a client.
 * 
 * If the client is already up to date, waits for a state change before resolving.
 */
export async function getStateUpdate(clientId, lastSeqNoSeen) {
    if ( lastSeqNoSeen == seqNo ) {
        await nextStatePromise;
    }

    return {
        seqNo,
        game: latestGameState
    }
}

export async function runGameLoop(generator) {
    let returnVal;

    while(true) {
        const { value, done } = generator.next(returnVal);

        if ( done ) {
            console.log('runGameLoop: done');
            break;   
        };

        console.log('runGameLoop:', value);

        switch ( value.type ) {
            case 'delay':
                await new Promise(resolve => setTimeout(resolve, value.t));
                break;

            case 'update':
                _sendUpdate(value.state);
                returnVal = value.state;
                break;
        }
    }
}

(function loop() {
    nextStatePromise = new Promise(resolve => {
        _sendUpdate = game => {
            latestGameState = game;
            ++seqNo;
            console.log('sendUpdate:', seqNo);
            resolve();
        };
    }).then(loop);
})();

function sendUpdate(state) {
    return { type: 'update', state };
}

function delay(t) {
    return { type: 'delay', t };
}
