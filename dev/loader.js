import BvhParser from '../src/bvh/BvhParser'
import BvhStream from '../src/bvh/BvhStream'
import Broadcast from '../src/Broadcast'
import Server from '../src/Server'
import path from 'path';

let skeleton;
let broadcastFor;
let web;
let frameIndex = 0;

async function init() {
    skeleton = new BvhParser();

    /**
     * requires a .bvh file to be located inside a folder storage
     * inside a folder external which is located next to the 
     * repository folder axis-streamer
     * 
     * axis-streamer/
     * external/
     * ├── app/
     * ├── storage/
     * 
     */

    const f = path.join(__dirname, '../../external/storage/test-load.bvh');
    await skeleton.readFile(f);

    console.log("loading file", f, "done.");
    console.log(skeleton.nbFrames, skeleton.frameTime);

    const stream = new BvhStream({ target: skeleton });
    web = new Server();
    broadcastFor = new Broadcast();
    broadcastFor.osc = { remoteAddress: '127.0.0.1', remotePort: 5000 };

    /* stick to a good update-rate of 50 fps */
    setInterval(update, 20);

    /**
     * the second interval takes care of 
     * broadcasting message. here however we
     * throttle broadcasting messages a bit, so 
     * that we only have to update every tenth 
     * of a second (or less or more?).
     * this is to prevent the network or receiver
     * from overloading.
     */
    setInterval(broadcast, 100);

}

function update() {
    frameIndex += 5;
    frameIndex %= skeleton.nbFrames;
    skeleton.play(frameIndex);
    skeleton.update();    
}

function broadcast() {
    web.xyz({ source: skeleton });
    broadcastFor.osc.xyz({ source: skeleton });
}

(async () => {
    init();
})();