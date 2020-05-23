import BvhParser from '../src/bvh/BvhParser';
import Broadcast from '../src/Broadcast';
import Server from '../src/Server';
import path from 'path';

let source = [];
let web;
let broadcastFor;
let destinations = [];

let frameIndex = 0;

async function init() {
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

  const file = path.join(__dirname, '../../external/storage/test-load.bvh');

  (async () => {
    return (await BvhParser).readFile({ file, id: 1 });
  })().then((body) => {
    source.push(body);
    body.play();
    console.log(`loading file\n${file}\n  ${source.length} BvhBody(s)`);
    source.forEach((b) => {
      const m = `  id: ${b.id}\tframes: ${b.nbFrames}\tframeTime: ${b.frameTime}`;
      console.log(m);
    });
  });

  /* initialise network components */
  web = new Server({ source });
  broadcastFor = new Broadcast({ source });
  broadcastFor.osc = {};

  destinations.push({ address: '127.0.0.1', port: 5001 });

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
  frameIndex += 4;
  source.forEach((body) => {
    body.currentFrame = frameIndex % body.nbFrames;
    body.update();
  });
}

function broadcast() {
  web.xyz();
  broadcastFor.osc.xyz({ dest: destinations });
}

init();
