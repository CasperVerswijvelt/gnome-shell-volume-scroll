const Main = imports.ui.main;
const Clutter = imports.gi.Clutter;
const Volume = imports.ui.status.volume;
const Gio = imports.gi.Gio;

const VOL_ICONS = [
    'audio-volume-muted-symbolic',
    'audio-volume-low-symbolic',
    'audio-volume-medium-symbolic',
    'audio-volume-high-symbolic'
];

let panel,
    panelBinding,
    volumeControl,
    streamSlider,
    volumeStep;

function init() {
  volumeControl = Volume.getMixerControl();
  streamSlider = new Volume.StreamSlider(volumeControl);
  volumeStep = _getVolumeMax() / 40;

  panel = Main.panel;
  panelBinding = null;
}

function enable() {
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

  switch(event.get_scroll_direction()) {
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
  }
  else if (volume < volumeStep) {
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
function _showVolumeOsd (level, maxLevel, absoluteMaxLevel) {
  let monitor = -1;
  let n;
  let percent = level / maxLevel;
  let maxPercent = absoluteMaxLevel / maxLevel;

  if (percent === 0) {
      n = 0;
  } else if (percent < 0.33) {
      n = 1
  } else {
      n = Math.min(Math.round(percent * 3), 3)
  }

  let icon = Gio.Icon.new_for_string(VOL_ICONS[n]);

  global.log(level, maxLevel, absoluteMaxLevel, percent, maxPercent)

  Main.osdWindowManager.show(monitor, icon, null, percent, maxPercent);
}