import {api, LightningElement} from 'lwc';
import getSObjectsApex from '@salesforce/apex/ListViewController.getSObjects'
import getSObjectCountApex from '@salesforce/apex/ListViewController.getSObjectCount'
import getSObjectFieldsApex from '@salesforce/apex/ListViewController.getSObjectFields'
import {NavigationMixin} from "lightning/navigation";
import getColumn from './getColumn';
import getRow from "./getRow";
import {logApexFunc, titleCase, toBoolean} from "./utils";
import {
  errorMessageGeneric,
  nameFields, pageSizeDefault,
  pageSizeMax,
  sortByDefault,
  sortDirectionDefault
} from "./constants";

// Wrap the apex functions using a decorative pattern for logging.
const getSObjects = logApexFunc('getSObjects', getSObjectsApex);
const getSObjectCount = logApexFunc('getSObjectCount', getSObjectCountApex);
const getSObjectFields = logApexFunc('getSObjectFields', getSObjectFieldsApex);

export default class ListView extends NavigationMixin(LightningElement) {

  // Controls the information that is queried and presented.
  @api soql;

  // Presentation of information.
  @api title;
  @api subTitle;
  @api icon;
  @api pageSize;
  @api showRowNumber;
  @api infiniteScrolling;
  @api infiniteScrollingAdditionalRows;
  @api infiniteScrollingHeight = 500;
  @api urlType;

  // Editing of information.
  @api editFields;
  @api bypassAccess;

  // Interpreted information from passed values.
  sObjectName;
  fields;
  whereClause;
  sortBy;
  sortDirection;
  iconName;

  // Helper variables.
  errorUI;
  dataOffset = 0;
  dataTotalCount;
  nameField;
  nameFieldLabel;
  isLoading = true;

  columns = [];
  data = [];
  dataMeta = [];

  /**
   * Runs the main process of detecting information based on arguments and runs
   * a query to populate the data table.
   */
  async connectedCallback() {
    try {
      // Set defaults and correct data types.
      this.pageSize = this.pageSize ?? pageSizeDefault;
      this.infiniteScrollingAdditionalRows = this.infiniteScrollingAdditionalRows ?? this.pageSize;
      this.showRowNumber = toBoolean(this.showRowNumber);
      this.infiniteScrolling = toBoolean(this.infiniteScrolling);

      this.detectSOQLData();
      this.detectIcon();

      await this.getMetaData();
      await Promise.all([this.getDataCount(), this.getData()]);
    } catch (e) {
      this.onError(e);
    } finally {
      this.isLoading = false;
    }
  }

  /**
   * When a button is clicked in a row, handle the event.
   *
   * @param event
   */
  onRowAction(event) {
    const action = event.detail.action;
    const row = event.detail.row;

    // If a url button has been pressed.
    if (action?.type === 'button') {
      this.navigateUrl(row[action?.fieldName]);
    }
  }

  /**
   * Get the page number based on the current offset.
   *
   * Offset: 0, Page Size: 10 = Page 1
   * Offset: 10, Page Size: 10 = Page 2
   * Offset: 20, Page Size: 10 = Page 3
   *
   * @returns {number}
   */
  get page() {
    return (this.dataOffset / (this.pageSize)) + 1;
  }

  /**
   * Get the total number of pages based on the row count.
   *
   * @returns {number}
   */
  get pageLast() {
    return Math.ceil(this.dataTotalCount / (this.pageSize)) || 1;
  }

  /**
   * If pages should be shown based on the options provided and the count of records.
   *
   * @returns {boolean}
   */
  get showPages() {
    return !!this.pageSize && this.pageLast > 1 && !this.infiniteScrolling;
  }

  get isPagePreviousDisabled() {
    return this.page <= 1 || this.isViewAllDisabled;
  }

  get isPageNextDisabled() {
    return this.page > this.pageLast - 1 || this.isViewAllDisabled;
  }

