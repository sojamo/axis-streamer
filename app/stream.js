import Base from './base';
import BvhParser from '../src/bvh/BvhParser';
import BvhStream from '../src/bvh/BvhStream';
import BvhBody from '../src/bvh/BvhBody';
import { log } from '../src/Log';

export default class Stream extends Base {
  constructor(options) {
    super(options);
  }

  async init() {
    this.settings.get.streams.forEach((stream) => {
      (async () => {
        return (await BvhParser).readFile();
      })().then((body) => {
        body.id = stream.id;
        body.address = stream.address;
        body.mode = BvhBody.MODE_STREAM;
        this.source.push(body);
      });
    });
    const { source, settings } = this;
    new BvhStream({ source, settings });

    const n = this.settings.get.streams.length;
    log.info(`Set up to stream in ${n} bod${n === 1 ? 'y' : 'ies'}`);

    this.initNetwork();
    this.initUpdate();
  }

  update() {
    this.source.forEach((body) => body.update());
  }
}
