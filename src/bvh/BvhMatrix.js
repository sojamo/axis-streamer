/**
 * BvhMatrix
 * 
 * A slimmed down Matrix class to perform required Matrix calculations
 * when converting from local to global joint coordinates.
 * 
 * adapted from Processing's PMatrix3D
 * https://github.com/processing/processing/blob/master/core/src/processing/core/PMatrix3D.java
 * 
 * a matrix javascript alternative is gl-matrix library
 * https://github.com/toji/gl-matrix http://glmatrix.net/
 * 
 */

export default class BvhMatrix {

	constructor() {
		this.reset();
	}

	reset() {
		this.set(
			1, 0, 0, 0,
			0, 1, 0, 0,
			0, 0, 1, 0,
			0, 0, 0, 1);
	}

	set(
		m00, m01, m02, m03,
		m10, m11, m12, m13,
		m20, m21, m22, m23,
		m30, m31, m32, m33) {
		this.m00 = m00;
		this.m01 = m01;
		this.m02 = m02;
		this.m03 = m03;
		this.m10 = m10;
		this.m11 = m11;
		this.m12 = m12;
		this.m13 = m13;
		this.m20 = m20;
		this.m21 = m21;
		this.m22 = m22;
		this.m23 = m23;
		this.m30 = m30;
		this.m31 = m31;
		this.m32 = m32;
		this.m33 = m33;
	}



	translate(tx, ty) {
		this.translate(tx, ty, 0);
	}

	translate(tx, ty, tz) {
		this.m03 += tx * this.m00 + ty * this.m01 + tz * this.m02;
		this.m13 += tx * this.m10 + ty * this.m11 + tz * this.m12;
		this.m23 += tx * this.m20 + ty * this.m21 + tz * this.m22;
		this.m33 += tx * this.m30 + ty * this.m31 + tz * this.m32;
	}

	rotate(angle) {
		this.rotateZ(angle);
	}


	rotateX(angle) {
		let c = Math.cos(angle);
		let s = Math.sin(angle);
		this.apply(1, 0, 0, 0, 0, c, -s, 0, 0, s, c, 0, 0, 0, 0, 1);
	}


	rotateY(angle) {
		let c = Math.cos(angle);
		let s = Math.sin(angle);
		this.apply(c, 0, s, 0, 0, 1, 0, 0, -s, 0, c, 0, 0, 0, 0, 1);
	}


	rotateZ(angle) {
		let c = Math.cos(angle);
		let s = Math.sin(angle);
		this.apply(c, -s, 0, 0, s, c, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1);
	}

	apply(
		n00, n01, n02, n03,
		n10, n11, n12, n13,
		n20, n21, n22, n23,
		n30, n31, n32, n33) {

		let r00 = this.m00 * n00 + this.m01 * n10 + this.m02 * n20 + this.m03 * n30;
		let r01 = this.m00 * n01 + this.m01 * n11 + this.m02 * n21 + this.m03 * n31;
		let r02 = this.m00 * n02 + this.m01 * n12 + this.m02 * n22 + this.m03 * n32;
		let r03 = this.m00 * n03 + this.m01 * n13 + this.m02 * n23 + this.m03 * n33;

		let r10 = this.m10 * n00 + this.m11 * n10 + this.m12 * n20 + this.m13 * n30;
		let r11 = this.m10 * n01 + this.m11 * n11 + this.m12 * n21 + this.m13 * n31;
		let r12 = this.m10 * n02 + this.m11 * n12 + this.m12 * n22 + this.m13 * n32;
		let r13 = this.m10 * n03 + this.m11 * n13 + this.m12 * n23 + this.m13 * n33;

		let r20 = this.m20 * n00 + this.m21 * n10 + this.m22 * n20 + this.m23 * n30;
		let r21 = this.m20 * n01 + this.m21 * n11 + this.m22 * n21 + this.m23 * n31;
		let r22 = this.m20 * n02 + this.m21 * n12 + this.m22 * n22 + this.m23 * n32;
		let r23 = this.m20 * n03 + this.m21 * n13 + this.m22 * n23 + this.m23 * n33;

		let r30 = this.m30 * n00 + this.m31 * n10 + this.m32 * n20 + this.m33 * n30;
		let r31 = this.m30 * n01 + this.m31 * n11 + this.m32 * n21 + this.m33 * n31;
		let r32 = this.m30 * n02 + this.m31 * n12 + this.m32 * n22 + this.m33 * n32;
		let r33 = this.m30 * n03 + this.m31 * n13 + this.m32 * n23 + this.m33 * n33;

		this.m00 = r00;
		this.m01 = r01;
		this.m02 = r02;
		this.m03 = r03;
		this.m10 = r10;
		this.m11 = r11;
		this.m12 = r12;
		this.m13 = r13;
		this.m20 = r20;
		this.m21 = r21;
		this.m22 = r22;
		this.m23 = r23;
		this.m30 = r30;
		this.m31 = r31;
		this.m32 = r32;
		this.m33 = r33;
	}

