import {api, LightningElement} from 'lwc';

export default class CardHeading extends LightningElement {

  @api title;
  @api titleCount;
  @api subTitle;

  @api iconName;

  get hasTitleCount() {
    return this.titleCount || this.titleCount === 0;
  }
}