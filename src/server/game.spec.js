
import {lobby} from './game';

describe('game', () => {
    describe('lobby', () => {
        it('sets phase to lobby, and waits', function () {
            
            const g = lobby({});

            expect( g.next().value ).toMatchObject({
                type: 'update',
                state: { phase: 'lobby' }
            });
            expect( g.next().value ).toMatchObject({
                type: 'delay'
            });
        })
    })
});

