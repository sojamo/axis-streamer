import BvhMatrix from './BvhMatrix';

export default class BvhBody {
  constructor(theId) {
    this.#id = theId;
    this.#nbFrames = 0;
    this.#frameTime = 0;
    this.currentFrame = 0;
    this.motionLoop = false;
    this.#root = undefined;
    this.joints = [];
    this.frames = [];
    this.#center = false;
    this.#flat = [];
    this.#lines = [];
    this.#owner = BvhBody.owner.SELF;
  }

  /**
   * update
   * must be called by a program to update
   * the skeleton data.
   */
  update() {
    this.updateJoint(this.root);
    this.flatten();
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
   * play
   *
   * @param {*} theFrameIndex
   */
  play(theFrameIndex) {
    theFrameIndex = theFrameIndex < 0 ? 0 : theFrameIndex;
    theFrameIndex = theFrameIndex >= this.nbFrames ? this.nbFrames - 1 : theFrameIndex;
    const data = this.getFrame(theFrameIndex);
    const dataLength = data.length;
    /**
     * TODO
     * dataLength must be 354
     * currently there is no .bvh format check
     * we expect 59 joints (see BvhBody.skeleton)
     * with 6 float values per channel where
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
        channels[BvhBody.skeleton[index]] = v;
        index++;
      }

      this.processIncomingData({ frameIndex: theFrameIndex, channels });
    } else {
      console.warn(
        'BvhBody.play(), wrong data-count: should be 354 but is',
        dataLength,
        'cant play frame',
      );
    }
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
  updateJoint(theJoint) {
    let m = new BvhMatrix();
    m.translate(theJoint.xPosition, theJoint.yPosition, theJoint.zPosition);
    m.translate(theJoint.xOffset, theJoint.yOffset, theJoint.zOffset);

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
      theJoint.children.forEach((el) => this.updateJoint(el));
    } else {
      m.translate(theJoint.xEndOffset, theJoint.yEndOffset, theJoint.zEndOffset);
      theJoint.endPositionAbsolute = m.multFast();
      theJoint.endPositionAbsolute = BvhBody.invertY(theJoint.endPositionAbsolute);
    }
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

  get nbFrames() {
    return this.#nbFrames;
  }

  get frameTime() {
    return this.#frameTime;
  }

  get center() {
    return this.#center;
  }

  get owner() {
    return this.#owner;
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

  set flat(theValue) {
    this.#flat = theValue;
  }

  set lines(theArray) {
    this.#lines = theArray;
  }

  set root(theJoint) {
    this.#root = theJoint;
  }

  set owner(theEnum) {
    this.#owner = theEnum;
  }

  /* static */

  static radians = (degrees) => {
    return (degrees * Math.PI) / 180;
  };

  static invertY = (theVec) => {
    theVec.y *= -1;
    return theVec;
  };

  #center;
  #flat;
  #frameTime;
  #id;
  #lines;
  #nbFrames;
  #owner;
  #root;

  static owner = {
    SELF: 0,
    OTHER: 1,
  };

  static defaultSkeleton = [
    'Hips',
    'RightUpLeg',
    'RightLeg',
    'RightFoot',
    'LeftUpLeg',
    'LeftLeg',
    'LeftFoot',
    'RightShoulder',
    'RightArm',
    'RightForeArm',
    'RightHand',
    'LeftShoulder',
    'LeftArm',
    'LeftForeArm',
    'LeftHand',
    'Head',
    'Neck',
    'Spine3',
    'Spine2',
    'Spine1',
    'Spine',
  ];

  static skeleton = [
    'Hips',
    'RightUpLeg',
    'RightLeg',
    'RightFoot',
    'LeftUpLeg',
    'LeftLeg',
    'LeftFoot',
    'Spine',
    'Spine1',
    'Spine2',
    'Spine3',
    'Neck',
    'Head',
    'RightShoulder',
    'RightArm',
    'RightForeArm',
    'RightHand',
    'RightHandThumb1',
    'RightHandThumb2',
    'RightHandThumb3',
    'RightInHandIndex',
    'RightHandIndex1',
    'RightHandIndex2',
    'RightHandIndex3',
    'RightInHandMiddle',
    'RightHandMiddle1',
    'RightHandMiddle2',
    'RightHandMiddle3',
    'RightInHandRing',
    'RightHandRing1',
    'RightHandRing2',
    'RightHandRing3',
    'RightInHandPinky',
    'RightHandPinky1',
    'RightHandPinky2',
    'RightHandPinky3',
    'LeftShoulder',
    'LeftArm',
    'LeftForeArm',
    'LeftHand',
    'LeftHandThumb1',
    'LeftHandThumb2',
    'LeftHandThumb3',
    'LeftInHandIndex',
    'LeftHandIndex1',
    'LeftHandIndex2',
    'LeftHandIndex3',
    'LeftInHandMiddle',
    'LeftHandMiddle1',
    'LeftHandMiddle2',
    'LeftHandMiddle3',
    'LeftInHandRing',
    'LeftHandRing1',
    'LeftHandRing2',
    'LeftHandRing3',
    'LeftInHandPinky',
    'LeftHandPinky1',
    'LeftHandPinky2',
    'LeftHandPinky3',
  ];

  static jointSequence = [
    'Hips',
    'RightUpLeg',
    'RightLeg',
    'RightFoot',
    'LeftUpLeg',
    'LeftLeg',
    'LeftFoot',
    'RightShoulder',
    'RightArm',
    'RightForeArm',
    'RightHand',
    'LeftShoulder',
    'LeftArm',
    'LeftForeArm',
    'LeftHand',
    'Head',
    'Neck',
    'Spine3',
    'Spine2',
    'Spine1',
    'Spine',
  ];
}
