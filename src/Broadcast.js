/**
 * Broadcast
 *
 * https://www.npmjs.com/package/osc
 *
 */

import BvhBody from './bvh/BvhBody';
import BvhParser from './bvh/BvhParser';
import BvhConstants from './bvh/BvhConstants';
import WebInterface from './WebInterface';
import * as osc from 'osc';
import { log } from './Log';
import Settings from './Settings';

export default class Broadcast {
  #osc;
  #settings;
  #source;
  #ws;

  constructor(options) {
    this.#source = options.source || [];
    this.#settings = options.settings || {};
  }

  set osc(options) {
    options.source = options.source || this.#source;
    options.settings = options.settings || this.#settings;
    this.#osc = new OSC(options);
  }

  get osc() {
    if (this.#osc === undefined) {
      this.#osc = new OSC({ source: this.#source, settings: this.#settings });
    }
    return this.#osc;
  }

  set ws(options) {
    options.source = options.source || this.#source;
    options.settings = options.settings || this.#settings;
    this.#ws = new WS(options);
  }

  get ws() {
    if (this.#ws === undefined) {
      this.#ws = new WS({ source: this.#source, settings: this.#settings });
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

class WS {
  constructor(options) {
    this.#source = options.source || []; /* ref to array that stores BvhBody(s) in main script */
    this.#settings = options.settings || {};

    const _self = this;

    /**
     * TODO
     * glitch.com currently does not allow nodejs websockets
     * to connect, see issue https://support.glitch.com/t/nodejs-websocket-server/26570/4
     * and https://glitch.com/edit/#!/ws-client-issue
     *
     * in case issue remains, try heroku
     * https://devcenter.heroku.com/articles/node-websockets
     *
     */

    /**
     * NOTE
     * the ? below refers to optional chaining
     * see https://github.com/tc39/proposal-optional-chaining
     * */

    if (this.#settings.get.broadcast?.web?.active || false) {
      const host = 'axis-online.glitch.me';
      const url = 'wss://' + host;
      const WebSocket = require('ws'); /** https://github.com/websockets/ws */

      this.#socket = new WebSocket(url);

      this.#socket.onopen = () => {
        /** TODO send msgpack formatted hello-message to initiate communication */
        log.info(`Broadcast.socket.onopen: connection to ${host} established.`);
        this.#socket.send('hello from axis-streamer');
        setInterval(() => {
          _self.publish();
        }, 100);
      };

      this.#socket.onmessage = (message) => {
        console.log(`message received ${message.data}`);
        log.debug(`message received ${message.data}`);
      };

      this.#socket.onerror = (err) => {
        log.warn(`Broadcast.ws: can't establish connection with ${err.target.url}, host might be down? ${err.message}`);
      };
    } else {
      log.info(`⍻ Broadcast.ws: sending data to remote server not active`);
    }
  }

  publish(options = {}) {
    // const range = BvhConstants.defaultSkeleton;
    const range = BvhConstants.reducedSkeleton;

    this.#source.forEach((body) => {
      const id = body.id;
      const data = WebInterface.getJsonFor(body, range);
      // this.#ws.sockets.emit('pn', { id, data });
      // this.#socket.send(JSON.stringify(data));

      Object.keys(data).forEach((key) => {
        const x = Number(data[key][0].toFixed(1));
        const y = Number(data[key][1].toFixed(1));
        const z = Number(data[key][2].toFixed(1));
        data[key] = [x, y, z];
      });
      log.info(`Broadcast.ws sending to websocket, data-length: ${JSON.stringify(data).length}`);
      /**
       * TODO: use messagepack to serialize JSON
       * https://github.com/ygoe/msgpack.js
       */
      if (id === 0) {
        this.#socket.send(JSON.stringify({ id, data }));
      }
    });
  }

  #settings;
  #socket;
  #source;
}

/**
 * OSC
 *
 * implements https://github.com/colinbdclark/osc.js
 *
 */

