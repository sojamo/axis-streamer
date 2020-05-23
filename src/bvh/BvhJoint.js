export default class BvhJoint {
  constructor(options = {}) {
    this.#id = options.id || 0;
    this.#name = options.name || '?';
    this.#parent = options.parent || undefined;
    this.#children = [];

    this.#positionAbsolute = { x: 0, y: 0, z: 0, xyz: [0, 0, 0] };
    this.#rotationAbsolute = { x: 0, y: 0, z: 0, xyz: [0, 0, 0] };
    this.#endPositionAbsolute = { x: 0, y: 0, z: 0, xyz: [0, 0, 0] };
    this.#endRotationAbsolute = { x: 0, y: 0, z: 0, xyz: [0, 0, 0] };

    this.#position = { x: 0, y: 0, z: 0, xyz: [0, 0, 0] };
    this.#rotation = { x: 0, y: 0, z: 0, xyz: [0, 0, 0] };
    this.#offset = { x: 0, y: 0, z: 0, xyz: [0, 0, 0] };
    this.#endOffset = { x: 0, y: 0, z: 0, xyz: [0, 0, 0] };

    this.#channels = [];
    this.#nbChannels = -1;
    this.#globalMatrix = undefined;
  }

  add(theElement) {
    this.#children.push(theElement);
    theElement.parent = this;
  }

  /* getter */

  get rotationAbsolute() {
    return this.#rotationAbsolute;
  }

  get positionAbsolute() {
    return this.#positionAbsolute;
  }

  get endPositionAbsolute() {
    return this.#endPositionAbsolute;
  }

  get position() {
    return this.#position;
  }

  get offset() {
    return this.#offset;
  }

  get rotation() {
    return this.#rotation;
  }

  get matrix() {
    return this.#globalMatrix;
  }

  get xPosition() {
    return this.#position.x;
  }

  get yPosition() {
    return this.#position.y;
  }

  get zPosition() {
    return this.#position.z;
  }

  get xOffset() {
    return this.#offset.x;
  }

  get yOffset() {
    return this.#offset.y;
  }

  get zOffset() {
    return this.#offset.z;
  }

  get xEndOffset() {
    return this.#endOffset.x;
  }

  get yEndOffset() {
    return this.#endOffset.y;
  }

  get zEndOffset() {
    return this.#endOffset.z;
  }

  get xRotation() {
    return this.#rotation.x;
  }

  get yRotation() {
    return this.#rotation.y;
  }

  get zRotation() {
    return this.#rotation.z;
  }

  get name() {
    return this.#name;
  }

  get id() {
    return this.#id;
  }

  get children() {
    return this.#children;
  }

  get parent() {
    return this.#parent;
  }

  get hasEndPoint() {
    return !this.#children.length;
  }

  /* setter */

  /**
   * @param {Number} theName
   */
  set id(theId) {
    this.#id = theId;
  }

  /**
   * @param {string} theName
   */
  set name(theName) {
    this.#name = theName;
  }

  /**
   * @param {number} theValue
   */
  set xRotation(theValue) {
    this.#rotation.x = theValue;
    this._updateFor(this.#rotation);
  }

  /**
   * @param {number} theValue
   */
  set yRotation(theValue) {
    this.#rotation.y = theValue;
    this._updateFor(this.#rotation);
  }

  /**
   * @param {number} theValue
   */
  set zRotation(theValue) {
    this.#rotation.z = theValue;
    this._updateFor(this.#rotation);
  }

  /**
   * @param {number} theValue
   */
  set xPosition(theValue) {
    this.#position.x = theValue;
    this._updateFor(this.#position);
  }

  /**
   * @param {number} theValue
   */
  set yPosition(theValue) {
    this.#position.y = theValue;
    this._updateFor(this.#position);
  }

  /**
   * @param {number} theValue
   */
  set zPosition(theValue) {
    this.#position.z = theValue;
    this._updateFor(this.#position);
  }

  /**
   * @param {number} theValue
   */
  set xOffset(theValue) {
    this.#offset.x = theValue;
    this._updateFor(this.#offset);
  }

  /**
   * @param {number} theValue
   */
  set yOffset(theValue) {
    this.#offset.y = theValue;
    this._updateFor(this.#offset);
  }

  /**
   * @param {number} theValue
   */
  set zOffset(theValue) {
    this.#offset.z = theValue;
    this._updateFor(this.#offset);
  }

  /**
   * @param {number} theValue
   */
  set xEndOffset(theValue) {
    this.#endOffset.x = theValue;
    this._updateFor(this.#endOffset);
  }

  /**
   * @param {number} theValue
   */
  set yEndOffset(theValue) {
    this.#endOffset.y = theValue;
    this._updateFor(this.#endOffset);
  }

  /**
   * @param {number} theValue
   */
  set zEndOffset(theValue) {
    this.#endOffset.z = theValue;
    this._updateFor(this.#endOffset);
  }

  set axisNeuronPositionRotation(theData) {
    this.#position.x = theData[0];
    this.#position.y = theData[1];
    this.#position.z = theData[2];

    this.#rotation.x = theData[4];
    this.#rotation.y = theData[3];
    this.#rotation.z = theData[5];

    this._updateFor(this.#position);
    this._updateFor(this.#rotation);
  }

  set positionAbsolute(theVec) {
    this.#positionAbsolute.x = theVec.x;
    this.#positionAbsolute.y = theVec.y;
    this.#positionAbsolute.z = theVec.z;
    this._updateFor(this.#positionAbsolute);
  }

  set endPositionAbsolute(theVec) {
    this.#endPositionAbsolute.x = theVec.x;
    this.#endPositionAbsolute.y = theVec.y;
    this.#endPositionAbsolute.z = theVec.z;
    this._updateFor(this.#endPositionAbsolute);
  }

  set rotationAbsolute(theVec) {
    this.#rotationAbsolute.x = theVec.x;
    this.#rotationAbsolute.y = theVec.y;
    this.#rotationAbsolute.z = theVec.z;
    this._updateFor(this.#rotationAbsolute);
  }

  /**
   * @param {any[]} theChannels
   */
  set channels(theChannels) {
    this.#channels = theChannels;
  }

  set nbChannels(theNbChannels) {
    this.#nbChannels = theNbChannels;
  }

  set parent(theParent) {
    this.#parent = theParent;
  }

  set matrix(theMatrix) {
    this.#globalMatrix = theMatrix;
  }

  _updateFor(theMember) {
    theMember['xyz'] = [theMember['x'], theMember['y'], theMember['z']];
  }

  #id;
  #name;
  #parent;
  #children;
  #positionAbsolute;
  #rotationAbsolute;
  #endPositionAbsolute;
  #endRotationAbsolute;
  #position;
  #rotation;
  #offset;
  #endOffset;
  #channels;
  #nbChannels;
  #globalMatrix;
}
