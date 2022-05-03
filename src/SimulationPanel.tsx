import { PanelExtensionContext, RenderState} from "@foxglove/studio";
import { useLayoutEffect, useEffect, useState } from "react";
import ReactDOM from "react-dom";

const buttonStyle = {
  backgroundColor:'#4d4d4d', 
  borderRadius:'3px', 
  display:'inline-block', 
  color:'#ffffff', 
  fontSize:'14px', 
  padding:'12px 30px', 
  marginBottom:'16px',
  border:'none'
};


const instructionTopic = "/instructions";
const updateTopic = "/updates";
const stateTopic = "/simulation_state";
updateTopic
const dataTopic = "/data";

const stateEnum = Object.freeze({"not_started":-1, "test": 0,"stopped": 1, "starting": 2, "started": 3, "simulation": 4});

function SimulationPanel({ context }: { context: PanelExtensionContext }): JSX.Element {
  const [currentState, setCurrentState] = useState<Number>(stateEnum.not_started);

  const [windSpeed, setWindSpeed] = useState<number>(-1);
  const [windDirection, setWindDirection] = useState<number>(-1);

  const [renderDone, setRenderDone] = useState<(() => void) | undefined>();

  const [currentStateSimu, setCurrentStateSimu] = useState<string>("1");
  currentStateSimu
  const [configName, setConfigName] = useState<string>("None");
  configName

  // We use a layout effect to setup render handling for our panel. We also setup some topic subscriptions.
  useLayoutEffect(() => {
    context.watch("currentFrame");

    context.subscribe([dataTopic, stateTopic]);

  }, []);

  // Refresh the onRender every time the currentStateSime is different from what we set in UI (When the ui is not in the right state)
  useEffect(() => {
    context.onRender = (renderState: RenderState, done) => {

      setRenderDone(done);
      
      renderState.currentFrame?.forEach(element => {
        switch (element.topic) {
          case stateTopic:
            let tmp = element.message as {command:string,data: string[]};
            if(currentStateSimu != tmp.command){
              console.log("Ici")
              setCurrentStateSimu(tmp.command);
              switch(Number(tmp.command)){
                case 1:
                  setCurrentState(stateEnum.not_started)
                  setConfigName("None")
                  break;
                case 2:
                  setCurrentState(stateEnum.not_started)
                  setConfigName("None")
                  break;
                case 3:
                  setCurrentState(stateEnum.stopped)
                  setConfigName((tmp.data)[0] as string)
                  break;
                case 4:
                  setCurrentState(stateEnum.starting)
                  setConfigName((tmp.data)[0] as string)
                  break;
                case 5:
                  setCurrentState(stateEnum.started)
                  setConfigName((tmp.data)[0] as string)
                  setWindSpeed(Number((tmp.data)[1] as string))
                  setWindDirection(Number((tmp.data)[2] as string))
                  break;
                case 6:
                  setCurrentState(stateEnum.simulation)
                  setConfigName((tmp.data)[0] as string)
                  setWindSpeed(Number((tmp.data)[1] as string))
                  setWindDirection(Number((tmp.data)[2] as string))
                  break;
                default:
                  break;
                }
              }
            break;
          default:
            break;
        }
        
      });

    
    };
  }, [currentStateSimu]);


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

  // invoke the done callback once the render is complete
  useEffect(() => {
    renderDone?.();
  }, [renderDone]);
  

  /**
   * Handles picker
   * @param event event that triggered the function call
   */
   function windSpeedChange(event:any) {
    let v = event.target.value
    setWindSpeed(v);
    console.error("Wind speed change");
    context.publish?.(dataTopic, {
      command: 'change_wind',
      data:[String(v), String(windDirection)]
    });
  }

  /**
   * Handles picker
   * @param event event that triggered the function call
   */
   function windDirectionChange(event:any) {
    let v = event.target.value
    setWindDirection(v);
    context.publish?.(dataTopic, {
      command: 'change_wind',
      data:[String(windSpeed),String(v)]
    });
  }

  /**
 * Publishes a message on the instruction topic to launch the nodes
 */
    function startNodes(){
    console.log("Start nodes");
    context.publish?.(instructionTopic, { data: 'launch_nodes' });
    setWindSpeed(-1);
    setWindDirection(-1);
    setCurrentState(stateEnum.starting);
  }

  /**
   * Launches the simulation
   */
   function launchSimulation(){
    console.log("Launch simulation");
    context.publish?.(instructionTopic, { data: 'launch_simulation' });
    setCurrentState(stateEnum.simulation);
  }
  
  /**
   * Publishes a message on the instruction topic to stop nodes
   */
  function stopNodes(){
    console.log("Stop nodes");
    context.publish?.(instructionTopic, { data: 'stop_nodes' });
    setCurrentState(stateEnum.stopped);
  }

  /**
   * Publishes a message on the instruction topic to stop nodes
   */
  function stopSimulation(){
    console.log("Stop simulation");
    context.publish?.(instructionTopic, { data: 'stop_simulation' });
    setCurrentState(stateEnum.stopped);
  }

  /**
   * Publishes a message on the instruction topic to stop nodes
   */
   function restartSimulation(){
    console.log("Stop simulation");
    context.publish?.(instructionTopic, { data: 'restart_simulation' });
    setCurrentState(stateEnum.stopped);
  }

  /**
   * Select the page to render acording to the currentPage value
   * @returns Returns the current page to render
   */
   function panelSelector(){
    switch(currentState){
      case stateEnum.not_started:
        return <SelectConfigPanel/>;
      case stateEnum.stopped:
        return <PreLaunchPanel startNodes={startNodes}/>;
      case stateEnum.starting:
        return <LaunchingPanel/>;
      case stateEnum.started:
        return <LaunchPanel windSpeed={windSpeed} windDirection={windDirection} windSpeedChange={windSpeedChange} windDirectionChange={windDirectionChange} launchSimulation={launchSimulation} stopNodes={stopNodes}/>;
      case stateEnum.simulation:
        return <RocketSimulationPanel windSpeed={windSpeed} windDirection={windDirection} windSpeedChange={windSpeedChange} windDirectionChange={windDirectionChange} restartSimulation={restartSimulation} stopSimulation={stopSimulation}/>;
      default:
        return <h1>404 page not found</h1>;
    }
  }

  const layout = (
    <div style={{display:'flex', justifyContent:'center', height:'100%'}}>
      {panelSelector()}
    </div>
  );

  return layout;
}


