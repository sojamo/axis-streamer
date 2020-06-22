import Base from './base';

export default class Load extends Base {
  constructor(options) {
    super(options);
    this.frameIndex = 0;
  }

  async init() {
    /**
     * requires a .bvh file to be located inside folder
     * external/storage/bvh
     *
     * project-root-folder/
     * ├── axis-streamer/
     * ├── external/
     *     ├── app/
     *     ├── storage/
     *         ├── bvh/
     *
     */
    this.loadFilesFromSettings();
  }

  update() {
    this.frameIndex += 4;
    this.source.forEach((body) => {
      body.currentFrame = this.frameIndex % body.nbFrames;
    });
  }
}
