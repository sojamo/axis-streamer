/**
 * BvhParser
 *
 * Code adapted from Processing code hosted at
 * https://github.com/perfume-dev/example-processing/tree/master/p5f_sample
 *
 * Parses .bvh structures from a file by going
 * through structure and frame data line by line.
 *
 * The frames included at the end of the .bvh file are
 * expected to be in position-XYZ and rotation YXZ order.
 *
 *
 */

import BvhBody from './BvhBody';
import BvhJoint from './BvhJoint';
import { promisify } from 'util';
import * as fs from 'fs';

export default class BvhParser {
  #template;

  static async build(options = {}) {
    /** default template .bvh file */
    const file = options.file || './assets/test.bvh';

    /** async read file */
    const pReadFile = promisify(fs.readFile);
    const result = { template: '' };
    await pReadFile(file, 'utf8').then((theResult) => {
      result.template = theResult;
    });
    /** return a new parser with file-data read */
    return new BvhParser(result);
  }

  constructor(options = {}) {
    /**
     * NOTE
     * if new BvhParser was created from BvhParser.build(),
     * template will be set to text read from .bvh file.
     * In the future we will not have to read the
     * template-file again, hence, we wont' run into
     * run-time Promise conflict (@ OSC on message)
     */
    this.#template = options.template || '';
  }

  fromTemplate(options = {}) {
    const id = options.id === undefined ? 1 : options.id;
    const body = new BvhBody(id);
    BvhParser.parse({
      body,
      read: this.#template.split(/[\r\n]+/g),
      currentLine: 1,
      currentJoint: undefined,
      lines: [],
    });
    body.flatten();
    return body;
  }

  static async readFile(options = {}) {
    const id = options.id === undefined ? 1 : options.id;
    /** NOTE: || value OR default (options.id || 1) will not
     * work if we expect 0 as value.
     */

    const file = options.file || './assets/test.bvh';
    const pReadFile = promisify(fs.readFile);
    const body = new BvhBody(id);

    await pReadFile(file, 'utf8').then((theResult) => {
      BvhParser.parse({
        body,
        read: theResult.split(/[\r\n]+/g),
        currentLine: 1,
        currentJoint: undefined,
        lines: [],
      });
      body.flatten();
    });
    return body;
  }

  static parse(args) {
    args.lines = [];
    args.read.forEach((el, i) => {
      args.lines.push(new BvhLine(el));
    });

    // theBody.#currentLine = 1;
    args.body.root = BvhParser.parseJoint(args);

    if (args.body.center === true) {
      args.body.rootJoint.xOffset = 0;
      args.body.rootJoint.yOffset = 0;
      args.body.rootJoint.zOffset = 0;
    }
    BvhParser.parseFrames(args);
  }

  static parseJoint(args) {
    let jointName = args.lines[args.currentLine].jointName; // 1
    let joint = new BvhJoint({
      joint: args.currentJoint,
      id: args.body.id,
      name: jointName,
    });
    args.body.joints.push(joint);

    // +2 OFFSET
    args.currentLine++; // 2 {
    args.currentLine++; // 3 OFFSET
    joint.xOffset = args.lines[args.currentLine].xOffset;
    joint.yOffset = args.lines[args.currentLine].yOffset;
    joint.zOffset = args.lines[args.currentLine].zOffset;

    // +3 CHANNELS
    args.currentLine++;
    joint.nbChannels = args.lines[args.currentLine].nbChannels;
    joint.channels = args.lines[args.currentLine].channelsProps;

    // +4 JOINT or End Site or }
    args.currentLine++;
    while (args.currentLine < args.lines.length) {
      let lineType = args.lines[args.currentLine].lineType;

      if (BvhLine.JOINT === lineType) {
        // JOINT or ROOT
        let child = BvhParser.parseJoint(args); // generate new BvhJOINT
        child.parent = joint;
        joint.children.push(child);
      } else if (BvhLine.END_SITE === lineType) {
        args.currentLine++; // {
        args.currentLine++; // OFFSET
        joint.xEndOffset = args.lines[args.currentLine].xOffset;
        joint.yEndOffset = args.lines[args.currentLine].yOffset;
        joint.zEndOffset = args.lines[args.currentLine].zOffset;
        args.currentLine++; //}
        args.currentLine++; //}
        return joint;
      } else if (BvhLine.BRACE_CLOSED === lineType) {
        return joint; //}
      }
      args.currentLine++;
    }
    log.warn(
      `BvhParser.parseJoint: Something strange happend while parsing BVH data. Wrong format?`,
    );
    return joint;
  }

  static parseFrames(args) {
    let currentLine = args.currentLine;

    for (; currentLine < args.lines.length; currentLine++) {
      if (args.lines[currentLine].lineType === BvhLine.MOTION) {
        break;
      }
    }

    if (args.lines.length > currentLine) {
      currentLine++; //Frames
      args.body.nbFrames = args.lines[currentLine].nbFrames;
      currentLine++; //FrameTime
      args.body.frameTime = args.lines[currentLine].frameTime;
      currentLine++;
      args.body.frames = [];
      for (; currentLine < args.lines.length; currentLine++) {
        args.body.frames.push(args.lines[currentLine].frames);
      }
    }
  }
}

