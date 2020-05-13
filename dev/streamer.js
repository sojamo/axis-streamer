import BvhParser from '../src/bvh/BvhParser';
import BvhStream from '../src/bvh/BvhStream';
import Broadcast from '../src/Broadcast';
import Server from '../src/Server';

let broadcastFor;
let web;
const entities = [];
const destinations = [];

async function init() {
  const parser = new BvhParser();
  entities.push(await parser.readFile({ file: './assets/test.bvh', id: 1 }));

  const stream = new BvhStream({ target: entities });

  /* first, initialise our broadcaster */
  web = new Server();
  broadcastFor = new Broadcast();
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

(async () => {
  init();
})();

function update() {
  entities.forEach((body) => body.update());
}

function broadcast() {
  web.xyz({ source: entities });
  broadcastFor.osc.xyz({ source: entities, dest: destinations });
  // broadcastFor.osc.xyz({ source: body, range: ['Head', 'LeftHand', 'RightHand', 'Hips'] });
}
