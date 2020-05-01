# Axis Streamer


A Node.js based Axis Neuron mocap reader that listens for streams of data coming from the Axis Neuron application. Data is streamed over UDP as BVH-binary version 1.1.0.0 so that it can be read and interpreted by the axis-streamer application.

Data is streamed from Axis Neuron over UDP port 7002. When data arrives and is parsed, the following options are available:

1. __OSC broadcast__ forward absolute joint positions as OSC messages over UDP to OSC receivers (by default receivers listening on port 5000)
2. __WebSocket__ send absolute joint positions to a web-app listening at default port 5080

Alternatively data can be read and played back from a .bvh file (see [dev/loader.js](dev/loader.js)) or joints can be animated in code (see [dev/sim.js](dev/sim.js)).


## Installation

- open a Terminal
- install [Node.js](https://nodejs.org/en/) and the [yarn](https://yarnpkg.com/) package manager if you haven't done so yet, an installer is available from the [Node.js website](https://nodejs.org/en/download/). Alternatively use [brew](https://brew.sh/) or [nvm](https://github.com/nvm-sh/nvm).
- check if Node.js and yarn are properly installed by typing `node --version` and `yarn --version` in the terminal
- install npx with `yarn global add npx`
- clone the project-repository from https://github.com/sojamo/axis-streamer.git to your computer `git clone https://github.com/sojamo/axis-streamer.git`
- `cd` into the repository's root folder `cd axis-streamer`
- install project dependencies with running `yarn`
- call `yarn run stream` for streaming data from Axis Neuron (see details below) or use `yarn run load` to load and playback a .bvh file (see dev/loader.js for details) or use a simulation `yarn run sim`.
- open http://localhost:5080

## Streaming Data

### Real-time

To stream data from Axis Neuron use `yarn run stream`

- open Axis Neuron 
- open a .raw mocap file or connect your sensor suit
- after the file is loaded, use the play-buttons inside the _Control editing_ pane to start the playback, you can increase the playback speed on the right and set the playback to loop (see loop-icon)
- under _Preferences → Output format_ set _Frequency reducing_ to a value below 1 and make sure _Rotation_ is set to _YXZ_
- under _Preferences → Broadcasting_ choose _UDP_ and scroll down to section _BVH_. Here tick _enable_, set _Format_ to _Binary_, the _Client Port_ should be 7002
- confirm with _OK_
- data should now stream to the application and animate the skeleton in the browser at http://localhost:5080

### From file

To stream data from file use `yarn run load`. You need to place a .bvh file named `test-load.bvh` into folder `external/storage`. the following folder structure is required. This file is not included int the repo since it tends to be in the MB-size.

```
axis-streamer/
external/
├── app/
├── storage/
```

### Simulation 

To stream data from code use `yarn run sim`. This will call script [dev/sim.js](dev/sim.js) which animates one leg and one arm swinging back and forth, left and right.


## Ports

- __7002__ Axis Neuron 
- __5000__ OSC
- __5080__ HTTP and WebSocket, when axis-streamer is running, open a browser window and point at http://localhost:5080


## Examples 

There are 3 examples inside the examples folder for

- OpenFrameworks over UDP and OSC
- Processing over UDP and OSC
- p5js over WebSocket


## Status

- This project is currently under development
- The purpose of this project is to take data streamed from Axis Neuron or from a .bvh file, translated angular position data to absolute position coordinates and streamed these out over WebSocket or OSC




