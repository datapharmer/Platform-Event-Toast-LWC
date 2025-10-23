import { LightningElement, api } from 'lwc';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';

export default class PlatformEventToast extends LightningElement {
    @api recordId;
    @api toastTitle = 'Welcome';
    @api toastMessage = 'Page loaded successfully';
    @api toastVariant = 'success';
    @api toastMode = 'dismissable';
    @api showDelay = 1000; // Delay in milliseconds
    @api showOnlyOnce = false; // Show toast only once per session

    connectedCallback() {
        // Check if we should show the toast
        if (this.shouldShowToast()) {
            // Use setTimeout to ensure page is fully loaded
            setTimeout(() => {
                this.showToast();
            }, this.showDelay);
        }
    }

    shouldShowToast() {
        // If showOnlyOnce is true, check sessionStorage
        if (this.showOnlyOnce) {
            const storageKey = `toast_shown_${this.recordId || 'page'}`;
            const hasShown = sessionStorage.getItem(storageKey);
            
            if (hasShown) {
                return false;
            }
            
            // Mark as shown
            sessionStorage.setItem(storageKey, 'true');
        }
        
        return true;
    }

    showToast() {
        // Prepare the message with record context if available
        let message = this.toastMessage;
        
        // Replace {recordId} placeholder if present
        if (this.recordId && message.includes('{recordId}')) {
            message = message.replace('{recordId}', this.recordId);
        }

        const event = new ShowToastEvent({
            title: this.toastTitle,
            message: message,
            variant: this.toastVariant,
            mode: this.toastMode
        });
        
        this.dispatchEvent(event);
    }

    // Public method to manually trigger toast
    @api
    triggerToast(customTitle, customMessage, customVariant) {
        const event = new ShowToastEvent({
            title: customTitle || this.toastTitle,
            message: customMessage || this.toastMessage,
            variant: customVariant || this.toastVariant,
            mode: this.toastMode
        });
        
        this.dispatchEvent(event);
    }
}