class OSC {
  constructor(options) {
    /**
     * this.#settings should exist at this point, creating
     * a new instance of Settings in the following case is to
     * prevent errors and Settings are set to the default Settings.
     */
    this.#settings = options.settings || new Settings(Settings.default);
    this.#source = options.source || []; /** ref to array that stores BvhBody(s) in main script */
    (async () => {
      return BvhParser.build();
    })().then((parser) => this.#init(parser));
  }

  #init(parser) {
    const _self = this;

    /** start OSC over UDP */
    this.#udpPort = new osc.UDPPort({
      localAddress: this.#settings.get.general.osc.address || '0.0.0.0',
      localPort: this.#settings.get.general.osc.port || 5000,
    });
    this.#udpPort.on('ready', () => {
      let ipAddresses = this.getIPAddresses();
      const inet = [` 0.0.0.0`, ` 127.0.0.1`];
      ipAddresses.forEach((addr, i) => {
        inet.push(` ${addr}`);
      });
      log.info(`Broadcast.osc.init: available NetInterfaces:${inet}`);
      log.info(`Broadcast.osc.init: using NetInterface: ${this.#udpPort.options.localAddress}`);
    });

    /** when a message is received */
    this.#udpPort.on('message', (m, time, rinfo) => {
      /** check if we are dealing with the right address space
       * address pattern must begin with /pn/ */
      if (m.address.startsWith('/pn/') === false) {
        if (m.address.startsWith('/subscribe')) {
          /** TODO let client register and add itself to settings.get.broadcast.osc */

          log.debug('message from:');
          log.debug(rinfo);
          log.debug(this.#settings.get.broadcast.osc);
        }

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
      log.debug(`got message from id ${id} @ ${remoteAddress} registered bodies: ${n}`);

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
      log.warn(`OSC destination not available ${err.address}`);
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
      log.debug(`Broadcast.osc.parseIncomingDataFor: parsing ${theAddressPattern} for body-id ${theBody.id}`);

      for (let i = 0, n = 0; i < theArgs.length; i += 3, n += 1) {
        /**
         * parse and assign absolute positions to body joints,
         * this will not calculate relative position nor rotation,
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
      log.debug(`Broadcast.osc.parseIncomingDataFor: received data for  ${theAddressPattern}`);
    }
  }

  sendRaw(address, args, dest = []) {
    dest.forEach((destination) => {
      this.#udpPort.send({ address, args }, destination.address, destination.port);
    });
  }

  /**
   * send
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
   * @param {*} settings
   *
   */

  publish(settings = {}) {
    /* destination specific */
    const destinations = settings.get.broadcast.osc || [];
    destinations
      .filter((destination) => destination.active)
      .forEach((destination) => {
        /** compose arguments for osc message */
        this.#source.forEach((source) => {
          const id = source.id;
          let isRequested = true;
          if (Array.isArray(destination.requestById)) {
            isRequested = destination.requestById.includes(id);
          }

          /** only send messages for body-id's that have specifically
           * been requested (or if request field is undefined). */

          if (isRequested) {
            const oscMessage = this.composeOscMessageFor(id, source, destination);
            /** send osc message to remote destination */
            const message = oscMessage.message;
            const addr = message.address;
            /** first send out single multi-args messages */
            this.#udpPort.send(message, destination.address, destination.port);
            /** then send out single single-arg messages (to unreal) */
            oscMessage.splitMessages.forEach((message) => {
              this.#udpPort.send(message, destination.address, destination.port);
            });
          }
        });
      });
  }

  composeOscMessageFor(id, source, dest = {}) {
    /**
     * there are currently 2 formats xyz and xyzuvw in which data can be sent.
     * xyz will include the absolute position for each joint, xyzuvw will add
     * the rotation angle the data of a joint.
     */
    const isRotationIncluded = dest.format !== undefined ? dest.format === 'xyzuvw' : false;

    /** prepare the address pattern for the OscMessage according to the data format */
    const path = isRotationIncluded ? Broadcast.addressSpace.allAbsolute : Broadcast.addressSpace.allPositionAbsolute;

    /** check if a range of joints is specified, otherwise use the default range */
    const range = dest.range || BvhConstants.defaultSkeleton;
    const isSplit = dest.split || false;
    const splitMessages = [];
    const oscArguments = [];
    const oscAddressPattern = this.getPrefix(id) + path;

    range.forEach((el1) => {
      const joint = source.flat[el1];
      if (joint !== undefined) {
        const x = joint.positionAbsolute.x;
        const y = joint.positionAbsolute.y;
        const z = joint.positionAbsolute.z;

        oscArguments.push({ type: 'f', value: x });
        oscArguments.push({ type: 'f', value: y });
        oscArguments.push({ type: 'f', value: z });

        if (isSplit) {
          const addr = `/pn/${id}${Broadcast.addressSpace[el1]}${Broadcast.addressSpace.positionAbsolute}`;
          splitMessages.push({ address: `${addr}/x`, args: { type: 'f', value: x } });
          splitMessages.push({ address: `${addr}/y`, args: { type: 'f', value: y } });
          splitMessages.push({ address: `${addr}/z`, args: { type: 'f', value: z } });
        }
        if (isRotationIncluded) {
          const u = joint.rotation.x;
          const v = joint.rotation.y;
          const w = joint.rotation.z;

          oscArguments.push({ type: 'f', value: u });
          oscArguments.push({ type: 'f', value: v });
          oscArguments.push({ type: 'f', value: w });

          if (isSplit) {
            const addr = `/pn/${id}${Broadcast.addressSpace[el1]}${Broadcast.addressSpace.rotation}`;
            splitMessages.push({ address: `${addr}/x`, args: { type: 'f', value: u } });
            splitMessages.push({ address: `${addr}/y`, args: { type: 'f', value: v } });
            splitMessages.push({ address: `${addr}/z`, args: { type: 'f', value: w } });
          }
        }
        if (joint.hasEndPoint) {
          const x = joint.endPositionAbsolute.x;
          const y = joint.endPositionAbsolute.y;
          const z = joint.endPositionAbsolute.z;

          oscArguments.push({ type: 'f', value: x });
          oscArguments.push({ type: 'f', value: y });
          oscArguments.push({ type: 'f', value: z });
          if (isSplit) {
            const addr = `/pn/${id}${Broadcast.addressSpace[`${el1}End`]}${Broadcast.addressSpace.positionAbsolute}`;

            splitMessages.push({ address: `${addr}/x`, args: { type: 'f', value: x } });
            splitMessages.push({ address: `${addr}/y`, args: { type: 'f', value: y } });
            splitMessages.push({ address: `${addr}/z`, args: { type: 'f', value: z } });
          }
          if (isRotationIncluded) {
            const u = joint.rotation.x;
            const v = joint.rotation.y;
            const w = joint.rotation.z;

            oscArguments.push({ type: 'f', value: u });
            oscArguments.push({ type: 'f', value: v });
            oscArguments.push({ type: 'f', value: w });

            if (isSplit) {
              const addr = `/pn/${id}${Broadcast.addressSpace[`${el1}End`]}${Broadcast.addressSpace.rotation}`;
              splitMessages.push({ address: `${addr}/x`, args: { type: 'f', value: u } });
              splitMessages.push({ address: `${addr}/y`, args: { type: 'f', value: v } });
              splitMessages.push({ address: `${addr}/z`, args: { type: 'f', value: w } });
            }
          }
        }
      }
    });
    const message = { address: oscAddressPattern, args: oscArguments };
    return { message, splitMessages };
  }

  getPrefix(theId) {
    return `/pn/${theId}`;
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

  #settings;
  #source;
  #udpPort;
}
