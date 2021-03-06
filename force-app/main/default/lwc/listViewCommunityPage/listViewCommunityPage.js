import {api, LightningElement} from 'lwc';

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
  @api bypassAccess;

  @api recordId;

  /**
   * Modify the SOQL passed by injecting the record id, before passing it
   * to the list view for processing.
   *
   * @returns {string}
   */
  get soqlModified() {
    return (this.soql || '').replace(/'?:?recordid'?/gi, `'${this.recordId}'`);
  }
}