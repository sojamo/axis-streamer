import Load from './load';
import Stream from './stream';
import Settings from '../src/Settings';
import { log } from '../src/Log';

const fs = require('fs');
const argv = require('minimist')(process.argv.slice(2));
let settings;

Object.keys(argv).forEach((key) => {
  const val = argv[key];
  switch (key) {
    case 'settings':
      const pathToSettings = '../external/settings/';
      const fileName = val === true ? 'settings-todo.json' : val;
      settings = new Settings(JSON.parse(fs.readFileSync(pathToSettings + fileName, 'utf-8')));
      break;
  }
});

settings = settings || new Settings(Settings.default);
log.info(`app start: Settings are ${settings.label}`);

if (argv['app'] !== undefined) {
  switch (argv['app']) {
    case 'stream':
      log.info('app start: App selected is stream, starting with Stream class.');
      new Stream(settings);
      break;
    case 'load':
      log.info('app start: App selected is load, starting with Load class.');
      new Load(settings);
      break;
    case 'sim':
      /** TODO
       * new Sim(options);
       **/

      break;
    default:
      log.info(
        `app start: App selected is unknown ${argv['app']} starting with Load class as default.`,
      );
      new Load(settings);
      break;
  }
} else {
  log.info(`app start: No app selected, starting with Load class as default.`);
  new Load(settings);
}
