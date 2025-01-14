import {api, LightningElement} from 'lwc';
import {toBoolean} from "c/utils";

const ERROR_MESSAGE_GENERIC = 'An unknown error occurred, please contact support.';
const PAGE_SIZE_DEFAULT = 20;
const SEARCH_DEBOUNCE_TIMEOUT = 500;

export default class ListView extends LightningElement {

  @api isLoading;
  @api enableSearch;
  @api columns;
  @api draftValues;
  @api sortBy;
  @api sortDirection;
  @api fieldErrors;
  @api enableRefresh;
  @api infiniteScrolling;
  @api page;
  @api pageLast;

  _title;
  _subTitle;
  _icon;
  _pageSize;
  _pageSizeInitial;
  _pageSizeMax;
  _showRowNumber;
  _enableDownload;
  _error;
  _values;
  _valuesTotalCount;

  isLoadingMore = false;
  searchTimeout;

  onLoadMore() {
    // Don't show more than our maximum limit or what is available.
    if (this.pageSize >= this.pageSizeMax || this.values.length >= this.valuesTotalCount) {
      return;
    }

    this.isLoadingMore = true;
    this.dispatchEvent(new CustomEvent('loadmore'));
  }

  onSave(event) {
    this.dispatchEvent(new CustomEvent('save', { detail: event.detail }));
  }

  onSort(event) {
    this.dispatchEvent(new CustomEvent('sort', { detail: event.detail }));
  }

  onRefresh() {
    this.dispatchEvent(new CustomEvent('refresh'));
  }

  /**
   * Enters a search term that is then used in the SOQL query.
   *
   * @param event
   */
  onSearch(event) {
    window.clearTimeout(this.searchTimeout);
    const searchValue = event.target.value;

    this.searchTimeout = setTimeout(() => {
      this.dispatchEvent(new CustomEvent('search', { detail: searchValue }));
    }, SEARCH_DEBOUNCE_TIMEOUT);
  }

  onPagePrevious() {
    this.dispatchEvent(new CustomEvent('pageprevious'));
  }

  onPageNext() {
    this.dispatchEvent(new CustomEvent('pagenext'));
  }

  onViewAll() {
    this.dispatchEvent(new CustomEvent('viewall'));
  }

  onDownload() {
    this.dispatchEvent(new CustomEvent('download'));
  }

  /* -----------------------------------------------
    General Getters and Setters
   ----------------------------------------------- */
  /**
   * If the data is empty, and we're not still loading.
   *
   * @returns {boolean}
   */
  get isDataEmpty() {
    return !this.isLoading && this.valuesTotalCount === 0;
  }

  /**
   * Shows the no records message to the user.
   */
  get showDataEmpty() {
    return !this.error && this.isDataEmpty;
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
    return this.isLoading && this.valuesTotalCount === undefined;
  }

  /**
   * If infinite scrolling is enabled, fix the height of the table.
   *
   * @returns {string}
   */
  get dataTableStyle() {
    return this.infiniteScrolling ? `height: ${this.infiniteScrollingHeight}rem;` : '';
  }

  /**
   * Get the error to be shown in the UI.
   *
   * @returns {string|undefined}
   */
  get error() {
    if (!this._error) {
      return undefined;
    }
    if (this.isPageBuilder) {
      return (this._error ? '' : '\n') + this._error;
    }
    return ERROR_MESSAGE_GENERIC;
  }

  /**
   * Adds an error to the UI depending on where we are and logs
   * the error to the console.
   *
   * @param value
   */
  @api set error(value) {
    if (this._error) {
      console.error(value);
    }
    this.isLoadingMore = false;
    this._error = value;
  }

  /**
   * Get the scroll height of the datatable required when scrolling infinitely.
   *
   * @returns {number}
   */
  get infiniteScrollingHeight() {
    return Number(this.pageSizeInitial * 2.5);
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
   * Get the total number of pages based on the row count.
   *
   * @returns {number}
   */
  get pageLast() {
    return Math.ceil(this.valuesTotalCount / (this.pageSize)) || 1;
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
   * @returns {boolean}
   */
  get isViewAllDisabled() {
    return this.pageSize >= this.pageSizeMax || this.isLoading;
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

  /* -----------------------------------------------
    API Getters and Setters
  ----------------------------------------------- */
  get title() {
    return this._title || '';
  }

  @api set title(value) {
    this._title = value;
  }

  get subTitle() {
    if (this._subTitle && this.valuesTotalCount === 1) {
      return `1 item • ${this._subTitle}`;
    }
    if (this._subTitle) {
      return `${this.valuesTotalCount ?? 0} items • ${this._subTitle}`;
    }
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
      return 'standard:default';
    }

    return '';
  }

  @api set icon(value) {
    this._icon = value;
  }

  get pageSize() {
    return Number(this._pageSize) > 0 ? Number(this._pageSize) : PAGE_SIZE_DEFAULT;
  }

  @api set pageSize(value) {
    this._pageSizeInitial = this._pageSizeInitial || value;
    this._pageSize = value;
  }

  get pageSizeInitial() {
    return Number(this._pageSizeInitial) > 0 ? Number(this._pageSizeInitial) : PAGE_SIZE_DEFAULT;
  }

  get pageSizeMax() {
    return Number(this._pageSizeMax) > 0 ? Number(this._pageSizeMax) : PAGE_SIZE_DEFAULT;
  }

  @api set pageSizeMax(value) {
    this._pageSizeMax = value;
  }

  get values() {
    return this._values ?? [];
  }

  @api set values(value) {
    this.isLoadingMore = false;
    this._values = value;
  }

  get valuesTotalCount() {
    return Number(this._valuesTotalCount) ?? this.values.length;
  }

  set valuesTotalCount(value) {
    this._valuesTotalCount = value;
  }

  get showRowNumber() {
    return toBoolean(this._showRowNumber);
  }

  @api set showRowNumber(value) {
    this._showRowNumber = value;
  }

  get enableDownload() {
    return toBoolean(this._enableDownload);
  }

  @api set enableDownload(value) {
    this._enableDownload = value;
  }
}