/**
 * Generate the panel when no config has been launched
 * @returns the panel when no config has been launched
 */
 function SelectConfigPanel(){
  return (
    <div style={{height:'100%', display:'flex', alignItems:'center', flexDirection:'column'}}>
      <h1 style={{textAlign:'center'}}>Please launch a configuration</h1>
    </div>
  );
}


/**
 * Generate the panel to start the nodes
 * @returns the panel to start the nodes
 */
function PreLaunchPanel({startNodes} : {startNodes:() => void}){
    
  return (
    <div style={{display:'flex', flexDirection:'column', width:'100%'}}>
      <h1 style={{textAlign:'center'}}>Simulator</h1>
      <div style={{flexGrow:'1', display:'flex', flexDirection:'column', alignItems:'center'}}>

      </div>
      <div style={{display:'flex', justifyContent:'space-evenly'}}><button style={buttonStyle} onClick={startNodes}>Stard nodes</button></div>
    </div>
  );
}

/**
 * Generate the panel when the nodes are launching
 * @returns the panel when the nodes are launching
 */
function LaunchingPanel(){
  return (
    <div style={{display:'flex', flexDirection:'column', width:'100%'}}>
      <h1 style={{textAlign:'center'}}>Simulator</h1>
      <div style={{flexGrow:'1', display:'flex', flexDirection:'column', alignItems:'center'}}>
        <h1 style={{textAlign:'center'}}>Launching nodes...</h1>
      </div>
      <div style={{display:'flex', justifyContent:'space-evenly'}}></div>
    </div>
  );
}

/**
   * Generate the simulation panel layout
   * @returns Returns the layout of the panel to handle the simulation
   */
 function LaunchPanel({windSpeed, windSpeedChange, windDirection, windDirectionChange, launchSimulation, stopNodes}:{windSpeed:number, windSpeedChange:(event:any)=>void,windDirection:number,windDirectionChange:(event:any)=>void, launchSimulation:()=>void, stopNodes:()=>void}){

  return (
    <div style={{display:'flex', flexDirection:'column', width:'100%'}}>
      <h1 style={{textAlign:'center'}}>Simulator</h1>
      <div style={{flexGrow:'1', display:'flex', flexDirection:'column', alignItems:'center'}}>
        <div style={{display:'flex', alignItems:'center'}}> 
          <div>Wind speed     : <input type="range" min="0" max="50" value={windSpeed} onChange={windSpeedChange}/></div> <div>{windSpeed}</div>
        </div>
        <div style={{display:'flex', alignItems:'center'}}> 
          Wind direction : <input type="range" min="0" max="359" value={windDirection} onChange={windDirectionChange}/> {windDirection}
        </div>
      </div>
      <div style={{display:'flex', justifyContent:'space-evenly'}}><button style={buttonStyle} onClick={launchSimulation}>Start Simulation</button><button style={buttonStyle} onClick={stopNodes}>Stop nodes</button></div>
    </div>
  );
}

/**
 * Generate the panel of the simulation
 * @returns the panel of the simulation
 */
function RocketSimulationPanel({windSpeed, windSpeedChange, windDirection, windDirectionChange, stopSimulation, restartSimulation}:{windSpeed:number, windSpeedChange:(event:any)=>void,windDirection:number,windDirectionChange:(event:any)=>void, stopSimulation:()=>void, restartSimulation:()=>void}){

  return (
    <div style={{display:'flex', flexDirection:'column', width:'100%'}}>
      <h1 style={{textAlign:'center'}}>Simulator</h1>
      <div style={{flexGrow:'1', display:'flex', flexDirection:'column', alignItems:'center'}}>
        <div style={{display:'flex', alignItems:'center'}}> 
          <div>Wind speed     : <input type="range" min="0" max="50" value={windSpeed} onChange={windSpeedChange}/></div> <div>{windSpeed}</div>
        </div>
        <div style={{display:'flex', alignItems:'center'}}> 
          Wind direction : <input type="range" min="0" max="359" value={windDirection} onChange={windDirectionChange}/> {windDirection}
        </div>
      </div>
      <div style={{display:'flex', justifyContent:'space-evenly'}}><button style={buttonStyle} onClick={stopSimulation}>Stop simulation</button><button style={buttonStyle} onClick={restartSimulation}>Restart simulation</button></div>
    </div>
  );
}


export function initSimulationPanel(context: PanelExtensionContext) {
  ReactDOM.render(<SimulationPanel context={context} />, context.panelElement);
}
