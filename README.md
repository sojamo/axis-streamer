# Axis Streamer


A node.js based Axis Neuron mocap reader that listens for streams of data coming from the Axis Neuron applications. Data is streamed over UDP as BVH-binary version 1.1.0.0 so that it can be read and interpreted by this program.

Data is streamed over UDP port 7002. When data arrives and is parsed, the following options are available:

1. __OSC broadcast__ forward data to OSC over UDP to other OSC clients (by default listening on port 5000)
2. __WebSocket__ send data to a web-app


## Installation

- open the terminal
- install node and yarn if you haven't done so yet, an installer is available from the [nodejs website](https://nodejs.org/en/download/). These are 2 alternatives to install nodejs with [brew](https://brew.sh/) or [nvm](https://github.com/nvm-sh/nvm).
- check if node and yarn are properly installed by typing `node --version` and `yarn --version` in the terminal
- install npx with `yarn global add npx`
- clone the project-repository from https://github.com/sojamo/axis-streamer.git to your computer `git clone https://github.com/sojamo/axis-streamer.git`
- `cd` into the repository root folder `cd axis-streamer`
- install project dependencies with `yarn`
- run `yarn run stream` for streaming data from Axis Neuron (see details below) or `yarn run load` to load and playback a .bvh file (see dev/loader.js for details)
- open http://localhost:5080

To stream data from Axis Neuron:

- open Axis Neuron 
- open a .raw mocap file
- after the file is loaded, use the play-buttons inside the _Control editing_ pane to start the playback, you can increase the playback speed on the right and set the playback to loop (see loop-icon)
- under _Preferences → Output format_ set _Frequency reducing_ to a value below 1 and make sure _Rotation_ is set to _YXZ_
- under _Preferences → Broadcasting_ choose _UDP_ and scroll down to section _BVH_. Here tick _enable_, set _Format_ to _Binary_, the _Client Port_ should be 7002
- confirm with _OK_
- data should now stream to our program and animate the skeleton in the browser at http://localhost:5080

## Ports

- __7002__ Axis Neuron 
- __5000__ OSC
- __5080__ HTTP and WebSocket, when axis streamer is running, open a browser window and http://localhost:5080


## Examples 

There are 3 examples inside the examples folder for

- OpenFrameworks over UDP and OSC
- Processing over UDP and OSC
- p5js over WebSocket


## Status

- This project is currently under development
- The purpose of this project is to take data streamed from Axis Neuron or from a .bvh file, translated angular position data to absoulte position coordinates and streamed them out over WebSocket or OSC




