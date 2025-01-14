import buttonTemplate from "./buttonTemplate/buttonTemplate.html";
import picklistTemplate from "./picklistTemplate/picklistTemplate.html";
import picklistTemplateEdit from "./picklistTemplate/picklistTemplateEdit.html";
import LightningDatatable from 'lightning/datatable';

export default class Datatable extends LightningDatatable {
  static customTypes = {
    customButton: {
      template: buttonTemplate,
      standardCellLayout: true,
      typeAttributes: ["url", "label", 'variant'],
    },
    customPicklist: {
      template: picklistTemplate,
      editTemplate: picklistTemplateEdit,
      standardCellLayout: true,
      typeAttributes: ["options"],
    }
  }
}