public with sharing class ListViewController {

    /**
     * Get a count of SObjects based on a soql string.
     *
     * @param soql
     *
     * @return
     */
    @AuraEnabled
    public static Integer getSObjectCount(String soql) {
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
    public static List<SObject> getSObjects(String soql) {
        return Database.query(soql);
    }

    /**
     * Returns a full list of fields definitions based on the DescribeFieldResult class.
     *
     * @src https://developer.salesforce.com/docs/atlas.en-us.apexref.meta/apexref/apex_methods_system_fields_describe.htm
     * @param sObjectName
     *
     * @return
     */
    @AuraEnabled(Cacheable=true)
    public static Map<String, Object> getSObjectFields(String sObjectName) {
        Map<String, Object> fieldDefinitions = new Map<String, Object>();
        List<Schema.SObjectField> fields = Schema.getGlobalDescribe().get(sObjectName).getDescribe().fields.getMap().values();

        for (Schema.SObjectField field : fields) {
            fieldDefinitions.put(field.getDescribe().getName().toLowerCase(), JSON.deserializeUntyped(JSON.serialize(field.getDescribe())));
        }
        return fieldDefinitions;
    }
}