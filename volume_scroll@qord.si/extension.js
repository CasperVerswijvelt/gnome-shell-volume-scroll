const Main = imports.ui.main;
const Clutter = imports.gi.Clutter;
const Volume = imports.ui.status.volume;
const PanelMenu = imports.ui.panelMenu;
const Gio = imports.gi.Gio;

let panel, panelBinding, volumeControl, volumeStep, aggregateMenu, volumeMenu;

function init() {
  volumeControl = Volume.getMixerControl();
  streamSlider = new Volume.StreamSlider(volumeControl);
  volumeStep = _getVolumeMax() / 40;

  panel = Main.panel;
  panelBinding = null;
}

function enable() {
  aggregateMenu = Main.panel.statusArea.aggregateMenu;

  if (
    aggregateMenu.hasOwnProperty("_volume") &&
    aggregateMenu._volume instanceof PanelMenu.SystemIndicator
  ) {
    volumeMenu = aggregateMenu._volume._volumeMenu;
  }

  panel.reactive = true;
  if (panelBinding) {
    disable();
  }
  panelBinding = panel.actor.connect('scroll-event',_onScroll);
}

function disable() {
  if (panelBinding) {
    panel.actor.disconnect(panelBinding);
    panelBinding = null;
  }
}

/**
 * Returns the max volume.
 */
function _getVolumeMax() {
  return volumeControl.get_vol_max_norm(); // Should be just 1
}

function _getVolumeAbsoluteMax() {
  return streamSlider.getMaxLevel() * _getVolumeMax(); // If volume boost enabled, this will be higher
}


/**
 * Handles panel mouse scroll event.
 */
function _onScroll(actor, event) {
  let volume = volumeControl.get_default_sink().volume;

  switch (event.get_scroll_direction()) {
    case Clutter.ScrollDirection.UP:
      volume += volumeStep;
      break;
    case Clutter.ScrollDirection.DOWN:
      volume -= volumeStep;
      break;
    default:
      return Clutter.EVENT_PROPAGATE;
  }

  if (volume > _getVolumeAbsoluteMax()) {
    volume = _getVolumeAbsoluteMax();
  } else if (volume < volumeStep) {
    volume = 0;
  }

  volumeControl.get_default_sink().volume = volume;
  volumeControl.get_default_sink().push_volume();

  _showVolumeOsd(volume, _getVolumeMax(), _getVolumeAbsoluteMax());

  return Clutter.EVENT_STOP;
}

/**
 * Shows the current volume on OSD.
 *
 * @see gsd-media-keys-manager.c
 */
function _showVolumeOsd() {
  let gicon = new Gio.ThemedIcon({ name: volumeMenu.getIcon() });
  let level = volumeMenu.getLevel();
  let maxLevel = volumeMenu.getMaxLevel();
  Main.osdWindowManager.show(-1, gicon, null, level, maxLevel);
}