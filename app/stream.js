import Base from './base';
import BvhParser from '../src/bvh/BvhParser';
import BvhStream from '../src/bvh/BvhStream';

export default class Stream extends Base {
  constructor(options) {
    super(options);
  }

  async init() {
    this.settings.stream.forEach((stream) => {
      (async () => {
        return (await BvhParser).readFile();
      })().then((body) => {
        body.id = stream.id;
        body.address = stream.address;
        this.source.push(body);
        console.log('body:', body.id, body.address);
      });
    });

    new BvhStream({ source: this.source });

    this.initNetwork();

    this.initUpdate();
  }

  update() {
    this.source.forEach((body) => body.update());
  }
}
