import { h, Component } from 'preact';

const cellStyle = {
    userSelect: 'none',
    width: '33%'
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
        return <table style={{width: '100%'}}>
            {this.state.rows.map(row => <tr>{row.map(cell => <td style={cellStyle}><button className="btn btn-primary" style={{width: '100%', height:'80px'}} onClick={() => this.onCellSelected(cell)}>{cell}</button></td>)}</tr>)}
        </table>
    }
}