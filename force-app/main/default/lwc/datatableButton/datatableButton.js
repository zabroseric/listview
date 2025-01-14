import {api, LightningElement} from 'lwc';
import {NavigationMixin} from "lightning/navigation";
import {getId} from "c/utils";

export default class DatatableButton extends NavigationMixin(LightningElement) {
  @api label;
  @api variant;
  @api url;
  @api type;

  onClick () {
    let urlConfig;

    if (getId(this.url)) {
      urlConfig = {
        type: 'standard__recordPage',
        attributes: {recordId: getId(this.url), actionName: 'view',},
      }
    } else {
      urlConfig = {
        type: 'standard__webPage',
        attributes: {url: this.url}
      };
    }

    this[NavigationMixin.Navigate](urlConfig);
  }

  get classNames() {
    return `slds-button slds-button_${this.variant} slds-text-align_left`;
  }
}