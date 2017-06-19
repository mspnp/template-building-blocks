describe('storageSettings:', () => {
    let rewire = require('rewire');
    let storageSettings = rewire('../core/storageSettings.js');
    let _ = require('lodash');

    describe('storage accounts merge:', () => {

        it('validates valid defaults are applied for storage accounts.', () => {
            let settings = {};

            let mergedValue = storageSettings.mergeWithDefaults(settings, 'storageAccounts');
            expect(mergedValue.count).toEqual(1);
            expect(mergedValue.nameSuffix).toEqual('st');
            expect(mergedValue.skuType).toEqual('Premium_LRS');
            expect(mergedValue.managed).toEqual(true);
        });
        it('validates defaults do not override settings.', () => {
            let settings = {
                'nameSuffix': 'test',
                'count': 2,
                'skuType': 'Standard_LRS',
                'managed': false
            };

            let mergedValue = storageSettings.mergeWithDefaults(settings, 'storageAccounts');
            expect(mergedValue.count).toEqual(2);
            expect(mergedValue.nameSuffix).toEqual('test');
            expect(mergedValue.skuType).toEqual('Standard_LRS');
            expect(mergedValue.managed).toEqual(false);
        });
        it('validates additional properties in settings are not removed.', () => {
            let settings = {
                'name1': 'test'
            };

            let mergedValue = storageSettings.mergeWithDefaults(settings, 'storageAccounts');
            expect(mergedValue.hasOwnProperty('name1')).toEqual(true);
            expect(mergedValue.name1).toEqual('test');
        });
        it('validates missing properties in settings are picked up from defaults.', () => {
            let settings = {
                'nameSuffix': 'test',
                'skuType': 'Standard_LRS',
                'managed': false
            };

            let mergedValue = storageSettings.mergeWithDefaults(settings, 'storageAccounts');
            expect(mergedValue.hasOwnProperty('count')).toEqual(true);
            expect(mergedValue.count).toEqual(1);
        });
    });
    describe('diagnostic storage accounts merge:', () => {

        it('validates valid defaults are applied for storage accounts.', () => {
            let settings = {};

            let mergedValue = storageSettings.mergeWithDefaults(settings);
            expect(mergedValue.count).toEqual(1);
            expect(mergedValue.nameSuffix).toEqual('diag');
            expect(mergedValue.skuType).toEqual('Standard_LRS');
            expect(mergedValue.managed).toEqual(false);
        });
        it('validates defaults do not override settings.', () => {
            let settings = {
                'nameSuffix': 'test',
                'count': 2,
                'skuType': 'LRS',
                'managed': true
            };

            let mergedValue = storageSettings.mergeWithDefaults(settings);
            expect(mergedValue.count).toEqual(2);
            expect(mergedValue.nameSuffix).toEqual('test');
            expect(mergedValue.skuType).toEqual('LRS');
            expect(mergedValue.managed).toEqual(true);
        });
        it('validates additional properties in settings are not removed.', () => {
            let settings = {
                'name1': 'test'
            };

            let mergedValue = storageSettings.mergeWithDefaults(settings);
            expect(mergedValue.hasOwnProperty('name1')).toEqual(true);
            expect(mergedValue.name1).toEqual('test');
        });
        it('validates missing properties in settings are picked up from defaults.', () => {
            let settings = {
                'skuType': 'Standard_LRS',
                'managed': false
            };

            let mergedValue = storageSettings.mergeWithDefaults(settings);
            expect(mergedValue.hasOwnProperty('nameSuffix')).toEqual(true);
            expect(mergedValue.nameSuffix).toEqual('diag');
        });
    });
    describe('storage validations:', () => {
        let settings = {
            nameSuffix: 'st',
            count: 2,
            skuType: 'Premium_LRS',
            managed: false,
            accounts: [
                'vm7tt2e6prktm3lst1',
                'vm7tt2e6prktm3lst2'
            ],
            subscriptionId: '3b518fac-e5c8-4f59-8ed5-d70b626f8e10',
            resourceGroupName: 'rs-test6-rg'
        };
        describe('nameSuffix:', () => {
            let validation = storageSettings.__get__('storageValidations').nameSuffix;
            it('validates nameSuffix canot be an empty string.', () => {
                let result = validation('');
                expect(result.result).toEqual(false);

                result = validation('test');
                expect(result.result).toEqual(true);

                result = validation(null);
                expect(result.result).toEqual(false);
            });
        });
        describe('managed:', () => {
            let validation = storageSettings.__get__('storageValidations').managed;
            it('validates valid value for managed property is boolean.', () => {
                let result = validation('yes', settings);
                expect(result.result).toEqual(false);

                result = validation('true', settings);
                expect(result.result).toEqual(false);

                result = validation(true, settings);
                expect(result.result).toEqual(true);
            });
        });
        describe('skuType:', () => {
            let validation = storageSettings.__get__('storageValidations').skuType;
            it('validates skuType canot be null or empty string, if managed is false.', () => {
                let result = validation('', settings);
                expect(result.result).toEqual(false);

                result = validation('test', settings);
                expect(result.result).toEqual(true);

                result = validation(null, settings);
                expect(result.result).toEqual(false);
            });
            it('validates skuType is ignored if managed is true.', () => {
                let param = _.cloneDeep(settings);
                param.managed = true;

                let result = validation('', param);
                expect(result.result).toEqual(true);

                result = validation(null, param);
                expect(result.result).toEqual(true);
            });
        });
        describe('count:', () => {
            let validation = storageSettings.__get__('storageValidations').count;
            it('validates count is greater than 0, if managed is false.', () => {
                let param = _.cloneDeep(settings);
                param.count = 0;

                let result = validation(0, param);
                expect(result.result).toEqual(false);

                result = validation('5', param);
                expect(result.result).toEqual(false);

                result = validation(null, param);
                expect(result.result).toEqual(false);

                result = validation(5, param);
                expect(result.result).toEqual(true);
            });
            it('validates count is ignored if managed is true.', () => {
                let param = _.cloneDeep(settings);
                param.managed = true;

                let result = validation(0, param);
                expect(result.result).toEqual(true);

                result = validation(null, param);
                expect(result.result).toEqual(true);
            });
        });
    });
    describe('diagnostic storage validations:', () => {
        let settings = {
            nameSuffix: 'diag',
            count: 2,
            skuType: 'Standard_LRS',
            managed: false,
            accounts: [
                'vm7tt2e6prktm3lst1',
                'vm7tt2e6prktm3lst2'
            ],
            subscriptionId: '3b518fac-e5c8-4f59-8ed5-d70b626f8e10',
            resourceGroupName: 'rs-test6-rg'
        };
        describe('nameSuffix:', () => {
            let validation = storageSettings.__get__('diagnosticValidations').nameSuffix;
            it('validates nameSuffix canot be an empty string.', () => {
                let result = validation('');
                expect(result.result).toEqual(false);

                result = validation('test');
                expect(result.result).toEqual(true);

                result = validation(null);
                expect(result.result).toEqual(false);
            });
        });
        describe('managed:', () => {
            let validation = storageSettings.__get__('diagnosticValidations').managed;
            it('validates managed property for diagnostic storage cannot be true.', () => {
                let result = validation('true', settings);
                expect(result.result).toEqual(false);

                result = validation(true, settings);
                expect(result.result).toEqual(false);

                result = validation(false, settings);
                expect(result.result).toEqual(true);
            });
        });
        describe('skuType:', () => {
            let validation = storageSettings.__get__('diagnosticValidations').skuType;
            it('validates skuType canot be null or empty string or premium storage', () => {
                let result = validation('', settings);
                expect(result.result).toEqual(false);

                result = validation(null, settings);
                expect(result.result).toEqual(false);

                result = validation('Standard_LRS', settings);
                expect(result.result).toEqual(true);

                let param = _.cloneDeep(settings);
                param.skuType = 'Premium_LRS';

                result = validation('Premium_LRS', param);
                expect(result.result).toEqual(false);
            });
        });
        describe('count:', () => {
            let validation = storageSettings.__get__('diagnosticValidations').count;
            it('validates count is greater than 0', () => {
                let param = _.cloneDeep(settings);
                param.count = 0;

                let result = validation(0, param);
                expect(result.result).toEqual(false);

                result = validation('5', param);
                expect(result.result).toEqual(false);

                result = validation(null, param);
                expect(result.result).toEqual(false);

                result = validation(5, param);
                expect(result.result).toEqual(true);
            });
        });
    });

    describe('storage accounts transform:', () => {
        let settings = {
            storageAccounts: {
                nameSuffix: 'st',
                count: 2,
                skuType: 'Premium_LRS',
                managed: false,
                accounts: [
                    'vm7tt2e6prktm3lst1',
                    'vm7tt2e6prktm3lst2'
                ],
                subscriptionId: '3b518fac-e5c8-4f59-8ed5-d70b626f8e10',
                resourceGroupName: 'rs-test6-rg'
            }
        };
        it('returns empty array if count of existing storage accounts is equal to count property:', () => {
            let result = storageSettings.processStorageSettings(settings.storageAccounts, settings);
            expect(result.length).toEqual(0);
        });
        it('returns empty array if count of existing storage accounts is greater than count property:', () => {
            let param = _.cloneDeep(settings);
            param.storageAccounts.accounts = ['A', 'B', 'C'];

            let result = storageSettings.processStorageSettings(param.storageAccounts, param);
            expect(result.length).toEqual(0);
        });
        it('returns array with storage account to create. length of array is count - no. of existing accounts provided:', () => {
            let param = _.cloneDeep(settings);
            param.storageAccounts.accounts = ['A'];

            let result = storageSettings.processStorageSettings(param.storageAccounts, param);
            expect(result.length).toEqual(1);
        });
        it('converts settings to RP shape', () => {
            let param = _.cloneDeep(settings);
            param.storageAccounts.accounts = [];

            let result = storageSettings.processStorageSettings(param.storageAccounts, param);
            expect(_.endsWith(result[0].name, `${param.storageAccounts.nameSuffix}1`)).toEqual(true);
            expect(result[0].kind).toEqual('Storage');
            expect(result[0].sku.name).toEqual('Premium_LRS');
            expect(_.endsWith(result[1].name, `${param.storageAccounts.nameSuffix}2`)).toEqual(true);
            expect(result[1].kind).toEqual('Storage');
            expect(result[1].sku.name).toEqual('Premium_LRS');
        });

    });
    describe('getUniqueString:', () => {
        it('validates that unique string functions is idempotent', () => {
            let getUniqueString = storageSettings.__get__('getUniqueString');

            let result = getUniqueString('test input');
            expect(result).toEqual(getUniqueString('test input'));
        });
        it('validates that unique string functions returns different result for different inputs', () => {
            let getUniqueString = storageSettings.__get__('getUniqueString');

            let result = getUniqueString('test input');
            expect(result).not.toEqual(getUniqueString('test input1'));
        });
        it('validates that unique string return is 13 char long', () => {
            let getUniqueString = storageSettings.__get__('getUniqueString');

            let result = getUniqueString('test input');
            expect(result.length).toEqual(13);
        });
    });
});