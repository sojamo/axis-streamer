let body = {};
let ry = 0,
  x = 0,
  y = 0,
  z = 0,
  nry = 0,
  nx = 0,
  ny = 100,
  nz = 0;

let isMove = false;

function setup() {
  createCanvas(windowWidth, windowHeight, WEBGL);
  connectAxis({ target: this.updateAxisData });
  noStroke();
}

function draw() {
  /* update body details first */
  updateBody();

  /* then draw workd and body */
  background(0);
  lights();
  noStroke();

  push();
  translate(x, y, z);
  rotateY(ry);

  /** floor-grid */
  push();
  rotateX(HALF_PI);
  let cx = 4;
  let cy = 4;
  let cs = 200;
  translate((-cs * cx) / 2, (-cs * cy) / 2);

  for (let x = 0; x < cx; x++) {
    for (let y = 0; y < cy; y++) {
      fill(255, x % 2 === 0 ? (y % 2 === 0 ? 30 : 60) : y % 2 === 0 ? 60 : 30);
      rect(cs * x, cs * y, cs, cs);
    }
  }

  pop();

  /** Bodies */
  Object.keys(body).forEach((id) => {
    fill(255);
    push();
    Object.keys(body[id].now).forEach((joint) => {
      push();
      let v = body[id].now[joint];
      translate(v[0], v[1], v[2]);
      sphere(2, 4, 4);
      pop();
    });
    pop();
    translate(-200, 0, 0);
    rotateY(HALF_PI);
  });
  pop();

  x += (nx - x) * 0.1;
  y += (ny - y) * 0.1;
  z += (nz - z) * 0.1;
  ry += (nry - ry) * 0.1;
}

function keyPressed() {
  /* check if Shift (keyCode 16) key is pressed
   * if so, we are then able to move the body
   * with a mouseDrag, otherwise the mousedrag
   * will affect the rotation of the body,
   * see mouseDragged() below.
   */
  isMove = keyCode == 16 ? true : isMove;
}

function keyReleased() {
  isMove = keyCode == 16 ? false : isMove;
}

function mouseDragged() {
  if (isMove) {
    // move along x and y axis
    nx += mouseX - pmouseX;
    ny += mouseY - pmouseY;
  } else {
    // rotate around Y-axis
    nry += (mouseX - pmouseX) * 0.02;
  }
}

function mouseWheel(event) {
  // event.preventDefault();
  nz += event.delta;
  return false;
}

function updateBody() {
  /*
   * since data is coming in at a lower update rate
   * than our framerate, lets interpolate between
   * latest coordinates received and current
   * xyz coordinates.
   */
  const s = 0.1;
  Object.keys(body).forEach((id) => {
    const sk = body[id];
    Object.keys(sk.soon).forEach((joint) => {
      sk.now[joint][0] += (sk.soon[joint][0] - sk.now[joint][0]) * s;
      sk.now[joint][1] += (sk.soon[joint][1] - sk.now[joint][1]) * s;
      sk.now[joint][2] += (sk.soon[joint][2] - sk.now[joint][2]) * s;
      if (sk.now[joint].length == 6) {
        // TODO add rotation
      }
    });
  });
}

function updateAxisData(theMessage) {
  const { id, data } = theMessage;
  body[id] = body[id] === undefined ? { now: data, soon: data } : body[id];
  body[id].soon = data;
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}
