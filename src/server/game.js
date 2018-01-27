
const ROUNDS = 3;

let latestGameState = {};
let players = {};
let nextId = 0;
let seqNo = 0;
let nextStatePromise = Promise.resolve({});
let sendUpdate;

export async function runGame() {
    console.log('runGame');
    const players = await lobby();
    for (let round = 0; round < ROUNDS; round++) {
        await runRound(players);
    }
    endGame(players);
    sendUpdate();
}

async function lobby(game) {
    game = {
        ...game,
        phase: 'lobby'
    }
    sendUpdate(game);

    await delay(10000);
}

async function runRound(players) {
    console.log('runRound');
    assignPairs(players);
    sendUpdate();
    await assignCodenames(players);
    sendUpdate();
    await receivePasswords(players);
    updateScores(players);
    sendUpdate();
}

function assignPairs(players) {

}

async function assignCodenames() {

}

async function receivePasswords() {

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

(function loop() {
    nextStatePromise = new Promise(resolve => {
        sendUpdate = game => {
            latestGameState = game;
            resolve();
        };
    }).then(() => {
        ++seqNo;
        console.log('loop:', seqNo);
        loop();
    });
})();

function delay(t) {
    return new Promise(resolve => setTimeout(resolve, t));
}
