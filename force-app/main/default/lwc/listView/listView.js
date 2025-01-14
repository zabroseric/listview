import {api, LightningElement} from 'lwc';

const INFINITE_SCROLLING_HEIGHT_DEFAULT = 30;
const ERROR_MESSAGE_GENERIC = 'An unknown error occurred, please contact support.';

export default class ListView extends LightningElement {

  @api valuesTotalCount;
  @api isLoading;
  @api enableSearch;
  @api enableDownload;
  @api columns;
  @api draftValues;
  @api infiniteLoading;
  @api showRowNumber;
  @api sortBy;
  @api sortDirection;
  @api fieldErrors;
  @api showPages;
  @api isPagePreviousDisabled;
  @api isViewAllDisabled;
  @api isPageNextDisabled;
  @api enableRefresh;
  @api infiniteScrolling;
  @api page;
  @api pageLast;
  @api isLoadingMore;

  _title;
  _subTitle;
  _icon;
  _pageSize;
  _error;


  _values;

  onLoadMore() {
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

  onSearch(event) {
    this.dispatchEvent(new CustomEvent('search', { detail: event.target.value }));
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
    this._error = value;
  }

  /**
   * Get the scroll height of the datatable required when scrolling infinitely.
   *
   * @returns {number}
   */
  get infiniteScrollingHeight() {
    return Number(this.values?.length > 0 ? this.initialPageSize * 2.5 : INFINITE_SCROLLING_HEIGHT_DEFAULT);
  }

  /**
   * Returns true if the user is currently in page builder.
   *
   * @returns {boolean}
   */
  get isPageBuilder() {
    return window.location.pathname.indexOf('flexipageEditor') !== -1;
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







  get values() {
    return this._values;
  }

  @api set values(value) {
    this._values = value;
    this.initialPageSize = this.initialPageSize > 0 ? this.initialPageSize : this._values.length;
  }
}