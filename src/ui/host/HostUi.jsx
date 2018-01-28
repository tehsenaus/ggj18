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

                const playerJoined = this.state.game && this.state.game.players && json.game.players && Object.keys(this.state.game.players).length === (Object.keys(json.game.players).length - 1)

                if(this.state.game &&
                    ((this.state.game.phase === LOBBY_PHASE && playerJoined)
                        || this.state.game.phase === YOUR_CODENAME_PHASE
                        || this.state.game.phase === PARTNER_CODENAME_PHASE)){

                    const audio = new Audio(require('../../assets/whoosh.wav'));
                    audio.play();
                }

                if(this.state.game && this.state.game.phase === INPUT_PASSWORDS_PHASE){
                    if(!this.music) {
                        this.music = new Audio(require('../../assets/music.wav'));
                        this.music.loop = true;
                        this.music.play();
                    } else {
                        this.music.play();
                    }
                }

                if(this.state.game && (this.state.game.phase === ROUND_END_PHASE || this.state.game.phase === LOBBY_PHASE) && this.music){
                    if(this.music){
                        this.music.pause();
                        this.music.currentTime = 0;
                    }
                }


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
            <div className="ui__host">
                <p className="text-center">
                    <h1>{ GAME_TITLE }</h1>

                    { phase === LOBBY_PHASE && <div>
                        <h5>Find your secret partner by their codeface, and <em>transmit</em> your secret PIN!</h5>
                        <img src={require('../../assets/qrcode.svg')} style={{ height: '40vh', maxHeight: '29vw' }}></img>
                        <div className="float-right" style={{ width: '70%', fontSize: '4em' }}>
                            <a href="http://goo.gl/wa9wsa">goo.gl/wa9wsa</a>
                        </div>
                        <div className="clearfix"><button className="btn btn-primary" onClick={this.startGame}>START GAME</button></div>
                    </div>}

                    { phase === ROUND_END_PHASE && (<div>
                        <h2>Get ready for round { round.roundNumber + 2 }!</h2>
                    </div>)}

                    { phase === GAME_END_PHASE && (<div>
                        <h2>Game Over!</h2>
                        <button className="btn btn-primary" onClick={this.resetGame}>PLAY AGAIN</button>
                    </div>)}
                </p>

                { phase === LOBBY_PHASE && this.renderPlayerList(players) }

                { ([YOUR_CODENAME_PHASE, PARTNER_CODENAME_PHASE, INPUT_PASSWORDS_PHASE, ROUND_END_PHASE].indexOf(phase) >= 0)
                    && this.renderCountdown(phase) }


                { (phase === ROUND_END_PHASE || phase === GAME_END_PHASE) && this.renderLeaderboard(players, phase, round) }

                {/* <pre>
                    { JSON.stringify(this.state, null, 2) }
                </pre> */}
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

    renderLeaderboard(players, phase, round) {
        const scores = get(this.state, ['game', 'scores'], {});
        players = sortBy(players, (p) => -(scores[p.playerId] || 0));

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
                            <td>{ player.name } {(round.players[player.playerId] && round.players[player.playerId].codeName) || ''}</td>
                            <td>{ scores[player.playerId] || 0 }</td>
                        </tr>
                    )) }
                </tbody>
            </table>
        );
    }
}
