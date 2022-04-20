// Object to store each command sent by user. This class makes possible to implement undo and redo functions

import { SystemContext } from "./system_context.js";

export class State{

  // Stack to control event orders
  static current = null;

  static initialize(){
    // First state must be the first stack element
    this.set();
  }

  // A new state is created converting System Context to json and putting the new object on current stack
  static set(){
    let newState = new State(SystemContext.toObject(), this.current);
    if(this.current != null){ // Unlikely event: only to avoid unexpected scenarios
      this.current.nextState = newState;
      $('#btnUndo').removeClass('disabled'); // If new state is created, it is now possible to undo.
    }
    this.current = newState;
    $('#btnRedo').addClass('disabled'); // After a new action is performed, redo option can't be no longer available. (enabled only after an undo command)
  }

  static backward(){
    // if previous state exists, return to it
    if(this.current.previousState != null){
      this.current = this.current.previousState;
      SystemContext.fromObject(this.current.objects);
    }
  }

  static forward(){
    // if next state exists, then go for it
    if(this.current.nextState != null){
      this.current = this.current.nextState;
      SystemContext.fromObject(this.current.objects);
    }
  }

  constructor(objects, previousState){
    this.objects = objects;
    this.previousState = previousState;
    this.nextState = null;
  }

}