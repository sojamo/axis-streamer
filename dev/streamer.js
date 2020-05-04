import BvhParser from '../src/bvh/BvhParser';
import BvhStream from '../src/bvh/BvhStream';
import Broadcast from '../src/Broadcast';
import Server from '../src/Server';

let broadcastFor;
let web;
const body = [];

async function init() {
  const parser = new BvhParser();
  body.push(await parser.readFile({ file: './assets/test.bvh', id: 1 }));

  const stream = new BvhStream({ target: body });

  /* first, initialise our broadcaster */
  web = new Server();
  broadcastFor = new Broadcast();
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

(async () => {
  init();
})();

function update() {
  body.forEach((el) => {
    el.update();
  });
}

function broadcast() {
  web.xyz({ source: body });
  broadcastFor.osc.xyz({ source: body });
  // broadcastFor.osc.xyz({ source: body, range: ['Head', 'LeftHand', 'RightHand', 'Hips'] });
}
