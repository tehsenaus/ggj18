
export function runGameLoop(generator) {
    let latestGameState = {};
    let seqNo = 0;
    let nextStatePromise = Promise.resolve({});
    let _sendUpdate;

    const inputCallbacks = {};

    const processValue = async value => {
        console.log('processValue', value);

        switch ( value.type ) {
            case 'delay':
                await new Promise(resolve => setTimeout(resolve, value.t));
                break;

            case 'update':
                _sendUpdate(value.state);
                return value.state;
            
            case 'getInput':
                return await new Promise(resolve => {
                    inputCallbacks[value.inputType] = resolve;
                });
            
            case 'either':
                return await Promise.race(
                    value.options.map(processValue)
                );

            case 'call':
                const res = value.fn();
                if ( res && typeof res.next === 'function' ) {
                    return await pump(res);
                } else {
                    return await res;
                }
        }
    }

    const pump = async (generator, sendValue) => {
        const { value, done } = generator.next(sendValue);

        if ( done ) {
            console.log('runGameLoop: done');
            return sendValue;
        };

        const returnVal = await processValue(value);
        
        return await pump(generator, returnVal);
    };

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

    const promise = pump(generator);

    return {
        sendInput: (clientId, inputType, data) => {
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

        return {
            seqNo,
            game: latestGameState
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
