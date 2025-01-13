import {api, LightningElement} from 'lwc';

export const INFINITE_SCROLLING_HEIGHT_DEFAULT = 30;

export default class ListView extends LightningElement {

  @api title;
  @api subTitle;
  @api icon;
  @api valuesTotalCount;
  @api isLoading;
  @api error;
  @api enableSearch;
  @api enableDownload;
  @api showTable;
  @api columns;
  @api draftValues;
  @api infiniteLoading;
  @api showRowNumber;
  @api sortBy;
  @api sortDirection;
  @api fieldErrors;
  @api showPlaceholder;
  @api showDataEmpty;
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

  onDownload() {
    this.dispatchEvent(new CustomEvent('download'));
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

  /* -----------------------------------------------
    General Getters and Setters
   ----------------------------------------------- */
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

  @api set infiniteScrollingHeight(value) {
    // This property is dynamic.
  }

  get values() {
    return this._values;
  }

  @api set values(value) {
    this._values = value;
    this.initialPageSize = this.initialPageSize > 0 ? this.initialPageSize : this._values.length;
  }
}