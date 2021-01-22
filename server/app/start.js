import Load from './load.js';
import Stream from './stream.js';
import StreamLoad from './streamload.js';
import Settings from '../src/Settings.js';
import { log } from '../src/Log.js';
import fs from 'fs';
import minimist from 'minimist';

const argv = minimist(process.argv.slice(2));

let settings;
let isHelp = false;

Object.keys(argv).forEach((key) => {
  const val = argv[key];
  switch (key) {
    case 'settings':
      const pathToSettings = '../external/storage/settings/';
      const fileName = val === true ? 'settings-template.json' : val;
      settings = new Settings(JSON.parse(fs.readFileSync(pathToSettings + fileName, 'utf-8')));
      break;
    case 'help':
      isHelp = true;
      break;
  }
});

if (isHelp) {
  console.log(
    `
  Usage: yarn run with [options]

  Options:
    --mode [ load | stream | streamload ]
    --settings [ omit | empty | filename ]
    --help

  Examples:
    yarn run with --mode load
    yarn run with --mode stream
    yarn run with --mode streamload
    yarn run with --mode streamload --settings settings-template.json
    
  `,
  );
} else {
  settings = settings || new Settings(Settings.default);
  log.info(`Start: Settings are ${settings.label}`);

  if (argv['mode'] !== undefined) {
    switch (argv['mode']) {
      case 'stream':
        log.info('Start: Mode selected is stream, starting with Stream class.');
        new Stream(settings);
        break;
      case 'load':
        log.info('Start: Mode selected is load, starting with Load class.');
        new Load(settings);
        break;
      case 'streamload':
        log.info('Start: Mode selected is streamload, starting with StreamLoad class.');
        new StreamLoad(settings);
        break;
      case 'sim': /** TODO new Sim(options); */
      default:
        log.info(`Start: Mode selected is unknown ${argv['mode']} starting with Load class as default.`);
        new Load(settings);
        break;
    }
  } else {
    log.info(`Start: No Mode selected, starting with Load class as default.`);
    new Load(settings);
  }
}
