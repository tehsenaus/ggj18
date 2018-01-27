
import express from 'express';
import {runGameLoop} from './loop';
import {runGame} from './game';

const app = express();

const {
    sendInput,
    getStateUpdate
} = runGameLoop(runGame());

setTimeout(() => {
    sendInput('testId', 'addPlayer', {
        name: 'Alex'
    })
}, 5000);

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

app.listen(process.env.PORT || 8080);
