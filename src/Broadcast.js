/**
 * Broadcast
 *
 * https://www.npmjs.com/package/osc
 *
 */
import BvhBody from './bvh/BvhBody';
import * as osc from 'osc';
import * as ws from 'ws';

export default class Broadcast {
  #osc;
  #ws;

  constructor() {}

  set osc(theOptions) {
    this.#osc = new OSC(theOptions);
    console.log(
      `### Setting default OSC remote to\n### ${theOptions.remoteAddress}:${theOptions.remotePort}\n`,
    );
  }

  set ws(theOptions) {
    this.#ws = new WebSocket(theOptions);
  }

  get osc() {
    if (this.#osc === undefined) {
      this.#osc = new OSC({});
    }
    return this.#osc;
  }

  get ws() {
    if (this._ws === undefined) {
      this._ws = new WebSocket({});
    }
    return this.#ws;
  }

  static addressSpace = {
    Hips: '/hips',
    RightUpLeg: '/right/up/leg',
    RightLeg: '/right/leg',
    RightFoot: '/right/foot',
    RightFootEnd: '/right/foot/end',
    LeftUpLeg: '/left/up/leg',
    LeftLeg: '/left/leg',
    LeftFoot: '/left/foot',
    LeftFootEnd: '/left/foot/end',
    RightShoulder: '/right/shoulder',
    RightArm: '/right/arm',
    RightForeArm: '/right/fore/arm',
    RightHand: '/right/hand',
    LeftShoulder: '/left/shoulder',
    LeftArm: '/left/arm',
    LeftForeArm: '/left/fore/arm',
    LeftHand: '/left/hand',
    Head: '/head',
    HeadEnd: '/head/end',
    Neck: '/neck',
    Spine3: '/spine3',
    Spine2: '/spine2',
    Spine1: '/spine1',
    Spine: '/spine',
    allAbsolute: '/all/absolute',
    allPositionAbsolute: '/all/position/absolute',
    positionAbsolute: '/position/absolute',
    position: '/position',
    rotation: '/rotation',
  };
}

/**
 * WebSocket
 *
 * TODO
 *
 * */

class WebSocket {
  // start from here
  // https://floatbug.com/transmitting-osc-data-via-websocket/
  constructor(options) {}
}

/**
 * OSC
 *
 * implements https://github.com/colinbdclark/osc.js
 *
 * TODO
 * 1. broadcast to multiple IPs and ports.
 * remoteAddress should be array? and remotePort, too?
 * or a remote class/object {address: '127.0.0.1', port:5000} ?
 * 2. defaultSkeleton, send as blob?
 *
 * */

