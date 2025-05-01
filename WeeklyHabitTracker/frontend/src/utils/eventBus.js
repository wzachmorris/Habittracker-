// /frontend/src/utils/eventBus.js
const EventBus = {
  events: {},
  
  subscribe(event, callback) {
    if (!this.events[event]) {
      this.events[event] = [];
    }
    this.events[event].push(callback);
    return () => this.unsubscribe(event, callback); // Return unsubscribe function
  },
  
  unsubscribe(event, callback) {
    if (this.events[event]) {
      this.events[event] = this.events[event].filter(cb => cb !== callback);
    }
  },
  
  publish(event, data) {
    console.log(`[EventBus] Publishing event: ${event}`, data);
    if (this.events[event]) {
      this.events[event].forEach(callback => {
        callback(data);
      });
    }
    
    // Also dispatch a DOM event for components that might be listening that way
    window.dispatchEvent(new CustomEvent(event, { detail: data }));
  }
};

export default EventBus;