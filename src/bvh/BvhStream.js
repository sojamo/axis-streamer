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

import BvhConstants from './BvhConstants';

export default class BvhStream {
  constructor(options = {}) {
    this.initSocket(options.port || 7002);
    this.#source = options.source || [];
    this.#collect = '';
  }

  initSocket(thePort) {
    const dgram = require('dgram');
    const client = dgram.createSocket('udp4');

    client.on('error', (err) => {
      console.log(`server error:\n${err.stack}`);
      client.close();
    });

    client.on('message', (msg, rinfo) => {
      this.parseBuffer(msg);
    });

    client.on('listening', () => {
      const address = client.address();
      console.log(
        `### Listening for \n### BVH stream from Axis Neuron\n### ${address.address}:${address.port}\n`,
      );
    });

    client.bind(thePort);
  }

  parseBuffer(theData) {
    let header = theData.readUInt16LE(0);
    if (header === 56831) {
      this.#collect = Buffer.alloc(0);
      this.#collect = Buffer.concat([this.#collect, theData]);
    } else if (this.#collect !== undefined) {
      this.#collect = Buffer.concat([this.#collect, theData]);
      /**
       * We are evaluating against Version 1.1.0.0
       * Axis Neuron User Manual_V3.8.1.5.pdf p.82
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

      /* source is an array of BvhBody(s) */
      this.#source.forEach((el) => {
        el.processIncomingData({ frameIndex, channels });
      });
    }
  }

  #collect;
  #source;
}
