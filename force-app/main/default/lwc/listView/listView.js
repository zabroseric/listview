import {api, LightningElement} from 'lwc';

export const INFINITE_SCROLLING_HEIGHT_DEFAULT = 30;

export default class ListView extends LightningElement {

  @api icon;
  @api valuesTotalCount;
  @api isLoading;
  @api error;
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
  @api pageSize;
  @api pageLast;
  @api isLoadingMore;

  _title;
  _subTitle;
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

  get infiniteScrollingHeight() {
    return Number(this.values?.length > 0 ? this.initialPageSize * 2.5 : INFINITE_SCROLLING_HEIGHT_DEFAULT);
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

  get values() {
    return this._values;
  }

  @api set values(value) {
    this._values = value;
    this.initialPageSize = this.initialPageSize > 0 ? this.initialPageSize : this._values.length;
  }
}