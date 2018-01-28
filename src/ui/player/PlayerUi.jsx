import { h, Component } from 'preact';
import guid from '../../common/guid'
import {CODE_NAMES, GAME_TITLE, INPUT_PASSWORDS_PHASE, LOBBY_PHASE, PARTNER_CODENAME_PHASE, YOUR_CODENAME_PHASE, ROUND_END_PHASE, GAME_END_PHASE} from "../../common/constants";
import KeyPad from "../components/KeyPad";

import values from 'lodash.values';
import get from 'lodash.get';

function sortBy(arr, f){
    return arr.slice(0).sort(function(a, b){
        if (f(a) < f(b))
         return -1;
      if (f(a) > f(b))
        return 1;
      return 0;
    });
}

const USER_HASH_KEY = 'user_hash';
const GAME_ID_KEY = 'game_id';

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
    onCreateGame = async () => {
        const res = await fetch('/game?id='+localStorage.getItem(USER_HASH_KEY), {method: "POST"});
        const {id} = await res.json();

        console.log('CREATED GAME:', id);

        this.setGameId(id);
    }

    startGame = async () => {
        await fetch('/game/start?id='+localStorage.getItem(USER_HASH_KEY)+'&gameId='+this.state.gameId, {method: "POST"});
    }
    resetGame = async () => {
        await fetch('/game?id='+localStorage.getItem(USER_HASH_KEY)+'&gameId='+this.state.gameId, {method: "DELETE"});
    }

    onJoinGame = () => {
        this.setState({ 
            ...this.state,
            joinGame: true
        })
    }

    constructor(){
        super();
        this.input = null;
    }

    componentDidMount() {
        let userHash = localStorage.getItem(USER_HASH_KEY);
        if(!userHash){
            userHash = guid();
            localStorage.setItem(USER_HASH_KEY, userHash);
        }

        const gameId = localStorage.getItem(GAME_ID_KEY);
        if (gameId) this.pollState(gameId, userHash);
        else this.setState({ userHash });
    }

    setGameId(gameId) {
        if ( gameId ) {
            localStorage.setItem(GAME_ID_KEY, gameId);
            this.pollState(gameId, localStorage.getItem(USER_HASH_KEY));
        } else {
            localStorage.removeItem(GAME_ID_KEY);
            this.setState({
                ...this.state,
                gameId: undefined,
                game: undefined,
                joinGame: false,
            });
        }
    }

    pollState(gameId, userHash) {
        this.setState({ seqNo: -1, gameId, userHash, inputState: NOT_VALIDATED, joinGame: false });

        const loop = async () => {
            try {
                const res = await fetch('/state?id='+userHash+'&gameId='+gameId+'&seq=' + this.state.seqNo);
                if ( res.status === 404 ) {
                    console.log('GAME NOT FOUND', gameId);
                    return this.setGameId(undefined);
                }
                const json = await res.json();

                if ( gameId !== localStorage.getItem(GAME_ID_KEY) ) {
                    console.log('stop polling:', gameId);
                    return;
                };

                this.setState({
                    ...this.state,
                    ...json,
                    gameId,
                    inputState : this.state.game && this.state.game.phase === YOUR_CODENAME_PHASE ? NOT_VALIDATED : this.state.inputState,
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
        const gameId = this.state.gameId || localStorage.getItem(GAME_ID_KEY);
        if(this.state.game.phase === LOBBY_PHASE) {
            const username = this.input.value;
            fetch("/player?id=" + this.state.userHash +'&gameId='+gameId + "&name=" + encodeURIComponent(username), {method: "POST"})
        } else if(this.state.game.phase === INPUT_PASSWORDS_PHASE){
            const passcode = this.input.value;
            fetch("/password?id=" + this.state.userHash +'&gameId='+gameId + "&passcode=" + passcode, {method: "POST"})
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
        const phase = this.state.game && this.state.game.phase || (this.state.joinGame && 'joinGame');
        return <div className={"ui__player o-flex phase-" + phase}>
            { this.renderMain() }

            {/* <pre>
                { JSON.stringify(this.state, null, 2) }
            </pre> */}
        </div>
    }

    renderCreateOrJoinGame() {
        if ( this.state.joinGame ) {
            return this.renderJoinGame();
        }

        return <div className="text-center">
            <p>
                { GAME_TITLE }
            </p>

            <p><b>Find your secret partner by their CODEFACE, and transmit your secret PIN!</b>
                <br/><br/>
                <span>This is a fast-paced competitive party game. Players compete over three rounds to exchange
                PIN numbers with a random partner, and each gain a point. How do you find your partner? With their Emoji CODEFACE!</span>
            </p>

            <p>
                <button className="btn btn-primary" onClick={(e) => this.onCreateGame()}>
                    Create Game
                </button>
            </p>

            <p>
                <button className="btn btn-info" onClick={(e) => this.onJoinGame()}>
                    Join Game
                </button>
            </p>
        </div>
    }

    renderJoinGame() {
        return <div>
            <p>Enter the game ID:</p>
            <div className="input__screen">
                <input type={"number"} disabled={true} min={0} max={999999} ref={(input) => { this.gameIdInput = input; }}></input>
            </div>
            
            <KeyPad
                onKeyNumPress={(key) => this.gameIdInput.value += key}
                onDelete={() => this.gameIdInput.value = this.gameIdInput.value.slice(0,-1)}
                onAccept={() => {
                    this.setGameId(this.gameIdInput.value);
                }}
            />
        </div>
    }

    renderMain() {
        if(!this.state.game){
            return this.renderCreateOrJoinGame();
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
                <h2>Your PIN: {this.state.game && this.state.game.selfPIN}</h2>
                <h2>PIN to find:</h2> 
                
                <div className="input__screen">
                    <input type={"number"} maxLength={3} disabled={true} min={0} max={999} ref={(input) => { this.input = input; }} onKeyPress={(e) => this.onInputKeyDown(e)}></input>
                </div>
                
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
              <h2>Round End!</h2>
              <p>Your score: {this.state.game.score}</p>
              <p>Get ready for round { this.state.game.roundNumber + 2 }!</p>
              {this.renderCountdown(this.state.game.countdownTimeSecs)}
            </div>
          );
        }

        if(this.state.game.phase === GAME_END_PHASE) {
            return (
              <div>
                <h2>Game Over!</h2>
                <button className="btn btn-primary" onClick={(e) => this.resetGame()}>
                    Play Again
                </button>
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
        return <canvas style={codenameStyle} width={size + pad * 2} height={size + 10} ref={e => {
            if (e) {
                var ctx = e.getContext('2d');
                ctx.clearRect(0, 0, e.width, e.height);
                ctx.font = size + 'px sans-serif';
                ctx.fillText(codename, pad, size);
            }
        }} />;
    }

    renderLobby(game) {
        if(!game.name){
            return <div className="ui__lobby">
                <h1 className={"text--screen-title text-uppercase m-b--lg"}>Codefaces</h1>
                <p>GAME ID: {this.state.gameId} (expires in {this.state.game.countdownTimeSecs})</p>
                <h2 className={"m-b--lg"}>Please enter your name below</h2>
                
                <div className="input__screen">
                    <div>
                        <input type={"text"}
                            className={"m-b--md"}
                            placeholder={"Your name"}
                            maxLength={16}
                            ref={(input) => { this.input = input; }}
                            onKeyPress={(e) => this.onInputKeyDown(e)}>
                        </input>
                    </div>

                    <p>
                        <button className="btn btn-primary" onClick={(e) => this.onInputAccepted()}>
                        Send
                        </button>
                    </p>

                    <p>
                        <a href='#' onClick={() => {
                            this.setGameId(undefined);
                        }}>QUIT GAME</a>
                    </p>
                </div>
            </div>
        }

        const iAmHost = game.hostId === game.playerId;
        const canStart = game.players.length > 2;

          return (
            <div className=" ui__lobby ui__lobby--has-entered">
                { iAmHost ? (
                    canStart 
                        ? <button className="btn btn-primary" onClick={(e) => this.startGame()}>
                            Start Game
                        </button>
                        : <h2 className={"m-b--md"}>We need more players. Send them the game ID!</h2>
                ) : <h2 className={"m-b--md"}>You are in the lobby, wait until game starts.</h2> }

                <p>GAME ID: <b style={{ fontSize: '1.5em' }}>{this.state.gameId}</b> (expires in {this.state.game.countdownTimeSecs})</p>
                
                <p>{ game.players.length } player(s) joined:</p>

                { game.players.map(player => {
                    const isCurrent = player.playerId === localStorage.getItem(USER_HASH_KEY)
                    return <span className="badge badge-pill badge-secondary m-b--xs"
                        style={{ 
                            fontSize: '1.5em', 
                            marginRight: '0.5em', 
                            ...(isCurrent ? {
                                backgroundColor: 'var(--primary)'
                            }:{
                                backgroundColor: 'var(--secondary)'
                            })
                        }}>
                        { player.playerId === game.playerId ?   `YOU (${player.name})` : player.name }
                    </span>
                }) }
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
