
import express from 'express';
import {runGame, getStateUpdate} from './game';

const app = express();

app.get('/state', async (req, res) => {
    res.json(await getStateUpdate(req.query.id, req.query.seq));
});

app.post('/player', (req, res) => {
    const id = nextId++;

    players[id] = {
        name: res.query.name
    }

    res.json({
        id
    });
});

app.listen(process.env.PORT || 8080);
