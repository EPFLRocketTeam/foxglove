import { PanelExtensionContext, RenderState, Topic, MessageEvent } from "@foxglove/studio";
import { useLayoutEffect, useEffect, useState } from "react";
import ReactDOM from "react-dom";

const instructionTopic ="/instructions";
const updateTopic = "/updates";
const testsTopic = "/tests";


function GlobalPanel({ context }: { context: PanelExtensionContext }): JSX.Element {
  const [topics, setTopics] = useState<readonly Topic[] | undefined>();
  const [_messages, setMessages] = useState<readonly MessageEvent<unknown>[] | undefined >();
  const [parameters, setParameters] = useState<ReadonlyMap<String, any> | undefined >();
  const [picker, setPicker] = useState(5);
  const [list, setList] = useState<unknown[]>([]);
  
  const [renderDone, setRenderDone] = useState<(() => void) | undefined>();
  



  // We use a layout effect to setup render handling for our panel. We also setup some topic subscriptions.
  useLayoutEffect(() => {
    // The render handler is run by the broader studio system during playback when your panel
    // needs to render because the fields it is watching have changed. How you handle rendering depends on your framework.
    // You can only setup one render handler - usually early on in setting up your panel.
    //
    // Without a render handler your panel will never receive updates.
    //
    // The render handler could be invoked as often as 60hz during playback if fields are changing often.
    context.onRender = (renderState: RenderState, done) => {
      // render functions receive a _done_ callback. You MUST call this callback to indicate your panel has finished rendering.
      // Your panel will not receive another render callback until _done_ is called from a prior render. If your panel is not done
      // rendering before the next render call, studio shows a notification to the user that your panel is delayed.
      //
      // Set the done callback into a state variable to trigger a re-render.
      setRenderDone(done);
      // We may have new topics - since we are also watching for messages in the current frame, topics may not have changed
      // It is up to you to determine the correct action when state has not changed.
      setTopics(renderState.topics);

      setParameters(renderState.parameters);

      // currentFrame has messages on subscribed topics since the last render call
      setMessages(renderState.currentFrame);

      // Rederects all messages into the correct list
      renderState.currentFrame?.forEach(element => {
          switch (element.topic) {
            case testsTopic:
              setList(list => [...list, element.message]);
              break;
          
            default:
              
              break;
          }
        });
        
    };
    topics;
    

    // After adding a render handler, you must indicate which fields from RenderState will trigger updates.
    // If you do not watch any fields then your panel will never render since the panel context will assume you do not want any updates.

    // tell the panel context that we care about any update to the _topic_ field of RenderState
    context.watch("topics");

    context.watch("parameters");

    // tell the panel context we want messages for the current frame for topics we've subscribed to
    // This corresponds to the _currentFrame_ field of render state.
    context.watch("currentFrame");

    // subscribe to some topics, you could do this within other effects, based on input fields, etc
    // Once you subscribe to topics, currentFrame will contain message events from those topics (assuming there are messages).
    context.subscribe([testsTopic]);

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

  }, []);

  // invoke the done callback once the render is complete
  useEffect(() => {
    renderDone?.();
  }, [renderDone]);


  /*
  //Generate 10 buttons
  const items = [];
  for (let index = 0; index < 10; index++) {
    items.push(<div><button onClick={handleClic} id={"id" + index}>Button {index}</button></div>);
    
  }


  function handleClic(event: any){
      var clicked = event.target.id+".txt";
      clicked;
  }
  */

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
   * @param event 
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

  function testButton(){
    context.publish?.(instructionTopic, {data: 'test'});
  }
  
  function sendInstruction(){
    console.log("List packages");
    context.publish?.(instructionTopic, { data: 'launch_node' });
  }
  function sendInstruction2(){
    console.log("List packages");
    context.publish?.(instructionTopic, { data: 'stop_node' });
  }

  const test = list.length < 3 ? list.map(message => (message as { data: string}).data):<></>  

  const myelem = (
    <div style={{overflowY: 'scroll'}}>
      <h1>Test</h1>
      <div>{picker} <input type="range" min="0" max="15" step="1" defaultValue={picker} onChange={handleChange}/></div>
      <div><button onClick={sendInstruction}>Launch Node</button><button onClick={sendInstruction2}>Stop Node</button></div>
      <div>Parameters</div>
      <div>{rocket}</div>
      <div>topics</div>
      <div>{topics?.map((n)=> n.name).join(" ,")}</div>
      <div>messages</div>
      <div>{_messages?.map(messageEvent => (messageEvent.message as { data: string}).data)}</div>
      <div>{_messages?.map(messageEvent => messageEvent.topic)}</div>
      <div>Registered messages</div>
      <div>{test} = {list.length} - {_messages?.length}</div>
      <div><div><button onClick={launchSimulation}>Launch simulation</button><button onClick={updateValue}>Update</button><button onClick={testButton}>Test</button></div></div>
    </div>
  );

  return myelem;
}

export function initGlobalPanel(context: PanelExtensionContext) {
  ReactDOM.render(<GlobalPanel context={context} />, context.panelElement);
}