class OSC {
  constructor(options) {
    this.#localAddress = options.localAddress || '0.0.0.0';
    this.#localPort = options.localPort || 5000;
    this.#route = options.route || ((m) => {});

    const _self = this;
    const entities = options.source || [];

    this.#udpPort = new osc.UDPPort({
      localAddress: this.#localAddress,
      localPort: this.#localPort,
    });

    this.#udpPort.on('ready', () => {
      let ipAddresses = this.getIPAddresses();
      const out = [];
      ipAddresses.forEach((addr, i) => {
        out.push([addr, _self.#udpPort.options.localPort]);
      });
      console.table(out);
    });

    this.#udpPort.on('message', (m) => {
      return;

      // TODO explain how route works.
      // A route is responsible for forwarding incoming
      // messages to other connected clients.
      // A route needs to be specified when instance
      // of OSC is created.
      _self.#route(m);

      /* extract id from address pattern */
      const id = m.address.match(/\/(\d+)/)[1];
      console.log('got message from', id, 'total registered bodies:', entities.length);

      let body;

      entities.some((el) => {
        /* check if a body matches the id received */
        const isMatch = el.id === id;
        if (isMatch) {
          body = el;
        }
        return isMatch;
      });

      if (body === undefined) {
        body = new BvhBody(id);
        body.owner = BvhBody.owner.OTHER;
        entities.push(body);
      }

      // console.log('Amount of BvhBody registered:', group.length);
    });

    this.#udpPort.on('error', (err) => {
      console.log(err);
      //
      // TODO when receiving an (or after receiving multiple
      // for some time) error message, filter out address and
      // port and ignore when sending unless remote is available
      // again (periodically check after lost connection, or
      // get the remote to send a activate-request or ping, etc.
      // to re-activate broadcasting)
      //
      // Error: send EHOSTDOWN 192.168.195.50:5000
      // at doSend (dgram.js:681:16)
      // at defaultTriggerAsyncIdScope (internal/async_hooks.js:313:12)
      // at afterDns (dgram.js:627:5)
      // at processTicksAndRejections (internal/process/task_queues.js:85:21) {
      // errno: -64,
      // code: 'EHOSTDOWN',
      // syscall: 'send',
      // address: '192.168.195.50',
      // port: 5000
      // }
    });

    this.#udpPort.open();
  }

  sendRaw(address, args, dest = []) {
    dest.forEach((el) => {
      this.#udpPort.send({ address, args }, el.address, el.port);
    });
  }

  /**
   * xyz
   * by default sends absolute xyz coordinates
   * stored in a single message and a single
   * list of floats:
   * xyzxyzxyz ...
   * [1][2][3] ...
   * when angles are included, options.isUVW must be true,
   * then the sequence looks like:
   * xyzuvwxyzuvwxyzuvw ...
   * [ 1  ][ 2  ][ 3  ]
   * the receiver must parse and route assign
   * coordinates accordingly.
   *
   * @param {*} options
   *
   */
  xyz(options = {}) {
    /* destination specific */
    const dest = options.dest || [];

    /* data specific */
    const path =
      options.isUVW === undefined
        ? 'allPositionAbsolute'
        : options.isUVW
        ? 'allAbsolute'
        : 'allPositionAbsolute';
    const range = options.range || BvhBody.defaultSkeleton;
    const source = options.source !== undefined ? options.source : [];
    const isUVW = options.isUVW || false;

    source.forEach((el0) => {
      const id = el0.id;
      const args = [];
      const address = this.getPrefix(id) + Broadcast.addressSpace[path];
      range.forEach((el1) => {
        const joint = el0.flat[el1];
        if (joint !== undefined) {
          args.push({ type: 'f', value: joint.positionAbsolute.x });
          args.push({ type: 'f', value: joint.positionAbsolute.y });
          args.push({ type: 'f', value: joint.positionAbsolute.z });
          if (isUVW) {
            args.push({ type: 'f', value: joint.rotation.x });
            args.push({ type: 'f', value: joint.rotation.y });
            args.push({ type: 'f', value: joint.rotation.z });
          }
          if (joint.hasEndPoint === true) {
            args.push({ type: 'f', value: joint.endPositionAbsolute.x });
            args.push({ type: 'f', value: joint.endPositionAbsolute.y });
            args.push({ type: 'f', value: joint.endPositionAbsolute.z });
            if (isUVW) {
              args.push({ type: 'f', value: joint.rotation.x });
              args.push({ type: 'f', value: joint.rotation.y });
              args.push({ type: 'f', value: joint.rotation.z });
            }
          }
        }
      });

      /* send to other remote desitnations if available */
      dest.forEach((el) => {
        const remote = el.address || undefined;
        const port = el.port || -1;
        if (remote !== undefined && port !== -1) {
          this.#udpPort.send({ address, args }, remote, port);
        }
      });
    });
  }

  getPrefix(theId) {
    return `/pn/${theId}`;
  }

  /**
   * xyzuvw
   * like xyz, function xyzuvw sends absolute
   * coordinates as well as (and followed by) rotation
   * angles in degrees. function xyz will do the job
   * by putting together the OSC message.
   *
   * @param {*} options
   *
   */

  xyzuvw(options = {}) {
    this.xyz({
      source: options.source || {},
      range: options.range || Broadcast.defaultSkeleton,
      isUVW: true,
      dest: options.dest || [],
    });
  }

  getIPAddresses() {
    let os = require('os'),
      interfaces = os.networkInterfaces(),
      ipAddresses = [];

    for (let deviceName in interfaces) {
      let addresses = interfaces[deviceName];
      for (let i = 0; i < addresses.length; i++) {
        let addressInfo = addresses[i];
        if (addressInfo.family === 'IPv4' && !addressInfo.internal) {
          ipAddresses.push(addressInfo.address);
        }
      }
    }
    return ipAddresses;
  }

  #localAddress;
  #localPort;
  #route;
  #udpPort;
}
