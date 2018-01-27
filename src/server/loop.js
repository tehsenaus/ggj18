
import {HOST_ID} from "../common/constants";
import {get} from "lodash";

export function runGameLoop(generator) {
    let latestGameState = {};
    let seqNo = 0;
    let nextStatePromise = Promise.resolve({});
    let _sendUpdate;

    const inputCallbacks = {};

    const processValue = context => async value => {
        console.log('processValue', value);

        switch ( value.type ) {
            case 'delay':
                await new Promise(resolve => setTimeout(resolve, value.t));
                break;

            case 'update':
                return _sendUpdate(value.state);

            case 'getInput':
                return await new Promise(resolve => {
                    inputCallbacks[value.inputType] = resolve;
                });

            case 'either': {
                let done = false;
                const eitherContext = {
                    // We are done if this branch is done, or if any outer branch is done
                    get done() { return done || context.done }
                };
                const res = await Promise.race(
                    value.options.map(processValue(eitherContext))
                );

                // Mark as done, so any sub-generators stop
                done = true;

                return res;
            }

            case 'call':
                const res = value.fn();
                if ( res && typeof res.next === 'function' ) {
                    return await pump(context, res);
                } else {
                    return await res;
                }

            default:
                throw new Error('invalid yield value: ' + value);
        }
    }

    const pump = async (context, generator, sendValue) => {
        const { value, done } = generator.next(sendValue);

        if ( context.done ) {
            console.log('pump: context is done');
            return;
        }
        if ( done ) {
            console.log('pump: done');
            return value;
        };

        const returnVal = await processValue(context)(value);

        return await pump(context, generator, returnVal);
    };

    (function loop() {
        nextStatePromise = new Promise(resolve => {
            _sendUpdate = update => {
                latestGameState = {...latestGameState, ...update};
                ++seqNo;
                console.log('sendUpdate:', seqNo);
                resolve();
                return latestGameState;
            };
        }).then(loop);
    })();

    const promise = pump({}, generator);

    return {
        sendInput: (clientId, inputType, data) => {
            console.log('sendInput', clientId, inputType, data);
            if (inputCallbacks[inputType]) {
                inputCallbacks[inputType]({ clientId, inputType, data });
            }
        },
        getStateUpdate,
        promise,
    }

    /**
     * Gets the next state update to send to a client.
     *
     * If the client is already up to date, waits for a state change before resolving.
     */
    async function getStateUpdate(clientId, lastSeqNoSeen) {
        if ( lastSeqNoSeen == seqNo ) {
            await nextStatePromise;
        }

        const isHost = clientId === HOST_ID;

        if(isHost){
            return {
                seqNo,
                game: latestGameState
            }
        } else {
            const otherPlayerId = get(latestGameState, ['playerPairMapping', clientId, 'otherPlayerId']);
            return {
                seqNo,
                game: {
                    phase : latestGameState.phase,
                    ...get(latestGameState, ['players', clientId], {}),
                    selfCodename: get(latestGameState, ['codeNames', clientId]),
                    partnerCodename: get(latestGameState, ['codeNames', otherPlayerId]),
                    selfPIN: get(latestGameState, ['passwords', clientId])
                }
            }
        }
    }
}

export function getInput(inputType) {
    return { type: 'getInput', inputType };
}

export function sendUpdate(state) {
    return { type: 'update', state };
}

export function delay(t) {
    return { type: 'delay', t };
}

export function either(...options) {
    return { type: 'either', options };
}

export function call(fn) {
    return { type: 'call', fn };
}
