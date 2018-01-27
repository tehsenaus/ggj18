import webpackDevMiddleware from 'webpack-dev-middleware';
import webpackHotMiddleware from 'webpack-hot-middleware';
import webpack from 'webpack';
import express from 'express';
import {runGameLoop} from './loop';
import {runGame} from './game';
import webpackConfig from '../../webpack.client.config';

const compiler = webpack(webpackConfig);
const app = express();

app.use(webpackDevMiddleware(compiler,{
    noInfo: false,
    publicPath: '/',
}));

app.use(webpackHotMiddleware(compiler));

const {
    sendInput,
    getStateUpdate
} = runGameLoop(runGame());

setTimeout(() => {
    sendInput('id1', 'addPlayer', {
        name: 'Alex'
    })
}, 5000);

/*setTimeout(() => {
    sendInput('id2', 'addPlayer', {
        name: 'Katie'
    })
}, 10000);*/

setTimeout(() => {
    sendInput('id3', 'addPlayer', {
        name: 'Bob'
    })
}, 15000);

app.get('/state', async (req, res) => {
    res.json(await getStateUpdate(req.query.id, req.query.seq));
});

app.post('/player', (req, res) => {
    const id = sendInput('addPlayer', {
        name: res.query.name
    });

    res.json({
        id
    });
});

app.listen(process.env.PORT || 8080, () => {
    console.log(`Public path: ${webpackConfig.output.publicPath}`);
    console.log('UI listening on port 8080!')
});
