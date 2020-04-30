import * as osc from "osc";
import * as ws from "ws";


export default class Broadcast {

    #osc
    #ws

    constructor() { }

    set osc(theOptions) {
        this.#osc = new OSC(theOptions);
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
        "Hips": "/hips",
        "RightUpLeg": "/right/up/leg",
        "RightLeg": "/right/leg",
        "RightFoot": "/right/foot",
        "RightFootEnd": "/right/foot/end",
        "LeftUpLeg": "/left/up/leg",
        "LeftLeg": "/left/leg",
        "LeftFoot": "/left/foot",
        "LeftFootEnd": "/left/foot/end",
        "RightShoulder": "/right/shoulder",
        "RightArm": "/right/arm",
        "RightForeArm": "/right/fore/arm",
        "RightHand": "/right/hand",
        "LeftShoulder": "/left/shoulder",
        "LeftArm": "/left/arm",
        "LeftForeArm": "/left/fore/arm",
        "LeftHand": "/left/hand",
        "Head": "/head",
        "HeadEnd": "/head/end",
        "Neck": "/neck",
        "Spine3": "/spine3",
        "Spine2": "/spine2",
        "Spine1": "/spine1",
        "Spine": "/spine",
        "allAbsolute": "/all/absolute",
        "allPositionAbsolute": "/all/position/absolute",
        "positionAbsolute": "/position/absolute",
        "position": "/position",
        "rotation": "/rotation",
    }

    static defaultSkeleton = [
        "Hips",
        "RightUpLeg", "RightLeg", "RightFoot",
        "LeftUpLeg", "LeftLeg", "LeftFoot",
        "RightShoulder", "RightArm", "RightForeArm", "RightHand",
        "LeftShoulder", "LeftArm", "LeftForeArm", "LeftHand",
        "Head", "Neck",
        "Spine3", "Spine2", "Spine1", "Spine"
    ];


    static bvhSkeleton = [
        "Hips",
        "RightUpLeg", "RightLeg", "RightFoot",
        "LeftUpLeg", "LeftLeg", "LeftFoot",
        "Spine", "Spine1", "Spine2", "Spine3", "Neck", "Head",
        "RightShoulder", "RightArm", "RightForeArm",
        "RightHand",
        "RightHandThumb1", "RightHandThumb2", "RightHandThumb3",
        "RightInHandIndex", "RightHandIndex1", "RightHandIndex2", "RightHandIndex3",
        "RightInHandMiddle", "RightHandMiddle1", "RightHandMiddle2", "RightHandMiddle3",
        "RightInHandRing", "RightHandRing1", "RightHandRing2", "RightHandRing3",
        "RightInHandPinky", "RightHandPinky1", "RightHandPinky2", "RightHandPinky3",
        "LeftShoulder", "LeftArm", "LeftForeArm",
        "LeftHand",
        "LeftHandThumb1", "LeftHandThumb2", "LeftHandThumb3",
        "LeftInHandIndex", "LeftHandIndex1", "LeftHandIndex2", "LeftHandIndex3",
        "LeftInHandMiddle", "LeftHandMiddle1", "LeftHandMiddle2", "LeftHandMiddle3",
        "LeftInHandRing", "LeftHandRing1", "LeftHandRing2", "LeftHandRing3",
        "LeftInHandPinky", "LeftHandPinky1", "LeftHandPinky2", "LeftHandPinky3"
    ];

    static jointSequence = [
        "Hips",
        "RightUpLeg", "RightLeg", "RightFoot",
        "LeftUpLeg", "LeftLeg", "LeftFoot",
        "RightShoulder", "RightArm", "RightForeArm", "RightHand",
        "LeftShoulder", "LeftArm", "LeftForeArm", "LeftHand",
        "Head", "Neck",
        "Spine3", "Spine2", "Spine1", "Spine"
    ];
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
    constructor(options) { }
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
        this.#localPort = options.localPort || 5001;
        this.#route = options.route || ((m) => { console.log(m) });

        // TODO 
        // prefix should come from with the skeleton data
        this.#prefix = options.prefix || '/pn/1';

        const _self = this;

        this.#udpPort = new osc.UDPPort({
            localAddress: this.#localAddress,
            localPort: this.#localPort,
            remoteAddress: this.#remoteAddress,
            remotePort: this.#remotePort,
        });

        this.#udpPort.on("ready", () => {
            let ipAddresses = this.getIPAddresses();
            console.log("Listening for OSC over UDP.");
            ipAddresses.forEach((addr) => {
                console.log(" Host:", addr, ", Port:", _self.#udpPort.options.localPort);
            });
        });

        this.#udpPort.on("message", (m) => {
            _self.#route(m);
        });

        this.#udpPort.on("error", (err) => {
            console.log(err);
        });

        this.#udpPort.open();
    }

    sendRaw(address, args, remote, port) {
        this.#udpPort.send({ address, args },
            remote || this.remoteAddress,
            port || this.remotePort
        );
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
        const path = options.isUVW === undefined ? "allPositionAbsolute" : options.isUVW ? "allAbsolute" : "allPositionAbsolute";
        const range = options.range || Broadcast.defaultSkeleton;
        const address = this.#prefix + Broadcast.addressSpace[path];
        const data = options.source !== undefined ? options.source.flat : {};
        const isUVW = options.isUVW || false;
        const args = [];
        range.forEach(el => {
            const joint = data[el];
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
        this.#udpPort.send({ address, args });
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
            isUVW: true
        });
    }

    getIPAddresses() {
        let os = require("os"),
            interfaces = os.networkInterfaces(),
            ipAddresses = [];

        for (let deviceName in interfaces) {
            let addresses = interfaces[deviceName];
            for (let i = 0; i < addresses.length; i++) {
                let addressInfo = addresses[i];
                if (addressInfo.family === "IPv4" && !addressInfo.internal) {
                    ipAddresses.push(addressInfo.address);
                }
            }
        }
        return ipAddresses;
    };

    getAddressFor(theJoint, theType, theValue) {
        let joint = Broadcast.addressSpace[theJoint];
        let type = Broadcast.addressSpace[theType];
        let value = `/${theValue}`;
        // TODO check if joint or type are undefined, then abort
        return this.#prefix + joint + type + value;
    }

    #localAddress
    #localPort
    #prefix
    #remoteAddress
    #remotePort
    #route
    #udpPort

}