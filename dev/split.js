import BvhParser from '../src/bvh/BvhParser';
import Broadcast from '../src/Broadcast';
import Server from '../src/Server';

let broadcastFor;
let web;
let parser;
const entities = [];
const destinations = [];

let frameCount = 0;

async function init() {
  parser = new BvhParser();
  const b0 = await parser.readFile();

  entities.push(b0);

  /* first, initialise our broadcaster */
  web = new Server();
  broadcastFor = new Broadcast();
  broadcastFor.osc = { source: entities };

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
  frameCount++;
  animate();
}

function animate() {
  entities.forEach((body) => {
    body.update();

    /* the naming convention for keys follows the
     * Axis Neuron Manual naming convention (p.84)
     *
     * changes to rotation only affects children
     * of a joint.
     *
     * position however will affect the the joint
     * changes are applied on.
     *
     */

    /** TODO use a function instead of making changes to array flat */
    body.flat['LeftUpLeg'].zRotation = Math.sin(frameCount * 0.01) * 20;
    body.flat['LeftUpLeg'].xRotation = Math.cos(frameCount * 0.1) * 40;

    body.flat['LeftLeg'].zRotation = Math.sin(frameCount * 0.1) * 10;
    body.flat['LeftLeg'].xRotation = Math.cos(frameCount * 0.1) * 10;

    body.flat['RightArm'].zRotation = Math.sin(frameCount * 0.1) * 30;
    body.flat['RightArm'].xRotation = Math.cos(frameCount * 0.1) * 50;
  });
}

function broadcast() {
  web.xyz({ source: entities });
  broadcastFor.osc.xyz({
    source: entities,
    dest: destinations,
    split: true,
    range: ['RightForeArm', 'RightHand'],
  });
}
