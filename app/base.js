import Broadcast from '../src/Broadcast';
import Server from '../src/Server';

export default class Base {
  constructor(options) {
    console.log(JSON.stringify(options, null, 2));
    this.settings = options.settings;
    this.destinations = this.settings.destinations || [];
    this.id = this.settings.id || 0;
    this.source = [];
    this.external = this.settings.external || '../../external/';
    this.bvh = this.settings.bvh[0].filePath || 'storage/test-load.bvh';
    this.updateFreq = this.settings.updateFrq || 20;
    this.broadcastFreq = this.settings.broadcastFrq || 100;
    this.init();
  }

  init() {
    console.log('automated message: your class must implement function init()');
  }

  initNetwork() {
    /* initialise network components */
    this.web = new Server({ source: this.source });
    this.broadcastFor = new Broadcast({ source: this.source });
    this.broadcastFor.osc = {};
  }

  initUpdate() {
    /* stick to a good update-rate of 50 fps */
    setInterval(this.update.bind(this), this.updateFreq);

    /**
     * the second interval takes care of
     * broadcasting message. here however we
     * throttle broadcasting messages a bit, so
     * that we only have to update every tenth
     * of a second (or less or more?).
     * this is to prevent the network or receiver
     * from overloading.
     */
    setInterval(this.broadcast.bind(this), this.broadcastFreq);
  }

  broadcast() {
    this.web.xyz();
    this.broadcastFor.osc.xyz({
      dest: this.destinations,
      split: this.settings.split || false,
      range: this.settings.range || [],
    });
  }
}
