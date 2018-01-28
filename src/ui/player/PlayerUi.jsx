import { h, Component } from 'preact';
import guid from '../../common/guid'
import {INPUT_PASSWORDS_PHASE, LOBBY_PHASE, PARTNER_CODENAME_PHASE, YOUR_CODENAME_PHASE} from "../../common/constants";
import KeyPad from "../components/KeyPad";
import PoseViewer from "../components/PoseViewer";

const USER_HASH_KEY = 'user_hash';

const codenameStyle = {
    display: 'block',
    fontSize: '8em'
}

export default class PlayerUi extends Component {

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

        this.setState({ seqNo: -1 , userHash});

        const loop = async () => {
            try {
                const res = await fetch('/state?id='+userHash+'&seq=' + this.state.seqNo);
                const json = await res.json();

                this.setState({
                    ...json,
                    userHash
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
        if(!this.state.game.name && this.state.game.phase === LOBBY_PHASE){
            return <div>
                <h1>Please enter your name below</h1>
                <br />
                <input type={"text"} ref={(input) => { this.input = input; }} onKeyPress={(e) => this.onInputKeyDown(e)}></input><button onClick={(e) => this.onInputAccepted()}>Send</button>
                {/*<PoseViewer poseIndex={3} debug={true} />*/}
            </div>
        }
        if(this.state.game.phase === LOBBY_PHASE) {
            return <div>
                You are in the lobby, wait until game starts.
            </div>;
        }
        if(this.state.game.phase === YOUR_CODENAME_PHASE ) {
            return <div>
                <h3>Do this:</h3>
                <br />
                {this.state.game.selfCodename && <PoseViewer poseIndex={this.state.game.selfCodename}/>}
            </div>
        }
        if(this.state.game.phase === PARTNER_CODENAME_PHASE ) {
            return <div>
                <h3>Your partner will do this:</h3>
                {this.state.game.partnerCodename && <PoseViewer poseIndex={this.state.game.partnerCodename}/>}
            </div>
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
}