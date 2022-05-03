import { PanelExtensionContext, RenderState, Topic} from "@foxglove/studio";
import { useLayoutEffect, useEffect, useState } from "react";
import ReactDOM from "react-dom";
//Currently not working, waiting for update from foxglove
//import { Button, Spinner } from 'reactstrap';
//import 'bootstrap/dist/css/bootstrap.css';

// Topics
const instructionTopic ="/instructions";
const updateTopic = "/updates";
const dataTopic = "/data";
const stateTopic = "/simulation_state";
const testsTopic = "/tests";

// Pages
const pageEnum = Object.freeze({"home": 1, "choose_configs": 2, "edit_param": 3, "launched": 4});



function ParameterPanel({ context }: { context: PanelExtensionContext }): JSX.Element {
  const [topics, setTopics] = useState<readonly Topic[] | undefined>();
  const [parameters, setParameters] = useState<ReadonlyMap<String, any> | undefined >();

  const [list, setList] = useState<unknown[]>([]);
  list;

  const [recentConfigs, setRecentConfigs] = useState<string[]>([]);
  const [configs, setConfigs] = useState<string[]>([]);
  const [currentPage, setCurrentPage] = useState<Number>(pageEnum.home);
  const [expanded, setExpanded] = useState<string>("");
  
  const [renderDone, setRenderDone] = useState<(() => void) | undefined>();
  const [parameterFiles, setParameterFiles] = useState<string[]>([]);
  
  const [configName, setConfigName] = useState<string>("None");
  
  const [currentState, setCurrentState] = useState<string>("1");

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

      // Rederects all messages into the correct list
      renderState.currentFrame?.forEach(element => {
          switch (element.topic) {
            case testsTopic:
              setList(list => [...list, element.message]);
              break;
            case dataTopic:
              let temp = element.message as {command:string,data: string[]};
              switch (temp.command) {
                case "recent_configs":
                  setRecentConfigs([...temp.data]);
                  break;
                case "configs":
                  setConfigs([...temp.data]);
                  break;
                  case "list_parameter_prefix":
                    setParameterFiles([...temp.data])
                    break;
                default:
                  break;
              }
              break;
              
            case stateTopic:
              let tmp = element.message as {command:string,data: string[]};
              if(currentState != tmp.command ){
                setCurrentState(tmp.command)
                switch(Number(tmp.command)){
                  case 1:
                    setCurrentPage(pageEnum.home)
                    setConfigName("None")
                    break;
                  case 2:
                    setCurrentPage(pageEnum.edit_param)
                    setConfigName((tmp.data)[0] as string)
                    break;
                  case 3:
                  case 4:
                  case 5:
                    setCurrentPage(pageEnum.launched)
                    setConfigName((tmp.data)[0] as string)
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

    // tell the panel context that we care about any update to the _topic_ field of RenderState
    context.watch("topics");

    context.watch("parameters");

    // tell the panel context we want messages for the current frame for topics we've subscribed to
    // This corresponds to the _currentFrame_ field of render state.
    context.watch("currentFrame");

    // subscribe to topics
    context.subscribe([testsTopic,updateTopic, dataTopic, stateTopic]);

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

    

  }, []);

  // invoke the done callback once the render is complete
  useEffect(() => {
    renderDone?.();
  }, [renderDone]);

  topics;

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

  function onChange(event:any){
    let v = String(event.target.value)
    if(v.includes(',')){
      v = '[' + v + ']'
    }
    context.publish?.(updateTopic, {
      config: expanded,
      parameter: String(event.target.previousElementSibling.value),
      value: v
    });
  }

  function FileParameters({name}: {name:string}){
    updateValue;
    let params: [string,string][] = []
    if(typeof parameters !== "undefined"){
      Array.from(parameters.entries()).forEach(elem => {
        let k = elem[0].split('/');
        if(k[1] == name){
          params = [...params, [k[2] as string, elem[1]]];
        }
      })
    }
    return (
      <div><br/>
      {params.map(elem => <div style={{marginBottom:'4px', display:'flex', justifyContent:'center'}}><input type='text' value={elem[0]}></input><input type='text' defaultValue={elem[1]} onBlur={onChange}></input></div>)}
      </div>
    );
  }


  function FileBar({name, expand} : {name:string, expand:Boolean}){
    var params = <></>
    if(expand){
      params = <div style={{margin:'8px', backgroundColor:'#4d4d4d', borderColor:'white', borderWidth:'1px', borderStyle:'solid'}}><FileParameters name={name}/></div>
    }
    return (
      <div>
        <p style={{textAlign:'center', borderStyle:'solid', borderWidth:'1px', borderColor:'white', backgroundColor:'#4d4d4d',color:'#ffffff', fontSize:'16px', padding:'16px 40px'}} onClick={() => setExpanded(expand ? "" : name)}>{name}</p>
          {params}
      </div>
      
    );
  }

  function backToListConfig(){
    context.publish?.(instructionTopic, {data: 'clear_parameters'});
    setCurrentPage(pageEnum.choose_configs);    
  }

  function ParameterPage(){
    return <ParameterFilesList list={parameterFiles} />
  };

  function ParameterFilesList({ list }: {list:string[]}){
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

    return (
      <div style={{display:'flex', justifyContent:'center', height:'100%', flexDirection:'column'}}>
        <div>
          <img onClick={backToListConfig} src="/home/mathieu/foxglove/foxglove/src/wbackarrow.png" style={{marginLeft:'8px', marginTop:'8px'}}/>
          <h1 style={{textAlign:'center'}}>{configName}</h1>
        </div>
        <div style={{flexGrow:'1', overflowY:'auto', margin:'8px'}}>
         {list.map(item => 
            <FileBar name={item} expand={expanded == item}/>
          )}
         </div>
        <div style={{display:'flex', justifyContent:'space-evenly'}}><button style={buttonStyle} onClick={saveParameters}>Save</button><button style={buttonStyle} onClick={launchConfig}>Launch</button></div>
      </div>
    );
  }

  function saveParameters(){
    context.publish?.(instructionTopic, {data: 'save_parameters'});
  }
  

  /**
   * This method is used to generate the buttons to select the config
   * @param param0 name of the config
   * @returns Return the component for the button with its onclick set
   */
  function ButtonFile({name}: {name:string}){
    let buttonStyle = {
      backgroundColor:'transparent',
      border:'none',
      color:'#1BA8FF',
      fontSize:'14px',
      marginBottom:'10px'
    };
    buttonStyle
    return (
        <button style={buttonStyle} onClick={() => selectConfig(name)}>{name}</button>
    );
  }


  /**
   * Generate the config panel layout
   * @returns Return the layout of the panel that lists all config files
   */
  function ListConfigs(){
    
    return (
      <div style={{display:'flex', flexDirection:'column', justifyContent:'center', alignItems:'center'}}>
        <div style={{width:'100%'}}>
          <img onClick={() => setCurrentPage(pageEnum.home)} src="/home/mathieu/foxglove/foxglove/src/wbackarrow.png" style={{marginLeft:'8px', marginTop:'8px'}}/>
              <h1 style={{textAlign:'center'}}>Choose your configuration</h1>
        </div>
        <div>
          <div style={{paddingLeft:'8px', display:'flex', flexDirection:'column'}}>
            <h2 style={{textAlign:'left'}}>Recent</h2>
            <div style={{paddingLeft:'8px', display:'flex', flexDirection:'column', justifyContent:'left', alignItems:'flex-start'}}>{recentConfigs.map(f => <ButtonFile name={f}></ButtonFile>)}</div>
          </div>
          <div style={{paddingLeft:'8px', display:'flex', flexDirection:'column'}}>
            <h2 style={{textAlign:'left'}}>Configurations</h2>
            <div style={{paddingLeft:'8px', display:'flex', flexDirection:'column', justifyContent:'left', alignItems:'flex-start'}}>{configs.map(f => <ButtonFile name={f}></ButtonFile>)}</div>
          </div>
        </div>
      </div>
      
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
    setConfigName(name);
    setCurrentPage(pageEnum.edit_param);
  }

  
  /**
   * Publishes a message on the instruction topic to get all config that can be launched and changes the page to the list of configs.
   */
  function getConfigs(){
    context.publish?.(instructionTopic, {data: 'get_configs'});
    setCurrentPage(pageEnum.choose_configs);    
  }

  /**
   * Publishes a message on the instruction topic to get all config that can be launched and changes the page to the list of configs.
   */
   function launchConfig(){
    context.publish?.(instructionTopic, {data: 'launch_config'});
    setCurrentPage(pageEnum.launched);    
  }

  /**
   * Publishes a message on the instruction topic to get all config that can be launched and changes the page to the list of configs.
   */
   function stopConfig(){
    context.publish?.(instructionTopic, {data: 'close_config'});
    setCurrentPage(pageEnum.home);    
  }

  /**
   * Generates the Home panel layout
   * @returns Returns the layout of the home panel
   */
  function Home(){
    let buttonStyle = {
      backgroundColor:'#4d4d4d', 
      borderRadius:'3px', 
      display:'inline-block', 
      color:'#ffffff', 
      fontSize:'16px', 
      padding:'16px 40px', 
      marginBottom:'16px',
      border:'none'
    };
    return (
      <div style={{height:'100%', display:'flex', justifyContent:'center', alignItems:'center', marginTop:'-100px'}}>
        <div>
          <h1 style={{textAlign:'left'}}>Simulator</h1>
          <div style={{display:'flex', flexDirection:'column'}}>
            <button style={buttonStyle}
            onClick={getConfigs}>Load configs</button>
            <button style={buttonStyle}
            onClick={getConfigs}>Load configs</button>
            <button style={buttonStyle}
            onClick={getConfigs}>Load configs</button>
          </div>
        </div>
      </div>
    );
  } 

  /**
   * Generates the Home panel layout
   * @returns Returns the layout of the home panel
   */
   function LaunchedPanel(){
    let buttonStyle = {
      backgroundColor:'#4d4d4d', 
      borderRadius:'3px', 
      display:'inline-block', 
      color:'#ffffff', 
      fontSize:'16px', 
      padding:'16px 40px', 
      marginBottom:'16px',
      border:'none'
    };
    return (
      <div style={{height:'100%', display:'flex', alignItems:'center', flexDirection:'column'}}>
        <h1 style={{textAlign:'center'}}>Parameters have been launched</h1>
        <button style={buttonStyle} onClick={stopConfig}>Close {configName}</button>
      </div>
    );
  } 

  /**
   * Select the page to render acording to the currentPage value
   * @returns Returns the current page to render
   */
  function panelSelector(){
    switch(currentPage){
      case pageEnum.home:
        return <Home/>;
      case pageEnum.choose_configs:
        return <ListConfigs/>;
      case pageEnum.edit_param:
        return <ParameterPage/>;
      case pageEnum.launched:
        return <LaunchedPanel/>
      default:
        return <h1>404 page not found</h1>;
    }
  }
  
  // Main layout
  const layout = (
    <div style={{height:'100%'}}>
      {panelSelector()}
    </div>
  );
  return layout;
}



export function initParameterPanel(context: PanelExtensionContext) {
  ReactDOM.render(<ParameterPanel context={context} />, context.panelElement);
}
