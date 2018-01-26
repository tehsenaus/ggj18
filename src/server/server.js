
import express from 'express';

const app = express()

app.get('/state', (req, res) => {
    res.json({
        hello: 'world'
    })
});

app.listen(process.env.PORT || 8080);
