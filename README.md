# Axis Streamer

A Node.js based Axis Neuron mocap reader that listens for streams of data coming from the Axis Neuron application. Data is streamed over UDP as BVH-binary version 1.1.0.0 so that it can be read and interpreted by the axis-streamer application.

Data is streamed from Axis Neuron over UDP port 7002. When data arrives and is parsed, the following options are available:

1. **OSC broadcast**: forward absolute joint positions as OSC messages over UDP to OSC receivers
2. **WebSocket**: send absolute joint positions to a web-app listening on default port 5080

Alternatively, data can be read and played back from one or more .bvh files.

## Installation

### Install Command Line Tools

- open a Terminal
- install [Node.js](https://nodejs.org/en/) and the [yarn](https://yarnpkg.com/) package manager if you haven't done so yet, an installer is available from the [Node.js website](https://nodejs.org/en/download/). Alternatively use [brew](https://brew.sh/) or [nvm](https://github.com/nvm-sh/nvm).
- check if Node.js and yarn are properly installed by typing `node --version` and `yarn --version` in the terminal
- install npx with `yarn global add npx`

### Setting up

Before you start, the folder structure for Axis-Streamer should look like this assuming your project's root folder is called _movement-project_

```
movement-project
├── external
|   ├── app
|   ├── storage
|   |   ├── bvh
|   |   └── settings
```

1. use the Terminal to cd into the directory where you want your project to live eg. `cd ~/Documents` and create a folder which you want to use as your working directory eg. _movement-project_ with `mkdir movement-project` then change directory with `cd movement-project`
2. inside working directory _movement-project_ a folder structure as outlined above is required.
3. then clone the axis-streamer repository from https://github.com/sojamo/axis-streamer.git with `git clone https://github.com/sojamo/axis-streamer.git` into the working directory.
4. `cd` into the repository's root folder `cd axis-streamer`
5. install project dependencies with running `yarn`
6. call `yarn run help` for a list of options, or call `yarn run with --mode stream` for streaming data from Axis Neuron (see details below) or use `yarn run with --mode load` to load and playback a .bvh file (files should be located inside folder _external → storage → bvh_), call `yarn run with --mode streamload` to load and stream data simultaneously.
7. open http://localhost:5080 in your browser, you should see a black 3D space with a checkered-board plane and one or more body representations.

After you have completed the above steps, your folder structure should look like this

```
movement-project
├── axis-streamer
├── external
|   ├── app
|   ├── storage
|   |   ├── bvh
|   |   └── settings
```

### Update project

- cd into your working directory eg. _movement-project_ and `git pull` to update to the latest version

## Settings

Axis-Streamer uses a json file to customize settings, these settings files go into _movement-project → external → storage → settings_. See the wiki at [wiki/Settings](https://github.com/sojamo/axis-streamer/wiki/Settings) for a detailed breakdown.

## Streaming Data

the following assumes that you are using a Terminal and you are `cd`'ed into your working directory.

### Real-time

To stream data from Axis Neuron cd into your working directory and use `yarn run with --mode stream`

- open Axis Neuron
- open a .raw mocap file or connect your sensor suit
- after the file is loaded, use the play-buttons inside the _Control editing_ pane to start the playback, you can increase the playback speed on the right and set the playback to loop (see loop-icon)
- under _Preferences → Output format_ set _Frequency reducing_ to a value below 1 and make sure _Rotation_ is set to _YXZ_ and _Displacement_ is ticked.
- under _Preferences → Broadcasting_ choose _UDP_ and scroll down to section _BVH_. Here tick _enable_, set _Format_ to _Binary_, the _Client Port_ should be 7002
- confirm with _OK_
- data should now stream to the application and animate the skeleton in the browser at http://localhost:5080

### From file

To stream data from file(s) use `yarn run with --mode load`. You need to place a .bvh file named eg. `test.bvh` (you can **copy** test.bvh located inside folder assets for a start) into folder _external → storage → bvh_ after which you need to update the filePath to the(se) file(s) in your Settings file ([breakdown of settings](https://github.com/sojamo/axis-streamer/wiki/Settings)).

```
movement-project
├── axis-streamer
├── external
|   ├── app
|   ├── storage
|   |   ├── bvh   ⟵
|   |   └── settings
```

## Stream and File

To accept both, streams and files, use `yarn run with --mode streamload`

## Ports

- **7002** Axis Neuron (UDP)
- **5000** OSC (UDP)
- **5080** when axis-streamer is running, open a browser window and point at http://localhost:5080 (HTTP and WebSocket)

## Examples

There are 3 examples inside the examples folder for

- OpenFrameworks over UDP and OSC
- Processing over UDP and OSC
- p5js over WebSocket

## Status

- This project is currently under development
- The purpose of this project is to take data streamed from Axis Neuron or from a .bvh file, translate angular position data to absolute position coordinates and streame these out over WebSocket and OSC
- Able to send and receive multiple streams
