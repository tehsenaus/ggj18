import { h, Component } from 'preact';
import guid from '../../common/guid'

const USER_HASH_KEY = 'user_hash';

export default class App extends Component {

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
        const username = this.input.value;
        fetch("/player?id="+this.state.userHash+"&name="+username, {method: "POST"})
    };

    render() {
        if(!this.state.game){
            return <div> Loading UI...</div>;
        }
        if(!this.state.game.name && this.state.game.phase ==='lobby'){
            return <div>
                    { JSON.stringify(this.state) }
                Please enter your name:<input type={"text"} ref={(input) => { this.input = input; }} onKeyPress={(e) => this.onInputKeyDown(e)}></input><button onClick={(e) => this.onInputAccepted()}>Send</button>
                </div>;
        } else {
            return <div>
                { JSON.stringify(this.state) }
                You are in the lobby, wait until game starts.
            </div>;
        }

    }
}