const body = {};
let ry = 0,
  x = 0,
  y = 0,
  z = 0,
  nry = 0,
  nx = 0,
  ny = 100,
  nz = 0;

let isMove = false;
let font;

function preload() {
  font = loadFont('assets/SourceCodePro-Medium.otf');
}
function setup() {
  createCanvas(windowWidth, windowHeight, WEBGL);
  connectAxis({ target: this.updateAxisData });
  noStroke();
  textFont(font);
  textSize(24);
  textAlign(CENTER, CENTER);
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

  const c0 = 10;
  const c1 = 20;
  for (let x = 0; x < cx; x++) {
    for (let y = 0; y < cy; y++) {
      fill(255, x % 2 === 0 ? (y % 2 === 0 ? c0 : c1) : y % 2 === 0 ? c1 : c0);
      rect(cs * x, cs * y, cs, cs);
    }
  }

  pop();

  /** Bodies */
  Object.keys(body).forEach((id) => {
    fill(255);
    push();
    if (body[id].now['Head']) {
      /** render id */
      push();
      let v = body[id].now['Head'];
      translate(v[0], v[1], v[2]);
      translate(0, -50, 0);
      stroke(255, 100);
      noFill();
      ellipse(0, 0, 40, 40);
      fill(255);
      text(id, 0, -4);
      pop();
    }

    /** render  joints */
    Object.keys(body[id].now).forEach((joint) => {
      push();
      let v = body[id].now[joint];
      translate(v[0], v[1], v[2]);
      sphere(2, 4, 4);
      pop();
    });
    pop();
  });
  pop();

  const vel = 0.1;

  x += (nx - x) * vel;
  y += (ny - y) * vel;
  z += (nz - z) * vel;
  ry += (nry - ry) * vel;
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
  const vel = 0.1;
  Object.keys(body).forEach((id) => {
    const sk = body[id];
    Object.keys(sk.soon).forEach((joint) => {
      sk.now[joint][0] += (sk.soon[joint][0] - sk.now[joint][0]) * vel;
      sk.now[joint][1] += (sk.soon[joint][1] - sk.now[joint][1]) * vel;
      sk.now[joint][2] += (sk.soon[joint][2] - sk.now[joint][2]) * vel;
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
