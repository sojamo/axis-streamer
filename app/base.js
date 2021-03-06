import Broadcast from '../src/Broadcast.js';
import BvhBody from '../src/bvh/BvhBody.js';
import BvhParser from '../src/bvh/BvhParser.js';
import BvhStream from '../src/bvh/BvhStream.js';
import WebInterface from '../src/WebInterface.js';
import { log } from '../src/Log.js';
import path from 'path';

export default class Base {
  constructor(settings) {
    this.settings = settings;
    this.source = [];
    this.init();
    this.initNetwork();
    this.initUpdate();
  }

  init() {
    log.warn('base.js: automated message, the inheriting class must implement function init().');
  }

  loadFilesFromSettings() {
    const __dirname = path.resolve();
    const dir = this.settings.get.general.external.dir;
    const files = this.settings.get.load.files;

    (async () => {
      files.forEach((el) => {
        if (el.hasOwnProperty('active') === false || el.active === true) {
          const file = path.join(__dirname, './', dir, el.filePath);
          const id = el.id || -1;
          if (id === -1) {
            log.warn(`app base.loadFilesFromSettings: ${file} without id`);
          }
          (async () => {
            return (await BvhParser).readFile({ file, id });
          })().then((body) => {
            body.mode = BvhBody.MODE_PLAYBACK;
            const f = file.split('/').pop();
            log.info(`✓ Base.loadFilesFromSettings ${f}`);
            this.source.push(body);
          });
        }
      });
    })();
  }

  initStreamsFromSettings() {
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
  }

  initNetwork() {
    /* initialise networking components */
    const { source, settings } = this;
    this.web = new WebInterface({ source, settings });
    this.broadcastFor = new Broadcast({ source, settings });
    this.broadcastFor.osc = {};
    this.broadcastFor.ws = {};
  }

  initUpdate() {
    /* stick to a good update-rate of 50 fps if possible (freq.update value=20) */
    setInterval(this.pre.bind(this), this.settings.get.general.freq.update);
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

  update() {
    /** to be overriden by inheriting class */
  }

  pre() {
    this.update();
    this.source.forEach((body) => body.update());
  }

  broadcast() {
    /** broadcast to the web */
    this.web.publish(this.settings);
    /** broacast to OSC channels */
    this.broadcastFor.osc.publish(this.settings);
  }
}
