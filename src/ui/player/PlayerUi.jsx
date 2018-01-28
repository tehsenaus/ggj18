import { h, Component } from 'preact';
import guid from '../../common/guid'
import {CODE_NAMES, INPUT_PASSWORDS_PHASE, LOBBY_PHASE, PARTNER_CODENAME_PHASE, YOUR_CODENAME_PHASE, ROUND_END_PHASE, GAME_END_PHASE} from "../../common/constants";
import KeyPad from "../components/KeyPad";
import { values, get, sortBy } from 'lodash';

const USER_HASH_KEY = 'user_hash';

const codenameStyle = {
    display: 'block',
    fontSize: '49px',
    width: '50vw',
    maxWidth: '240px',
    margin: '0 auto'
}

const NOT_VALIDATED = 'not-validated';
const VALIDATED_CORRECT = 'validated-correct';
const VALIDATED_NOT_CORRECT = 'validated-not-correct';

export default class PlayerUi extends Component {

    constructor(){
        super();
        this.input = null;
    }

    mockState() {
        this.setState({
            game: {
                phase: YOUR_CODENAME_PHASE,
                selfCodename: CODE_NAMES[Math.floor(Math.random() * CODE_NAMES.length)]
            }
        });

        setTimeout(() => this.mockState(), 1000);
    }

    componentDidMount() {
        this.pollState();
    }

    pollState() {
        let userHash = localStorage.getItem(USER_HASH_KEY);
        if(!userHash){
            userHash = guid();
            localStorage.setItem(USER_HASH_KEY, userHash);
        }

        this.setState({ seqNo: -1 , userHash, inputState: NOT_VALIDATED});

        const loop = async () => {
            try {
                const res = await fetch('/state?id='+userHash+'&seq=' + this.state.seqNo);
                const json = await res.json();

                this.setState({
                    ...json,
                    userHash,
                    inputState : this.state.game && this.state.game.phase === YOUR_CODENAME_PHASE ? NOT_VALIDATED : this.state.inputState
                });
                setTimeout(loop, 5);
            } catch (e) {
                console.error('poll loop error', e);
                setTimeout(loop, 1);
            }
        };

        loop();
    }

    onInputKeyDown(e) {
        if (e.key === 'Enter') {
            this.onInputAccepted();
        }
    };

    onInputAccepted(e) {
        if(this.state.game.phase === LOBBY_PHASE) {
            const username = this.input.value;
            fetch("/player?id=" + this.state.userHash + "&name=" + username, {method: "POST"})
        } else if(this.state.game.phase === INPUT_PASSWORDS_PHASE){
            const passcode = this.input.value;
            fetch("/password?id=" + this.state.userHash + "&passcode=" + passcode, {method: "POST"})
            .then((response) => {
                return response.json();
            })
            .then((response) => {
                this.setState({
                    ...this.state,
                    inputState: response.correct ? VALIDATED_CORRECT : VALIDATED_NOT_CORRECT
                })

                if(this.state.inputState === VALIDATED_NOT_CORRECT){
                    this.input.value = '';
                }
            })
        }
    };

    render() {
        return <div style={{ textAlign: 'center' }}>
            { this.renderMain() }
        </div>
    }

