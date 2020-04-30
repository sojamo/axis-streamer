import BvhParser from '../src/bvh/BvhParser'
import BvhStream from '../src/bvh/BvhStream'
import Broadcast from '../src/Broadcast'
import Server from '../src/Server'

let pauseBroadcasting = false;
let broadcastFor;
let web;
let skeleton;
let frameCount = 0;


async function init() {
  skeleton = new BvhParser();
  await skeleton.readFile('./assets/test.bvh');
  console.log(Date.now(), 'skeleton detected', skeleton.root === undefined ? false : true);

  const stream = new BvhStream({ target: skeleton });

  /* first, initialise our broadcaster */
  web = new Server();
  broadcastFor = new Broadcast();
  broadcastFor.osc = { remoteAddress: '127.0.0.1', remotePort: 5000 };
  if (pauseBroadcasting) console.log('\n\n  Broadcasting is currently paused\n\n');

  
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

  skeleton.update();
  
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

  let isAnimate = false; /* manipulate skeleton-joints algorithmically? */

  if (isAnimate) {
    skeleton.flat['LeftUpLeg'].zRotation = Math.sin(frameCount * 0.01) * 20;
    skeleton.flat['LeftUpLeg'].xRotation = Math.cos(frameCount * 0.1) * 40;

    skeleton.flat['LeftLeg'].zRotation = Math.sin(frameCount * 0.1) * 10;
    skeleton.flat['LeftLeg'].xRotation = Math.cos(frameCount * 0.1) * 10;

    skeleton.flat['RightArm'].zRotation = Math.sin(frameCount * 0.1) * 30;
    skeleton.flat['RightArm'].xRotation = Math.cos(frameCount * 0.1) * 50;
  }
}


function broadcast() {
  web.xyz({ source: skeleton });
  broadcastFor.osc.xyz({ source: skeleton });
  // broadcastFor.osc.xyz({ source: skeleton, range: ['Head', 'LeftHand', 'RightHand', 'Hips'] });
}
