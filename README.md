# Setup
1. Download the program file for foxglove https://foxglove.dev/download
2. Install Foxglove studio: Open a terminal where you downloaded the file and install the version of the file you downloaded (replace the * by your version)
```bash
sudo apt install ./foxglove-studio-*.deb
```
To update the version when it is installed :
```bash
sudo apt update
sudo apt install foxglove-studio
```
3a. Install Beautifulsoup4 for python

```bash
pip install beautifulsoup4
```
3b. Install Beautifulsoup4 for python

```bash
pip install -U pip setuptools wheel
pip install launchpadlib
pip install ruamel.yaml
```
4. Clone the repo of foxglove

```bash
mkdir ~/foxglove
cd ~/foxglove
git clone https://github.com/EPFLRocketTeam/foxglove.git
```
5. Add the extension

```bash
mkdir -p ~/.foxglove-studio/extensions
cp ~/foxglove/foxglove/foxglove_extension_1.0.1.foxe ~/.foxglove-studio/extensions/foxglove_extension_1.0.1.foxe
```
6. Go to ~/.foxglove-studio/extensions and extract the file (right click -> Extract here)
7. If real_time_simulator doesn't have a /log folder
```bash
cd ~/catkin_ws/src/real_time_simulator/
mkdir log
```

8. Launch foxglove (No need to connect to ROS)
9. In the Layouts tab (second from the top on the left), Click on the file "Import layout" and import the Simulator.json layout that is in the  /home/foxglove/foxglove/layouts folder
10. In foxglove, at the bottom left, there is a Preference tab with a screw icon. Click on it and change the ROS_PACKAGE_PATH value with your path to the ROS src : ex. /home/user/catkin_ws/src

11. Close Foxglove studio
12. You can now launch the simulator by executing the startup.sh script in real_time_simulator
```bash
cd ~/catkin_ws
./src/real_time_simulator/bash_scripts/startup.sh
```

13. Note: In the simulator, only the launchFiles containing "rocket" will be displayed


# Develop an extension
You have a tutorial on how to create an extension for foxglove here https://foxglove.dev/docs/studio/extensions/getting-started

You will need to install <a href="https://nodejs.org/en/">Node.js 14+</a> and <a href="">Yarn</a> if you don't already have them 

You will need to create a directory that will contain your extensions,


# Build project
To build the project, you need to go into your extension folder and execute one of the following commands : 

1. This command builds the project but the changes are not visible in foxglove. It tells you if you have syntax errors.
```bash
yarn build
```
2. This command builds the project and pushes the changes to foxglove. To see the changes, you have to restart foxglove.

```bash
yarn local-install
```

# How to communicate with ROS (dev only)

You can find more infos at <a href="https://foxglove.dev/docs/studio/extensions/panel-api-methods">this link</a>.

## Publish on a topic
To advertise on a topic using basic message type : 
``` js
context.advertise?.("/topic", "std_msgs/String", {
      datatypes: new Map(
        Object.entries({
          "std_msgs/String": { definitions: [{ name: "data", type: "string" }] },
        }),
      ),
    });
```
and then publish :

``` js
context.publish?.("/topic", { data: 'value' });
```

To use custom message types, the second argument is {package}/{TypeName}. 

ex:

```js
// Advertise update topic
    context.advertise?.("/updateTopic", "real_time_simulator/Update", {
      datatypes: new Map(
        Object.entries({
          "real_time_simulator/Update": {definitions: [
            { type: "string", name: "config"},
            { type: "string", name: "parameter"},
            { type: "string", name: "value"},
        ]}
        }),
      ),
    });
```

## Subscribe to a topic

To subscribe to a topic and get the messages, you first need to say that you want your layout to update every time you get a message on a topic using this line inside the useLayoutEffect block:

```js
context.watch("currentFrame");
```

Then, you need to subscribe to the topics using this line :

```js
context.subscribe(["/topic1", "/topic2", ...]);
```

Calling subscribe with no topics will unsubscribe from all topics.

After that, all messages from all topics subsribed that are recieved will be availaibe during one refresh in this variable :

```js
renderState.currentFrame
```
