import BvhParser from '../src/bvh/BvhParser';
import Broadcast from '../src/Broadcast';
import Server from '../src/Server';

let broadcastFor;
let web;
let parser;
let body = [];
let frameCount = 0;

async function init() {
  parser = new BvhParser();
  body.push(await parser.readFile());

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
  frameCount++;
  animate();
}

function animate() {
  body.forEach((el) => {
    el.update();

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

    el.flat['LeftUpLeg'].zRotation = Math.sin(frameCount * 0.01) * 20;
    el.flat['LeftUpLeg'].xRotation = Math.cos(frameCount * 0.1) * 40;

    el.flat['LeftLeg'].zRotation = Math.sin(frameCount * 0.1) * 10;
    el.flat['LeftLeg'].xRotation = Math.cos(frameCount * 0.1) * 10;

    el.flat['RightArm'].zRotation = Math.sin(frameCount * 0.1) * 30;
    el.flat['RightArm'].xRotation = Math.cos(frameCount * 0.1) * 50;
  });
}

function broadcast() {
  web.xyz({ source: body });
  broadcastFor.osc.xyz({ source: body });
}
