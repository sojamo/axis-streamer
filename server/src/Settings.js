export default class Settings {
  #settings;

  constructor(settings) {
    this.#settings = settings;
  }

  get get() {
    return this.#settings;
  }

  get label() {
    return this.get.label || '?';
  }

  /**
   * the default settings format is used when no
   * external settings file is specified.
   */
  static default = {
    label: 'default-settings',
    general: {
      osc: {
        port: 5000,
        address: '0.0.0.0',
        description: `The port and inet address the application
        will be listening on. By default the port should be 5000. 
        Possible net interface addresses are 127.0.0.1 for local and 
        loopback, the default 0.0.0.0 (can be used to mean anything 
        from accept all IP addresses to the default route when servers
        possess more than one network interface).`,
      },
      freq: {
        update: 20,
        broadcast: 100,
        description: `Determines the update frequency for updates applied 
          to body (skeleton) details and the update frequency to 
          broadcast current body states. updates are in milliseconds.`,
      },
      record: {
        dir: '',
        prefix: 'rec',
        active: false,
      },
      external: {
        dir: '../external/',
        description: `Specifies the path to the external folder where project 
          specific details are stored such as settings, .bvh files, etc. 
          and relative to the axis-streamer folder.`,
      },
    },
    load: {
      files: [
        { filePath: 'storage/bvh/test-load-1.bvh', label: 'default', id: 2, active: true },
        { filePath: 'storage/bvh/test-load-2.bvh', label: 'default', id: 3, active: true },
      ],
      description: `contains an array of paths to bvh files to load from and then 
        playback. These files should be located inside external. Useful 
        when developing, testing or when there is no live-stream available.`,
    },
    // streams: [
    //   {
    //     active: true,
    //     id: 1,
    //     address: '127.0.0.1',
    //     label: 'local',
    //     type: 'axis-neuron',
    //   },
    //   {
    //     active: true,
    //     id: 2,
    //     address: '172.17.0.1',
    //     label: 'local',
    //     type: 'axis-neuron',
    //   },
    // ],
    server: {
      web: {
        path: {
          public: 'public/',
          app: '../external/app/',
        },
        port: 5080,
      },
      description: `a web server that streams data to a locally 
      accessible website to monitor states`,
    },
    broadcast: {
      web: [
        {
          active: false,
          label: 'glitch',
          host: 'axis-online.glitch.me',
          freq: 100,
          global: true,
        },
      ],
      osc: [
        {
          active: true,
          address: '127.0.0.1',
          port: 5001,
          format: 'xyz',
          label: 'local-5001',
        },
        {
          active: false,
          address: '127.0.0.1',
          port: 5001,
          format: 'xyz',
          split: true,
          range: ['Head', 'Hips'],
          requestById: [1, 2],
          label: 'local-split-5001',
        },
      ],
      description: `(osc) data is broadcasted over UDP/OSC and 
      (web) over websocket to a publically available web server, 
      currently for example this is hosted at axis-online.glitch.com.`,
    },
  };
}
