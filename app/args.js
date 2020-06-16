import Load from './load';
import Stream from './stream';
import Settings from '../src/Settings';
import { exists } from 'fs';

const fs = require('fs');
const argv = require('minimist')(process.argv.slice(2));
const options = {};
const path = '../external/';
let settings = null;

Object.keys(argv).forEach((key) => {
  const val = argv[key];
  switch (key) {
    case 'settings':
      const file = val === true ? 'settings-todo.json' : val;
      options.settings = JSON.parse(fs.readFileSync(path + file, 'utf-8'));
      settings = new Settings(JSON.parse(fs.readFileSync(path + file, 'utf-8')));
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
      new Stream(settings);
      break;
    case 'load':
      console.log('App selected: load, starting with Load');
      new Load(settings);
      break;
    case 'sim':
      // new Sim(options);
      break;
    default:
      console.log('App selected: unknown (' + argv['app'] + '), starting with Load as default.');
      new Load(settings);
      break;
  }
} else {
  console.log('No app selected, starting with Load as default.');
  new Load(settings);
}
