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
const pageEnum = Object.freeze({"test": 0,"home": 1, "choose_configs": 2, "edit_param": 3, "launched": 4});



function ParameterPanel({ context }: { context: PanelExtensionContext }): JSX.Element {
  const [topics, setTopics] = useState<readonly Topic[] | undefined>();
  const [_messages, setMessages] = useState<readonly MessageEvent<unknown>[] | undefined >();
  const [parameters, setParameters] = useState<ReadonlyMap<String, any> | undefined >();

  const [list, setList] = useState<unknown[]>([]);
  const [files, setFiles] = useState<string[]>([]);
  const [fileParameters, setFileParameters] = useState<Map<String, string[]>>(new Map())
  const [currentPage, setCurrentPage] = useState<Number>(pageEnum.home);
  const [expanded, setExpanded] = useState<string>("");
  
  const [renderDone, setRenderDone] = useState<(() => void) | undefined>();
  const [parameterFiles, setParameterFiles] = useState<string[]>(["rocket", "environment","perturbation","visualization"])
  

  setParameterFiles

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

      renderState.parameters?.forEach((key, value) => {
        let temp = key.split("/");
        value
        //if(temp[1] in parameterFiles)
        switch(temp[1]){
          case "rocket":
          case "environment":
          case "perturbation":
          case "visualization":
            if(fileParameters.has(temp[1])){
              let l = [...(fileParameters.get(temp[1]) as string[]), key];
              setFileParameters(fileParameters.set(temp[1], l))
            }
            break;

          default:
            break;
        }
      });

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
  expanded
  setExpanded

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



  function FileParameters({name}: {name:String}){
    name;
    return (
      <div><br/>
      {fileParameters.get(name)?.map(item => <p>{item}</p>)}
      </div>
    );
  }


  function FileBar({name, expand} : {name:string, expand:Boolean}){
    var params = <></>
    if(expand){
      params = <FileParameters name={name}/>
    }
    params
    return (
      <div>
        <p onClick={() => setExpanded(expand ? "" : name)}>{name}</p>
        {params}
      </div>
      
    );
  }
  FileBar

  function ParameterPage(){
    return <ParameterFilesList list={parameterFiles} />
  };

  function ParameterFilesList({ list }: {list:string[]}){
    return (
      <div>
        {list.map(item => 
          <FileBar name={item} expand={expanded == item}/>
        )}
        <div>Parameters : </div><br/>
        {parameters}
      </div>
    );
  }
  

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
   * Sends a message on the data topic to give the selected config file and changes the current page to the simulation page
   * @param name Name of the selected config
   */
  function selectConfig(name:string){
    context.publish?.(dataTopic, {
      command: 'select_config',
      data:[name]
    });
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

  /**
   * Generates the Home panel layout
   * @returns Returns the layout of the home panel
   */
   function Test(){
    return (
      <div style={{height:'100%'}}>
        <div style={{width:'50%', height:'100%', float:'left', backgroundColor:'red', justifyContent:'center', textAlign:'center', borderRight:'2px solid black'}}>
          <h1>Text</h1>
        </div>
        <div style={{width:'50%', float:'left', backgroundColor:'blue', justifyContent:'center', textAlign:'center'}}>
          <h1>Test</h1>
        </div>
      </div>
    );
  } 

  /**
   * Select the page to render acording to the currentPage value
   * @returns Returns the current page to render
   */
  function panelSelector(){
    switch(currentPage){
      case pageEnum.test:
        return <Test/>;
      case pageEnum.home:
        return <Home/>;
      case pageEnum.choose_configs:
        return <ListConfigs/>;
      case pageEnum.edit_param:
        return <ParameterPage/>;
      case pageEnum.launched:
        return <div><h1>Parameters have been launched</h1></div>
      default:
        return <h1>404 page not found</h1>;
    }
  }
  
  // Main layout
  const layout = (
    <div>
      {panelSelector()}
    </div>
  );
  return layout;
}



export function initParameterPanel(context: PanelExtensionContext) {
  ReactDOM.render(<ParameterPanel context={context} />, context.panelElement);
}
