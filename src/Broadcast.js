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
    this.#remoteAddress = options.remoteAddress || '127.0.0.1';
    this.#remotePort = options.remotePort || 5000;
    this.#localAddress = options.localAddress || '0.0.0.0';
    this.#localPort = options.localPort || 5000;
    this.#route = options.route || ((m) => {});

    const _self = this;
    const group = options.group || [];

    this.#udpPort = new osc.UDPPort({
      localAddress: this.#localAddress,
      localPort: this.#localPort,
      remoteAddress: this.#remoteAddress,
      remotePort: this.#remotePort,
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
      _self.#route(m);
      // extract id from address pattern
      const id = m;
      let body;
      group.forEach((el) => {
        // check if any el matches id
      });
      if (body === undefined) {
        body = new BvhBody(id);
        body.owner = BvhBody.owner.OTHER;
        group.push(body);
      }
    });

    this.#udpPort.on('error', (err) => {
      console.log(err);
    });

    this.#udpPort.open();
  }

  sendRaw(address, args, remote, port) {
    this.#udpPort.send({ address, args }, remote || this.remoteAddress, port || this.remotePort);
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
    const args = [];
    source.forEach((el0) => {
      const id = el0.id;
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

      /* send to default remote address */
      this.#udpPort.send({ address, args });

      /* send to other remotes if available */
      dest.forEach((el) => {
        const remote = el.address || undefined;
        const port = el.port || -1;
        if (remote !== undefined && port !== -1) {
          this.#udpPort.send({ addr, args }, remote, port);
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
  #remoteAddress;
  #remotePort;
  #route;
  #udpPort;
}
