import { h, Component } from 'preact';
import { values } from 'lodash';
import {HOST_ID, LOBBY_PHASE, INPUT_PASSWORDS_PHASE, ROUND_END_PHASE, GAME_END_PHASE} from '../../common/constants';

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
        const { phase, players } = this.state.game || {};

        return (
            <div>
                <p className="text-center">
                    <h1>MISSION: TRANSMISSION</h1>

                    { phase === LOBBY_PHASE && <button className="btn btn-primary" onClick={this.startGame}>START GAME</button> }
                    { phase === GAME_END_PHASE && (<div>
                        <h2>Game Over!</h2>
                        <button className="btn btn-primary" onClick={this.resetGame}>PLAY AGAIN</button>
                    </div>)}
                </p>

                { phase === LOBBY_PHASE && this.renderPlayerList(players) }

                { phase === INPUT_PASSWORDS_PHASE && this.renderCountdown() }


                { (phase === ROUND_END_PHASE || phase === GAME_END_PHASE) && this.renderLeaderboard(players) }

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

    renderCountdown() {
        return (
            <div>
                <h2>Find your partner and exchange passwords! GO GO GO!!</h2>
            </div>
        )
    }

    renderLeaderboard(players) {
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
                        <tr>
                            <td>#{i+1}</td>
                            <td>{ player.name }</td>
                            <td>0</td>
                        </tr>
                    )) }
                </tbody>
            </table>
        );
    }
}
