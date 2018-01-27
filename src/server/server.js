
import express from 'express';
import {runGameLoop, runGame, getStateUpdate} from './game';

const app = express();

const {
    sendInput,
    getStateUpdate
} = runGameLoop(runGame());

app.get('/state', async (req, res) => {
    res.json(await getStateUpdate(req.query.id, req.query.seq));
});

app.post('/player', (req, res) => {
    const id = nextId++;

    const id = sendInput('addPlayer', {
        name: res.query.name
    });

    res.json({
        id
    });
});

app.listen(process.env.PORT || 8080);
