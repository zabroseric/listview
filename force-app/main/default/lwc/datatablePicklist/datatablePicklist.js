import {api, LightningElement} from 'lwc';

export default class DatatableButton extends LightningElement {
  @api _options;
  @api value;
  @api mode;
  @api required;

  renderedCallback() {
    console.log(this.options)
  }

  get label() {
    if (!this.value) {
      return '';
    }
    return this.options.find((option) => option.value === this.value)?.label;
  }

  get isInputVisible() {
    return this.mode === 'edit';
  }

  get options() {
    if (!this._options) {
      return [];
    }

    // When passing the options in editing, it comes back with an object instead.
    if (!Array.isArray(this._options) && typeof [] === 'object') {
      return [{value: "", label: "--None--"}, ...Object.values(this._options)];
    }

    return [{value: "", label: "--None--"}, ...this._options];
  }

  onChange(event) {
    this.value = event.detail.value;
  }

  @api set options(value) {
    this._options = value;
  }

  @api get validity() {
    return this.refs.input.validity;
  }

  @api focus() {
    this.refs.input.focus();
  }

  @api showHelpMessageIfInvalid() {
    this.refs.input?.showHelpMessageIfInvalid();
  }
}