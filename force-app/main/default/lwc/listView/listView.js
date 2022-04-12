import {api, LightningElement} from 'lwc';
import getSObjects from '@salesforce/apex/ListViewController.getSObjects'
import getSObjectCount from '@salesforce/apex/ListViewController.getSObjectCount'
import getSObjectFields from '@salesforce/apex/ListViewController.getSObjectFields'
import {NavigationMixin} from "lightning/navigation";
import getColumn from './getColumn';
import {getRow} from "./getRow";

const errorMessageGeneric = 'An unknown error occurred, please contact support.';

export default class ListView extends NavigationMixin(LightningElement) {

  // Controls the information that is queried and presented.
  @api soql;

  // Presentation of information.
  @api title;
  @api subTitle;
  @api icon;
  @api pageSize;
  @api showRowNumber;
  @api urlType;

  // Editing of information.
  @api editFields;
  @api bypassAccess;

  // Interpreted information from passed values.
  sObjectName;
  fields;
  whereClause;
  iconName;

  // Helper variables.
  errorUI;
  dataOffset = 0;
  columns = [];

  data = [];
  dataOriginal = [];
  dataTotalCount = [];
  dataMeta = [];
  isLoading = true;

  /**
   * Runs the main process of detecting information based on arguments and runs
   * a query to populate the data table.
   */
  async connectedCallback() {
    try {
      this.detectSOQLData();
      this.detectIcon();

      await this.getMetaData();
      await this.getData();
    } catch (e) {
      this.addErrorUI(e?.body?.message || e?.message || e);
    } finally {
      this.isLoading = false;
      this.debugFields();
    }
  }

  onRowAction(event) {
    const action = event.detail.action;
    const row = event.detail.row;

    // If a url button has been pressed.
    if (action?.type === 'button') {
      this.navigateUrl(row[action?.fieldName]);
    }
  }

  get showTable() {
    return !this.errorUI && !this.isLoading;
  }

  /**
   * Navigate the user to a specific URL.
   */
  navigateUrl(url) {
    const config = {
      type: 'standard__webPage',
      attributes: {
        url: url
      }
    };
    this[NavigationMixin.Navigate](config);
  }

  /**
   * Adds an error to the UI depending on where we are.
   *
   * @param error
   */
  addErrorUI(error) {
    console.error(error);

    // If we are not in page builder, simply provide a generic error.
    if (!this.isPageBuilder) {
      this.errorUI = errorMessageGeneric;
      return;
    }
    // Add the errors together.
    this.errorUI = (this.errorUI ? '' : '\n') + error;
  }

  /**
   * Returns true if the user is currently in page builder.
   *
   * @returns {boolean}
   */
  get isPageBuilder() {
    return window.location.pathname.indexOf('flexipageEditor') !== -1;
  }

  /**
   * Get metadata from the sObject to help us understand what to render in the list view.
   *
   * @returns {Promise<void>}
   */
  async getMetaData() {
    console.debug(`Retrieving a list of fields.`);
    const dataMeta = this.dataMeta = await getSObjectFields({sObjectName: this.sObjectName});

    this.columns = this.fields
      .map((field) => field.toLowerCase()) // Convert to lowercase.
      .map((field) => dataMeta[field]) // Get the respective metadata.
      .map((field, index) => getColumn(field, { // Generate the columns and pass options.
        urlType: this.urlType,
        fieldName: this.fields[index],
      }))
    ;

    // Change the fields to a list of valid ones based on the metadata.
    this.fields = this.columns
      .map((column) => column.fieldName)
      .filter((value) => value)
    ;
  }

  /**
   * Get data for the list view from the apex class.
   * Note: This also adds the limit and offset based on our current position.
   *
   * @returns {Promise<void>}
   */
  async getData() {
    // Make the list of fields unique and ensure 'Name' is included
    const fields = [...new Set([...this.fields, 'Name'])];

    let soql = `SELECT ${fields.join(', ')} FROM ${this.sObjectName} ${this.whereClause}`;
    let soqlCount = `SELECT COUNT(id) FROM ${this.sObjectName} ${this.whereClause}`;

    if (/limit [0-9]/gi.exec(soql) !== null && this.pageSize) {
      console.warn('A page size has been added for pagination, but the SOQL has a limit/offset specified. Pagination has been turned off.');
    } else if (this.pageSize) {
      soql += `LIMIT ${this.pageSize} OFFSET ${this.dataOffset}`;
    }

    // Get the rows
    console.debug(`Executing SOQL: ${soql}`);
    this.dataOriginal = (await getSObjects({soql: soql}));
    this.data = this.dataOriginal.map((row) => getRow(row));

    // Get the total count
    console.debug(`Executing SOQL: ${soqlCount}`);
    this.dataTotalCount = await getSObjectCount({soql: soqlCount});
  }

  /**
   * Debug all information that we've got.
   */
  debugFields() {
    console.debug(`SObject: ${this.sObjectName}`);
    console.debug(`Fields: ${this.fields}`);
    console.debug(`Icon: ${this.iconName}`);
    console.debug(`Total Count: ${this.dataTotalCount}`);
    console.debug(this.dataMeta);
    console.table(this.columns);
    console.table(this.dataOriginal);
    console.table(this.data);
  }

  /**
   * Extract various pieces of the SOQL provided.
   */
  detectSOQLData() {
    const matchingGroups = /SELECT (?<fields>.+?) FROM (?<sObjectName>[a-z0-9_]+)(?<whereClause>.*)/i.exec(this.soql)?.groups;

    if (matchingGroups === undefined) {
      throw (`Error detecting the sobject name and relevant fields, expected format "SELECT % FROM %", "${this.soql}" received.`);
    } else {
      this.sObjectName = matchingGroups.sObjectName;
      this.fields = matchingGroups.fields.split(',').map(field => field.trim().toLowerCase());
      this.whereClause = (matchingGroups.whereClause || '').trim();
    }
  }

  /**
   * Detect the icon that should be used on the page based on the SOQL provided.
   */
  detectIcon() {
    const iconValidFormat = /^[a-z]+:[a-z]+$/i.exec(this.icon) !== null;

    // Icon is provided, and is of a valid format.
    if (this.icon && iconValidFormat) {
      this.iconName = this.icon;
      return;
    }

    // Icon is provided and invalid format.
    if (this.icon && !iconValidFormat) {
      console.info(`The icon ${this.icon} is invalid, expected format "%:%"`)
      return;
    }

    // Auto-detect - SObject name missing.
    if (!this.sObjectName) {
      this.iconName = 'standard:default';
      return;
    }

    // Auto-detect - Standard SObject.
    if (this.sObjectName.indexOf('__c') === -1) {
      this.iconName = `standard:${this.sObjectName.toLowerCase()}`;
      return;
    }

    // Auto detect - custom SObject.
    this.iconName = undefined;
    // TODO: Implement this from tab.
  }
}