export default class Settings {
  #settings;

  constructor(settings) {
    this.#settings = settings;
  }

  get get() {
    return this.#settings;
  }
}
