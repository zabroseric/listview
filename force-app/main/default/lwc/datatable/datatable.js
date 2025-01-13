import buttonTemplate from "./buttonTemplate/buttonTemplate.html";
import LightningDatatable from 'lightning/datatable';

export default class Datatable extends LightningDatatable {
  static customTypes = {
    customButton: {
      template: buttonTemplate,
      standardCellLayout: true,
      typeAttributes: ['url', "label", 'variant'],
    }
  }
}