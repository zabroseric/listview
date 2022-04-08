/**
 * Created by shaun on 7/04/2022.
 */

import {api, LightningElement} from 'lwc';
import getSObjects from '@salesforce/apex/ListViewController.getSObjects'
import getSObjectCount from '@salesforce/apex/ListViewController.getSObjectCount'
import getSObjectFields from '@salesforce/apex/ListViewController.getSObjectFields'
import getColumn from './getColumn';

const errorMessageGeneric = 'An unknown error occurred, please contact support.';

export default class ListView extends LightningElement {

  // Controls the information that is queried and presented.
  @api soql;

  // Presentation of information.
  @api title;
  @api subTitle;
  @api icon;
  @api pageSize;
  @api showRowNumber;
  @api showButtons;

  // Editing of information.
  @api editFields;
  @api bypassAccess;

  // Interpreted information from passed values.
  sObjectName;
  fields;
  iconName;

  // Helper variables.
  errorUI;
  dataOffset = 0;
  columns = [];

  data = [];
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

      // Run both process in multiple threads for performance.
      await Promise.all([this.getMetaData(), this.getData()]);
    }
    catch (e) {
      this.addErrorUI(e.body.message || e.message);
      console.error(e.body || e.message);
    }
    finally {
      this.isLoading = false;
      this.debugFields();
    }
  }

  get showSubTitle() {
    return this.title !== undefined;
  }

  get showIcon() {
    return this.iconName !== undefined;
  }

  get errorUI() {
    return this.errorUI;
  }

  get showTable() {
    return !this.errorUI && !this.isLoading;
  }

  /**
   * Adds an error to the UI depending on where we are.
   *
   * @param error
   */
  addErrorUI(error) {
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
      .map((field) => field.toLowerCase()) // Convert to lowercase
      .map((field) => dataMeta[field]) // Get the respective metadata
      .map((field) => getColumn(field)) // Generate the column
    ;
  }

  /**
   * Get data for the list view from the apex class.
   * Note: This also adds the limit and offset based on our current position.
   *
   * @returns {Promise<void>}
   */
  async getData() {
    let soql = this.soql;
    let soqlCount = this.soql.replace(/SELECT .+? FROM/i, 'SELECT count(Id) FROM');

    if (/limit [0-9]/gi.exec(soql) !== null && this.pageSize) {
      console.warn('A page size has been added for pagination, but the SOQL has a limit/offset specified. Pagination has been turned off.');
    } else if (this.pageSize) {
      soql += `LIMIT ${this.pageSize} OFFSET ${this.dataOffset}`;
    }

    // Get the rows
    console.debug(`Executing SOQL: ${soql}`);
    this.data = await getSObjects({soql: soql});

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
    console.table(this.data);
  }

  /**
   * Extract various pieces of the SOQL provided.
   */
  detectSOQLData() {
    const matchingGroups = /SELECT (?<fields>.+?) FROM (?<sObjectName>[a-z0-9_]+)/i.exec(this.soql)?.groups;

    if (matchingGroups === undefined) {
      console.error(`Error detecting the sobject name and relevant fields, expected format "SELECT % FROM %", "${this.soql}" recieved.`);
    } else {
      this.sObjectName = matchingGroups.sObjectName;
      this.fields = matchingGroups.fields.split(',').map(field => field.trim());
    }
  }

  /**
   * Detect the icon that should be used on the page based on the SOQL provided.
   */
  detectIcon() {
    const iconValidFormat = /$[a-z]+:[a-z]+^/i.exec(this.icon) !== null;

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

    // Auto-detect - standard object name if provided.
    if (!this.sObjectName) {
      return;
    }
    if (this.sObjectName.indexOf('__c') === -1) {
      this.iconName = `standard:${this.sObjectName.toLowerCase()}`;
      return;
    }

    // Auto detect - custom object name.
    this.iconName = undefined;
    // TODO: Implement this from tab.
  }
}