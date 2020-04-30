/**
 * axis-streamer OSC receiver for Processing.
 
 * requires axis-streamer to stream skeleton-coordinates 
 * over OSC and the OscP5 library (install via Add Library)
 *
 * https://github.com/sojamo/axis-streamer
 *
 */

import oscP5.*;
import netP5.*;

OscP5 osc;
NetAddress remote;
float x, nx;
float y, ny;
float z, nz;
float[][] nxyz = new float[24][3];
float[][] xyz = new float[24][3];
float[] offset = new float[6];
boolean isMove = false;

void setup() {
  size(400, 800, P3D);
  pixelDensity(2);

  osc = new OscP5(this, 5000);

  /* OSC messages are received by function
   * oscEvent() below, check for more details about
   * messages parsed and address patterns accepted.
   */

  noStroke();
  background(0);
}


void draw() {

  /* first update the data we receive
   * since data is coming in at a lower update rate
   * than our framerate, lets interpolate between 
   * latest coordinates received and current 
   * xyz coordinates.
   *
   */

  float s = 0.1;
  for (int i=0; i<xyz.length; i++) {
    xyz[i][0] += (nxyz[i][0] - xyz[i][0]) * s;
    xyz[i][1] += (nxyz[i][1] - xyz[i][1]) * s;
    xyz[i][2] += (nxyz[i][2] - xyz[i][2]) * s;
  }

  /* now lets draw the world and the skeleton */

  background(0);
  noStroke();
  fill(255);

  float x = width/2 + offset[0];
  float y = height/2 + offset[1];
  float z = offset[2];
  float rx = offset[3];
  float ry = offset[4];
  float rz = offset[5];
  translate(x, y, z);
  rotateX(rx);
  rotateY(ry);
  rotateZ(rz);

  for (float[] v : xyz) {
    push();
    translate(v[0], v[1], v[2]);
    sphere(2);
    pop();
  }
}

void keyPressed() {

  /* check if Shift (keyCode 16) key is pressed
   * if so, we are then able to move the skeleton 
   * with a mouseDrag, otherwise the mousedrag
   * will affect the rotation of the skeleton,
   * see mouseDragged() below.
   */
  isMove = keyCode == 16 ? true:isMove;
}

void keyReleased() {
  isMove = keyCode == 16 ? false:isMove;
}

void mouseDragged() {
  if (isMove) { // move along x and y axis
    offset[0] += ((mouseX - pmouseX));
    offset[1] += ((mouseY - pmouseY));
  } else { // rotate around Y-axis
    offset[4] += ((mouseX - pmouseX)*0.1) * 0.1;
  }
}

void oscEvent(OscMessage theMessage) {

  final String prefix = "/pn/1";

  if (
    theMessage.addrPattern().startsWith(prefix) &&
    theMessage.addrPattern().contains("/all/position/absolute")
    ) {

    // println(theMessage.getAddress(), theMessage.getTypetag().length());
    // default skeleton (without fingers, 24 elements)  : 72 floats

    int index = 0;
    for (int i=0; i<theMessage.arguments().length; i+=3) {
      nxyz[index][0] = theMessage.get(i + 0).floatValue();
      nxyz[index][1] = theMessage.get(i + 1).floatValue();
      nxyz[index][2] = theMessage.get(i + 2).floatValue();
      index++;
    }
  } else {
    println(theMessage.addrPattern());
  }
}
