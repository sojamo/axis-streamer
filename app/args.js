import Load from './load';
import Stream from './stream';

const fs = require('fs');
const argv = require('minimist')(process.argv.slice(2));
const options = {};
const path = '../external/';

Object.keys(argv).forEach((key) => {
  const val = argv[key];
  switch (key) {
    case 'settings':
      const f = val === true ? 'settings.json' : val;
      options.settings = JSON.parse(fs.readFileSync(path + f, 'utf-8'));
      break;
    case 'app':
      options.app = options.app || val;
      break;
    case 'record':
      options.record = options.record || val;
  }
});

if (argv['app'] !== undefined) {
  switch (argv['app']) {
    case 'stream':
      console.log('App selected: stream, starting with Stream');
      new Stream(options);
      break;
    case 'load':
      console.log('App selected: load, starting with Load');
      new Load(options);
      break;
    case 'sim':
      // new Sim(options);
      break;
    default:
      console.log('App selected: unknown (' + argv['app'] + '), starting with Load as default.');
      new Load(options);
      break;
  }
} else {
  console.log('No app selected, starting with Load as default.');
  new Load(options);
}
