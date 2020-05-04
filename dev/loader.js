import BvhParser from '../src/bvh/BvhParser';
import Broadcast from '../src/Broadcast';
import Server from '../src/Server';
import path from 'path';

let body = [];
let broadcastFor;
let web;
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

  body.push(await parser.readFile({ file, id: 1 }));
  console.log(`loading file\n${file}\n  ${body.length} BvhBody(s)`);

  body.forEach((b) => {
    console.log(`  id: ${b.id}\tframes: ${b.nbFrames}\tframeTime: ${b.frameTime}`);
  });

  web = new Server();
  broadcastFor = new Broadcast({ group: body });
  broadcastFor.osc = { remoteAddress: '127.0.0.1', remotePort: 5001 };

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
  body.forEach((el) => {
    frameIndex += 5;
    frameIndex %= el.nbFrames;
    el.play(frameIndex);
    el.update();
  });
}

function broadcast() {
  web.xyz({ source: body });
  broadcastFor.osc.xyz({ source: body });
}

(async () => {
  init();
})();
