import { ExtensionContext } from "@foxglove/studio";
import { initParameterPanel } from "./GlobalPanel";
import { initNodePanel } from "./NodePanel";
import { initSimulationPanel } from "./SimulationPanel";

export function activate(extensionContext: ExtensionContext) {
  extensionContext.registerPanel({ name: "ERT - Parameter", initPanel: initParameterPanel });
  extensionContext.registerPanel({ name: "ERT - Node", initPanel: initNodePanel });
  extensionContext.registerPanel({ name: "ERT - Simulation", initPanel: initSimulationPanel });
}