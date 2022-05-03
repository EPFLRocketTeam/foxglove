import { PanelExtensionContext, RenderState} from "@foxglove/studio";
import { useLayoutEffect, useEffect, useState } from "react";
import {ArrowLeft} from '@emotion-icons/bootstrap/ArrowLeft'
import ReactDOM from "react-dom";


const stateTopic = "/simulation_state";

function SimulationPanel({ context }: { context: PanelExtensionContext }): JSX.Element {
  const [triggered, setTriggered] = useState<boolean>(false);
  const [test, setTest] = useState<number>(0);
  const [renderDone, setRenderDone] = useState<(() => void) | undefined>();

  // We use a layout effect to setup render handling for our panel. We also setup some topic subscriptions.
  useLayoutEffect(() => {

    context.onRender = (renderState: RenderState, done) => {

    setRenderDone(done);

    renderState.currentFrame?.forEach(element => {
      switch (element.topic) {
        case stateTopic:
          if(!triggered){
              setTest(666)
              setTriggered(true)
            }else{
              setTest(8888)
            }
          break;
        default:
          break;
      }
      
    });
  
    }

    context.watch("topics");

    context.watch("currentFrame");
    context.subscribe([stateTopic]);
  }, []);

  // invoke the done callback once the render is complete
  useEffect(() => {
    renderDone?.();
  }, [renderDone]);


  const layout = (
    <div style={{display:'flex', justifyContent:'center', height:'100%'}}>
      <ArrowLeft/>
      Triggered : {String(triggered)}
      Test value : {test}
    </div>
  );

  return layout;
}

export function initSimulationPanel(context: PanelExtensionContext) {
  ReactDOM.render(<SimulationPanel context={context} />, context.panelElement);
}
