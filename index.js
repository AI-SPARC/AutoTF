import { SystemContext } from './src/controls/system_context.js';
import { initializeCanvas } from './src/controls/canvas_events.js';
import { initializePageEvents } from './src/controls/page_events.js';
import { State } from './src/controls/state.js';

$(function () {

  SystemContext.initializeContext(); // Initialize canvas to start drawing
  State.initialize(); // Initialize events stack (undo/redo)
  initializePageEvents(); // Create listeners to shortcuts and toolbars
  initializeCanvas(); // Create listeners to perform actions when user tries to manipulate canvas workspace
  SystemContext.draw(); // First draw to clean workspace 

});