    renderMain() {
        if(!this.state.game){
            return <div> Loading UI...</div>;
        }
        if(this.state.game.phase === LOBBY_PHASE){
          return this.renderLobby(this.state.game);
        }

        if (!this.state.game.name) {
          return <div>You are not in the game! Wait for next game to start.</div>
        }

        if(this.state.game.phase === YOUR_CODENAME_PHASE ) {
            return (
              <div>
                <h3>Your CODEFACE is: {this.renderCodename(this.state.game.selfCodename)}</h3>
                {this.renderCountdown(this.state.game.countdownTimeSecs)}
              </div>
          );
        }
        if(this.state.game.phase === PARTNER_CODENAME_PHASE ) {
            return (
              <div>
                <h3>Your partner's CODEFACE is: {this.renderCodename(this.state.game.partnerCodename)}</h3>
                {this.renderCountdown(this.state.game.countdownTimeSecs)}
              </div>
            );
        }
        if(this.state.game.phase === INPUT_PASSWORDS_PHASE) {
            return <div style={{textAlign:'center', width:'100%'}}>
                <h1>Your PIN: {this.state.game.selfPIN}</h1>
                <h1>PIN to find:</h1>
                <br />
                <input type={"number"} maxLength={32} disabled={true} style={{fontSize:'3em',margin:'5px'}} min={0} max={999} ref={(input) => { this.input = input; }} onKeyPress={(e) => this.onInputKeyDown(e)}></input>
                <br />
                {this.state.inputState === VALIDATED_CORRECT && <h3>Correct!</h3> }
                {this.state.inputState === VALIDATED_NOT_CORRECT && <h3>PIN Not Correct!</h3> }
                {<KeyPad
                    showGlow={this.state.inputState !== NOT_VALIDATED}
                    glowColor={this.state.inputState === VALIDATED_CORRECT ? 'green' : this.state.inputState === VALIDATED_NOT_CORRECT ? 'red' : 'gray'}
                    onKeyNumPress={(key) => this.input.value += key}
                    onDelete={() => this.input.value = this.input.value.slice(0,-1)}
                    onAccept={() => this.onInputAccepted()}
                />}
            </div>
        }

        if(this.state.game.phase === ROUND_END_PHASE) {
          return (
            <div>
              <h1>Round End!</h1>
              <p>Your score: {this.state.game.score}</p>
              <p>Get ready for round { this.state.game.roundNumber + 2 }!</p>
              {this.renderCountdown(this.state.game.countdownTimeSecs)}
            </div>
          );
        }

        if(this.state.game.phase === GAME_END_PHASE) {
            return (
              <div>
                <h1>Game Over!</h1>
                {this.renderLeaderboard(this.state.game.scores, this.state.game.players, this.state.game.playerId, this.state.game.roundPlayers)}

              </div>
            )
        }
    }

    renderCodename(codename) {
        //<span style={codenameStyle}>{this.state.game.selfCodename}</span>
        var iOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
        const size = iOS ? 80 : 48;
        const pad = 10;
        return <canvas ref={e => {
            if (e) {
                var ctx = e.getContext('2d');
                ctx.clearRect(0, 0, e.width, e.height);
                ctx.font = size + 'px sans-serif';
                ctx.fillText(codename, pad, size);
            }
        }} style={codenameStyle} width={size + pad * 2} height={size + 10} />;
    }

    renderLobby(game) {
        if(!game.name){
            return <div>
                <h1>Please enter your name below</h1>
                <br />
                <input type={"text"}
                       maxLength={32}
                       ref={(input) => { this.input = input; }}
                      onKeyPress={(e) => this.onInputKeyDown(e)}>
                </input>

                <button onClick={(e) => this.onInputAccepted()}>
                  Send
                </button>
                </div>
        }

          return (
            <div>
            <h1>
                You are in the lobby, wait until game starts.
            </h1>

            <p>{ game.players.length } player(s) joined:</p>

            { game.players.map(player => (
                <span className="badge badge-pill badge-secondary"
                      style={{ fontSize: '1.5em', marginRight: '0.5em' }}>
                      { player.playerId === game.playerId ?   `YOU (${player.name})` : player.name }
                </span>
            )) }
            </div>
          );
    }

    renderLeaderboard(scores, players, playerId, roundPlayers) {
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
                            <td>{ i === 0 ? '🏆' : '#'+(i+1) }</td>
                            <td>{ player.playerId === playerId ?   `YOU (${player.name})` : player.name } { (roundPlayers[player.playerId] && roundPlayers[player.playerId].codeName) || '' }</td>
                            <td>{ scores[player.playerId] || 0 }</td>
                        </tr>
                    )) }
                </tbody>
            </table>
        );
    }

    renderCountdown(countdownTimeSecs) {
      if (!countdownTimeSecs) {
        return <span></span>
      }

        return (
            <div className="text-center">
                <h1 style={{ fontSize: '5em' }}>{ countdownTimeSecs } </h1>
            </div>
        )
    }
}
