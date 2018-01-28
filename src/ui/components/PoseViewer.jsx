import { h, Component } from 'preact';

const generateFromPreviousPose = (newPose, currentFrame) => {
    currentFrame--;
    while(currentFrame >= 0){
        if(newPose[currentFrame] !== undefined){
            const pose = newPose[currentFrame];
            return {
                head : [pose.head[0],pose.head[1]],
                neck : [pose.neck[0],pose.neck[1]],
                leftElbow : [pose.leftElbow[0],pose.leftElbow[1]],
                leftHand: [pose.leftHand[0],pose.leftHand[1]],
                rightElbow: [pose.rightElbow[0],pose.rightElbow[1]],
                rightHand: [pose.rightHand[0],pose.rightHand[1]],
                butt: [pose.butt[0],pose.butt[1]],
                leftKnee: [pose.leftKnee[0],pose.leftKnee[1]],
                leftFoot: [pose.leftFoot[0],pose.leftFoot[1]],
                rightKnee: [pose.rightKnee[0],pose.rightKnee[1]],
                rightFoot: [pose.rightFoot[0],pose.rightFoot[1]],
            }
        }
        currentFrame--;
    }
    return {"head":[50,13],"neck":[50,30],"leftElbow":[38,30],"leftHand":[30,40],"rightElbow":[62,30],"rightHand":[70,40],"butt":[50,50],"leftKnee":[40,60],"leftFoot":[40,80],"rightKnee":[60,60],"rightFoot":[60,80]}
};

const isChrome = () =>{
    return navigator.userAgent.toLowerCase().indexOf('chrome') !== -1
};

const svgStyle = {
    border: '1px solid black',
    margin: '20px'
};

const headStyle = {
    stroke: 'black',
    ...(isChrome()? {
        transition: 'all 1s ease-in-out',
        webkitTransition: 'all 1s ease-in-out'
    }:{})
};

const lineStyle = {
    strokeWidth: '5px',
    strokeLinecap: 'round',
    stroke: 'black',
    ...(isChrome()? {
        transition: 'all 1s ease-in-out',
        webkitTransition: 'all 1s ease-in-out'
    }:{})
};

const animNameMapping = {
    1: 'Do Nothing!',
    2: 'Head Bang!',
    3: 'Sit Down & Stand Up!',
    4: 'Lean to the side!',
    5: 'Weave Hands!'
};

export default class PoseViewer extends Component {

    constructor(){
        super();
        this.state = {
            activeElement: 'none',
            currentFrame: 0,
            poseMapping: {
                //init
                '1' : [{"head":[50,13],"neck":[50,30],"leftElbow":[38,30],"leftHand":[30,40],"rightElbow":[62,30],"rightHand":[70,40],"butt":[50,50],"leftKnee":[40,60],"leftFoot":[40,80],"rightKnee":[60,60],"rightFoot":[60,80]}],
                //head bang
                '2' : [{"head":[40,13],"neck":[50,30],"leftElbow":[38,30],"leftHand":[30,40],"rightElbow":[62,30],"rightHand":[70,40],"butt":[50,50],"leftKnee":[40,60],"leftFoot":[40,80],"rightKnee":[60,60],"rightFoot":[60,80]},{"head":[60,13],"neck":[50,30],"leftElbow":[38,30],"leftHand":[30,40],"rightElbow":[62,30],"rightHand":[70,40],"butt":[50,50],"leftKnee":[40,60],"leftFoot":[40,80],"rightKnee":[60,60],"rightFoot":[60,80]}],
                //sit down
                '3' : [{"head":[50,13],"neck":[50,30],"leftElbow":[38,30],"leftHand":[30,40],"rightElbow":[62,30],"rightHand":[70,40],"butt":[50,50],"leftKnee":[40,60],"leftFoot":[40,80],"rightKnee":[60,60],"rightFoot":[60,80]},{"head":[50,33],"neck":[50,50],"leftElbow":[38,50],"leftHand":[30,60],"rightElbow":[62,50],"rightHand":[70,60],"butt":[50,70],"leftKnee":[40,60],"leftFoot":[40,80],"rightKnee":[60,60],"rightFoot":[60,80]}],
                //lean side
                '4' : [{"head":[50,13],"neck":[50,30],"leftElbow":[38,30],"leftHand":[30,40],"rightElbow":[62,30],"rightHand":[70,40],"butt":[50,50],"leftKnee":[40,60],"leftFoot":[40,80],"rightKnee":[60,60],"rightFoot":[60,80]},{"head":[72,13],"neck":[64,30],"leftElbow":[51,30],"leftHand":[43,40],"rightElbow":[78,30],"rightHand":[88,40],"butt":[58,50],"leftKnee":[40,60],"leftFoot":[28,73],"rightKnee":[66,60],"rightFoot":[60,80]}],
                //weave hands
                '5' : [{"head":[50,13],"neck":[50,30],"leftElbow":[38,25],"leftHand":[20,10],"rightElbow":[62,25],"rightHand":[65,10],"butt":[50,50],"leftKnee":[40,60],"leftFoot":[40,80],"rightKnee":[60,60],"rightFoot":[60,80]},{"head":[50,13],"neck":[50,30],"leftElbow":[38,25],"leftHand":[35,10],"rightElbow":[62,25],"rightHand":[80,10],"butt":[50,50],"leftKnee":[40,60],"leftFoot":[40,80],"rightKnee":[60,60],"rightFoot":[60,80]}]
            },
            animationRunning: true
        }
    }

