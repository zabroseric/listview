import {api, LightningElement} from 'lwc';
import getSObjectNameApex from '@salesforce/apex/ListViewController.getSObjectName'
import {logApexFunc} from "c/utils";
import {subscribe} from 'lightning/empApi';
import userId from "@salesforce/user/Id";

// Wrap the apex functions using a decorative pattern for logging.
const getSObjectName = logApexFunc('getSObjectName', getSObjectNameApex);

export default class ListViewRecordPage extends LightningElement {

  @api soql;
  @api title;
  @api subTitle;
  @api icon;
  @api pageSize;
  @api showRowNumber;
  @api infiniteScrolling;
  @api urlType;
  @api editFields;
  @api bypassAccess;

  @api recordId;

  hasRendered = false;

  /**
   * Modify the SOQL passed by injecting the record id, before passing it
   * to the list view for processing.
   *
   * @returns {string}
   */
  get soqlModified() {
    return (this.soql || '').replace(/'?:?recordid'?/gi, `'${this.recordId}'`);
  }

  renderedCallback() {
    if (!this.hasRendered) {
      this.onSubscribe().catch((e) => console.error(e));
      this.hasRendered = true;
    }
  }

  async onSubscribe() {
    const sObjectChangeEvent = await this.getsObjectChangeEvent();

    const messageCallback = (event) => {
      if (event.data.payload.CreatedById === userId) {
        this.template.querySelector('c-list-view').refreshData();
      }
    }
    console.debug(`Subscribing to: ${sObjectChangeEvent}`);
    subscribe(sObjectChangeEvent, -1, messageCallback).catch((e) => console.error(e));
  }

  async getsObjectChangeEvent() {
    const sObjectName = await getSObjectName({sObjectName: this.template.querySelector('c-list-view').sObjectName});
    return !sObjectName.includes('__c') ? `/data/${sObjectName}ChangeEvent` : `/data/${sObjectName}__ChangeEvent`;
  }
}