/*
 * BvhLine
 *
 * A sub-class to read and store single lines
 * when read from the source .bvh file.
 *
 */

class BvhLine {
  constructor() {
    this.#lineString = '';
    this.#lineType = '';

    if (arguments.length === 1) {
      this.parse(arguments[0]);
    }
  }

  parse(theLineString) {
    this.#lineString = theLineString.trim();
    let s = this.#lineString.split(' ');
    this.#lineType = this.parseLineType(s);

    if (BvhLine.HIERARCHY === this.#lineType) {
      return;
    } else if (BvhLine.JOINT === this.#lineType) {
      this.#jointType = s[0] === 'ROOT' ? BvhLine.JOINT_TYPE_ROOT : BvhLine.JOINT_TYPE_JOINT;
      this.#jointName = s[1];
      return;
    } else if (BvhLine.OFFSET === this.#lineType) {
      this.#xOffset = parseFloat(s[1]);
      this.#yOffset = parseFloat(s[2]);
      this.#zOffset = parseFloat(s[3]);
      return;
    } else if (BvhLine.CHANNELS === this.#lineType) {
      this.#nbChannels = Number(s[1]);
      this.#channelsProps = [];
      for (let i = 0; i < this.#nbChannels; i++) {
        this.#channelsProps.push(s[i + 2]);
      }
      return;
    } else if (BvhLine.FRAMES === this.#lineType) {
      this.#nbFrames = Number(s[1]);
      return;
    } else if (BvhLine.FRAME_TIME === this.#lineType) {
      this.#frameTime = parseFloat(s[2]);
      return;
    } else if (BvhLine.FRAME === this.#lineType) {
      this.#frames = [];
      s.forEach((el) => {
        this.#frames.push(parseFloat(el));
      });
      return;
    } else if (
      BvhLine.END_SITE === this.#lineType ||
      BvhLine.BRACE_OPEN === this.#lineType ||
      BvhLine.BRACE_CLOSED === this.#lineType ||
      BvhLine.MOTION === this.#lineType
    ) {
      return;
    }
  }

  parseLineType(theStringArray) {
    if ('HIERARCHY' === theStringArray[0]) {
      return BvhLine.HIERARCHY;
    }

    if ('ROOT' === theStringArray[0] || 'JOINT' === theStringArray[0]) {
      return BvhLine.JOINT;
    }

    if ('{' === theStringArray[0]) {
      return BvhLine.BRACE_OPEN;
    }

    if ('}' === theStringArray[0]) {
      return BvhLine.BRACE_CLOSED;
    }

    if ('OFFSET' === theStringArray[0]) {
      return BvhLine.OFFSET;
    }

    if ('CHANNELS' === theStringArray[0]) {
      return BvhLine.CHANNELS;
    }

    if ('End' === theStringArray[0]) {
      return BvhLine.END_SITE;
    }

    if ('MOTION' === theStringArray[0]) {
      return BvhLine.MOTION;
    }

    if ('Frames:' === theStringArray[0]) {
      return BvhLine.FRAMES;
    }

    if ('Frame' === theStringArray[0]) {
      return BvhLine.FRAME_TIME;
    }

    if (BvhLine.isFloat(theStringArray[0])) {
      return BvhLine.FRAME;
    }

    return undefined;
  }

  get frames() {
    return this.#frames;
  }

  get frameTime() {
    return this.#frameTime;
  }

  get nbFrames() {
    return this.#nbFrames;
  }

  get channelsProps() {
    return this.#channelsProps;
  }

  get nbChannels() {
    return this.#nbChannels;
  }

  get xOffset() {
    return this.#xOffset;
  }

  get yOffset() {
    return this.#yOffset;
  }

  get zOffset() {
    return this.#zOffset;
  }

  get jointName() {
    return this.#jointName;
  }

  get jointType() {
    return this.#jointType;
  }

  get lineType() {
    return this.#lineType;
  }

  static HIERARCHY = 'HIERARCHY';
  static JOINT = 'JOINT';
  static BRACE_OPEN = 'BRACE_OPEN';
  static BRACE_CLOSED = 'BRACE_CLOSED';
  static OFFSET = 'OFFSET';
  static CHANNELS = 'CHANNELS';
  static END_SITE = 'END_SITE';

  static MOTION = 'MOTION';
  static FRAMES = 'FRAMES';
  static FRAME_TIME = 'FRAME_TIME';
  static FRAME = 'FRAME';
  static JOINT_TYPE_ROOT = 'ROOT';
  static JOINT_TYPE_JOINT = 'JOINT';

  static isFloat(n) {
    return Number(n) == n && n % 1 != 0;
  }

  #lineString;
  #lineType;
  #jointType;
  #jointName;
  #xOffset;
  #yOffset;
  #zOffset;
  #nbChannels;
  #channelsProps;
  #nbFrames;
  #frameTime;
  #frames;
}
