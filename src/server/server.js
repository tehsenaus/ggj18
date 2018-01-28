import webpackDevMiddleware from 'webpack-dev-middleware';
import webpackHotMiddleware from 'webpack-hot-middleware';
import webpack from 'webpack';
import express from 'express';
import {runGameLoop} from './loop';
import {runGame} from './game';
import webpackConfig from '../../webpack.config.js';
import {HOST_ID, ROUND_END_PHASE, GAME_END_PHASE, ADD_PLAYER_INPUT, START_GAME_INPUT, RESET_GAME_INPUT, GUESS_PASSWORD_INPUT} from '../common/constants';
import {get} from "lodash";

const _ = require('lodash');

const compiler = webpack(webpackConfig);
const app = express();
const isProd = process.env.NODE_ENV === 'production';

console.log('env:', process.env.NODE_ENV);

app.use(webpackDevMiddleware(compiler,{
    noInfo: false,
    publicPath: '/',
}));

if (!isProd) app.use(webpackHotMiddleware(compiler));

const {
    sendInput,
    getStateUpdate,
    promise
} = runGameLoop(runGame());

promise.catch(e => {
  console.error('ERROR IN GAME', e);
});

// setTimeout(() => {
//     sendInput('id1', ADD_PLAYER_INPUT, {
//         name: 'Alex'
//     })
// }, 10);
//
// setTimeout(() => {
//     sendInput('id2', 'addPlayer', {
//         name: 'Katie'
//     })
// }, 20);
//
// setTimeout(() => {
//     sendInput('id3', ADD_PLAYER_INPUT, {
//         name: 'Bob'
//     })
// }, 30);

app.get('/state', async (req, res) => {
    const clientId = req.query.id;
    res.json(await getStateUpdate(req.query.id, req.query.seq, latestGameState => {
        const isHost = clientId === HOST_ID;

        if (isHost) {
            return latestGameState;
        }

        const players = latestGameState.round && latestGameState.round.players || {};
        const player = players[clientId] || {};
        const otherPlayer = players[player.otherPlayerId] || {};
        return {
            phase : latestGameState.phase,
            ...get(latestGameState, ['players', clientId], {}),
            selfCodename: player.codeName,
            partnerCodename: otherPlayer.codeName,
            selfPIN: player.password,
            players: _.values(latestGameState.players),
            roundPlayers: [ROUND_END_PHASE, GAME_END_PHASE].indexOf(latestGameState.phase) >= 0 ? players : {},
            scores: latestGameState.scores,
            roundNumber: latestGameState.round && latestGameState.round.roundNumber,
            score: get(latestGameState, ['scores', clientId], 0),
            countdownTimeSecs: latestGameState.countdownTimeSecs
        }
    }));
});

app.post('/player', (req, res) => {
    const id = sendInput(req.query.id, ADD_PLAYER_INPUT, {
        name: req.query.name
    });

    res.json({
        id
    });
});

app.post('/password', async (req, res) => {
    const clientId = req.query.id;

    sendInput(clientId, GUESS_PASSWORD_INPUT, {
        password: req.query.passcode
    });

    const state = await getStateUpdate(clientId, 0);

    res.json(get(state.game, ['round', 'players', clientId, 'guess'], {}));
});

app.delete('/game', (req, res) => {
    if ( req.query.id === HOST_ID ) {
        sendInput(req.query.id, RESET_GAME_INPUT, {});
    }
});

app.post('/game/start', (req, res) => {
    if ( req.query.id === HOST_ID ) {
        sendInput(req.query.id, START_GAME_INPUT, {});
    }
});

app.listen(process.env.PORT || 8080, () => {
    console.log(`Public path: ${webpackConfig.output.publicPath}`);
    console.log('UI listening on port 8080!')
});
