import EventEmitter from 'events';

class AppEventEmitter extends EventEmitter {}

export const appEventEmitter = new AppEventEmitter();
appEventEmitter.setMaxListeners(50);

export default appEventEmitter;
