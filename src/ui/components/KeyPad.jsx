import { h, Component } from 'preact';

const cellStyle = {
    border: '1px solid black',
    padding: '50px'
};

export default class KeyPad extends Component {

    constructor(){
        super();
        this.state = {
            rows: [
                [7,8,9],
                [4,5,6],
                [1,2,3],
                [0,'del','ent']
            ]
        }
    }

    onCellSelected(cell){
        if(cell === 'del'){
            this.props.onDelete()
        } else if(cell === 'ent'){
            this.props.onAccept()
        } else {
            this.props.onKeyNumPress(cell)
        }

    }

    render(){
        return <table>
            {this.state.rows.map(row => <tr>{row.map(cell => <td style={cellStyle} onClick={() => this.onCellSelected(cell)}>{cell}</td>)}</tr>)}
        </table>
    }
}