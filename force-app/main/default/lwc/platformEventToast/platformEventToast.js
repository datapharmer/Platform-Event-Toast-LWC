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
    
    // Don't initialize, let undefined mean "use platform events"
    @api usePlatformEvents;
    
    channelName = '/event/Toast_Event__e';
    subscription = {};
    hasShownPageLoadToast = false;

    // Getter to handle backward compatibility
    get shouldUsePlatformEvents() {
        // If not explicitly set to false, default to true for backward compatibility
        return this.usePlatformEvents !== false;
    }

    connectedCallback() {
        // Show page load toast if configured
        if (this.showOnPageLoad && !this.shouldUsePlatformEvents) {
            this.showPageLoadToast();
        }
        
        // Subscribe to platform events if enabled
        if (this.shouldUsePlatformEvents) {
            this.registerErrorListener();
            this.handleSubscribe();
        }
    }

    disconnectedCallback() {
        if (this.shouldUsePlatformEvents && this.subscription) {
            this.handleUnsubscribe();
        }
    }

    // ... rest of the methods remain the same
}
