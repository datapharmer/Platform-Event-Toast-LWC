import { LightningElement, api } from 'lwc';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import { subscribe, unsubscribe, onError } from 'lightning/empApi';
import userId from '@salesforce/user/Id';

export default class PlatformEventToast extends LightningElement {
    // Existing design-time props
    @api key;                 // App Builder "Key" to match platform events
    @api runInSystemMode = false;

    // New/updated props
    @api channelName = '/event/TostEvent__e'; // default from the repo/package
    @api useRecordIdAsKey = false;            // when placed on a record page
    @api recordId;                            // auto-populated by framework on record pages

    subscription;

    connectedCallback() {
        this.subscribeToChannel();
        onError(error => {
            // Optional: surface an error toast so admins know what's wrong
            this.dispatchEvent(
                new ShowToastEvent({
                    title: 'Platform Event Toast – subscription error',
                    message: (error && error.message) || 'See console for details',
                    variant: 'error',
                    mode: 'sticky'
                })
            );
            // eslint-disable-next-line no-console
            console.error('EMP API error', JSON.stringify(error));
        });
    }

    disconnectedCallback() {
        if (this.subscription) {
            unsubscribe(this.subscription);
            this.subscription = null;
        }
    }

    async subscribeToChannel() {
        const replayId = -1; // newest events only
        this.subscription = await subscribe(this.channelName, replayId, (event) =>
            this.handleEvent(event)
        );
    }

    handleEvent(message) {
        const p = message?.data?.payload || {};

        // Respect "key" filter. If useRecordIdAsKey=true on a record page, recordId is the expected key.
        const expectedKey = this.useRecordIdAsKey && this.recordId ? this.recordId : this.key;
        if (expectedKey && p.Key__c !== expectedKey) return;

        // If not running in system mode, optionally honor a targeted user field if you have one
        // (Remove this block if your platform event doesn’t have TargetUserId__c)
        if (!this.runInSystemMode && p.TargetUserId__c && p.TargetUserId__c !== userId) return;

        // Build and fire the standard toast
        const title = p.Title__c || 'Notice';
        const messageText = p.Message__c || '';
        const variant = (p.Variant__c || 'info').toLowerCase();       // info | success | warning | error
        const mode = (p.Mode__c || 'dismissable').toLowerCase();      // dismissable | pester | sticky

        // Optional messageData JSON (for links/placeholders)
        let messageData = [];
        if (p.MessageData__c) {
            try { messageData = JSON.parse(p.MessageData__c); } catch (e) { /* ignore */ }
        }

        this.dispatchEvent(
            new ShowToastEvent({
                title,
                message: messageText,
                variant,
                mode,
                messageData
            })
        );
    }
}
