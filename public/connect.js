function connectAxis(options = {}) {
  const groupId = options.groupId || 'axis';
  const port = options.port || 5080;
  const id = options.id || Math.round(Math.random() * 1000);
  const target =
    options.target ||
    ((d) => {
      console.log(d);
    });
  const isSecure = false;

  /** extract server url */
  const url =
    window.location.hostname === 'localhost'
      ? 'ws://localhost:' + port
      : isSecure
      ? 'wss://' + window.location.hostname + ':' + port
      : 'ws://' + window.location.hostname + ':' + port;

  /** start websocket and connect to url */
  const ws = new WebSocket(url);

  ws.onopen = function () {
    console.log(`opening websocket to ${url}`);

    /** we are expecting arraybuffers, data wrapped into bytes */
    ws.binaryType = 'arraybuffer';
    /**
     * we are using msgpack to serialize
     * and deserialize data and send as bytes, string
     * formated data is ignored on the server.
     */
    ws.send(msgpack.serialize({ address: 'register', args: { id: 'axis-web' } })); /** OK */
    // ws.send({ register: 'abc', id: 123 }); /** ignored */
  };

  /** incoming messages are received here, we expect
   * bytes and not strings. data is deserialised with
   * the msgpack library by https://github.com/ygoe/msgpack.js
   * and must be included locally (on the server).
   */
  ws.onmessage = function (ev) {
    const packet = msgpack.deserialize(ev.data);
    const { address, args } = packet;
    if (address === 'pn') {
      args.forEach((el) => {
        target(el);
      });
    }
    if (address === 'settings') {
      console.log(args);
      document.getElementById('settings-label').innerHTML = args.label;
      document.getElementById('settings-json').innerHTML = JSON.stringify(args.broadcast, null, 2);
    } else {
      /** else we received maybe a system message */
    }
  };
}
