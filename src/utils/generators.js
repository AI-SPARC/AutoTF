import { Component } from "../components/component.js";
export function generateComponentId(idInitial){
    let found = false;
    let number = 1;
    while(!found){
        found = true;
        Component.list.forEach(function(c){
            if(idInitial+number == c.id){
                found = false;
            }
        });
        if(!found)
            number += 1;
    }
    return idInitial+number;
}

export function generateUUID(){
    var dt = new Date().getTime();
    var uuid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        var r = (dt + Math.random()*16)%16 | 0;
        dt = Math.floor(dt/16);
        return (c=='x' ? r :(r&0x3|0x8)).toString(16);
    });
    return uuid;
}