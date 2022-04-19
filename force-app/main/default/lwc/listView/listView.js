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
  infiniteScrollHeightDefault,
  nameFields,
  pageSizeDefault,
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
  _soql;

  // Presentation of information.
  _title;
  _subTitle;
  _icon;
  _pageSize;
  _showRowNumber;
  _infiniteScrolling;
  _infiniteScrollingAdditionalRows;
  _infiniteScrollingHeight = 500;
  _urlType;

  // Editing of information.
  _editFields;
  _bypassAccess;

  // Helper variables.
  _sortBy;
  _sortDirection;
  _error;
  dataOffset = 0;
  dataTotalCount;
  nameField;
  nameFieldLabel;
  isLoading = true;

  columns = [];
  data = [];
  dataMeta = [];

  /**
   * Retrieve the data and render it.
   */
  async connectedCallback() {
    try {
      // Validate the SOQL before continuing.
      if (this.soqlGroups === undefined) {
        throw(`Error detecting the sobject name and relevant fields, expected format "SELECT % FROM %", "${this.soql}" received.`);
      }

      await this.getMetaData();
      await Promise.all([this.getDataCount(), this.getData()]);
    } catch (e) {
      this.error = e;
    } finally {
      this.isLoading = false;
    }
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
      .catch((e) => this.error = e)
      .finally(() => this.isLoading = false)
    ;
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
   * On pressing of the Previous Page button.
   */
  onPagePrevious() {
    this.dataOffset -= this.pageSize;
    this.refreshData();
  }

  /**
   * On pressing of the Next Page button.
   */
  onPageNext() {
    this.dataOffset += this.pageSize;
    this.refreshData();
  }

  /**
   * On pressing of the view all button.
   */
  onViewAll() {
    this.pageSize = pageSizeMax;
    this.refreshData();
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
   * Handles the sorting of data via SOQL, due to multiple pages not necessarily being in memory.
   * The method uses defaults in the case there's an issue with the sorting field.
   *
   * @param event
   */
  onSort(event) {
    this.sortBy = this.rewriteFieldName(event.detail.fieldName) || this.getFieldMetaData(sortByDefault)?.name;
    this.sortDirection = event.detail._sortDirection || sortDirectionDefault;
    this.isLoading = true;

    this.getData()
      .catch((e) => this.error = e)
      .finally(() => this.isLoading = false)
    ;
  }

  /**
   * When infinite scrolling is enabled, the page size is increased is added to
   * based on the original page size.
   *
   * Note: We expand the event to the target, as there appears to be an issue referencing the event
   * in an async operation.
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
      .catch((e) => this.error = e)
      .finally(() => target.isLoading = false)
    ;
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

  /* -----------------------------------------------
    General Getters and Setters
   ----------------------------------------------- */
  /**
   * If the data is empty and we're not still loading.
   *
   * @returns {boolean}
   */
  get isDataEmpty() {
    return !this.isLoading && this.dataTotalCount === 0;
  }

  /**
   * Show the table if the data isn't empty, and there are no errors.
   *
   * @returns {boolean}
   */
  get showTable() {
    return !this.error && !this.isDataEmpty;
  }

  /**
   * Show the placeholder padding if we haven't retrieved data for the first time.
   *
   * @returns {boolean}
   */
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

  /**
   * @returns {boolean|*}
   */
  get isPagePreviousDisabled() {
    return this.page <= 1 || this.isViewAllDisabled;
  }

  /**
   * @returns {boolean|*}
   */
  get isPageNextDisabled() {
    return this.page > this.pageLast - 1 || this.isViewAllDisabled;
  }

  /**
   * @returns {boolean}
   */
  get isViewAllDisabled() {
    return this.pageSize >= pageSizeMax || this.isLoading;
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

  /* -----------------------------------------------
    Dynamic Getters from the SOQL Statement
   ----------------------------------------------- */
  get sObjectName() {
    return this.soqlGroups ? this.soqlGroups.sObjectName.toLowerCase() : '';
  }

  get fields() {
    return this.soqlGroups ? this.soqlGroups.fields.split(',').map(field => field.trim().toLowerCase()) : [];
  }

  get whereClause() {
    return (this.soqlGroups.conditions || '').replace(/(((limit|offset) [0-9])|order by ).*/i, '').trim();
  }

  get soqlGroups() {
    return /SELECT (?<fields>.+?) FROM (?<sObjectName>[a-z0-9_]+)(?<conditions>.*)?/i.exec(this.soql)?.groups;
  }

  /* -----------------------------------------------
    API Getters and Setters
   ----------------------------------------------- */
  get error() {
    return this._error;
  }

  /**
   * Adds an error to the UI depending on where we are and logs
   * the error to the console.
   *
   * @param value
   */
  @api set error(value) {
    if (!this.isPageBuilder) {
      this._error = errorMessageGeneric;
    } else {
      this._error = (this._error ? '' : '\n') + value;
    }
    console.error(value);
  }

  /**
   * Prefer the sort by provided, as a backup use the ORDER BY field name in the SOQL, and if that
   * isn't present use the default direction of sort field.
   *
   * @returns {string|string}
   */
  get sortBy() {
    return this._sortBy
      || /order by (?<orderby>[a-z0-9_]+)/i.exec(this.soqlGroups.conditions)?.groups?.orderby?.toLowerCase()
      || sortByDefault
      ;
  }

  @api set sortBy(value) {
    this._sortBy = value;
  }

  /**
   * Prefer the sort direction provided, as a backup use the ORDER BY direction in the SOQL, and if that
   * isn't present use the default direction of sorting.
   *
   * @returns {string|string}
   */
  get sortDirection() {
    return this._sortDirection
      || /order by [a-z0-9_]+ (?<orderbydirection>(asc|desc))/i.exec(this.soqlGroups.conditions)?.groups?.orderbydirection?.toLowerCase()
      || sortDirectionDefault
      ;
  }

  @api set sortDirection(value) {
    this._sortDirection = value;
  }

  get infiniteScrollingHeight() {
    return Number(this._infiniteScrollingHeight || infiniteScrollHeightDefault);
  }

  @api set infiniteScrollingHeight(value) {
    this._infiniteScrollingHeight = value;
  }

  get soql() {
    return this._soql || '';
  }

  @api set soql(value) {
    this._soql = value;
  }

  get title() {
    return this._title || '';
  }

  @api set title(value) {
    this._title = value;
  }

  get subTitle() {
    return this._subTitle || '';
  }

  @api set subTitle(value) {
    this._subTitle = value;
  }

  /**
   * Interpret the icon provided if one is available, otherwise
   * show one depending on other information we have retrieved.
   *
   * @returns {string|undefined|*}
   */
  get icon() {
    const iconValidFormat = /^[a-z]+:[a-z0-9]+$/i.exec(this._icon) !== null;

    // Icon is provided, and is of a valid format.
    if (this._icon && iconValidFormat) {
      return this._icon;
    }

    // Icon is provided and invalid format.
    if (this._icon && !iconValidFormat) {
      console.info(`The icon ${this.icon} is invalid, expected format "%:%"`);
      return '';
    }

    // Auto-detect - SObject name missing.
    if (!this.sObjectName) {
      return 'standard:default';
    }

    // Auto-detect - Standard SObject.
    if (this.sObjectName.indexOf('__c') === -1) {
      return `standard:${this.sObjectName.toLowerCase()}`;
    }

    return '';
  }

  @api set icon(value) {
    this._icon = value;
  }

  get pageSize() {
    return Number(this._pageSize) > 0 ? Number(this._pageSize) : pageSizeDefault;
  }

  @api set pageSize(value) {
    this._pageSize = value;
  }

  get showRowNumber() {
    return toBoolean(this._showRowNumber);
  }

  @api set showRowNumber(value) {
    this._showRowNumber = value;
  }

  get infiniteScrolling() {
    return toBoolean(this._infiniteScrolling);
  }

  @api set infiniteScrolling(value) {
    this._infiniteScrolling = value;
  }

  get infiniteScrollingAdditionalRows() {
    return Number(this._infiniteScrollingAdditionalRows) > 0 ? Number(this._infiniteScrollingAdditionalRows) : this.pageSize;
  }

  @api set infiniteScrollingAdditionalRows(value) {
    this._infiniteScrollingAdditionalRows = value;
  }

  get urlType() {
    return this._urlType;
  }

  @api set urlType(value) {
    this._urlType = value;
  }

  get editFields() {
    return this._editFields;
  }

  @api set editFields(value) {
    this._editFields = value;
  }

  get bypassAccess() {
    return this._bypassAccess;
  }

  @api set bypassAccess(value) {
    this._bypassAccess = value;
  }
}