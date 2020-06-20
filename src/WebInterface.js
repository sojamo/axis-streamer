/**
 * Server
 *
 * runs a http server at default port 5080.
 * uses express to serve and manage pages.
 * ws takes care of websocket data streams
 * which are packed into bytearrays using
 * msgpack by ygoe.
 *
 * https://github.com/expressjs/express
 * https://github.com/ygoe/msgpack.js
 * https://www.npmjs.com/package/ws
 * https://github.com/websockets/ws/blob/HEAD/doc/ws.md
 *
 *
 */

import BvhConstants from './bvh/BvhConstants';
import express from 'express';
import path from 'path';
import msgpack from '@ygoe/msgpack';
import * as WebSocket from 'ws';
import * as http from 'http';
import { log } from './Log';

export default class WebInterface {
  #settings;
  #source;

  constructor(options = {}) {
    this.#source = options.source !== undefined ? options.source : [];
    this.#settings = options.settings || {};

    const _self = this;
    const app = express();

    /** TODO check if this.#settings is valid and not empty. */
    const publicDir = path.join(__dirname, '../', this.#settings.get.server.web.path.public);
    const appDir = path.join(__dirname, '../', this.#settings.get.server.web.path.app);

    app.use(express.json());
    app.use(express.static(publicDir));

    const server = http.createServer(app);

    /**
     * In order to develop custom web-apps, a folder outside the
     * project folder is reserved (if it doesn't exist, create
     * folder external/app next to the repo folder axis-streamer).
     *
     * axis-streamer/
     * external/
     * ├── app/
     * ├── storage/
     *
     * All external web-apps can be stored, hosted and accessed there
     * by requesting http://localhost:5080/app
     *
     */

    app.use('/app', express.static(appDir));

    this.#ws = new WebSocket.Server({ server });

    this.#ws.on('connection', (ws) => {
      const bytes = msgpack.serialize({ address: 'settings', args: _self.#settings.get });
      ws.send(bytes);

      ws.isAlive = true;
      ws.on('pong', () => {
        ws.isAlive = true;
      });

      const addr = ws._socket.remoteAddress.replace('::ffff:', '');
      const port = ws._socket.remotePort;
      log.info(`WebInterface: new connection from ${addr}:${port} (${_self.#ws.clients.size})`);

      ws.on('message', (m) => {
        try {
          const result = msgpack.deserialize(m);
          log.debug(`WebInterface: received from ${addr}:${port} ${JSON.stringify(result)}`);
        } catch (err) {
          log.warn(`WebInterface: not able to deserialize message from ${addr}:${port}`);
        }
      });

      ws.on('close', (m) => {
        log.info(`WebInterface: connection closed by ${addr}:${port} (${_self.#ws.clients.size})`);
        return ws.terminate;
      });
    });

    const heartbeat = setInterval(() => {
      _self.#ws.clients.forEach(function each(ws) {
        if (ws.isAlive === false) {
          console.log('connection list ' + ws + 'terminating.');
          return ws.terminate();
        }
        ws.isAlive = false;
        ws.ping(() => {});
      });
    }, 1000);

    this.#ws.on('close', () => {
      clearInterval(heartbeat);
    });

    server.listen(options.port || 5080, () => {
      const port = server.address().port;
      log.info(`WebInterface: starting web-server at http://0.0.0.0:${port}`);
    });
  }

  send(settings = {}) {
    const range = settings.get.server.web.range || BvhConstants.defaultSkeleton;
    const packet = { address: 'pn', args: [] };

    /** collect all data from sources */
    this.#source.forEach((body) => {
      const id = body.id;
      const data = WebInterface.getJsonFor(body, range);
      packet.args.push({ id, data });
    });

    /** pack data */
    const bytes = msgpack.serialize(packet);

    /** send data to all connected clients */
    this.#ws.clients.forEach((client) => {
      client.send(bytes);
    });
  }

  static getJsonFor(theBody, theRange) {
    const data = {};
    theRange.forEach((el) => {
      const joint = theBody.flat[el];
      if (joint !== undefined) {
        data[el] = joint.positionAbsolute.xyz;
        if (joint.hasEndPoint === true) {
          data[el + 'End'] = joint.endPositionAbsolute.xyz;
        }
      }
    });
    return data;
  }

  #ws;
}
