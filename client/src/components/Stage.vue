<template>
  <div class="stage-container d-flex justify-content-center align-items-center h-100">
    <div id="sketch" ref="sketchTemplate" />
  </div>
</template>

<script lang="ts">
import { defineComponent, onMounted, ref, Ref } from '@vue/composition-api';
import p5 from 'p5';
import msgpack from '@ygoe/msgpack';

interface Message {
  id: string;
  data: object;
}

interface ConnectAxisOptions {
  groupId?: string;
  port?: number;
  id?: number;
  target?: (msg: Message) => void;
}

export default defineComponent({
  props: {
    body: {
      type: Object,
      required: true,
    },
  },

  setup(props, { emit }) {
    const sketchTemplate: Ref<HTMLElement | undefined> = ref(undefined);
    let isMove = false;

    onMounted(() => {
      const sketch = (g: p5.Graphics): any => {
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
          g.createCanvas(
            sketchTemplate.value?.clientWidth ?? 0,
            sketchTemplate.value?.clientHeight ?? 0,
            g.WEBGL,
          );
          connectAxis({ target: updateAxisData });
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
          Object.keys(props.body).forEach(id => {
            g.fill(255);
            g.push();
            if (props.body[id].now['Head']) {
              /** render id */
              g.push();
              let v = props.body[id].now['Head'];
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
            Object.keys(props.body[id].now).forEach(joint => {
              g.push();
              let v = props.body[id].now[joint];
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

      const myp5 = new p5(sketch, sketchTemplate.value);
    });

    function updateBody() {
      /*
       * since data is coming in at a lower update rate
       * than our framerate, lets interpolate between
       * latest coordinates received and current
       * xyz coordinates.
       */
      const vel = 0.1;
      Object.keys(props.body).forEach(id => {
        const sk = props.body[id];
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

    function connectAxis(options: ConnectAxisOptions = {}) {
      const groupId = options.groupId || 'axis';
      const port = options.port || 5080;
      const id = options.id || Math.round(Math.random() * 1000);
      const target =
        options.target ||
        (d => {
          console.log(d);
        });
      const isSecure = false;

      /** extract server url */
      const url =
        window.location.hostname === 'localhost'
          ? 'ws://localhost:' + port
          : isSecure
          ? 'wss://' + window.location.hostname + ':' + port
          : 'ws://' + window.location.hostname + ':' + port;

      // const url = `ws://143.110.161.85:${port}`;

      /** start websocket and connect to url */
      const ws = new WebSocket(url);

      ws.onopen = function() {
        console.log(`opening websocket to ${url}`);

        /** we are expecting arraybuffers, data wrapped into bytes */
        ws.binaryType = 'arraybuffer';
        /**
         * we are using msgpack to serialize
         * and deserialize data and send as bytes, string
         * formated data is ignored on the server.
         */
        ws.send(msgpack.serialize({ address: 'subscribe', args: { id: 'axis-web' } })); /** OK */
        // ws.send({ register: 'abc', id: 123 }); /** ignored */
      };

      /** incoming messages are received here, we expect
       * bytes and not strings. data is deserialised with
       * the msgpack library by https://github.com/ygoe/msgpack.js
       * and must be included locally (on the server).
       */
      ws.onmessage = function(ev) {
        // console.log(ev);

        const packet = msgpack.deserialize(ev.data);
        const { address, args } = packet;
        if (address === 'pn') {
          args.forEach((el: any) => {
            target(el);
          });
        }
        if (address === 'settings') {
          console.log(args);
          // document.getElementById('settings-label').innerHTML = args.label;
          // document.getElementById('settings-json').innerHTML = JSON.stringify(args.broadcast, null, 2);
        } else {
          /** else we received maybe a system message */
        }
      };
    }

    function updateAxisData(theMessage: Message) {
      const { id, data } = theMessage;

      if (props.body[id] === undefined) {
        emit('update:body', { ...props.body, [id]: { now: data, soon: data } });
      } else {
        props.body[id].soon = data;
      }

      // props.body[id] = props.body[id] === undefined ? { now: data, soon: data } : props.body[id];
      // props.body[id].soon = data;
    }

    return {
      sketchTemplate,
    };
  },
});
</script>

<style lang="scss" scoped>
@import '../assets/scss/custom.scss';

.stage-container {
  background-color: $black;
}

#sketch {
  width: 99%;
  height: 99%;
}
</style>