  get isViewAllDisabled() {
    return this.pageSize >= pageSizeMax || this.isLoading;
  }

  onPagePrevious() {
    this.dataOffset -= this.pageSize;
    this.refreshData();
  }

  onPageNext() {
    this.dataOffset += this.pageSize;
    this.refreshData();
  }

  onViewAll() {
    this.pageSize = pageSizeMax;
    this.refreshData();
  }

  get isDataEmpty() {
    return !this.isLoading && this.dataTotalCount === 0;
  }

  get showTable() {
    return !this.errorUI && !this.isDataEmpty;
  }

  get showPlaceholder() {
    return this.isLoading && this.dataTotalCount === undefined;
  }

  /**
   * Gets a list of fields that have been filtered to only those
   * that are valid on the object itself.
   *
   * @returns {*[]}
   */
  get fieldsValid() {
    const fields = this.columns
      .map((column) => column.fieldName)
      .filter((value) => value)
    ;

    // Add the name field if it exists on the object
    this.nameField && fields.push(this.nameField);

    // Make sure the list of fields are unique.
    return [...new Set([...fields])];
  }

  /**
   * Navigate the user to a specific URL.
   */
  navigateUrl(url) {
    this[NavigationMixin.Navigate]({
      type: 'standard__webPage',
      attributes: {
        url: url
      }
    });
  }

  /**
   * Adds an error to the UI depending on where we are and logs
   * the error to the console.
   *
   * @param error
   */
  onError(error) {
    if (!this.isPageBuilder) {
      this.errorUI = errorMessageGeneric;
    } else {
      this.errorUI = (this.errorUI ? '' : '\n') + error;
    }
    console.error(error);
  }

  /**
   * Handles the sorting of data via SOQL, due to multiple pages not necessarily being in memory.
   * The method uses defaults in the case there's an issue with the sorting field.
   *
   * @param event
   */
  onSort(event) {
    this.sortBy = this.rewriteFieldName(event.detail.fieldName) || this.getFieldMetaData(sortByDefault)?.name;
    this.sortDirection = event.detail.sortDirection || sortDirectionDefault;
    this.isLoading = true;

    this.getData()
      .catch((e) => this.onError(e))
      .finally(() => this.isLoading = false)
    ;
  }

  /**
   * When infinite scrolling is enabled, the page size is increased is added to
   * based on the original page size.
   *
   * @param target
   * @returns {boolean}
   */
  onLoadMore({target}) {
    // Don't show more than our maximum limit or what is available.
    if (this.pageSize >= pageSizeMax || this.data.length >= this.dataTotalCount) {
      return false;
    }

    target.isLoading = true;
    this.pageSize += this.infiniteScrollingAdditionalRows;

    this.getData()
      .catch((e) => this.onError(e))
      .finally(() => target.isLoading = false)
    ;
  }

