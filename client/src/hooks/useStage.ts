import p5 from 'p5';

interface Message {
  id: string;
  data: object;
}

export default function useStage(el: HTMLElement, body: Object) {
  const sketch = (g: p5.Graphics): any => {
    let isMove = false;

    let font: p5.Font,
      ry = 0,
      x = 0,
      y = 0,
      z = 0,
      nry = 0,
      nx = 0,
      ny = 100,
      nz = 0;

    g.preload = () => {
      font = g.loadFont('./fonts/SourceCodePro-Medium.otf');
    };

    g.setup = () => {
      g.createCanvas(el.clientWidth, el.clientHeight, g.WEBGL);
      // connectAxis({ target: updateAxisData });
      g.noStroke();
      g.textFont(font);
      g.textSize(24);
      g.textAlign(g.CENTER, g.CENTER);
    };

    g.draw = () => {
      /* update body details first */
      updateBody();

      /* then draw workd and body */
      g.background(0);
      g.lights();
      g.noStroke();

      g.push();
      g.translate(x, y, z);
      g.rotateY(ry);

      /** floor-grid */
      g.push();
      g.rotateX(g.HALF_PI);
      let cx = 4;
      let cy = 4;
      let cs = 200;
      g.translate((-cs * cx) / 2, (-cs * cy) / 2);

      const c0 = 30;
      const c1 = 70;
      for (let x = 0; x < cx; x++) {
        for (let y = 0; y < cy; y++) {
          g.fill(255, x % 2 === 0 ? (y % 2 === 0 ? c0 : c1) : y % 2 === 0 ? c1 : c0);
          g.rect(cs * x, cs * y, cs, cs);
        }
      }

      g.pop();

      /** Bodies */
      Object.keys(body).forEach(id => {
        g.fill(255);
        g.push();
        if (body[id].now['Head']) {
          /** render id */
          g.push();
          let v = body[id].now['Head'];
          g.translate(v[0], v[1], v[2]);
          g.translate(0, -50, 0);
          g.stroke(255, 100);
          g.noFill();
          g.ellipse(0, 0, 40, 40);
          g.fill(255);
          g.text(id, 0, -4);
          g.pop();
        }

        /** render  joints */
        Object.keys(body[id].now).forEach(joint => {
          g.push();
          let v = body[id].now[joint];
          g.translate(v[0], v[1], v[2]);
          g.sphere(2, 4, 4);
          g.pop();
        });
        g.pop();

        const vel = 0.1;

        x += (nx - x) * vel;
        y += (ny - y) * vel;
        z += (nz - z) * vel;
        ry += (nry - ry) * vel;
      });
    };

    g.mouseDragged = evt => {
      if (isMove) {
        // move along x and y axis
        nx += g.mouseX - g.pmouseX;
        ny += g.mouseY - g.pmouseY;
      } else {
        // rotate around Y-axis
        nry += (g.mouseX - g.pmouseX) * 0.02;
      }
    };

    //@ts-ignore
    g.mouseWheel = evt => {
      // event.preventDefault();
      nz += evt.delta;
      return false;
    };

    g.keyPressed = () => {
      /* check if Shift (keyCode 16) key is pressed
       * if so, we are then able to move the body
       * with a mouseDrag, otherwise the mousedrag
       * will affect the rotation of the body,
       * see mouseDragged() below.
       */
      isMove = g.keyCode == 16 ? true : isMove;
    };

    g.keyReleased = () => {
      isMove = g.keyCode == 16 ? false : isMove;
    };

    g.windowResized = () => {
      g.resizeCanvas(g.windowWidth, g.windowHeight);
    };
  };

  function updateBody() {
    /*
     * since data is coming in at a lower update rate
     * than our framerate, lets interpolate between
     * latest coordinates received and current
     * xyz coordinates.
     */
    const vel = 0.1;
    Object.keys(body).forEach(id => {
      const sk = body[id];
      Object.keys(sk.soon).forEach(joint => {
        sk.now[joint][0] += (sk.soon[joint][0] - sk.now[joint][0]) * vel;
        sk.now[joint][1] += (sk.soon[joint][1] - sk.now[joint][1]) * vel;
        sk.now[joint][2] += (sk.soon[joint][2] - sk.now[joint][2]) * vel;
        if (sk.now[joint].length == 6) {
          // TODO add rotation
        }
      });
    });
  }

  function updateAxisData(theMessage: Message) {
    const { id, data } = theMessage;

    // if (body[id] === undefined) {
    //   body[id] = { now: data, soon: data };
    // } else {
    //   body[id].soon = data;
    // }

    body[id] = body[id] === undefined ? { now: data, soon: data } : body[id];
    body[id].soon = data;
  }

  const myp5 = new p5(sketch, el);

  return { target: updateAxisData };
}
