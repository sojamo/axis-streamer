import BvhMatrix from './BvhMatrix';
import BvhConstants from './BvhConstants';

export default class BvhBody {
  constructor(theId) {
    this.#id = theId;
    this.#address = '127.0.0.1';
    this.#owner = BvhBody.owner.SELF;
    this.#mode = BvhBody.MODE_IDLE;

    /** joints */
    this.#root = undefined;
    this.joints = [];
    this.#center = false;
    this.#flat = [];

    /** frames */
    this.#nbFrames = 0;
    this.#frameTime = 0;
    this.#currentFrame = 0;
    this.frames = [];

    /** playback */
    this.motionLoop = false;
    this.#play = true;
  }

  /**
   * update
   * must be called by a program to update
   * the skeleton data.
   */

  update() {
    if (this.#owner === BvhBody.owner.SELF) {
      if (this.mode === BvhBody.MODE_PLAYBACK) {
        if (this.#play) {
          this.#updateFrames();
        }
      }

      this.#updateJoint(this.root);
      this.flatten();
    } else {
      // TODO
      // update remote body?
    }
  }

  #updateFrames() {
    const data = this.getFrame(this.currentFrame);
    const dataLength = data.length;
    /**
     * TODO
     * dataLength must be 354
     * currently there is no .bvh format check
     * we expect 59 joints (see BvhConstants.skeleton)
     * we
     * xyz-position followed by yxz-rotation
     */

