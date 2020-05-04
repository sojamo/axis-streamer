let body = {};
let ry = 0,
  x = 0,
  y = 0;
let isMove = false;

function setup() {
  createCanvas(windowWidth, windowHeight, WEBGL);
  connectAxis({ target: this.updateAxisData });
  noStroke();
}

function draw() {
  /* update skeleton details first */
  updateSkeleton();

  /* then draw workd and skeleton */
  background(0);
  lights();
  noStroke();
  fill(255);
  push();
  translate(x, y);
  rotateY(ry);
  Object.keys(body).forEach((id) => {
    push();
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
}

function keyPressed() {
  /* check if Shift (keyCode 16) key is pressed
   * if so, we are then able to move the skeleton
   * with a mouseDrag, otherwise the mousedrag
   * will affect the rotation of the skeleton,
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
    x += mouseX - pmouseX;
    y += mouseY - pmouseY;
  } else {
    // rotate around Y-axis
    ry += (pmouseX - mouseX) * 0.1;
  }
}

function updateSkeleton() {
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
