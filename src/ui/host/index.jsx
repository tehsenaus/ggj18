import { h, render } from 'preact';

let root;
function init() {
    let HostUi = require('./HostUi').default;
    root = render(<HostUi />, document.body, root);
}

// in development, set up HMR:
if (module.hot) {
    //require('preact/devtools');   // turn this on if you want to enable React DevTools!
    module.hot.accept('./HostUi', () => requestAnimationFrame(init) );
}

init();
