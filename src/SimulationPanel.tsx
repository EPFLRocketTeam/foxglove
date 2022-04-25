import { PanelExtensionContext, RenderState, Topic, MessageEvent } from "@foxglove/studio";
import { useLayoutEffect, useEffect, useState } from "react";
import ReactDOM from "react-dom";

const instructionTopic = "/instructions";
const updateTopic = "/updates";
updateTopic
const dataTopic = "/data";

const stateEnum = Object.freeze({"test": 0,"stopped": 1, "started": 2, "simulation": 3});

function SimulationPanel({ context }: { context: PanelExtensionContext }): JSX.Element {
  const [topics, setTopics] = useState<readonly Topic[] | undefined>();
  const [messages, setMessages] = useState<readonly MessageEvent<unknown>[] | undefined>();
  const [currentState, setCurrentState] = useState<Number>(stateEnum.stopped);

  const [picker, setPicker] = useState(10);

  const [renderDone, setRenderDone] = useState<(() => void) | undefined>();

  // We use a layout effect to setup render handling for our panel. We also setup some topic subscriptions.
  useLayoutEffect(() => {

    context.onRender = (renderState: RenderState, done) => {

      setRenderDone(done);

      setTopics(renderState.topics);

      setMessages(renderState.currentFrame);
    };

    context.watch("topics");

    context.watch("currentFrame");

    context.subscribe([dataTopic]);

    // Advertise instruction topic
    context.advertise?.(instructionTopic, "std_msgs/String", {
      datatypes: new Map(
        Object.entries({
          "std_msgs/String": { definitions: [{ name: "data", type: "string" }] },
        }),
      ),
    });

    // Advertise data topic
    context.advertise?.(dataTopic, "real_time_simulator/Data", {
      datatypes: new Map(
        Object.entries({
          "real_time_simulator/Data": {definitions: [
            { type: "string", name: "command"},
            { type: "string", isArray:true, name: "data"},
          ]}
        }),
      ),
    });

  }, []);

  // invoke the done callback once the render is complete
  useEffect(() => {
    renderDone?.();
  }, [renderDone]);
  
  messages;
  topics;

  /**
   * Handles picker
   * @param event event that triggered the function call
   */
   function handleChange(event:any) {
    let v = event.target.value
    setPicker(v);
    context.publish?.(dataTopic, {
      command: 'change_wind_speed',
      data:[String(v)]
    });
  }

    /**
   * Publishes a message on the instruction topic to launch the nodes
   */
     function startNodes(){
      console.log("Start nodes");
      context.publish?.(instructionTopic, { data: 'launch_node' });
      setCurrentState(stateEnum.started);
    }
  
    /**
     * Publishes a message on the instruction topic to stop nodes
     */
    function stopNodes(){
      console.log("Stop nodes");
      context.publish?.(instructionTopic, { data: 'stop_node' });
      setCurrentState(stateEnum.stopped);
    }
    
  /**
   * Launches the simulation
   */
  function launchSimulation(){
    console.log("Launch simulation");
    context.publish?.(instructionTopic, { data: 'launch' });
    setCurrentState(stateEnum.simulation);
  }

  function getBottomButtons(){
    let buttonStyle = {
      backgroundColor:'#4d4d4d', 
      borderRadius:'3px', 
      display:'inline-block', 
      color:'#ffffff', 
      fontSize:'14px', 
      padding:'12px 30px', 
      marginBottom:'16px',
      border:'none'
    };

    switch(currentState){
      case stateEnum.stopped:
        return <button style={buttonStyle} onClick={startNodes}>Stard nodes</button>;
      case stateEnum.started:
        return <><button style={buttonStyle} onClick={launchSimulation}>Start Simulation</button><button style={buttonStyle} onClick={stopNodes}>Stop nodes</button></>
      case stateEnum.simulation:
        return <><button style={buttonStyle} onClick={stopNodes}>Stop simulation</button><button style={buttonStyle} onClick={stopNodes}>Restart simulation</button></>
      default:
        return <h1>404 not found</h1>;
    }
  }

  /**
   * Generate the simulation panel layout
   * @returns Returns the layout of the panel to handle the simulation
   */
   function LaunchPanel(){
    return (
      <div style={{display:'flex', flexDirection:'column', width:'100%'}}>
        <h1 style={{textAlign:'center'}}>Simulator</h1>
        <div style={{flexGrow:'1', display:'flex', flexDirection:'column', alignItems:'center'}}>
          <div style={{display:'flex', alignItems:'center'}}> 
            Wind speed : <input type="range" min="0" max="50" defaultValue={picker} onChange={handleChange}/> {picker}</div>
          </div>
        <div style={{display:'flex', justifyContent:'space-evenly'}}>{getBottomButtons()}</div>
      </div>
    );
  }
  

    // Temporary test layout
    const myelem = (
      <div style={{overflowY: 'scroll'}}>
        <h1>Test</h1>
        <div>{picker} : <input type="range" min="0" max="50" defaultValue={picker} onChange={handleChange}/></div>
      </div>
    );
    myelem

  const layout = (
    <div style={{display:'flex', justifyContent:'center', height:'100%'}}>
      <LaunchPanel/>
    </div>
  );

  return layout;
}

export function initSimulationPanel(context: PanelExtensionContext) {
  ReactDOM.render(<SimulationPanel context={context} />, context.panelElement);
}
