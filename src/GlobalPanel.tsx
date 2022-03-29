import { PanelExtensionContext, RenderState, Topic, MessageEvent } from "@foxglove/studio";
import { useLayoutEffect, useEffect, useState } from "react";
import ReactDOM from "react-dom";
//Currently not working, waiting for update from foxglove
//import { Button, Spinner } from 'reactstrap';
//import 'bootstrap/dist/css/bootstrap.css';

// Topics
const instructionTopic ="/instructions";
const updateTopic = "/updates";
const dataTopic = "/data";
const testsTopic = "/tests";

// Pages
const pageEnum = Object.freeze({"home": 1, "choose_configs": 2, "edit_config": 3, "simulation": 4});



function GlobalPanel({ context }: { context: PanelExtensionContext }): JSX.Element {
  const [topics, setTopics] = useState<readonly Topic[] | undefined>();
  const [_messages, setMessages] = useState<readonly MessageEvent<unknown>[] | undefined >();
  const [parameters, setParameters] = useState<ReadonlyMap<String, any> | undefined >();
  const [picker, setPicker] = useState(5);
  const [list, setList] = useState<unknown[]>([]);
  const [files, setFiles] = useState<string[]>([]);
  const [currentPage, setCurrentPage] = useState<Number>(pageEnum.home);
  
  const [renderDone, setRenderDone] = useState<(() => void) | undefined>();
  



  // We use a layout effect to setup render handling for our panel. We also setup some topic subscriptions.
  useLayoutEffect(() => {

    // The render handler could be invoked as often as 60hz during playback if fields are changing often.
    context.onRender = (renderState: RenderState, done) => {

      // Set the done callback into a state variable to trigger a re-render.
      setRenderDone(done);
      
      // Set topics
      setTopics(renderState.topics);

      // Set parameters
      setParameters(renderState.parameters);

      // currentFrame has messages on subscribed topics since the last render call
      setMessages(renderState.currentFrame);

      // Rederects all messages into the correct list
      renderState.currentFrame?.forEach(element => {
          switch (element.topic) {
            case testsTopic:
              setList(list => [...list, element.message]);
              break;
            case dataTopic:
              let temp = element.message as {command:string,data: string[]};
              switch (temp.command) {
                case "configs":
                  setFiles([...temp.data]);
                  break;
                default:
                  break;
              }
              break;
            default:
              
              break;
          }
        });
        
    };
    topics;

    // tell the panel context that we care about any update to the _topic_ field of RenderState
    context.watch("topics");

    context.watch("parameters");

    // tell the panel context we want messages for the current frame for topics we've subscribed to
    // This corresponds to the _currentFrame_ field of render state.
    context.watch("currentFrame");

    // subscribe to topics
    context.subscribe([testsTopic, dataTopic]);

    // Advertise instruction topic
    context.advertise?.(instructionTopic, "std_msgs/String", {
      datatypes: new Map(
        Object.entries({
          "std_msgs/String": { definitions: [{ name: "data", type: "string" }] },
        }),
      ),
    });

    // Advertise update topic
    context.advertise?.(updateTopic, "real_time_simulator/Update", {
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

    // Advertise data topic
    context.advertise?.(dataTopic, "real_time_simulator/Data", {
      datatype: new Map(
        Object.entries({
          "real_time_simulator/Data": {definitions: [
            {type: "string", name: "command"},
            {type: "string[]", name: "data"},
          ]}
        }),
      ),
    });

  }, []);

  // invoke the done callback once the render is complete
  useEffect(() => {
    renderDone?.();
  }, [renderDone]);

  list

  // Creates a list for all parameter files
  const rocket = [];
  rocket.push(<div><h2>Rocket</h2></div>)
  const environment = [];
  const perturbation = [];
  const visualization = [];
  const others = [];

  parameters?.forEach((value, key) => {
    const temp = key.split("/");
    switch (temp[1]) {
      case "rocket":
        rocket.push(<div>{temp[2]} : {value}</div>)
        break;
      case "environment":
        environment.push(<div><h5>{temp[2]}</h5> : {value}</div>)
        break;
      case "perturbation":
        perturbation.push(<div><h5>{temp[2]}</h5> : {value}</div>)
        break;
      case "visualization":
        visualization.push(<div><h5>{temp[2]}</h5> : {value}</div>)
        break;
      default:
        others.push(<div><h5>{temp[1]}</h5> : {value}</div>)
        break;
    }

  });

  /**
   * Handles picker
   * @param event event that triggered the function call
   */
  function handleChange(event:any) {
    setPicker(event.target.value);
  }

  /**
   * Launches the simulation
   */
  function launchSimulation(){
    console.log("Launch simulation");
    context.publish?.(instructionTopic, { data: 'launch' });
  }

  /**
   * Send a message to modify a parameter
   */
  function updateValue(){
    console.log("Update value");
    context.publish?.(updateTopic, {
      config: 'rocket',
      parameter: 'Thrust',
      value: '10'
    });
  }
  updateValue

  /**
   * This method is used to generate the buttons to select the config
   * @param param0 name of the config
   * @returns Return the component for the button with its onclick set
   */
  function ButtonFile({name}: {name:string}){
    return (
      <div style={{marginTop:'10px'}}>
        <button onClick={() => selectConfig(name)}>{name}</button>
      </div>
    );
  }

  /**
   * Generate the config panel layout
   * @returns Return the layout of the panel that lists all config files
   */
  function ListConfigs(){
    return (
      <>
        <h1 style={{textAlign:'center'}}>Configs</h1>
        <div>{files.map(f => <ButtonFile name={f}></ButtonFile>)}</div>
      </>
    );
  }

  /**
   * Generate the simulation panel layout
   * @returns Returns the layout of the panel to handle the simulation
   */
  function LaunchPanel(){
    return (
      <>
        <h1 style={{textAlign:'center'}}>Launch Panel</h1>
        <div><button onClick={startNodes}>Launch nodes</button><button onClick={stopNodes}>Stop nodes</button></div>
        <div><button onClick={launchSimulation}>Launch simulation</button></div>
      </>
    );
  }

  /**
   * Sends a message on the data topic to give the selected config file and changes the current page to the simulation page
   * @param name Name of the selected config
   */
  function selectConfig(name:string){
    context.publish?.(dataTopic, {
      command: 'select_config',
      data:[name]
    });
    setCurrentPage(pageEnum.simulation);
  }

  /**
   * Publishes a test message on the instruction topic (mainly for tests). Will be removed on final version
   */
  function testButton(){
    context.publish?.(instructionTopic, {data: 'test'});
  }
  testButton
  
  /**
   * Publishes a message on the instruction topic to launch the nodes
   */
  function startNodes(){
    console.log("Start nodes");
    context.publish?.(instructionTopic, { data: 'launch_node' });
  }

  /**
   * Publishes a message on the instruction topic to stop nodes
   */
  function stopNodes(){
    console.log("Stop nodes");
    context.publish?.(instructionTopic, { data: 'stop_node' });
  }

  /**
   * Publishes a message on the instruction topic to get all config that can be launched and changes the page to the list of configs.
   */
  function getConfigs(){
    context.publish?.(instructionTopic, {data: 'get_configs'});
    setCurrentPage(pageEnum.choose_configs);    
  }

  /**
   * Generates the Home panel layout
   * @returns Returns the layout of the home panel
   */
  function Home(){
    return (
      <>
        <h1 style={{textAlign:'center'}}>Home</h1>
        <div>
          <button onClick={getConfigs}>Load configs</button>
        </div>
      </>
    );
  } 
  
  // Temporary test layout
  const myelem = (
    <div style={{overflowY: 'scroll'}}>
      <h1>Test</h1>
      <div>{picker} <input type="range" min="0" max="15" step="1" defaultValue={picker} onChange={handleChange}/></div>
    </div>
  );
  myelem

  /**
   * Select the page to render acording to the currentPage value
   * @returns Returns the current page to render
   */
  function panelSelector(){
    switch(currentPage){
      case pageEnum.home:
        return <Home/>
      case pageEnum.choose_configs:
        return <ListConfigs/>
      case pageEnum.simulation:
        return <LaunchPanel/>
      default:
        return <h1>404 page not found</h1>
    }
  }
  
  // Main layout
  const layout = (
    <div style={{display:'flex', justifyContent:'center', alignItems:'center'}}>
      <div>
      {panelSelector()}
      </div>
    </div>
  );
  return layout;
}



export function initGlobalPanel(context: PanelExtensionContext) {
  ReactDOM.render(<GlobalPanel context={context} />, context.panelElement);
}
