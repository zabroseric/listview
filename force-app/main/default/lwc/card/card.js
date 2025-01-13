import {api, LightningElement} from 'lwc';

export default class Card extends LightningElement {

  @api title;
  @api titleCount;
  @api iconName;
  @api subTitle;
  @api isLoading;
  @api error;

  get hasTitleCount() {
    return this.titleCount || this.titleCount === 0;
  }
}