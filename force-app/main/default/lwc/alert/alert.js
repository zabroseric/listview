/**
 * Created by shaun on 7/04/2022.
 */

import {api, LightningElement} from 'lwc';

const variantAllowed = [
  'error',
];

const variantIcons = {
  'error': 'utility:error'
};

/**
 * TODO: Implement the other variations supported by slds.
 *
 * @src https://www.lightningdesignsystem.com/guidelines/messaging/components/alerts/#
 * @src https://www.lightningdesignsystem.com/icons/
 */
export default class Alert extends LightningElement {

  @api variant;
  @api message;

  connectedCallback() {
    if (!this.showAlert) {
      console.error(`Alert variant of ${this.variant} not allowed.`);
    }
  }

  get className() {
    return `slds-notify slds-notify_alert slds-theme_${this.variant} slds-theme_alert-texture slds-banner`;
  }

  get showAlert() {
    return variantAllowed.includes(this.variant)
  }

  get iconName() {
    return variantIcons[this.variant];
  }
}