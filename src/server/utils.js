import { sendUpdate, delay } from './loop';

export function* countdown(timeout) {
  while (timeout > 0) {
    yield sendUpdate({countdownTimeSecs: timeout/1000});
    yield delay(1000);
    timeout = timeout - 1000;
  }
  yield sendUpdate({countdownTimeSecs: 0});
}
