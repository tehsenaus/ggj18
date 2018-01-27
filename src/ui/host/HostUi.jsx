import { h, Component } from 'preact';
import { values } from 'lodash';
import {HOST_ID} from '../../common/constants';

const clientId = HOST_ID;

export default class App extends Component {
    startGame = () => {
        return fetch('/game/start?id=' + clientId, {
            method: 'POST',
        });
    }

    componentDidMount() {
        this.setState({ seqNo: -1 });

        const loop = async () => {
            try {
                const res = await fetch('/state?seq=' + this.state.seqNo);
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
        const { players } = this.state.game || {};

        return (
            <div>
                <p className="text-center">
                    <h1>MISSION: TRANSMISSION</h1>

                    <button className="btn btn-primary" onClick={this.startGame}>START GAME</button>
                </p>

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

                <pre>
                    { JSON.stringify(this.state, null, 2) }
                </pre>
            </div>
        );
    }
}
