import Clutter from "gi://Clutter";
import GLib from "gi://GLib";
import Gio from "gi://Gio";
import St from "gi://St";
import { Extension } from "resource:///org/gnome/shell/extensions/extension.js";
import * as Main from "resource:///org/gnome/shell/ui/main.js";
import * as PanelMenu from "resource:///org/gnome/shell/ui/panelMenu.js";

export default class GESMExtension extends Extension {
  enable() {
    this._indicator = new PanelMenu.Button(0.0, this.metadata.name, false);

    // create label
    const label = new St.Label({ text: "" });
    label.y_align = Clutter.ActorAlign.CENTER;
    this._indicator.add_child(label);
    Main.panel.addToStatusArea(this.uuid, this._indicator);

    const memInfoFile = Gio.File.new_for_path("/proc/meminfo");

    // update label
    this._sourceId = GLib.timeout_add_seconds(GLib.PRIORITY_DEFAULT, 1, () => {
      const [ok, contents] = memInfoFile.load_contents(null);
      if (!ok) {
        console.error("Error: can't open /proc/meminfo");
        return;
      }
      label.set_text(
        `Free: ${Math.round(
          parseInt(
            new TextDecoder("utf-8")
              .decode(contents)
              .split("\n")
              .find((string) => string.startsWith("MemFree:"))
              .match(/\d+/)
          ) / 1024
        )} MB`
      );
      return GLib.SOURCE_CONTINUE;
    });
  }

  disable() {
    if (this._sourceId) {
      GLib.Source.remove(this._sourceId);
      this._sourceId = null;
    }
    this._indicator?.destroy();
    this._indicator = null;
  }
}
