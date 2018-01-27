import { h, Component } from 'preact';

export default class App extends Component {
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
        return (
            <div>
                { JSON.stringify(this.state) }
            </div>
        );
    }
}
