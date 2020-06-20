import Broadcast from '../src/Broadcast';
import WebInterface from '../src/WebInterface';
import { log } from '../src/Log';

export default class Base {
  constructor(settings) {
    this.settings = settings;
    this.source = [];
    this.init();
  }

  init() {
    log.warn('base.js: automated message, the extending class must implement function init().');
  }

  initNetwork() {
    /* initialise network components */
    const { source, settings } = this;
    this.web = new WebInterface({ source, settings });
    this.broadcastFor = new Broadcast({ source, settings });
    this.broadcastFor.osc = {};
    this.broadcastFor.ws = {};
  }

  initUpdate() {
    /* stick to a good update-rate of 50 fps */
    setInterval(this.update.bind(this), this.settings.get.general.freq.update);
    /**
     * the second interval takes care of
     * broadcasting message. here however we
     * throttle broadcasting messages a bit, so
     * that we only have to update every tenth
     * of a second (or less or more?).
     * this is to prevent the network or receiver
     * from overloading.
     */
    setInterval(this.broadcast.bind(this), this.settings.get.general.freq.broadcast);
  }

  broadcast() {
    /** broadcast to the web */
    this.web.send(this.settings);
    /** broacast to OSC channels */
    this.broadcastFor.osc.send(this.settings);
  }
}
