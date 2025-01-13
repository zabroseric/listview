@IsTest
public with sharing class ListViewControllerTest {
    @TestSetup
    static void setupTestData(){
        List<Account> accounts = new List<Account>();

        for(Integer i = 0; i < 20; i++) {
            Account a = new Account(Name = 'Test Account ' + i);
            accounts.add(a);
        }
        
        insert accounts;
    }

    @IsTest
    static void SObjectCount() {
        String soqlString = 'SELECT count(Id) FROM Account';
        Integer count = ListViewController.getSObjectCount(soqlString);

        System.assertEquals(20, count, 'Count should equal number of accounts created');
    }

    @IsTest
    static void getSObjects() {
        String soqlString = 'SELECT Id, Name FROM Account';
        List<SObject> accounts = ListViewController.getSObjects(soqlString);

        System.assertEquals(20, accounts.size(), 'SObject retrieval should equal number of accounts created');
    }

    @IsTest
    static void getSObjectName() {
        String objectApiName = 'Account';
        String objectName=  ListViewController.getSObjectName(objectApiName);

        System.assertEquals('Account', objectName, 'Should have retrieved the Object Name');
    }

    @IsTest
    static void getSObjectFields() {
        String objectApiName = 'Account';
        List<String> fields = new List<String>{'Id', 'Name', 'Phone', 'Parent.Name' ,'Nonsense__c'};
        Map<String, Object> objectFields =  ListViewController.getSObjectFields(objectApiName, fields);

        System.assertEquals(5, objectFields.keySet().size(), 'Should have retrieved the Correct Fields');
    }
}