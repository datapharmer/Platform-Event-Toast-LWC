import { LightningElement, api } from 'lwc';
import { subscribe, unsubscribe, onError } from 'lightning/empApi';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';

export default class PlatformEventToast extends LightningElement {
    @api recordId;
    
    // Keep ALL existing properties for backward compatibility
    @api toastTitle;
    @api toastMessage;
    @api toastVariant;
    @api toastKeys;
    @api toastMode;
    @api runInSystemMode = false;
    
    // New properties for page load functionality
    @api showOnPageLoad = false;
    @api showDelay = 1000;
    @api showOnlyOnce = false;
    @api usePlatformEvents = false; // Changed from true to false
    
    channelName = '/event/Toast_Event__e';
    subscription = {};
    hasShownPageLoadToast = false;

    connectedCallback() {
        // Show page load toast if configured
        if (this.showOnPageLoad && !this.usePlatformEvents) {
            this.showPageLoadToast();
        }
        
        // Subscribe to platform events if enabled
        // Default to true for backward compatibility if not explicitly set to false
        if (this.usePlatformEvents !== false) {
            this.registerErrorListener();
            this.handleSubscribe();
        }
    }

    disconnectedCallback() {
        if (this.usePlatformEvents !== false && this.subscription) {
            this.handleUnsubscribe();
        }
    }

    showPageLoadToast() {
        if (this.shouldShowPageLoadToast()) {
            setTimeout(() => {
                this.showDirectToast();
            }, this.showDelay);
        }
    }

    shouldShowPageLoadToast() {
        if (this.showOnlyOnce) {
            const storageKey = `toast_shown_${this.recordId || 'page'}`;
            const hasShown = sessionStorage.getItem(storageKey);
            
            if (hasShown) {
                return false;
            }
            
            sessionStorage.setItem(storageKey, 'true');
        }
        
        return true;
    }

    showDirectToast() {
        const message = this.toastMessage ? 
            this.toastMessage.replace('{recordId}', this.recordId || '') : 
            'Page loaded successfully';
            
        const event = new ShowToastEvent({
            title: this.toastTitle || 'Notification',
            message: message,
            variant: this.toastVariant || 'info',
            mode: this.toastMode || 'dismissable'
        });
        
        this.dispatchEvent(event);
    }

    // Platform Event Methods (keeping existing functionality)
    handleSubscribe() {
        const messageCallback = (response) => {
            const toastEvent = response.data.payload;
            
            if (this.shouldShowPlatformEventToast(toastEvent)) {
                this.showPlatformEventToast(toastEvent);
            }
        };

        subscribe(this.channelName, -1, messageCallback).then(response => {
            this.subscription = response;
        }).catch(error => {
            console.error('Subscribe error:', JSON.stringify(error));
        });
    }

    shouldShowPlatformEventToast(toastEvent) {
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
            return toastEvent.Record_Id__c === this.recordId;
        }

        // If no record ID is specified in the toast event, show it
        if (!toastEvent.Record_Id__c) {
            return true;
        }

        return false;
    }

    showPlatformEventToast(toastEvent) {
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
            console.error('Platform Event Error:', JSON.stringify(error));
        });
    }
}
