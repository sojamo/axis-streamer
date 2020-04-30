
/**
 * BvhParser
 * 
 * Code adapted from Processing code hosted at
 * https://github.com/perfume-dev/example-processing/tree/master/p5f_sample
 *
 * Parses .bvh structures from a file by going 
 * through structure and frame data line by line.  
 * 
 * The frames included at the end of the .bvh file are 
 * expected to be in position-XYZ and rotation YXZ order.
 * 
 *
 */

import Broadcast from '../Broadcast'
import BvhJoint from './BvhJoint'
import BvhMatrix from './BvhMatrix'
import * as fs from "fs";
import { promisify } from 'util';



export default class BvhParser {

	constructor(theBvh) {
		// initialise local variables 
		// to process .bvh file.
		this.#id = 0;
		this.#nbFrames = 0;
		this.#frameTime = 0;
		this.#currentLine = 0;
		this.#currentFrame = 0;
		this.#motionLoop = false;
		this.#rootJoint = undefined;
		this.#currentJoint = undefined;
		this.#joints = [];
		this.#frames = [];
		this.#center = false;
	}


	async readFile(theFile) {
		const pReadFile = promisify(fs.readFile);
		await pReadFile(theFile, 'utf8').then(theResult => {
			this.parse(theResult.split(/[\r\n]+/g));
			this.#flat = this.flatten();
		});
	}

	parse(theLines) {
		this.#lines = [];

		theLines.forEach((el, i) => {
			this.#lines.push(new BvhLine(el));
		});

		this.#currentLine = 1;
		this.#rootJoint = this.parseJoint();


		if (this.#center === true) {
			this.#rootJoint.xOffset = 0;
			this.#rootJoint.yOffset = 0;
			this.#rootJoint.zOffset = 0;
		}
		this.parseFrames();
	}

