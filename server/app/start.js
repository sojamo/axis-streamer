import Settings from './src/Settings.js';
import { log } from './src/Log.js';
import fs from 'fs';
import minimist from 'minimist';
import GoldStreamer from './src/GoldStreamer.js';

const argv = minimist(process.argv.slice(2));

let settings;
let isHelp = false;

Object.keys(argv).forEach((key) => {
  const val = argv[key];
  switch (key) {
    case 'settings':
      const fileName = val === true ? 'settings-template.json' : val;
      settings = new Settings(JSON.parse(fs.readFileSync(fileName, 'utf-8')));
      break;
    case 'help':
      isHelp = true;
      break;
  }
});

if (isHelp) {
  console.log(
    `
  Usage: yarn start [options]

  Options:
    --settings [ omit | empty | absolute path ]
    --help

  Examples:
    yarn start
    yarn start --settings /path/to/settings-template.json
    
  `,
  );
} else {
  settings = settings || new Settings(Settings.default);
  log.info(`Start: Settings are ${settings.label}`);
  new GoldStreamer(settings);

  // if (argv['mode'] !== undefined) {
  //   switch (argv['mode']) {
  //     case 'stream':
  //       log.info('Start: Mode selected is stream, starting with Stream class.');
  //       new Stream(settings);
  //       break;
  //     case 'load':
  //       log.info('Start: Mode selected is load, starting with Load class.');
  //       new Load(settings);
  //       break;
  //     case 'streamload':
  //       log.info('Start: Mode selected is streamload, starting with StreamLoad class.');
  //       new StreamLoad(settings);
  //       break;
  //     case 'sim': /** TODO new Sim(options); */
  //     default:
  //       log.info(
  //         `Start: Mode selected is unknown ${argv['mode']} starting with Load class as default.`,
  //       );
  //       new Load(settings);
  //       break;
  //   }
  // } else {
  //   log.info(`Start: No Mode selected, starting with Load class as default.`);
  //   new Load(settings);
  // }
}
