import webpackDevMiddleware from 'webpack-dev-middleware';
import webpackHotMiddleware from 'webpack-hot-middleware';
import webpack from 'webpack';
import express from 'express';
import {runGameLoop} from './loop';
import {runGame} from './game';
import webpackConfig from '../../webpack.client.config';
import {HOST_ID, ADD_PLAYER_INPUT, START_GAME_INPUT, RESET_GAME_INPUT, GUESS_PASSWORD_INPUT} from '../common/constants';
import {get} from "lodash";

const compiler = webpack(webpackConfig);
const app = express();

app.use(webpackDevMiddleware(compiler,{
    noInfo: false,
    publicPath: '/',
}));

app.use(webpackHotMiddleware(compiler));

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
        } else {
            const players = latestGameState.round && latestGameState.round.players || {};
            const player = players[clientId] || {};
            const otherPlayer = players[player.otherPlayerId] || {};
            return {
                phase : latestGameState.phase,
                ...get(latestGameState, ['players', clientId], {}),
                selfCodename: player.codeName,
                partnerCodename: otherPlayer.codeName,
                selfPIN: player.password
            }
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

app.post('/password', (req, res) => {
    const id = sendInput(req.query.id, GUESS_PASSWORD_INPUT, {
        password: req.query.passcode
    });

    res.json({
        id
    });
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
