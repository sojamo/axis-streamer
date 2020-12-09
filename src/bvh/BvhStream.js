/**
 * BvhStream
 *
 * Reads bvh data coming from Axis Neuron as bvh-binary
 * format. For the Rotation setting under the Output Format,
 * BvhStream expects coordinates to be in YXZ order.
 *
 * BvhStream by default listens for incoming UDP
 * messages on port 7002.
 *
 */

import BvhConstants from './BvhConstants.js';
import Settings from '../Settings.js';
import { log } from '../Log.js';
import dgram from 'dgram';

export default class BvhStream {
  constructor(options = {}) {
    this.#settings = options.settings || new Settings(Settings.default);
    this.initSocket(options.port || 7002);
    this.#source = options.source || [];
    this.#collect = '';
  }

  initSocket(thePort) {
    // const dgram = require('dgram');
    const client = dgram.createSocket('udp4');
    client.on('error', (err) => {
      log.error(`BvhStream.initSocket: server error ${err.stack}`);
      client.close();
    });

    client.on('message', (msg, rinfo) => {
      this.parseBuffer(msg, rinfo.address);
    });

    client.on('listening', () => {
      const address = client.address();
      log.info(`✓ BvhStream.initSocket: listening for stream from ${address.address}:${address.port}`);
    });

    client.bind(thePort);
  }

  parseBuffer(theData, theIpAddress) {
    /** TODO
     * to avoid parsing conflicts, thsi.#collect should be an
     * associtive array with theIpAddress as key
     */

    let header = theData.readUInt16LE(0);
    let isParse = theData.length === 1024 ? false : true;

    /** NOTE
     * On mac, Axis Neuron sends 2 packets, the first one 1024 bytes long.
     * On PC however, the message fits into 1 packet, 1480 bytes long.
     * the following is a hack to make it work for both.
     *
     * FIX by distinguishing by IP
     *
     * */

    if (header === 56831) {
      this.#collect = Buffer.alloc(0);
      this.#collect = Buffer.concat([this.#collect, theData]);
    } else if (this.#collect !== undefined) {
      this.#collect = Buffer.concat([this.#collect, theData]);
      isParse = true;
    }

    if (isParse) {
      /**
       * We are evaluating against Version 1.1.0.0
       * Axis Neuron User Manual_V3.8.1.5.pdf p.82
       *
       * inside the Axis Neuron app, the output format
       * must be configured for BVH Data as follows:
       * 1. Frequency reducing: ideally is below 1,
       * decent results are still acceptable with
       * 1/4 and even 1/8
       * 2. Rotation: YXZ
       * 3. Displacemen: ticked
       * 4. Reference: not ticked
       */
      const headerToken = this.#collect.readUInt16LE(0); // 56831
      const version = this.#collect.readUInt32BE(2); // 00 00 01 01 = 1.1.0.0
      const dataCount = this.#collect.readUInt16LE(6); // 62 01 = 354
      const withDisp = this.#collect.readInt8(8); // 01
      const withRef = this.#collect.readInt8(9); // 00
      const avatarIndex = this.#collect.readUInt32LE(10); // 00 00 00 00
      const avatarName = this.#collect.subarray(14, 46).toString('ascii', 0, 32);
      const frameIndex = this.#collect.readUInt32LE(46);
      const reserved = this.#collect.readUInt32LE(50);
      const reserved1 = this.#collect.readUInt32LE(54);
      const reserved2 = this.#collect.readUInt32LE(58);
      const bvhHeaderToken2 = this.#collect.readUInt16LE(62); // EE FF = 61183
      const dataLength = dataCount * 4; // each data is 4 bytes
      const data = this.#collect.subarray(64, 64 + dataLength);
      const channels = {};
      let index = 0;

      for (let i = 0; i < dataLength; i += 24) {
        const v = [];
        v.push(data.readFloatLE(i + 0)); // x-pos
        v.push(data.readFloatLE(i + 4)); // y-pos
        v.push(data.readFloatLE(i + 8)); // z-pos
        v.push(data.readFloatLE(i + 12)); // y-rot
        v.push(data.readFloatLE(i + 16)); // x-rot
        v.push(data.readFloatLE(i + 20)); // z-rot
        channels[BvhConstants.skeleton[index]] = v;
        index++;
      }

      /** source is an array of BvhBody(s) */
      this.#source.forEach((body) => {
        log.debug(`
          BvhStream.parseBuffer: 
          id:${body.id}, 
          ip:${body.address}, 
          total number of sources:${this.#source.length}`);

        /** check the incoming data's IP address against the
         * registered IP (as identifier) to then process data.
         */
        // REMINDER: This may have broken the ability for multiple streams to be sent
        if (body.address === theIpAddress) {
          body.processIncomingData({ frameIndex, channels });
        }
      });
    }
  }

  #collect;
  #settings;
  #source;
}
