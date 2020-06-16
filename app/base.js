import Broadcast from '../src/Broadcast';
import Server from '../src/Server';

export default class Base {
  constructor(settings) {
    this.settings = settings;
    this.source = [];
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
    this.broadcastFor.ws = {};
  }

  initUpdate() {
    /* stick to a good update-rate of 50 fps */
    setInterval(this.update.bind(this), this.settings.freq.update);

    /**
     * the second interval takes care of
     * broadcasting message. here however we
     * throttle broadcasting messages a bit, so
     * that we only have to update every tenth
     * of a second (or less or more?).
     * this is to prevent the network or receiver
     * from overloading.
     */
    setInterval(this.broadcast.bind(this), this.settings.freq.broadcast);
  }

  broadcast() {
    /** broadcast to the web */
    this.web.xyz();
    /** broacast to OSC channels */
    this.broadcastFor.osc.xyz(this.settings);
  }
}
