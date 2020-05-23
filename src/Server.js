/**
 * Server
 *
 * runs a http server at default port 5080.
 * uses express to serve and manage pages.
 * socket.io takes care of data streams.
 *
 * https://github.com/socketio/socket.io
 * https://github.com/expressjs/express
 *
 */

import BvhConstants from './bvh/BvhConstants';
import express from 'express';
import path from 'path';
import socket from 'socket.io';

export default class Server {
  #source;
  constructor(options = {}) {
    this.#source = options.source !== undefined ? options.source : [];
    const _self = this;
    const app = express();
    const groupId = 'axis';

    app.use(express.json());
    app.use(express.static(path.join(__dirname, '../public')));

    const server = app.listen(options.port || 5080, () => {
      const port = server.address().port;
      console.log(`### Web Server at\n### http://localhost:${port}\n`);
    });

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

    app.use('/app', express.static(path.join(__dirname, '../../external/app')));

    this.#ws = socket(server);

    this.#ws.sockets.on('connection', (socket) => {
      /**
       * when a client connects it needs to reply with
       * a bvh message to join the bvh group
       */
      socket.on('group', function (theGroupId, theId) {
        socket.join(theGroupId);
        console.log(theId || '?', 'joined group', theGroupId, '\t socket.io id', socket.id);
      });

      socket.on('update', (data) => {
        /* broadcast messages, exclude sender */
        console.log('got update from', socket.id, data);
        socket.in(groupId).broadcast.emit('update', data);
      });
    });
  }

  xyz(options = {}) {
    const range = options.range || BvhConstants.defaultSkeleton;

      const id = el0.id;
      const data = {};
      range.forEach((el1) => {
        const joint = el0.flat[el1];
        if (joint !== undefined) {
          data[el1] = joint.positionAbsolute.xyz;
          if (joint.hasEndPoint === true) {
            data[el1 + 'End'] = joint.endPositionAbsolute.xyz;
          }
        }
      });
      this.#ws.sockets.emit('pn', { id, data });
    });
  }

  #ws;
}