    componentDidMount(){
        document.addEventListener('keypress', (event) => {
            const keyName = event.key;
            switch(keyName){
                case 'h': this.setState({...this.state,activeElement:'head'}); break;
                case 'n': this.setState({...this.state,activeElement:'neck'}); break;
                case 's': this.setState({...this.state,activeElement:'leftElbow'}); break;
                case 'a': this.setState({...this.state,activeElement:'leftHand'}); break;
                case 'd': this.setState({...this.state,activeElement:'rightElbow'}); break;
                case 'f': this.setState({...this.state,activeElement:'rightHand'}); break;
                case 'b': this.setState({...this.state,activeElement:'butt'}); break;
                case 'z': this.setState({...this.state,activeElement:'leftFoot'}); break;
                case 'x': this.setState({...this.state,activeElement:'leftKnee'}); break;
                case 'c': this.setState({...this.state,activeElement:'rightKnee'}); break;
                case 'v': this.setState({...this.state,activeElement:'rightFoot'}); break;
                case 'p': console.log(JSON.stringify(this.state.poseMapping[this.props.poseIndex])); break;
                case 'l': this.setState({...this.state,animationRunning: !this.state.animationRunning}); break;
                default:{
                    if(Number.isInteger(+keyName)){
                        const currentFrame = +keyName;
                        if(this.state.poseMapping[this.props.poseIndex][currentFrame] === undefined){
                            const newPose = this.state.poseMapping[this.props.poseIndex].slice();
                            newPose[currentFrame] = generateFromPreviousPose(newPose, currentFrame);
                            this.setState({
                                ...this.state,
                                currentFrame,
                                poseMapping: {
                                    ...this.state.poseMapping,
                                    [this.props.poseIndex] : newPose
                                }
                            })
                        } else {
                            this.setState({...this.state,currentFrame})
                        }
                    }
                }
            }
        });
        document.addEventListener('keydown', (event) => {
            if(this.state.activeElement === 'none') return;
            const keyCode = event.keyCode;
            let dx = 0;
            let dy = 0;

            switch(keyCode){
                case 38: { //UP
                    dy = -1;
                }
                break;
                case 40: {//DOWN
                    dy = 1;
                }
                break;
                case 37: {//LEFT
                    dx = -1;
                }
                break;
                case 39: {//RIGHT
                    dx = 1;
                }
                break;
            }

            const newPose = this.state.poseMapping[this.props.poseIndex].slice();
            const oldPosePosition = newPose[this.state.currentFrame][this.state.activeElement];
            newPose[this.state.currentFrame] = {
                ...newPose[this.state.currentFrame],
                [this.state.activeElement] : [oldPosePosition[0] + dx, oldPosePosition[1]+dy]
            };

            this.setState({
                ...this.state,
                poseMapping: {
                    ...this.state.poseMapping,
                    [this.props.poseIndex]: newPose
                }})
        });

        setInterval(() => {
            if(this.state.animationRunning){
                let nextFrame = this.state.currentFrame + 1;
                if(this.state.poseMapping[this.props.poseIndex][nextFrame] === undefined){
                    nextFrame = 0
                }
                this.setState({
                    ...this.state,
                    currentFrame: nextFrame
                })
            }
        },1000)
    }

