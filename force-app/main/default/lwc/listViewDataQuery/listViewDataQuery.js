import {api, LightningElement} from 'lwc';
import getSObjectsApex from '@salesforce/apex/ListViewController.getSObjects'
import getSearchSObjectsApex from '@salesforce/apex/ListViewController.getSearchSObjects'
import getSObjectCountApex from '@salesforce/apex/ListViewController.getSObjectCount'
import getSearchSObjectCountApex from '@salesforce/apex/ListViewController.getSearchSObjectCount'
import getSObjectFieldsApex from '@salesforce/apex/ListViewController.getSObjectFields'
import getColumn from './getColumn';
import getRow from "./getRow";
import {flattenObject, logApexFunc, titleCase, toBoolean} from "c/utils";
import {
  nameFields,
  searchTimerDelay,
  sortByDefault,
  sortDirectionDefault,
  soslMaxRowCount
} from "./constants";
import {updateRecord as updateRecordApex} from "lightning/uiRecordApi";
import {ShowToastEvent} from "lightning/platformShowToastEvent";
import getCSV from "./getCSV";

// Wrap the apex functions using a decorative pattern for logging.
const getSObjects = logApexFunc('getSObjects', getSObjectsApex);
const getSearchSObjects = logApexFunc('searchSObjects', getSearchSObjectsApex);
const getSObjectCount = logApexFunc('getSObjectCount', getSObjectCountApex);
const getSearchSObjectCount = logApexFunc('searchSObjectCount', getSearchSObjectCountApex);
const getSObjectFields = logApexFunc('getSObjectFields', getSObjectFieldsApex);
const updateRecord = logApexFunc('updateRecord', updateRecordApex, true);

const PAGE_SIZE_DEFAULT = 200;
const PAGE_SIZE_MAX = 1000;

export default class ListViewDataQuery extends LightningElement {

  // Controls the information that is queried and presented.
  _soql;

  // Presentation of information.
  @api title;
  @api subTitle;
  @api icon;
  @api showRowNumber;
  @api enableDownload;
  _pageSize;
  _infiniteScrolling;
  _infiniteScrollingAdditionalRows;
  _urlType;
  _enableSearch;
  _enableRefresh;
  _hyperlinkNames;

  // Editing of information.
  _editFields;