  /**
   * If infinite scrolling is enabled, fix the height of the table.
   *
   * @returns {string|string}
   */
  get dataTableStyle() {
    return this.infiniteScrolling ? `height: ${this.infiniteScrollingHeight}px;` : '';
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
   * Get the metadata for a specific field (case inventive).
   *
   * @param fieldName
   * @returns {*}
   */
  getFieldMetaData(fieldName) {
    return this.dataMeta[this.rewriteFieldName(fieldName)?.toLowerCase()];
  }

  /**
   * Rewrite the field name allowing another to be used where required.
   *
   * @param fieldName
   * @returns {*}
   */
  rewriteFieldName(fieldName) {
    return fieldName === 'Id' ? this.nameField : fieldName;
  }

  /**
   * Get metadata from the sObject to help us understand what to render in the list view.
   *
   * @returns {Promise<void>}
   */
  async getMetaData() {
    const dataMeta = this.dataMeta = this.debug = await getSObjectFields({sObjectName: this.sObjectName});

    // Get the name of the object, if we can't find the field, manually replace it with 'Unknown'.
    this.nameField = this.dataMeta[(nameFields[this.sObjectName] ?? nameFields['default'])?.toLowerCase()]?.name;
    this.nameFieldLabel = this.dataMeta[this.nameField?.toLowerCase()]?.label
      ?.replace('Full Name', 'Contact Name')
    ;

    this.columns = this.debug = this.fields
      .map((field) => field.toLowerCase()) // Convert to lowercase.
      .map((field) => dataMeta[field]) // Get the respective metadata.
      .map((field, index) => getColumn(field, { // Generate the columns and pass options.
        urlType: this.urlType,
        fieldName: this.fields[index],
        nameField: this.nameField,
        nameFieldLabel: this.nameFieldLabel,
      }))
    ;

    // Correct the sort by based on the metadata.
    this.sortBy = this.getFieldMetaData(this.sortBy)?.name || this.getFieldMetaData(sortByDefault)?.name;
  }

  /**
   * Refreshes the data by wrapping the call and managing the loading state.
   */
  refreshData() {
    this.isLoading = true;

    this.getData()
      .catch((e) => this.onError(e))
      .finally(() => this.isLoading = false)
    ;
  }

  /**
   * Get data for the list view from the apex class.
   *
   * @returns {Promise<void>}
   */
  async getData() {
    this.data = this.logTable = (await getSObjects({
      soql: `SELECT ${this.fieldsValid.join(', ')} FROM ${titleCase(this.sObjectName)} ${this.whereClause}`
        + `ORDER BY ${this.sortBy} ${this.sortDirection.toUpperCase()} LIMIT ${this.pageSize} OFFSET ${this.dataOffset}`.trim()
    })).map((row) => getRow(row, this.columns));
  }

  /**
   * Get the data count for the list view from the apex class.
   *
   * @returns {Promise<void>}
   */
  async getDataCount() {
    this.dataTotalCount = await getSObjectCount({
      soql: `SELECT COUNT(Id) FROM ${titleCase(this.sObjectName)} ${this.whereClause}`.trim()
    });
  }

  /**
   * Extract various pieces of the SOQL provided.
   */
  detectSOQLData() {
    const matchingGroups = /SELECT (?<fields>.+?) FROM (?<sObjectName>[a-z0-9_]+)(?<conditions>.*)?/i.exec(this.soql)?.groups;

    if (matchingGroups === undefined) {
      throw (`Error detecting the sobject name and relevant fields, expected format "SELECT % FROM %", "${this.soql}" received.`);
    } else {
      this.sObjectName = matchingGroups.sObjectName.toLowerCase();
      this.fields = matchingGroups.fields.split(',').map(field => field.trim().toLowerCase());
      this.whereClause = (matchingGroups.conditions || '').replace(/(((limit|offset) [0-9])|order by ).*/i, '').trim();
      this.sortBy = /order by (?<orderby>[a-z0-9_]+)/i.exec(matchingGroups.conditions)?.groups?.orderby?.toLowerCase();
      this.sortDirection = /order by [a-z0-9_]+ (?<orderbydirection>(asc|desc))/i.exec(matchingGroups.conditions)?.groups?.orderbydirection?.toLowerCase() || sortDirectionDefault;

      if (/(limit|offset) [0-9].*/i.exec(this.soql)) {
        console.warn('A limit or offset has been detected, and has been removed as pagination should be used as an alternative.');
      }
    }
  }

  /**
   * Detect the icon that should be used on the page based on the SOQL provided.
   */
  detectIcon() {
    const iconValidFormat = /^[a-z]+:[a-z0-9]+$/i.exec(this.icon) !== null;

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

  /**
   * As an alternative to a class variable decorator, we can debug a value
   * directly by setting the output to be the debug class variable.
   *
   * @param value
   */
  set debug(value) {
    console.debug(value);
  }

  /**
   * As an alternative to a class variable decorator, we can log a table value
   * directly by setting the output to be the logTable class variable.
   *
   * @param value
   */
  set logTable(value) {
    console.table(value);
  }
}