	parseJoint() {

		let jointName = this.#lines[this.#currentLine].jointName; // 1
		let joint = new BvhJoint({ joint: this.#currentJoint, id: this.id, name: jointName });
		this.#joints.push(joint);


		// +2 OFFSET
		this.#currentLine++; 									// 2 {
		this.#currentLine++; 									// 3 OFFSET
		joint.xOffset = this.#lines[this.#currentLine].xOffset;
		joint.yOffset = this.#lines[this.#currentLine].yOffset;
		joint.zOffset = this.#lines[this.#currentLine].zOffset;

		// +3 CHANNELS
		this.#currentLine++;
		joint.nbChannels = this.#lines[this.#currentLine].nbChannels;
		joint.channels = this.#lines[this.#currentLine].channelsProps;

		// +4 JOINT or End Site or }
		this.#currentLine++;
		while (this.#currentLine < this.#lines.length) {
			let lineType = this.#lines[this.#currentLine].lineType;

			if (BvhLine.JOINT === lineType) { 					// JOINT or ROOT
				let child = this.parseJoint();   	 			// generate new BvhJOINT
				child.parent = joint;
				joint.children.push(child);
			} else if (BvhLine.END_SITE === lineType) {
				this.#currentLine++; 							// {
				this.#currentLine++; 							// OFFSET
				joint.xEndOffset = this.#lines[this.#currentLine].xOffset;
				joint.yEndOffset = this.#lines[this.#currentLine].yOffset;
				joint.zEndOffset = this.#lines[this.#currentLine].zOffset;
				this.#currentLine++; 							//}
				this.#currentLine++; 							//}
				return joint;
			} else if (BvhLine.BRACE_CLOSED === lineType) {
				return joint; 									//}
			}
			this.#currentLine++;
		}
		console.log("Something strage");
		return joint;
	}


	parseFrames() {
		let currentLine = this.#currentLine;

		for (; currentLine < this.#lines.length; currentLine++) {
			if (this.#lines[currentLine].lineType === BvhLine.MOTION) {
				break;
			}
		}

		if (this.#lines.length > currentLine) {
			currentLine++; //Frames
			this.#nbFrames = this.#lines[currentLine].nbFrames;
			currentLine++; //FrameTime
			this.#frameTime = this.#lines[currentLine].frameTime;
			currentLine++;
			this.#frames = [];
			for (; currentLine < this.#lines.length; currentLine++) {
				this.#frames.push(this.#lines[currentLine].frames);
			}
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
		return this.flattenFor(this.root, {});
	}

	flattenFor(theJoint, theList) {
		theList[theJoint.name] = theJoint;
		theJoint.children.forEach(el => {
			this.flattenFor(el, theList);
		});
		return theList;
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
		m.rotateY(BvhParser.radians(theJoint.yRotation));
		m.rotateX(BvhParser.radians(theJoint.xRotation));
		m.rotateZ(BvhParser.radians(theJoint.zRotation));

		theJoint.matrix = m;

		if (theJoint.parent !== undefined &&
			theJoint.parent.matrix !== undefined
		) {
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
		theJoint.positionAbsolute = BvhParser.invertY(theJoint.positionAbsolute);


		if (theJoint.children.length > 0) {
			theJoint.children.forEach(el => this.updateJoint(el));
		} else {
			m.translate(theJoint.xEndOffset, theJoint.yEndOffset, theJoint.zEndOffset);
			theJoint.endPositionAbsolute = m.multFast();
			theJoint.endPositionAbsolute = BvhParser.invertY(theJoint.endPositionAbsolute);
		}
	}

	/**  
	 * update
	 * must be called by a program to update 
	 * the skeleton data.
	 */
	update() {
		this.updateJoint(this.root);
		this.#flat = this.flatten();
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
		 * we expect 59 joints (see Broadcast.bvhSkeleton)
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
				channels[Broadcast.bvhSkeleton[index]] = v;
				index++;
			}
			this.processAxisNeuronData({ frameIndex: theFrameIndex, channels });
		} else {
			console.warn(
				'BvhParser.play(), wrong data-count: should be 354 but is',
				dataLength, 'cant play frame'
			);
		}
	}

	/**  
	 * processAxisNeuronData
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
	processAxisNeuronData(theData) {
		let flat = this.flatten();
		Object.keys(theData.channels).forEach(index => {
			flat[index].axisNeuronPositionRotation = theData.channels[index];
		});
	}

	getFrame(theFrame) {
		return this.#frames[theFrame];
	}

	/* getter */

	get id() {
		return this.#id++;
	}

	get root() {
		return this.#rootJoint;
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

	/* setter */

	set center(theFlag) {
		this.#center = theFlag;
	}

	/* static */

	static invertY = (theVec) => {
		theVec.y *= -1;
		return theVec;
	}

	static radians = (degrees) => {
		return degrees * Math.PI / 180;
	}

	/* private variables */

	#joints
	#center
	#currentJoint
	#currentFrame
	#currentLine
	#flat
	#frames
	#frameTime
	#id
	#lines
	#motionLoop
	#nbFrames
	#rootJoint
}


/* 
 * BvhLine
 *
 * A sub-class to read and store single lines 
 * when read from the source .bvh file.
 * 
 */

class BvhLine {

	constructor() {
		this.#lineString = "";
		this.#lineType = "";

		if (arguments.length === 1) {
			this.parse(arguments[0]);
		}
	}

	parse(theLineString) {
		this.#lineString = theLineString.trim();
		let s = this.#lineString.split(" ");
		this.#lineType = this.parseLineType(s);

		if (BvhLine.HIERARCHY === this.#lineType) {
			return;
		} else if (BvhLine.JOINT === this.#lineType) {
			this.#jointType = (s[0] === "ROOT") ? BvhLine.JOINT_TYPE_ROOT : BvhLine.JOINT_TYPE_JOINT;
			this.#jointName = s[1];
			return;
		} else if (BvhLine.OFFSET === this.#lineType) {
			this.#xOffset = parseFloat(s[1]);
			this.#yOffset = parseFloat(s[2]);
			this.#zOffset = parseFloat(s[3]);
			return;
		} else if (BvhLine.CHANNELS === this.#lineType) {
			this.#nbChannels = Number(s[1]);
			this.#channelsProps = [];
			for (let i = 0; i < this.#nbChannels; i++) {
				this.#channelsProps.push(s[i + 2]);
			}
			return;
		} else if (BvhLine.FRAMES === this.#lineType) {
			this.#nbFrames = Number(s[1]);
			return;
		} else if (BvhLine.FRAME_TIME === this.#lineType) {
			this.#frameTime = parseFloat(s[2]);
			return;
		} else if (BvhLine.FRAME === this.#lineType) {
			this.#frames = [];
			s.forEach((el) => {
				this.#frames.push(parseFloat(el));
			});
			return;
		} else if (
			BvhLine.END_SITE === this.#lineType ||
			BvhLine.BRACE_OPEN === this.#lineType ||
			BvhLine.BRACE_CLOSED === this.#lineType ||
			BvhLine.MOTION === this.#lineType) {
			return;
		}

	}

	parseLineType(theStringArray) {
		if ("HIERARCHY" === theStringArray[0]) {
			return BvhLine.HIERARCHY;
		}

		if ("ROOT" === theStringArray[0] ||
			"JOINT" === theStringArray[0]) {
			return BvhLine.JOINT;
		}

		if ("{" === theStringArray[0]) {
			return BvhLine.BRACE_OPEN;
		}

		if ("}" === theStringArray[0]) {
			return BvhLine.BRACE_CLOSED;
		}

		if ("OFFSET" === theStringArray[0]) {
			return BvhLine.OFFSET;
		}

		if ("CHANNELS" === theStringArray[0]) {
			return BvhLine.CHANNELS;
		}

		if ("End" === theStringArray[0]) {
			return BvhLine.END_SITE;
		}

		if ("MOTION" === theStringArray[0]) {
			return BvhLine.MOTION;
		}

		if ("Frames:" === theStringArray[0]) {
			return BvhLine.FRAMES;
		}

		if ("Frame" === theStringArray[0]) {
			return BvhLine.FRAME_TIME;
		}

		if (BvhLine.isFloat(theStringArray[0])) {
			return BvhLine.FRAME;
		}

		return undefined;
	}

	get frames() {
		return this.#frames;
	}

	get frameTime() {
		return this.#frameTime;
	}

	get nbFrames() {
		return this.#nbFrames;
	}

	get channelsProps() {
		return this.#channelsProps;
	}

	get nbChannels() {
		return this.#nbChannels;
	}

	get xOffset() {
		return this.#xOffset;
	}

	get yOffset() {
		return this.#yOffset;
	}

	get zOffset() {
		return this.#zOffset;
	}

	get jointName() {
		return this.#jointName;
	}

	get jointType() {
		return this.#jointType;
	}

	get lineType() {
		return this.#lineType;
	}

	static HIERARCHY = "HIERARCHY";
	static JOINT = "JOINT";
	static BRACE_OPEN = "BRACE_OPEN";
	static BRACE_CLOSED = "BRACE_CLOSED";
	static OFFSET = "OFFSET";
	static CHANNELS = "CHANNELS";
	static END_SITE = "END_SITE";

	static MOTION = "MOTION";
	static FRAMES = "FRAMES";
	static FRAME_TIME = "FRAME_TIME";
	static FRAME = "FRAME";
	static JOINT_TYPE_ROOT = "ROOT";
	static JOINT_TYPE_JOINT = "JOINT";

	static isFloat(n) {
		return Number(n) == n && n % 1 != 0;
	}

	#lineString
	#lineType
	#jointType
	#jointName
	#xOffset
	#yOffset
	#zOffset
	#nbChannels
	#channelsProps
	#nbFrames
	#frameTime
	#frames
}