  // Helper variables.
  _sortBy;
  _sortDirection;
  error;
  dataOffset = 0;
  dataTotalCount;
  isLoading = true;
  draftValues;
  fieldErrors;
  _searchTerm;
  searchTimer;

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
        throw (`Error detecting the sobject name and relevant fields, expected format "SELECT % FROM %", "${this.soql}" received.`);
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
    // The minimum length for a search term is 2 characters.
    if (this.searchTerm.length > 1) {
      this.data = (await getSearchSObjects({
        sosl: `FIND '${this.searchTerm}' IN ALL FIELDS RETURNING ${titleCase(this.sObjectName)}`
          + `(`
          + `${this.fieldsValid.join(', ')} ${this.whereClause}`.trim() + ' '
          + `ORDER BY ${this.sortBy} ${this.sortDirection.toUpperCase()} LIMIT ${this.pageSize} OFFSET ${this.dataOffset}`.trim()
          + `)`
      })).map((row) => getRow(row, this.columns));
    } else {
      this.data = (await getSObjects({
        soql: `SELECT ${this.fieldsValid.join(', ')} FROM ${titleCase(this.sObjectName)} ${this.whereClause}`.trim() + ' '
          + `ORDER BY ${this.sortBy} ${this.sortDirection.toUpperCase()} LIMIT ${this.pageSize} OFFSET ${this.dataOffset}`.trim()
      })).map((row) => getRow(row, this.columns));
    }
  }

  /**
   * Get the data count for the list view from the apex class.
   *
   * @returns {Promise<void>}
   */
  async getDataCount() {
    // The minimum length for a search term is 2 characters.
    if (this.searchTerm.length > 1) {
      this.dataTotalCount = (await getSearchSObjectCount({
        sosl: `FIND '${this.searchTerm}' IN ALL FIELDS RETURNING ${titleCase(this.sObjectName)}`
          + `(${this.fieldsValid.join(', ').trim()} ${this.whereClause.trim()} LIMIT ${soslMaxRowCount})`
      }));
    } else {
      this.dataTotalCount = await getSObjectCount({
        soql: `SELECT COUNT(Id) FROM ${titleCase(this.sObjectName)} ${this.whereClause}`.trim()
      });
    }
  }

  /**
   * Get metadata from the sObject to help us understand what to render in the list view.
   *
   * @returns {Promise<void>}
   */
  async getMetaData() {
    const fieldRelationshipIds = this.fieldRelationshipIds;

    const dataMeta = this.dataMeta = await getSObjectFields({
      sObjectName: this.sObjectName,
      fields: [...new Set([...this.fields, ...this.fieldIds])]
    });

    this.columns = this.fields
      .map((field) => field.toLowerCase()) // Convert to lowercase.
      .map((field) => dataMeta[field]) // Get the respective metadata.
      .map((metaData, index) => getColumn(metaData, {
        // Generate the columns and pass options.
        urlType: this.urlType,
        fieldName: this.fields[index],
        editFieldsList: this.editFieldsList,
        hyperlinkNames: this.hyperlinkNames,
        metaDataRelationship: {
          ...dataMeta[fieldRelationshipIds[this.fields[index]]],
          reference: fieldRelationshipIds[this.fields[index]]
        },
      }))
    ;
  }

  /**
   * Refreshes the data by wrapping the call and managing the loading state.
   */
  @api refreshData() {
    this.isLoading = true;

    this.getData()
      .then(() => this.error = undefined)
      .catch((e) => this.error = e)
      .finally(() => this.isLoading = false)
    ;
  }

  /**
   * Refreshes both the data and the count.
   */
  @api refresh() {
    this.isLoading = true;

    Promise.all([this.getData(), this.getDataCount()])
      .then(() => this.error = undefined)
      .catch((e) => this.error = e)
      .finally(() => this.isLoading = false)
    ;
  }

  /**
   * Enters a search term that is then used in the SOQL query.
   *
   * @param event
   */
  onSearch(event) {
    window.clearTimeout(this.searchTimer);

    this.searchTerm = event.detail;
    this.searchTimer = setTimeout(() => {
      this.refresh();
    }, searchTimerDelay);
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
   * On pressing of the View All button.
   */
  onViewAll() {
    this.dataOffset = 0;
    this.pageSize = this.pageSizeMax;
    this.refreshData();
  }

  /**
   * Handles the sorting of data via SOQL, due to multiple pages not necessarily being in memory.
   * The method uses defaults in the case there's an issue with the sorting field.
   *
   * @param event
   */
  onSort(event) {
    this.sortBy = event.detail.fieldName;
    this.sortDirection = event.detail.sortDirection;
    this.isLoading = true;

    this.getData()
      .catch((e) => this.error = e)
      .finally(() => this.isLoading = false)
    ;
  }

  /**
   * Handles the save functionality by using the standard updateRecord action.
   * Any errors returned are then interpreted and display in the datatable accordingly.
   *
   * @param event
   */
  async onSave(event) {
    this.isLoading = true;

    // Convert fields from lower case to their proper case.
    const recordInputs = event.detail.draftValues.slice().map(fields => ({
      fields: {
        ...Object.fromEntries(Object.entries(fields).map(([key, val]) => ([this.dataMeta[key]?.name ?? 'Id', val]))),
      }
    }));

    // Update all records in one go.
    const promises = recordInputs.map(recordInput => updateRecord(recordInput));
    try {
      const results = await Promise.allSettled(promises);

      // If we have errors, throw the results.
      if (results.find((result) => result.status === 'rejected') !== undefined) {
        throw results;
      }

      this.dispatchEvent(
        new ShowToastEvent({
          title: 'Success',
          message: 'Records updated',
          variant: 'success'
        })
      );
      this.draftValues = [];
      this.refreshData();

    } catch (results) {
      // Build an errors object containing all info.
      const errorResults = results
        .map((result, index) => (
          {
            id: recordInputs[index].fields.Id,
            status: result.status,
            detail: {
              fieldErrors: flattenObject(result?.reason?.body?.output?.fieldErrors ?? {}),
              errors: result?.reason?.body?.output?.errors ?? []
            }
          }))
        .filter((result) => result.status === 'rejected')

      // Set the errors based on what has been returned to us.
      this.fieldErrors = {
        // Field errors.
        rows: Object.assign({}, ...errorResults.map((result) => ({
            [result.id]: {
              title: 'An error occurred.',
              fieldNames: Object.entries(result.detail.fieldErrors)
                .filter(([key,]) => key.match(/\.field$/) !== null)
                .map(([, value]) => value.toLowerCase()),
              messages: Object.entries(result.detail.fieldErrors)
                .filter(([key,]) => key.match(/\.message$/) !== null)
                .map(([, value]) => value)
            }
          }))
            .filter((error) => Object.values(error)[0]?.messages?.length > 0)
        ),
        // Page errors.
        table: {
          title: 'An error occurred.',
          messages: Object.assign([],
            ...errorResults.map((result) => result.detail.errors.map((error) => error.message))
              .filter((error) => error)
          )
        }
      };

      // If only field errors were found.
      if (this.fieldErrors.table.messages.length === 0) {
        this.fieldErrors.table.messages = ['Please see the rows for more details.'];
      }
    } finally {
      this.isLoading = false;
    }
  }

  /**
   * When infinite scrolling is enabled, the page size is increased is added to
   * based on the original page size.
   *
   * @returns {boolean}
   */
  async onLoadMore() {
    this.pageSize += this.infiniteScrollingAdditionalRows;

    try {
      await this.getData();
    } catch (e) {
      this.error = e;
    }
  }

  /**
   * Get the metadata for a specific field (case inventive).
   *
   * @param fieldName
   * @returns {*}
   */
  getFieldMetaData(fieldName) {
    return this.dataMeta[fieldName?.toLowerCase()];
  }

  /* -----------------------------------------------
    General Getters and Setters
   ----------------------------------------------- */
  /**
   * Gets a list of fields that have been filtered to only those
   * that are valid on the object itself.
   *
   * @returns {*[]}
   */
  get fieldsValid() {
    const fields = this.columns
      .map((column) => column.fieldName)
      .filter((column) => column)
    ;

    // Make sure the list of fields are unique.
    return [...new Set([...fields])];
  }

  /**
   * Get a list of field ids that should be included in any fetches.
   * E.g. Account.Name should include Account.Id as part of the SOQL.
   *
   * @returns
   */
  get fieldIds() {
    return [...this.fields
      .filter((fieldName) => nameFields.includes(fieldName.replace(/.+\.([^.]+)$/, '$1')))
      .map((fieldName) => (fieldName.replace(/\.[^.]+$/, '.id')))
    ];
  }

  /**
   * Gets the relationship between the names of the object and the relationship they came from.
   * For example: Account.Name => Account, My_Custom_Account__r.Name => My_Custom_Account__c, Account.Owner.Name => Account.Owner
   *
   * @returns {unknown}
   */
  get fieldRelationshipIds() {
    return Object.assign({}, ...this.fields
      .filter((fieldName) => nameFields.includes(fieldName.replace(/.+\.([^.]+)$/, '$1')))
      .map((fieldName) => ({[fieldName]: fieldName.replace(/\.[^.]+$/, '').replace(/__r$/, '__r.id')}))
    );
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
   * Create a CSV download from the data that's currently displayed on the table.
   */
  onDownload() {
    const csv = getCSV(this.data, this.columns);

    const downloadElement = document.createElement('a');
    downloadElement.href = encodeURI(`data:text/csv;charset=utf-8,${csv}`);
    downloadElement.target = '_self';
    downloadElement.download = `${this.title}.csv`;
    document.body.appendChild(downloadElement);
    downloadElement.click();
  }

  /* -----------------------------------------------
    Dynamic Getters from the SOQL Statement
   ----------------------------------------------- */
  @api get sObjectName() {
    return this.soqlGroups ? this.soqlGroups.sObjectName.toLowerCase() : '';
  }

  @api get fields() {
    return this.soqlGroups ? this.soqlGroups.fields.split(',').map(field => field.replace(/\s/g, '').toLowerCase()) : [];
  }

  @api get whereClause() {
    return (this.soqlGroups.conditions || '').replace(/(((limit|offset) [0-9])|order by ).*/i, '').trim();
  }

  @api get soqlGroups() {
    return /SELECT (?<fields>.+?) FROM (?<sObjectName>[a-z0-9_]+)(?<conditions>.*)?/i.exec(this.soql)?.groups;
  }

  /* -----------------------------------------------
    API Getters and Setters
   ----------------------------------------------- */
  /**
   * Prefer the sort by provided, as a backup use the ORDER BY field name in the SOQL, and if that
   * isn't present use the default direction of sort field.
   *
   * @returns {string|string}
   */
  get sortBy() {
    return (this._sortBy
      || this.getFieldMetaData(/order by (?<orderby>[a-z0-9_]+)/i.exec(this.soqlGroups.conditions)?.groups?.orderby?.toLowerCase())?.name
      || this.getFieldMetaData(sortByDefault)?.name
      || sortByDefault
    ).toLowerCase();
  }

  set sortBy(value) {
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

  set sortDirection(value) {
    this._sortDirection = value;
  }

  get soql() {
    return this._soql || '';
  }

  @api set soql(value) {
    this._soql = value;
  }

  get pageSize() {
    return Number(this._pageSize) > 0 ? Number(this._pageSize) : PAGE_SIZE_DEFAULT;
  }

  @api set pageSize(value) {
    this._pageSize = value;
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

  get enableSearch() {
    return toBoolean(this._enableSearch);
  }

  @api set enableSearch(value) {
    this._enableSearch = value;
  }

  get enableRefresh() {
    return toBoolean(this._enableRefresh);
  }

  @api set enableRefresh(value) {
    this._enableRefresh = value;
  }

  get editFields() {
    return this._editFields || '';
  }

  @api set editFields(value) {
    this._editFields = value;
  }

  get editFieldsList() {
    return this.editFields
      .split(/[^a-z0-9_]+/gi)
      .map((field) => field.toLowerCase())
      ;
  }

  get searchTerm() {
    return (this._searchTerm || '')
      .replace('\'', '\\\'')
      ;
  }

  @api set searchTerm(value) {
    this._searchTerm = value;
  }

  get hyperlinkNames() {
    return toBoolean(this._hyperlinkNames);
  }

  @api set hyperlinkNames(value) {
    this._hyperlinkNames = value;
  }

  get pageSizeMax() {
    return PAGE_SIZE_MAX;
  }
}