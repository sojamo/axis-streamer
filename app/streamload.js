import Base from './base.js';

export default class StreamLoad extends Base {
  constructor(options) {
    super(options);
    this.frameIndex = 0;
  }

  init() {
    this.loadFilesFromSettings();
    this.initStreamsFromSettings();
  }

  update() {
    this.frameIndex += 4;
    this.source.forEach((body) => {
      body.currentFrame = this.frameIndex % body.nbFrames;
    });
  }
}
