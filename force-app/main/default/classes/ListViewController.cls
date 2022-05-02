public with sharing class ListViewController {

  /**
   * Get a count of SObjects based on a soql string.
   *
   * @param soql
   *
   * @return
   */
  @AuraEnabled
  public static Integer getSObjectCount(String soql)
  {
    return (Integer) Database.query(soql)[0].get('expr0');
  }

  /**
   * Get a list of SObjects based on a soql string.
   *
   * @param soql
   *
   * @return
   */
  @AuraEnabled
  public static List<SObject> getSObjects(String soql)
  {
    return Database.query(soql);
  }

  /**
   * Get the case-sensitive name for an object.
   * This is useful when this is required, for example: subscribing to change events.
   *
   * @param sObjectName
   *
   * @return
   */
  @AuraEnabled
  public static String getSObjectName(String sObjectName)
  {
    return Schema.getGlobalDescribe().get(sObjectName).getDescribe().getName();
  }

  /**
   * Returns a list of serialized fields definitions based on the DescribeFieldResult class.
   * The list is restricted based on the fields provided, and is able to transverse unlimited relationship fields.
   *
   * @src https://developer.salesforce.com/docs/atlas.en-us.apexref.meta/apexref/apex_methods_system_fields_describe.htm
   * @param sObjectName
   * @param fields
   *
   * @return
   */
  @AuraEnabled(Cacheable=true)
  public static Map<String, Object> getSObjectFields(String sObjectName, List<String> fields)
  {
    Map<String, DescribeFieldResult> sObjDescribeFields = getSObjectDescribes(sObjectName);
    Map<String, Object> fieldDefinitions = new Map<String, Object>();

    for (String fieldName : listStringLower(fields)) {
      String fieldNamePrimary = fieldName.split('\\.')[0];
      String fieldNameRelationship = fieldName.removeStart(fieldNamePrimary + '.');
      DescribeFieldResult fieldDescribe = sObjDescribeFields.get(fieldNamePrimary);

      // If the field doesn't exist on the object add it to the map.
      if (fieldDescribe == null) {
        continue;
      }

      fieldDefinitions.put(fieldNamePrimary.replaceAll('__r$', '__c'), JSON.deserializeUntyped(JSON.serialize(fieldDescribe)));

      // Recursively call this method to get the nested relationship.
      if (fieldDescribe.getRelationshipName() != null && !fieldDescribe.getReferenceTo().isEmpty() && fieldName.contains('.')) {
        List<Object> sObjFields = getSObjectFields(String.valueOf(fieldDescribe.getReferenceTo().get(0)), new List<String>{
          fieldNameRelationship
        }).values();
        if (!sObjFields.isEmpty()) {
          fieldDefinitions.put(fieldName, sObjFields.get(0));
        }
      }
    }
    return fieldDefinitions;
  }


  /**
   * Get a map of field describes, and include either the field name or the relationship name
   * as a lower case key.
   *
   * @param sObjectName
   *
   * @return
   */
  private static Map<String, DescribeFieldResult> getSObjectDescribes(String sObjectName)
  {
    Map<String, Schema.SObjectField> sObjSchema = Schema.getGlobalDescribe().get(sObjectName).getDescribe().fields.getMap();
    Map<String, DescribeFieldResult> sObjDescribe = new Map<String, DescribeFieldResult>();

    for (String fieldName : sObjSchema.keySet()) {
      DescribeFieldResult fieldDescribe = sObjSchema.get(fieldName).getDescribe();

      if (fieldDescribe.getRelationshipName() != null) {
        sObjDescribe.put(fieldDescribe.getRelationshipName().toLowerCase(), fieldDescribe);
      }
      sObjDescribe.put(fieldDescribe.getName().toLowerCase(), fieldDescribe);
    }
    return sObjDescribe;
  }

  /**
   * Utility method to convert a list of strings to lowercase.
   *
   * @param strList
   *
   * @return
   */
  private static List<String> listStringLower(List<String> strList)
  {
    List<String> stringList = new List<String>();
    for (String str : strList) {
      stringList.add(str.toLowerCase());
    }
    return stringList;
  }
}