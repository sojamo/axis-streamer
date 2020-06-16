import Base from './base';
import BvhParser from '../src/bvh/BvhParser';
import path from 'path';

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
    const result = [];
    (async () => {
      files.forEach((el) => {
        const pathToFile = path.join(__dirname, '../', dir, el.filePath);
        debug(pathToFile);
        (async () => {
          return (await BvhParser).readFile({ file: pathToFile, id: _self.id });
        })().then((file) => {
          result.push(file);
          return result;
        });
      });
      return await result;
    })().then((t) => {
      console.log(t);
    });

    // (async () => {
    //   return (await BvhParser).readFile({ file: pathToFile, id: this.id });
    // })().then((body) => {
    //   this.source.push(body);
    //   body.play();
    //   console.log(`loading file\n${file}\n  ${this.source.length} BvhBody(s)`);
    //   this.source.forEach((b) => {
    //     const m = `  id: ${b.id}\tframes: ${b.nbFrames}\tframeTime: ${b.frameTime}`;
    //     console.log(m);
    //   });
    // });

    // this.initNetwork();

    // this.initUpdate();
  }

  update() {
    this.frameIndex += 4;
    this.source.forEach((body) => {
      body.currentFrame = this.frameIndex % body.nbFrames;
      body.update();
    });
  }
}
