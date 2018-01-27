import { h, Component } from 'preact';

export default class App extends Component {

    componentDidMount() {
        const loop = async () => {
            const res = await fetch('/state');
            const json = await res.json();

            this.setState(json);
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
