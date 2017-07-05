describe('availabilitySetSettings:', () => {
    let rewire = require('rewire');
    let _ = require('lodash');

    describe('merge:', () => {
        //let merge = availabilitySetSettings.__get__('merge');
        let availabilitySetSettings = rewire('../core/availabilitySetSettings.js');

        it('validate valid defaults are applied.', () => {
            let settings = {};

            let mergedValue = availabilitySetSettings.merge({settings});
            expect(mergedValue.platformFaultDomainCount).toEqual(3);
            expect(mergedValue.platformUpdateDomainCount).toEqual(5);
        });
        it('validate defaults do not override settings.', () => {
            let settings = {
                'platformFaultDomainCount': 10,
                'platformUpdateDomainCount': 11,
                'name': 'test-as'
            };

            let mergedValue = availabilitySetSettings.merge({settings});
            expect(mergedValue.platformFaultDomainCount).toEqual(10);
            expect(mergedValue.platformUpdateDomainCount).toEqual(11);
            expect(mergedValue.name).toEqual('test-as');
        });
        it('validate additional properties in settings are not removed.', () => {
            let settings = {
                'name1': 'test-as'
            };

            let mergedValue = availabilitySetSettings.merge({settings});
            expect(mergedValue.hasOwnProperty('name1')).toBeTruthy();
            expect(mergedValue.name1).toEqual('test-as');
        });
        it('validate missing properties in settings are picked up from defaults.', () => {
            let settings = {
                'platformFaultDomainCount': 10
            };

            let mergedValue = availabilitySetSettings.merge({settings});
            expect(mergedValue.hasOwnProperty('platformUpdateDomainCount')).toEqual(true);
            expect(mergedValue.platformUpdateDomainCount).toEqual(5);
        });
        it('validate merge lets override defaults.', () => {
            let settings = {
                'platformFaultDomainCount': 10,
            };

            let defaults = {
                'platformUpdateDomainCount': 11,
                'platformFaultDomainCount': 11
            };

            let mergedValue = availabilitySetSettings.merge({settings: settings, defaultSettings: defaults});
            expect(mergedValue.platformFaultDomainCount).toEqual(10);
            expect(mergedValue.platformUpdateDomainCount).toEqual(11);
        });
    });
    describe('userDefaults:', () => {
        it('validate valid user defaults are applied.', () => {
            let availabilitySetSettings = rewire('../core/availabilitySetSettings.js');
            let settings = {};

            let defaults = {
                'platformFaultDomainCount': 12
            };

            let mergedValue = availabilitySetSettings.merge({settings, defaultSettings: defaults});
            expect(mergedValue.platformFaultDomainCount).toEqual(12);
            expect(mergedValue.platformUpdateDomainCount).toEqual(5);
        });
        it('validate user defaults do not override settings.', () => {
            let availabilitySetSettings = rewire('../core/availabilitySetSettings.js');
            let settings = {
                'platformFaultDomainCount': 10,
                'platformUpdateDomainCount': 11,
                'name': 'test-as'
            };

            let defaults = {
                'platformFaultDomainCount': 12,
                'platformUpdateDomainCount': 12,
                'name': 'xyz-test-as'
            };

            let mergedValue = availabilitySetSettings.merge({settings, defaultSettings: defaults});
            expect(mergedValue.platformFaultDomainCount).toEqual(10);
            expect(mergedValue.platformUpdateDomainCount).toEqual(11);
            expect(mergedValue.name).toEqual('test-as');
        });
        it('validate additional properties in user settings are not removed.', () => {
            let availabilitySetSettings = rewire('../core/availabilitySetSettings.js');
            let settings = {
                'name1': 'test-as'
            };

            let defaults = {
                'name1': 'xyz-test-as'
            };

            let mergedValue = availabilitySetSettings.merge({settings, defaultSettings: defaults});
            expect(mergedValue.hasOwnProperty('name1')).toBeTruthy();
            expect(mergedValue.name1).toEqual('test-as');
        });
        it('validate missing properties in settings are picked up from defaults.', () => {
            let availabilitySetSettings = rewire('../core/availabilitySetSettings.js');
            let settings = {
                'platformFaultDomainCount': 10
            };

            let defaults = {
                'platformFaultDomainCount': 12
            };

            let mergedValue = availabilitySetSettings.merge({settings, defaultSettings: defaults});
            expect(mergedValue.hasOwnProperty('platformUpdateDomainCount')).toEqual(true);
            expect(mergedValue.platformUpdateDomainCount).toEqual(5);
        });
        it('validate merge lets override defaults.', () => {
            let availabilitySetSettings = rewire('../core/availabilitySetSettings.js');
            let settings = {
                'platformFaultDomainCount': 10,
            };

            let defaults = {
                'platformUpdateDomainCount': 11,
                'platformFaultDomainCount': 11
            };

            let mergedValue = availabilitySetSettings.merge({settings: settings, defaultSettings: defaults});
            expect(mergedValue.platformFaultDomainCount).toEqual(10);
            expect(mergedValue.platformUpdateDomainCount).toEqual(11);
        });
    });
    describe('validations:', () => {
        let availabilitySetSettings = rewire('../core/availabilitySetSettings.js');
        let testAvSetSettings = {
            platformFaultDomainCount: 3,
            platformUpdateDomainCount: 5,
            name: 'test-as'
        };
        describe('platformFaultDomainCount:', () => {
            let validation = availabilitySetSettings.__get__('availabilitySetValidations').platformFaultDomainCount;
            it('validate platformFaultDomainCount values can be between 1-3.', () => {
                let result = validation(0, testAvSetSettings);
                expect(result.result).toEqual(false);

                result = validation(3, testAvSetSettings);
                expect(result.result).toEqual(true);

                result = validation(5, testAvSetSettings);
                expect(result.result).toEqual(false);

                result = validation('5', testAvSetSettings);
                expect(result.result).toEqual(false);
            });
        });
        describe('platformUpdateDomainCount:', () => {
            let availabilitySetSettings = rewire('../core/availabilitySetSettings.js');
            let validation = availabilitySetSettings.__get__('availabilitySetValidations').platformUpdateDomainCount;
            it('validate platformUpdateDomainCount values can be between 1-20.', () => {
                let result = validation(0, testAvSetSettings);
                expect(result.result).toEqual(false);

                result = validation(20, testAvSetSettings);
                expect(result.result).toEqual(true);

                result = validation(50, testAvSetSettings);
                expect(result.result).toEqual(false);

                result = validation('5', testAvSetSettings);
                expect(result.result).toEqual(false);
            });
        });
        describe('name:', () => {
            let availabilitySetSettings = rewire('../core/availabilitySetSettings.js');
            let validation = availabilitySetSettings.__get__('availabilitySetValidations').name;
            it('validate name canot be an empty string.', () => {
                let result = validation('', testAvSetSettings);
                expect(result.result).toEqual(false);

                result = validation('test', testAvSetSettings);
                expect(result.result).toEqual(true);

                result = validation(null, testAvSetSettings);
                expect(result.result).toEqual(false);
            });
        });
    });

    if (global.testConfiguration.runTransform) {
        describe('transform:', () => {
            let availabilitySetSettings = rewire('../core/availabilitySetSettings.js');
            let settings = {
                storageAccounts: {
                    count: 2,
                    managed: false
                },
                availabilitySet: {
                    useExistingAvailabilitySet: false,
                    platformFaultDomainCount: 3,
                    platformUpdateDomainCount: 5,
                    name: 'test-as'
                }
            };
            it('converts settings to RP shape', () => {
                let result = availabilitySetSettings.transform(settings.availabilitySet, settings);
                expect(result.availabilitySet[0].name).toEqual('test-as');
                expect(result.availabilitySet[0].properties.platformFaultDomainCount).toEqual(3);
                expect(result.availabilitySet[0].properties.platformUpdateDomainCount).toEqual(5);
            });
            it('adds a managed property to properties only if storage accounts are managed', () => {
                let result = availabilitySetSettings.transform(settings.availabilitySet, settings);
                expect(result.availabilitySet[0].properties.hasOwnProperty('managed')).toEqual(false);

                let param = _.cloneDeep(settings);
                param.storageAccounts.managed = true;

                result = availabilitySetSettings.transform(param.availabilitySet, param);
                expect(result.availabilitySet[0].properties.hasOwnProperty('managed')).toEqual(true);
            });
        });
    }
});