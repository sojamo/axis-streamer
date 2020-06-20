import Base from './base';
import BvhParser from '../src/bvh/BvhParser';
import BvhBody from '../src/bvh/BvhBody';
import path from 'path';
import { log } from '../src/Log';

export default class Load extends Base {
  constructor(options) {
    super(options);
    this.frameIndex = 0;
  }

  async init() {
    /**
     * requires a .bvh file to be located inside a folder storage
     * inside a folder external which is located next to the
     * repository folder axis-streamer
     *
     * axis-streamer/
     * external/
     * ├── app/
     * ├── storage/
     *
     */
    const debug = require('debug')('load');

    const _self = this;
    const dir = this.settings.get.general.external.dir;
    const files = this.settings.get.load.files;

    (async () => {
      files.forEach((el) => {
        const file = path.join(__dirname, '../', dir, el.filePath);
        const id = el.id || _self.id;
        (async () => {
          return (await BvhParser).readFile({ file, id });
        })().then((body) => {
          body.mode = BvhBody.MODE_PLAYBACK;
          _self.source.push(body);
        });
      });
    })();

    this.initNetwork();
    this.initUpdate();
  }

  update() {
    this.frameIndex += 4;
    this.source.forEach((body) => {
      body.currentFrame = this.frameIndex % body.nbFrames;
      body.update();
    });
  }
}
