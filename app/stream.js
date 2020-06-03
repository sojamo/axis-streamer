import Base from './base';
import BvhParser from '../src/bvh/BvhParser';
import BvhStream from '../src/bvh/BvhStream';

export default class Stream extends Base {
  constructor(options) {
    super(options);
  }

  async init() {
    (async () => {
      return (await BvhParser).readFile();
    })().then((body) => {
      this.source.push(body);
    });

    new BvhStream({ source: this.source });

    this.initNetwork();

    this.initUpdate();
  }

  update() {
    this.source.forEach((body) => body.update());
  }
}
