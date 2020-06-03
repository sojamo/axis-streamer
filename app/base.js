import Broadcast from '../src/Broadcast';
import Server from '../src/Server';

export default class Base {
  constructor(options) {
    this.options = options;
    this.destinations = options.settings.destinations || [];
    this.id = options.settings.id || 0;
    this.source = [];
    this.external = options.settings.external || '../../external/';
    this.bvh = options.settings.bvh[0].filename || 'storage/test-load.bvh';
    this.updateFreq = options.settings.updateFrq || 20;
    this.broadcastFreq = options.settings.broadcastFrq || 100;
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
      split: this.options.split || false,
      range: this.options.range || [],
    });
  }
}
