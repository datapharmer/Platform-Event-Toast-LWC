import { LightningElement, api } from 'lwc';
import { subscribe, unsubscribe, onError } from 'lightning/empApi';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';

export default class PlatformEventToast extends LightningElement {
    // Add record ID for context awareness
    @api recordId;
    
    // Keep existing properties for backward compatibility
    @api toastTitle;
    @api toastMessage; 
    @api toastVariant;
    @api toastKeys;
    @api toastMode;
    @api runInSystemMode = false;
    
    channelName = '/event/Toast_Event__e';
    subscription = {};

    connectedCallback() {
        this.registerErrorListener();
        this.handleSubscribe();
    }

    disconnectedCallback() {
        this.handleUnsubscribe();
    }

    handleSubscribe() {
        const messageCallback = (response) => {
            const toastEvent = response.data.payload;
            
            // Check if the toast should be shown based on user context and record ID
            if (this.shouldShowToast(toastEvent)) {
                this.showToast(toastEvent);
            }
        };

        subscribe(this.channelName, -1, messageCallback).then(response => {
            this.subscription = response;
        });
    }

    shouldShowToast(toastEvent) {
        // If running in system mode, show to all users
        if (this.runInSystemMode) {
            return true;
        }

        // Check if the toast matches the key filter (if specified)
        if (this.toastKeys && toastEvent.Key__c) {
            const keys = this.toastKeys.split(',').map(key => key.trim());
            if (!keys.includes(toastEvent.Key__c)) {
                return false;
            }
        }

        // If a record ID is specified in the toast event and we're on a record page
        if (toastEvent.Record_Id__c && this.recordId) {
            // Only show if the record IDs match
            return toastEvent.Record_Id__c === this.recordId;
        }

        // If no record ID is specified in the toast event, show it
        if (!toastEvent.Record_Id__c) {
            return true;
        }

        return false;
    }

    showToast(toastEvent) {
        // Use configured properties if available, otherwise use platform event data
        const title = this.toastTitle || toastEvent.Title__c || 'Notification';
        const message = this.toastMessage || toastEvent.Message__c || '';
        const variant = this.toastVariant || (toastEvent.Type__c ? toastEvent.Type__c.toLowerCase() : 'info');
        const mode = this.toastMode || (toastEvent.Mode__c ? toastEvent.Mode__c.toLowerCase() : 'dismissable');

        const event = new ShowToastEvent({
            title: title,
            message: message,
            variant: variant,
            mode: mode
        });
        
        this.dispatchEvent(event);
    }

    handleUnsubscribe() {
        unsubscribe(this.subscription, response => {
            console.log('Unsubscribed from channel');
        });
    }

    registerErrorListener() {
        onError(error => {
            console.error('Error in Platform Event Toast:', JSON.stringify(error));
        });
    }
}
