import { h, Component } from 'preact';
import { values, get, sortBy } from 'lodash';
import { GAME_TITLE, HOST_ID, LOBBY_PHASE, YOUR_CODENAME_PHASE, PARTNER_CODENAME_PHASE, INPUT_PASSWORDS_PHASE, ROUND_END_PHASE, GAME_END_PHASE} from '../../common/constants';

const clientId = HOST_ID;

export default class App extends Component {
    resetGame = () => {
        return fetch('/game?id=' + clientId, {
            method: 'DELETE',
        });
    }

    startGame = () => {
        return fetch('/game/start?id=' + clientId, {
            method: 'POST',
        });
    }

    componentDidMount() {
        this.setState({ seqNo: -1 });

        const loop = async () => {
            try {
                const res = await fetch('/state?id='+clientId+'&seq=' + this.state.seqNo);
                const json = await res.json();

                this.setState(json);
                setTimeout(loop, 5);
            } catch (e) {
                console.error('poll loop error', e);
                setTimeout(loop, 1);
            }
        };

        loop();
    }

    render() {
        const { phase, players, round } = this.state.game || {};

        return (
            <div>
                <p className="text-center">
                    <h1>{ GAME_TITLE }</h1>

                    { phase === LOBBY_PHASE && <div>
                        <h5>Find your secret partner by their codeface, and <em>transmit</em> your secret PIN!</h5>
                        <button className="btn btn-primary" onClick={this.startGame}>START GAME</button>
                    </div>}

                    { phase === ROUND_END_PHASE && (<div>
                        <h2>Get ready for round { round + 2 }!</h2>
                    </div>)}

                    { phase === GAME_END_PHASE && (<div>
                        <h2>Game Over!</h2>
                        <button className="btn btn-primary" onClick={this.resetGame}>PLAY AGAIN</button>
                    </div>)}
                </p>

                { phase === LOBBY_PHASE && this.renderPlayerList(players) }

                { ([YOUR_CODENAME_PHASE, PARTNER_CODENAME_PHASE, INPUT_PASSWORDS_PHASE].indexOf(phase) >= 0)
                    && this.renderCountdown(phase) }


                { (phase === ROUND_END_PHASE || phase === GAME_END_PHASE) && this.renderLeaderboard(players, phase) }

                <pre>
                    { JSON.stringify(this.state, null, 2) }
                </pre>
            </div>
        );
    }

    renderPlayerList(players) {
        players = values(players);

        return <p className='text-center'>

            <h2>{ players.length } player(s) joined:</h2>

            { players.map(player => (
                <span className="badge badge-pill badge-secondary" style={{ fontSize: '1.5em', marginRight: '0.5em' }}>{ player.name }</span>
            )) }
        </p>
    }

    renderCountdown(phase) {
        return (
            <div className="text-center">
                { phase === YOUR_CODENAME_PHASE && (<div>
                    <h2>Look at your 'codename' - your partner will use this to identify you!</h2>
                </div>)}

                { phase === PARTNER_CODENAME_PHASE && (<div>
                    <h2>Look at your partner's codename - get ready to find them!</h2>
                </div>)}

                { phase === INPUT_PASSWORDS_PHASE && (<div>
                    <h2>Find your partner and exchange passwords! GO GO GO!!</h2>
                </div>)}
                
                <h1 style={{ fontSize: '10em' }}>{ this.state.game.countdownTimeSecs } </h1>
            </div>
        )
    }

    renderLeaderboard(players, phase) {
        const scores = get(this.state, ['game', 'scores'], {});
        players = sortBy(players, (p) => -(scores[p.id] || 0));

        return (
            <table className="table table-striped leaderboard">
                <thead>
                    <tr>
                        <th></th>
                        <th>NAME</th>
                        <th>SCORE</th>
                    </tr>
                </thead>
                <tbody>
                    { values(players).map((player, i) => (
                        <tr style={{ fontSize: i === 0 ? '2em' : '1em' }}>
                            <td>{ i === 0 && phase === GAME_END_PHASE ? '🏆' : '#'+(i+1) }</td>
                            <td>{ player.name }</td>
                            <td>{ scores[player.id] || 0 }</td>
                        </tr>
                    )) }
                </tbody>
            </table>
        );
    }
}
