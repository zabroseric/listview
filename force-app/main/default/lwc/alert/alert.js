import {api, LightningElement} from 'lwc';

const variantAllowed = [
  'error',
  'warning',
  'info',
  'success',
];

const variantIcons = {
  'error': 'utility:error',
  'warning': 'utility:warning',
  'info': 'utility:user',
  'success': 'utility:success',
};

/**
 * Display an alert on the pae following the Lightning Design System standards.
 *
 * @src https://www.lightningdesignsystem.com/guidelines/messaging/components/alerts/#
 * @src https://www.lightningdesignsystem.com/icons/
 */
export default class Alert extends LightningElement {

  @api variant;
  @api message;

  get className() {
    return `slds-notify slds-notify_alert slds-theme_${this.variant} slds-theme_alert-texture slds-banner`;
  }

  get showAlert() {
    return variantAllowed.includes(this.variant);
  }

  get iconName() {
    return variantIcons[this.variant];
  }

  connectedCallback() {
    if (!this.showAlert) {
      console.error(`Alert variant of ${this.variant} not allowed.`);
    }
  }
}