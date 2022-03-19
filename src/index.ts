import { ExtensionContext } from "@foxglove/studio";
import { initGlobalPanel } from "./GlobalPanel";

export function activate(extensionContext: ExtensionContext) {
  extensionContext.registerPanel({ name: "ERT global panel", initPanel: initGlobalPanel });
}
