import Broadcast from './Broadcast.js';
import BvhBody from './bvh/BvhBody.js';
import BvhParser from './bvh/BvhParser.js';
import BvhStream from './bvh/BvhStream.js';
import WebInterface from './WebInterface.js';
import { log } from './Log.js';
import path from 'path';
import { BehaviorSubject } from 'rxjs';

export default class GoldStreamer {
  constructor(settings) {
    this.settings = settings;
    this.sources = new BehaviorSubject([]);
    this.initNetwork();
    this.initUpdate();
  }

  // REMINDER: Needs to be integrated into the persistant server
  // loadFilesFromSettings() {
  //   const __dirname = path.resolve();
  //   const dir = this.settings.get.general.external.dir;
  //   const files = this.settings.get.load.files;

  //   (async () => {
  //     files.forEach((el) => {
  //       if (el.hasOwnProperty('active') === false || el.active === true) {
  //         const file = path.join(__dirname, './', dir, el.filePath);
  //         const id = el.id || -1;
  //         if (id === -1) {
  //           log.warn(`app base.loadFilesFromSettings: ${file} without id`);
  //         }
  //         (async () => {
  //           return (await BvhParser).readFile({ file, id });
  //         })().then((body) => {
  //           body.mode = BvhBody.MODE_PLAYBACK;
  //           const f = file.split('/').pop();
  //           log.info(`✓ Base.loadFilesFromSettings ${f}`);
  //           this.source.push(body);
  //         });
  //       }
  //     });
  //   })();
  // }

  initNetwork() {
    /* initialise networking components */
    const { sources, settings } = this;
    this.web = new WebInterface({ sources, settings });
    this.broadcastFor = new Broadcast({ sources, settings });
    this.broadcastFor.osc = {};
    this.broadcastFor.ws = {};
    const bvhStream = new BvhStream({ sources, settings });
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
    this.sources.value.forEach((body) => body.update());
  }

  broadcast() {
    /** broadcast to the web */
    this.web.publish(this.settings);
    /** broacast to OSC channels */
    this.broadcastFor.osc.publish(this.settings);
  }
}