    if (dataLength == 354) {
      const channels = {};
      let index = 0;
      for (let i = 0; i < dataLength; i += 6) {
        const v = [];
        v.push(data[i + 0]); // x-pos
        v.push(data[i + 1]); // y-pos
        v.push(data[i + 2]); // z-pos
        v.push(data[i + 3]); // y-rot
        v.push(data[i + 4]); // x-rot
        v.push(data[i + 5]); // z-rot
        channels[BvhConstants.skeleton[index]] = v;
        index++;
      }
      this.processIncomingData({ frameIndex: this.currentFrame, channels });
    } else {
      console.warn(
        'BvhBody.play(), wrong data-count: should be 354 but is',
        dataLength,
        'cant play frame',
      );
    }
  }

  /**
   * flatten
   *
   * by default skeleton data is stored in a
   * nested data structure. By flattening the
   * data structure, we can easily access
   * individual joints by named key.
   * eg. theSkeleton.flat.LeftLeg which will
   * return a BvhJoint from which position or
   * rotation data can be requested.
   *
   */
  flatten() {
    this.#flat = this.flattenFor(this.root, {});
  }

  flattenFor(theJoint, theList) {
    theList[theJoint.name] = theJoint;
    theJoint.children.forEach((el) => {
      this.flattenFor(el, theList);
    });
    return theList;
  }

  /**
   * processIncomingData
   *
   * Data received from Axis Neuron as a binary stream
   * (see BvhStream) will be passed on to each joint and
   * processed accordingly. First the skeleton structure
   * us flattened to more conveniently access individual
   * joints to the assign the new position and
   * rotation values.
   *
   * @param {*} theData
   */
  processIncomingData(theData) {
    // theData = {frameIndex, channels}
    this.flatten();
    Object.keys(theData.channels).forEach((index) => {
      this.#flat[index].axisNeuronPositionRotation = theData.channels[index];
    });
  }

  getFrame(theFrame) {
    return this.frames[theFrame];
  }

  /**
   * updateJoint
   *
   * calculates the absolute position and uses a
   * matrix to do so. The matrix class is incomplete
   * and only implements code necessary for the
   * following transformations.
   *
   * @param {*} theJoint
   */
  #updateJoint(theJoint) {
    let m = new BvhMatrix();
    m.translate(theJoint.xPosition, theJoint.yPosition, theJoint.zPosition);

    /** TODO
     * when translating by offset, the "grouding" of the
     * skeleton is off, without applying offset information, it
     * is fine. When streaming from Axis Neuron and loading
     * from .bvh the skeleton structure is accurate and congruent.
     * */

    // m.translate(theJoint.xOffset, theJoint.yOffset, theJoint.zOffset);

    /**
     * important:
     * we expect rotation values to be in YXZ order
     */
    m.rotateY(BvhBody.radians(theJoint.yRotation));
    m.rotateX(BvhBody.radians(theJoint.xRotation));
    m.rotateZ(BvhBody.radians(theJoint.zRotation));

    theJoint.matrix = m;

    if (theJoint.parent !== undefined && theJoint.parent.matrix !== undefined) {
      m.preApplyMatrix(theJoint.parent.matrix);
    }

    theJoint.positionAbsolute = m.multFast();
    theJoint.rotationAbsolute = m.multFast();

    /**
     * we need to invert the coordinate along the y-axis
     * to make the skeleton stand up right.
     * TODO
     * theJoint.positionAbsolute uses getter and setter
     * is there a better way to do this? Sorry not
     * a matrix wizard.
     */
    theJoint.positionAbsolute = BvhBody.invertY(theJoint.positionAbsolute);

    if (theJoint.children.length > 0) {
      theJoint.children.forEach((el) => this.#updateJoint(el));
    } else {
      m.translate(theJoint.xEndOffset, theJoint.yEndOffset, theJoint.zEndOffset);
      theJoint.endPositionAbsolute = m.multFast();
      theJoint.endPositionAbsolute = BvhBody.invertY(theJoint.endPositionAbsolute);
    }
  }

  /**
   * play
   *
   */
  play() {
    this.#play = true;
  }

  stop() {
    this.first();
    this.#play = false;
  }

  pause() {
    // TODO
  }

  jumpTo(theFrame) {
    // TODO
    this.currentFrame = theFrame;
    this.#updateFrames();
  }

  setSpeed() {
    // TODO
  }

  /* getter */

  get id() {
    return this.#id;
  }

  get root() {
    return this.#root;
  }

  get flat() {
    return this.#flat;
  }

  get address() {
    return this.#address;
  }

  get nbFrames() {
    return this.#nbFrames;
  }

  get frameTime() {
    return this.#frameTime;
  }

  get center() {
    return this.#center;
  }

  get currentFrame() {
    return this.#currentFrame;
  }

  get owner() {
    return this.#owner;
  }

  get mode() {
    return this.#mode;
  }
  /* setter */

  set frameTime(theValue) {
    this.#frameTime = theValue;
  }

  set id(theId) {
    this.#id = theId;
  }

  set nbFrames(theValue) {
    this.#nbFrames = theValue;
  }
  set center(theValue) {
    this.#center = theValue;
  }

  set currentFrame(theFrameIndex) {
    theFrameIndex = theFrameIndex < 0 ? 0 : theFrameIndex;
    theFrameIndex = theFrameIndex >= this.nbFrames ? this.nbFrames - 1 : theFrameIndex;
    this.#currentFrame = theFrameIndex;
  }

  set flat(theValue) {
    this.#flat = theValue;
  }

  set address(theAddress) {
    this.#address = theAddress;
  }

  set root(theJoint) {
    this.#root = theJoint;
  }

  set owner(theEnum) {
    this.#owner = theEnum;
  }

  set mode(theMode) {
    this.#mode = theMode;
  }

  /* static */

  static radians = (degrees) => {
    return (degrees * Math.PI) / 180;
  };

  static invertY = (theVec) => {
    theVec.y *= -1;
    return theVec;
  };

  #address;
  #center;
  #currentFrame;
  #flat;
  #frameTime;
  #id;
  #mode;
  #nbFrames;
  #owner;
  #play;
  #root;

  static MODE_IDLE = 0;
  static MODE_PLAYBACK = 1;
  static MODE_STREAM = 2;

  static owner = {
    SELF: 0,
    OTHER: 1,
  };
}