	preApplyMatrix(theMatrix) {
		this.preApply(
			theMatrix.m00, theMatrix.m01, theMatrix.m02, theMatrix.m03,
			theMatrix.m10, theMatrix.m11, theMatrix.m12, theMatrix.m13,
			theMatrix.m20, theMatrix.m21, theMatrix.m22, theMatrix.m23,
			theMatrix.m30, theMatrix.m31, theMatrix.m32, theMatrix.m33);
	}


	preApply(
		n00, n01, n02, n03,
		n10, n11, n12, n13,
		n20, n21, n22, n23,
		n30, n31, n32, n33) {
		let r00 = n00 * this.m00 + n01 * this.m10 + n02 * this.m20 + n03 * this.m30;
		let r01 = n00 * this.m01 + n01 * this.m11 + n02 * this.m21 + n03 * this.m31;
		let r02 = n00 * this.m02 + n01 * this.m12 + n02 * this.m22 + n03 * this.m32;
		let r03 = n00 * this.m03 + n01 * this.m13 + n02 * this.m23 + n03 * this.m33;

		let r10 = n10 * this.m00 + n11 * this.m10 + n12 * this.m20 + n13 * this.m30;
		let r11 = n10 * this.m01 + n11 * this.m11 + n12 * this.m21 + n13 * this.m31;
		let r12 = n10 * this.m02 + n11 * this.m12 + n12 * this.m22 + n13 * this.m32;
		let r13 = n10 * this.m03 + n11 * this.m13 + n12 * this.m23 + n13 * this.m33;

		let r20 = n20 * this.m00 + n21 * this.m10 + n22 * this.m20 + n23 * this.m30;
		let r21 = n20 * this.m01 + n21 * this.m11 + n22 * this.m21 + n23 * this.m31;
		let r22 = n20 * this.m02 + n21 * this.m12 + n22 * this.m22 + n23 * this.m32;
		let r23 = n20 * this.m03 + n21 * this.m13 + n22 * this.m23 + n23 * this.m33;

		let r30 = n30 * this.m00 + n31 * this.m10 + n32 * this.m20 + n33 * this.m30;
		let r31 = n30 * this.m01 + n31 * this.m11 + n32 * this.m21 + n33 * this.m31;
		let r32 = n30 * this.m02 + n31 * this.m12 + n32 * this.m22 + n33 * this.m32;
		let r33 = n30 * this.m03 + n31 * this.m13 + n32 * this.m23 + n33 * this.m33;

		this.m00 = r00;
		this.m01 = r01;
		this.m02 = r02;
		this.m03 = r03;
		this.m10 = r10;
		this.m11 = r11;
		this.m12 = r12;
		this.m13 = r13;
		this.m20 = r20;
		this.m21 = r21;
		this.m22 = r22;
		this.m23 = r23;
		this.m30 = r30;
		this.m31 = r31;
		this.m32 = r32;
		this.m33 = r33;
	}

	multFast() {
		return { x: this.m03, y: this.m13, z: this.m23 };
	}

	mult(source) {
		const result = { x: 0, y: 0, z: 0 };
		result.x = this.m00 * source.x + this.m01 * source.y + this.m02 * source.z + this.m03;
		result.y = this.m10 * source.x + this.m11 * source.y + this.m12 * source.z + this.m13;
		result.z = this.m20 * source.x + this.m21 * source.y + this.m22 * source.z + this.m23;
		return result;
	}

	toString() {
		return "[\n" +
			this.m00 + ", " + this.m01 + ", " + this.m02 + ", " + this.m03 + "\n" +
			this.m10 + ", " + this.m11 + ", " + this.m12 + ", " + this.m13 + "\n" +
			this.m20 + ", " + this.m21 + ", " + this.m22 + ", " + this.m23 + "\n" +
			this.m30 + ", " + this.m31 + ", " + this.m32 + ", " + this.m33 + "\n" +
			"]";
	}
}
