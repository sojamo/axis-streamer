/**
 * Broadcast
 *
 * https://www.npmjs.com/package/osc
 *
 */

import BvhBody from './bvh/BvhBody';
import BvhParser from './bvh/BvhParser';
import BvhConstants from './bvh/BvhConstants';
import * as osc from 'osc';

export default class Broadcast {
  #osc;
  #source;

  constructor(options) {
    this.#source = options.source || [];
  }

  set osc(options) {
    options.source = options.source || this.#source;
    this.#osc = new OSC(options);
  }

  get osc() {
    if (this.#osc === undefined) {
      this.#osc = new OSC({ source: this.#source });
    }
    return this.#osc;
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
    this.#source = options.source || []; /* ref to array that stores BvhBody(s) in main script */
    (async () => {
      return BvhParser.build();
    })().then((parser) => this.#init(parser));
  }

  #init(parser) {
    const _self = this;

    /** start OSC over UDP */
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

    /** when a message is received */
    this.#udpPort.on('message', (m, time, rinfo) => {
      /** check if we are dealing with the right address space
       * address pattern must begin with /pn/ */
      if (m.address.startsWith('/pn/') === false) {
        return;
      }

      // TODO explain how route works.
      // A route is responsible for forwarding incoming
      // messages to other connected clients.
      // A route needs to be specified when instance
      // of OSC is created.

      // _self.#route(m);

      /* extract id from address pattern */
      const regex0 = /\/(\d+)/;
      const r0 = m.address.match(regex0);
      const id = parseInt(r0[1]);

      /** parse address pattern, we are looking for the part
       * of the address after the id */
      var regex1 = new RegExp(r0[0] + '(.+)');
      const r1 = regex1.exec(m.address);
      const addressPattern = r1[1];

      /** get the remote IP address and assign to BvhBody */
      const remoteAddress = rinfo.address;
      const n = this.#source.length;
      // console.log(`got message from id ${id} @ ${remoteAddress} registered bodies: ${n}`);

      let body;

      /* check if a body matches the id received */
      this.#source.some((el) => {
        const isMatch = el.id === id;
        if (isMatch) {
          body = el;
        }
        return isMatch;
      });

      /** if we received an unknown body-id, we create
       * a new body-entity */
      if (body === undefined) {
        body = parser.fromTemplate({ id });
        body.owner = BvhBody.owner.OTHER;
        body.ip = remoteAddress;
        this.#source.push(body);
      }

      /** now forward message details for parsing */
      _self.parseIncomingDataFor(body, addressPattern, m.args);
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

  parseIncomingDataFor(theBody, theAddressPattern, theArgs) {
    if (theAddressPattern.endsWith(Broadcast.addressSpace.allPositionAbsolute)) {
      // console.log('parsing', theAddressPattern, 'for body-id', theBody.id);

      for (let i = 0, n = 0; i < theArgs.length; i += 3, n += 1) {
        /**  parse and assign absolute positions to body joints,
         *  this will not calcualte relative position nor rotation,
         * but will only update absolute position.
         */

        const v = { x: theArgs[i], y: theArgs[i + 1], z: theArgs[i + 2] };
        const jointName = BvhConstants.jointSequence[n];

        if (jointName.endsWith('End') === false) {
          theBody.flat[jointName].positionAbsolute = v;
        } else {
          // TODO
        }
      }
    } else {
      // TODO
      // check address pattern, extract jointName, and assign to theBody.flat[jointName]
      console.log('received data for', theAddressPattern);
    }
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
    let range = options.range || BvhConstants.defaultSkeleton;
    range = range.length === 0 ? BvhConstants.defaultSkeleton : range;

    const isUVW = options.isUVW || false;
    const isSplit = options.split || false;

    this.#source.forEach((el0) => {
      const id = el0.id;
      const args = [];
      const address = this.getPrefix(id) + Broadcast.addressSpace[path];
      const split = [];
      range.forEach((el1) => {
        const joint = el0.flat[el1];
        if (joint !== undefined) {
          const x = joint.positionAbsolute.x;
          const y = joint.positionAbsolute.y;
          const z = joint.positionAbsolute.z;

          args.push({ type: 'f', value: x });
          args.push({ type: 'f', value: y });
          args.push({ type: 'f', value: z });

          if (isSplit === true) {
            const addr = `/pn/${id}${Broadcast.addressSpace[el1]}${Broadcast.addressSpace.positionAbsolute}`;
            split.push({ address: `${addr}/x`, args: { type: 'f', value: x } });
            split.push({ address: `${addr}/y`, args: { type: 'f', value: y } });
            split.push({ address: `${addr}/z`, args: { type: 'f', value: z } });
          }
          if (isUVW) {
            const u = joint.rotation.x;
            const v = joint.rotation.y;
            const w = joint.rotation.z;

            args.push({ type: 'f', value: u });
            args.push({ type: 'f', value: v });
            args.push({ type: 'f', value: w });

            if (isSplit === true) {
              const addr = `/pn/${id}${Broadcast.addressSpace[el1]}${Broadcast.addressSpace.rotation}`;
              split.push({ address: `${addr}/x`, args: { type: 'f', value: u } });
              split.push({ address: `${addr}/y`, args: { type: 'f', value: v } });
              split.push({ address: `${addr}/z`, args: { type: 'f', value: w } });
            }
          }
          if (joint.hasEndPoint === true) {
            const x = joint.endPositionAbsolute.x;
            const y = joint.endPositionAbsolute.y;
            const z = joint.endPositionAbsolute.z;

            args.push({ type: 'f', value: x });
            args.push({ type: 'f', value: y });
            args.push({ type: 'f', value: z });
            if (isSplit === true) {
              const addr = `/pn/${id}${Broadcast.addressSpace[`${el1}End`]}${
                Broadcast.addressSpace.positionAbsolute
              }`;

              split.push({ address: `${addr}/x`, args: { type: 'f', value: x } });
              split.push({ address: `${addr}/y`, args: { type: 'f', value: y } });
              split.push({ address: `${addr}/z`, args: { type: 'f', value: z } });
            }
            if (isUVW) {
              const u = joint.rotation.x;
              const v = joint.rotation.y;
              const w = joint.rotation.z;

              args.push({ type: 'f', value: u });
              args.push({ type: 'f', value: v });
              args.push({ type: 'f', value: w });

              if (isSplit === true) {
                const addr = `/pn/${id}${Broadcast.addressSpace[`${el1}End`]}${
                  Broadcast.addressSpace.rotation
                }`;
                split.push({ address: `${addr}/x`, args: { type: 'f', value: u } });
                split.push({ address: `${addr}/y`, args: { type: 'f', value: v } });
                split.push({ address: `${addr}/z`, args: { type: 'f', value: w } });
              }
            }
          }
        }
      });

      /* send to other remote desitnations if available */
      dest.forEach((destination) => {
        const remote = destination.address || undefined;
        const port = destination.port || -1;
        if (remote !== undefined && port !== -1) {
          this.#udpPort.send({ address, args }, remote, port);
          split.forEach((message) => {
            this.#udpPort.send(message, remote, port);
          });
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
      range: options.range || BvhConstants.defaultSkeleton,
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
  #source;
  #udpPort;
}
