

function connectAxis(options = {}) {
    
    const groupId = options.groupId || 'axis';
    const port = options.port || 5080;
    const id = options.id || Math.round(Math.random() * 1000);
    const target = options.target || ((d) => {console.log(d);});
    const isSecure = false;
    
    /* extract server url */
    const url = window.location.hostname === 'localhost'
        ? 'http://localhost:' + port
        : isSecure
            ? 'https://' + window.location.hostname + ':' + port
            : 'http://'  + window.location.hostname + ':' + port;


    /* get the socket started and connect to the server. */
    const socket = io.connect(url);
    socket.on('connect', () => {
        console.log('Connecting client with', id, 'to group', groupId, 'at', url);
        socket.emit('group', groupId, id);
    });

    socket.on('pn', target);
}