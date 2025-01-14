import {api, LightningElement, wire} from 'lwc';
import getSObjectNameApex from '@salesforce/apex/ListViewController.getSObjectName'
import {logApexFunc} from "c/utils";
import {subscribe} from 'lightning/empApi';
import userId from "@salesforce/user/Id";
import {getRecord} from "lightning/uiRecordApi";

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
  @api enableSearch;
  @api enableRefresh;
  @api enableDownload;
  @api hyperlinkNames;

  @api recordId;

  hasRendered = false;
  hasLoadedFieldValues = false;
  fieldValues = {};

  /**
   * Retrieve the record details based on any injectable fields we have provided in the SOQL.
   *
   * @param error
   * @param data
   */
  @wire(getRecord, {recordId: "$recordId", fields: "$injectableFields"})
  wiredRecord({error, data}) {
    if (data) {
      this.fieldValues = data.fields;

      // If we load new fields from the record, ensure that we refresh the list view.
      if (this.hasLoadedFieldValues) {
        this.template.querySelector('c-list-view-data-query').soql = this.soqlModified;
        this.template.querySelector('c-list-view-data-query').onRefresh();
      }
      this.hasLoadedFieldValues = true;
    } else if (error) {
      console.error(JSON.stringify(error));
    }
  }

  /**
   * Get fields we want to inject from the current SObject.
   * This is provided using the :Field_Name notation in the SOQL.
   *
   * @returns {*|*[]}
   */
  get injectableFields() {
    if (this.sObjectName === undefined) {
      console.error('Unable to determine sObject name from the SOQL');
      return [];
    }

    return this.soql
      .match(/(?<=:)[a-z0-9_]+/gi)
      ?.filter((field) => /recordid/i.exec(field) === null)
      ?.map((field) => `${this.sObjectName}.${field}`) ?? []
      ;
  }

  /**
   * Get the sObject name from the SOQL provided.
   *
   * @returns {string | undefined}
   */
  get sObjectName() {
    return /FROM (?<sObjectName>[a-z0-9_]+)?/i.exec(this.soql)?.groups?.sObjectName;
  }

  /**
   * Modify the SOQL passed by injecting the record id, before passing it
   * to the list view for processing.
   *
   * @returns {string}
   */
  get soqlModified() {
    return (this.soql || '')
      .replace(/'%:?recordid%'?/gi, `'%${this.recordId}%'`)
      .replace(/'?:?recordid'?/gi, `'${this.recordId}'`)
      .replace(/:[a-z0-9_]+/gi, (field) => this.fieldValues[field.substring(1)]?.value ?? '<UNKNOWN>')
      ;
  }

  /**
   * Subscribe to events after the list-view component has rendered and can analyse the SOQL provided.
   */
  renderedCallback() {
    if (!this.hasRendered) {
      this.onSubscribe().catch(console.error);
      this.hasRendered = true;
    }
  }

  /**
   * Subscribe to the data capture event and refresh the list view if a change is detected
   * from the current user.
   *
   * @returns {Promise<void>}
   */
  async onSubscribe() {
    const sObjectChangeEvent = await this.getsObjectChangeEvent();

    const messageCallback = (event) => {
      if (event.data.payload.CreatedById === userId) {
        this.template.querySelector('c-list-view-data-query').onRefresh();
      }
    }
    subscribe(sObjectChangeEvent, -1, messageCallback).catch(console.error);
  }

  /**
   * Get the event object that should be subscribed to, based on the SOQL provided.
   *
   * @returns {Promise<string>}
   */
  async getsObjectChangeEvent() {
    const sObjectName = await getSObjectName({sObjectName: this.sObjectName});
    return !sObjectName.includes('__c') ? `/data/${sObjectName}ChangeEvent` : `/data/${sObjectName}__ChangeEvent`;
  }
}