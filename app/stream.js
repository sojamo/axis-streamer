import Base from './base';

export default class Stream extends Base {
  constructor(options) {
    super(options);
  }

  async init() {
    this.initStreamsFromSettings();
  }
}
