import BvhParser from '../src/bvh/BvhParser';
import Broadcast from '../src/Broadcast';
import Server from '../src/Server';
import path from 'path';

let entities = [];
let web;
let broadcastFor;
let destinations = [];

let frameIndex = 0;

async function init() {
  const parser = new BvhParser();

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
  const b1 = await parser.readFile({ file, id: 1 });

  entities.push(b1);

  console.log(`loading file\n${file}\n  ${entities.length} BvhBody(s)`);

  entities.forEach((b) => {
    console.log(`  id: ${b.id}\tframes: ${b.nbFrames}\tframeTime: ${b.frameTime}`);
  });

  /* initialise network components */
  web = new Server();
  broadcastFor = new Broadcast({ source: entities });
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
  entities.forEach((body) => {
    body.currentFrame = frameIndex % body.nbFrames;
    body.play();
    body.update();
  });
}

function broadcast() {
  web.xyz({
    source: entities,
  });

  broadcastFor.osc.xyz({
    source: entities,
    dest: destinations,
    split: true,
  });
}

(async () => {
  init();
})();
