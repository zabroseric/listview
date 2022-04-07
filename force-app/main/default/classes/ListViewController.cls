/**
 * Created by shaun on 7/04/2022.
 */

public with sharing class ListViewController {

    /**
     * Runs a query given a string.
     *
     * @param soql
     *
     * @return
     */
    @AuraEnabled
    public static List<SObject> execSOQL(String soql) {
        return Database.query(soql);
    }

    /**
     * Returns a full list of fields definitions based on the DescribeFieldResult class.
     *
     * @param sObjectName
     *
     * @return
     */
    @AuraEnabled(Cacheable=true)
    public static Map<String, Object> getSObjectFields(String sObjectName) {
        Map<String, Object> fieldDefinitions = new Map<String, Object>();
        List<Schema.SObjectField> fields = Schema.getGlobalDescribe().get(sObjectName).getDescribe().fields.getMap().values();

        for ( Schema.SObjectField field : fields ) {
            fieldDefinitions.put(field.getDescribe().getName().toLowerCase(), JSON.deserializeUntyped(JSON.serialize(field.getDescribe())));
        }
        return fieldDefinitions;
    }
}