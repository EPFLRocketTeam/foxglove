import { PanelExtensionContext, RenderState, Topic} from "@foxglove/studio";
import { useLayoutEffect, useEffect, useState} from "react";
import {ArrowLeft} from '@emotion-icons/bootstrap/ArrowLeft'
import ReactDOM from "react-dom";

// Topics
const instructionTopic ="/instructions";
const updateTopic = "/updates";
const dataTopic = "/data";
const stateTopic = "/simulation_state";

// Pages
const pageEnum = Object.freeze({"home": 1, "choose_configs": 2, "edit_param": 3, "launched": 4});



function ParameterPanel({ context }: { context: PanelExtensionContext }): JSX.Element {
  const [renderDone, setRenderDone] = useState<(() => void) | undefined>();
  
  const [topics, setTopics] = useState<readonly Topic[] | undefined>();
  const [parameters, setParameters] = useState<ReadonlyMap<String, any> | undefined >();

  const [recentConfigs, setRecentConfigs] = useState<string[]>([]);
  const [configs, setConfigs] = useState<string[]>([]);
  const [currentPage, setCurrentPage] = useState<Number>(pageEnum.home);
  const [expanded, setExpanded] = useState<string>("");
  
  const [parameterFiles, setParameterFiles] = useState<string[]>([]);
  
  const [configName, setConfigName] = useState<string>("None");
  
  const [currentState, setCurrentState] = useState<Boolean>(false);

  // We use a layout effect to setup render handling for our panel. We also setup some topic subscriptions.
  useLayoutEffect(() => {

    // tell the panel context that we care about any update to the _topic_ field of RenderState
    context.watch("topics");

    context.watch("parameters");

    // tell the panel context we want messages for the current frame for topics we've subscribed to
    // This corresponds to the _currentFrame_ field of render state.
    context.watch("currentFrame");

    // subscribe to topics
    context.subscribe([updateTopic, dataTopic, stateTopic]);

    // Advertise instruction topic
    context.advertise?.(instructionTopic, "std_msgs/String", {
      datatypes: new Map(
        Object.entries({
          "std_msgs/String": { definitions: [{ name: "data", type: "string" }] },
        }),
      ),
    });

    // Advertise data topic
    context.advertise?.(dataTopic, "real_time_simulator/FoxgloveDataMessage", {
      datatypes: new Map(
        Object.entries({
          "real_time_simulator/FoxgloveDataMessage": {definitions: [
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
            { type: "string", name: "parameter"},
            { type: "string", isArray:true, name: "sub_param"},
            { type: "string", name: "value"},
          ]}
        }),
      ),
    });

    

  }, []);

  useEffect(() => {
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
              if(!currentState){
                setCurrentState(true)
                switch(Number(tmp.command)){
                  case 1:
                    setCurrentPage(pageEnum.home)
                    setConfigName("None")
                    break;
                  case 2:
                    setCurrentPage(pageEnum.choose_configs)
                    let n1 = Number(tmp.data[0] as string)
                    let n2 = Number(tmp.data[1] as string)
                    let array = tmp.data
                    let recents = array.slice(2, n1 + 2)
                    let all = array.slice(n1 + 2, n1 + n2 + 2)
                    setRecentConfigs(recents)
                    setConfigs(all)
                    break;
                  case 3:
                    setCurrentPage(pageEnum.edit_param)
                    setConfigName((tmp.data)[0] as string)
                    let n = Number(tmp.data[1] as string)
                    setParameterFiles([...tmp.data.slice(2, n + 2)])
                    break;
                  case 4:
                  case 5:
                  case 6:
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
  }, [currentState]);

  // invoke the done callback once the render is complete
  useEffect(() => {
    renderDone?.();
  }, [renderDone]);

  topics;
  

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
          <ArrowLeft size="48" onClick={backToListConfig} style={{marginLeft:'8px', marginTop:'8px'}}/>
          <h1 style={{textAlign:'center'}}>{configName}</h1>
        </div>
        <div style={{flexGrow:'1', overflowY:'auto', margin:'8px'}}>
         {list.map(item => 
            <FileBar name={item} expand={expanded == item}/>
          )}
         </div>
        <div style={{display:'flex', justifyContent:'space-evenly'}}><button style={buttonStyle} onClick={saveParameters}>Save</button><button style={buttonStyle} onClick={stopConfig}>Close config</button></div>
      </div>
    );
  }
  

  function FileBar({name, expand} : {name:string, expand:Boolean}){
    var params = <></>
    if(expand){
      params = <div style={{margin:'8px', backgroundColor:'#4d4d4d', borderColor:'white', borderWidth:'1px', borderStyle:'solid', borderRadius:'4px'}}><FileParameters name={name}/></div>
    }
    return (
      <div>
        <p style={{textAlign:'center', borderStyle:'solid', borderWidth:'1px', borderColor:'white', backgroundColor:'#4d4d4d',color:'#ffffff', fontSize:'16px', padding:'16px 40px', borderRadius:'4px', textTransform:'capitalize'}} onClick={() => setExpanded(expand ? "" : name)}>{name}</p>
          {params}
      </div>
      
    );
  }

  function FileParameters({name}: {name:string}){
    let params: [string,any][] = []
    let temp: string[] = []
    if(typeof parameters !== "undefined"){
      Array.from(parameters.entries()).forEach(elem => {
        let k = elem[0].split('/');
        if(k[1] == name){
          params = [...params, [k[2] as string, elem[1]]];
          temp = [...temp, k[2] as string + " " +  elem[1] as string + " type: " + typeof elem[1]]
        }
      })
    }
    return (
      <div style={{margin:'8px'}}><br/>
        {params.map(elem => 
        <HandleParam param={elem} prefix={[]}/>)}
      </div>
    );
  }

  function HandleParam({param, prefix} : {param:[string, any], prefix:string[]}){
    if(typeof param[1] === 'object'){
      return (<div style={{paddingLeft:'16px', marginBottom:'16px'}}>
        <h2 style={{marginBottom:'0px', paddingBottom:'0px', textTransform:'capitalize', marginLeft:'-8px'}}>{param[0]}</h2>
        {Object.entries(param[1]).map(e => <HandleParam param={e} prefix={[...prefix, param[0]]}/>)}
        </div>);
    }else{
      return <div style={{marginBottom:'4px', display:'flex', justifyContent:'center'}}><input type='text' disabled style={{flex:1, minWidth:'50px', maxWidth:'220px', backgroundColor:'#bababa', color:'black'}} value={param[0]}></input><input type='text' style={{flex:1, minWidth:'50px', maxWidth:'220px'}} defaultValue={param[1]} onKeyDown={e => handleKeyDown([...prefix, param[0]], e)} onBlur={e => onParameterChange([...prefix, param[0]], e)}></input></div>
    }
  }

  const handleKeyDown = (prefix:string[], event:any) => {
    if(event.key === 'Enter'){
      onParameterChange(prefix, event)
    }
  }

  /**
   * Send the modification request to the server for the parameter
   * @param prefix List of the prefixes of the parameter
   * @param event event that happened
   */
  function onParameterChange(prefix:string[], event:any){
    
    let v = String(event.target.value)
    let p = '/' + expanded + '/' + prefix[0]
    
    context.publish?.(updateTopic, {
      parameter: p,
      sub_param: prefix.slice(1),
      value: v
    });
  }


  /**
   * Save parameters
   */
  function saveParameters(){
    context.publish?.(instructionTopic, {data: 'save_parameters'});
  }

  /**
   * Go back to home
   */
  function backToHome(){
    context.publish?.(instructionTopic, {data: 'clear_configs'});
    setCurrentPage(pageEnum.home)
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
          <ArrowLeft size="48" onClick={backToHome} style={{marginLeft:'8px', marginTop:'8px'}}/>
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
          <h1 style={{textAlign:'left', paddingBottom:'0px', marginBottom:'0px'}}>Simulator</h1>
          <h2 style={{marginTop:'0px', paddingTop:'0px', opacity:'0.7'}}>By EPFL Rocket Team</h2>
          <div style={{display:'flex', flexDirection:'column'}}>
            <button style={buttonStyle} onClick={getConfigs}>Load configs</button>
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
    return (
      <div style={{height:'100%', display:'flex', alignItems:'center', flexDirection:'column'}}>
        <h1 style={{textAlign:'center'}}>The project is currently launched</h1>
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
