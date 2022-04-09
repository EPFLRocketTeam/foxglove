import { PanelExtensionContext, RenderState, Topic, MessageEvent } from "@foxglove/studio";
import { useLayoutEffect, useEffect, useState } from "react";
import ReactDOM from "react-dom";

function NodePanel({ context }: { context: PanelExtensionContext }): JSX.Element {
  const [topics, setTopics] = useState<readonly Topic[] | undefined>();
  const [messages, setMessages] = useState<readonly MessageEvent<unknown>[] | undefined>();

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

    context.subscribe(["/some/topic"]);
  }, []);

  // invoke the done callback once the render is complete
  useEffect(() => {
    renderDone?.();
  }, [renderDone]);
  messages;
  topics;

  const layout = (
    <div>
      <h1>Node Layout</h1>
    </div>
  );

  return layout;
}

export function initNodePanel(context: PanelExtensionContext) {
  ReactDOM.render(<NodePanel context={context} />, context.panelElement);
}
