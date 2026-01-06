/**
 * EventBus - Decoupled event communication system
 * Implements Observer/PubSub pattern for module communication
 *
 * @enterprise-pattern Observer/PubSub
 * @responsibility Event handling, module communication
 */

export class EventBus {
    static instance = null;

    /**
     * Singleton accessor
     * @returns {EventBus}
     */
    static getInstance() {
        if (!EventBus.instance) {
            EventBus.instance = new EventBus();
        }
        return EventBus.instance;
    }

    constructor() {
        if (EventBus.instance) {
            throw new Error('EventBus is a singleton. Use getInstance()');
        }

        this.listeners = new Map();
        this.onceListeners = new Map();
    }

    /**
     * Subscribe to an event
     * @param {string} event - Event name
     * @param {Function} callback - Event handler
     * @returns {Function} Unsubscribe function
     */
    on(event, callback) {
        if (!this.listeners.has(event)) {
            this.listeners.set(event, new Set());
        }

        this.listeners.get(event).add(callback);

        // Return unsubscribe function
        return () => this.off(event, callback);
    }

    /**
     * Subscribe to event (fires once then unsubscribes)
     * @param {string} event - Event name
     * @param {Function} callback - Event handler
     */
    once(event, callback) {
        if (!this.onceListeners.has(event)) {
            this.onceListeners.set(event, new Set());
        }

        this.onceListeners.get(event).add(callback);
    }

    /**
     * Unsubscribe from an event
     * @param {string} event - Event name
     * @param {Function} callback - Event handler to remove
     */
    off(event, callback) {
        if (this.listeners.has(event)) {
            this.listeners.get(event).delete(callback);
        }

        if (this.onceListeners.has(event)) {
            this.onceListeners.get(event).delete(callback);
        }
    }

    /**
     * Emit an event
     * @param {string} event - Event name
     * @param {*} data - Event data
     */
    emit(event, data) {
        // Fire regular listeners
        if (this.listeners.has(event)) {
            this.listeners.get(event).forEach((callback) => {
                try {
                    callback(data);
                } catch (error) {
                    console.error(`Error in event listener for "${event}":`, error);
                }
            });
        }

        // Fire and remove once listeners
        if (this.onceListeners.has(event)) {
            this.onceListeners.get(event).forEach((callback) => {
                try {
                    callback(data);
                } catch (error) {
                    console.error(`Error in once listener for "${event}":`, error);
                }
            });
            this.onceListeners.delete(event);
        }
    }

    /**
     * Remove all listeners for an event
     * @param {string} event - Event name
     */
    clear(event) {
        this.listeners.delete(event);
        this.onceListeners.delete(event);
    }

    /**
     * Remove all listeners
     */
    clearAll() {
        this.listeners.clear();
        this.onceListeners.clear();
    }

    /**
     * Get listener count for an event
     * @param {string} event - Event name
     * @returns {number}
     */
    listenerCount(event) {
        const regularCount = this.listeners.has(event) ? this.listeners.get(event).size : 0;
        const onceCount = this.onceListeners.has(event) ? this.onceListeners.get(event).size : 0;
        return regularCount + onceCount;
    }
}
