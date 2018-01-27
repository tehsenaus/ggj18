
import {runGameLoop, either, delay, call, getInput} from './loop';

describe('loop', () => {
    describe('either', () => {
        it('returns value of the first promise to resolve', function () {
            
            function* testG() {
                const startMs = Date.now();
                yield either(
                    delay(100),
                    delay(500)
                )
                const diff = Date.now() - startMs;
                expect(diff / 1000).toBeCloseTo(0.1, 1);
            }

            return runGameLoop(testG()).promise;
        });
    });

    describe('call', () => {
        it('runs generators in parallel', function () {
            
            function* testG() {
                let done;
                yield either(
                    call(function *() {
                        console.log('called A');
                        yield delay(100);
                        done = 'A';
                    }),
                    call(function *() {
                        console.log('called B');
                        yield delay(500);
                        done = 'B';
                    })
                );

                expect(done).toBe('A');
            }

            const gl = runGameLoop(testG());
            return gl.promise;
        });
    });

    describe('getInput', () => {
        it('waits for external input', async () => {
            function* testG() {
                const input = yield getInput('testInput');
                return input;
            }

            const gl = runGameLoop(testG());
            gl.sendInput('test', 'testInput', {
                x: 'y'
            });
            const res = await gl.promise;

            console.log(res);
            expect(res).toMatchObject({
                clientId: 'test',
                data: { x: 'y' }
            });
        });
    });
});