    componentWillReceiveProps(){
    }

    render(){
        const pose = this.state.poseMapping[this.props.poseIndex][this.state.currentFrame];
        const strokeWidth = 20;
        const activeElementObj = pose[this.state.activeElement] || [0,0];

        return <div key="position-container">
            {this.props.debug && <div>
                Pose NO:{this.props.poseIndex}
                <br />
                Active Element:{this.state.activeElement}
                <br />
                Active Element Pos: {activeElementObj[0]} : {activeElementObj[1]}
                <br />
                Current Frame: {this.state.currentFrame}
                <br />
                Animation playing: {this.state.animationRunning ? 'yes': 'no'} ([l] to change)
                <br />
            </div>}
            <h3>Do: {animNameMapping[this.props.poseIndex] || ''}</h3>
            <br />
            <svg xmlns="http://www.w3.org/2000/svg" xmlnsXlink="http://www.w3.org/1999/xlink"
                key="position-svg" style={svgStyle} width={200} height={200} viewBox="0 0 100 100">
                <circle key={"head"} style={headStyle} cx={pose.head[0]} cy={pose.head[1]} r={10}/>
                <path key={"neck"} style={lineStyle} d={`M ${pose.head[0]},${pose.head[1]} L ${pose.neck[0]},${pose.neck[1]}`}/>
                <path key={"leftForearm"} style={lineStyle} d={`M ${pose.leftElbow[0]},${pose.leftElbow[1]} L ${pose.neck[0]},${pose.neck[1]}`}/>
                <path key={"leftArm"} style={lineStyle} d={`M ${pose.leftElbow[0]},${pose.leftElbow[1]} L ${pose.leftHand[0]},${pose.leftHand[1]}`}/>
                <path key={"rightForearm"} style={lineStyle} d={`M ${pose.rightElbow[0]},${pose.rightElbow[1]} L ${pose.neck[0]},${pose.neck[1]}`}/>
                <path key={"rightArm"} style={lineStyle} d={`M ${pose.rightElbow[0]},${pose.rightElbow[1]} L ${pose.rightHand[0]},${pose.rightHand[1]}`}/>
                <path key={"spine"} style={lineStyle} d={`M ${pose.neck[0]},${pose.neck[1]} L ${pose.butt[0]},${pose.butt[1]}`}/>
                <path key={"leftForeleg"} style={lineStyle} d={`M ${pose.butt[0]},${pose.butt[1]} L ${pose.leftKnee[0]},${pose.leftKnee[1]}`} />
                <path key={"leftLeg"} style={lineStyle} d={`M ${pose.leftKnee[0]},${pose.leftKnee[1]} L ${pose.leftFoot[0]},${pose.leftFoot[1]}`}/>
                <path key={"rightForeleg"} style={lineStyle} d={`M ${pose.butt[0]},${pose.butt[1]} L ${pose.rightKnee[0]},${pose.rightKnee[1]}`} />
                <path key={"rightLeg"} style={lineStyle} d={`M ${pose.rightKnee[0]},${pose.rightKnee[1]} L ${pose.rightFoot[0]},${pose.rightFoot[1]}`}/>
            </svg>
        </div>
    }
}