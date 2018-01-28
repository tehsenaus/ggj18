import { h, Component } from 'preact';
import guid from '../../common/guid'
import {CODE_NAMES, INPUT_PASSWORDS_PHASE, LOBBY_PHASE, PARTNER_CODENAME_PHASE, YOUR_CODENAME_PHASE} from "../../common/constants";
import KeyPad from "../components/KeyPad";

const USER_HASH_KEY = 'user_hash';

const codenameStyle = {
    display: 'block',
    fontSize: '49px',
    width: '50vw',
    maxWidth: '160px',
    margin: '0 auto'
}

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
        this.mockState();
    }
    
    pollState() {
        let userHash = localStorage.getItem(USER_HASH_KEY);
        if(!userHash){
            userHash = guid();
            localStorage.setItem(USER_HASH_KEY, userHash);
        }

        this.setState({ seqNo: -1 , userHash});

        const loop = async () => {
            try {
                const res = await fetch('/state?id='+userHash+'&seq=' + this.state.seqNo);
                const json = await res.json();

                this.setState({
                    ...json,
                    userHash,
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
        if(this.state.game.phase === YOUR_CODENAME_PHASE ) {
            return <div>Your code name is: {this.renderCodename(this.state.game.selfCodename)}</div>
        }
        if(this.state.game.phase === PARTNER_CODENAME_PHASE ) {
            return <div>Your partner code name is: {this.renderCodename(this.state.game.partnerCodename)}</div>
        }
        if(this.state.game.phase === INPUT_PASSWORDS_PHASE) {
            return <div style={{textAlign:'center', width:'100%'}}>
                <h1>Your PIN: {this.state.game.selfPIN}</h1>
                <h1>PIN to find:</h1>
                <br />
                <input type={"number"} disabled={true} style={{fontSize:'3em',margin:'5px'}} min={0} max={999} ref={(input) => { this.input = input; }} onKeyPress={(e) => this.onInputKeyDown(e)}></input>
                <br />
                {<KeyPad
                    onKeyNumPress={(key) => this.input.value += key}
                    onDelete={() => this.input.value = this.input.value.slice(0,-1)}
                    onAccept={() => this.onInputAccepted()}
                />}
            </div>
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
                      { player.name }
                </span>
            )) }
            </div>
          );
    }
}
