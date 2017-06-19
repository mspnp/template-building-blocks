describe('validation', () => {
    let validation = require('../core/validation.js');
    let _ = require('lodash');

    describe('utilities', () => {
        describe('isGuid', () => {
            let isGuid = validation.utilities.isGuid;
            it('undefined', () => {
                expect(isGuid()).toEqual(false);
            });

            it('null', () => {
                expect(isGuid(null)).toEqual(false);
            });

            it('empty', () => {
                expect(isGuid('')).toEqual(false);
            });

            it('whitespace', () => {
                expect(isGuid(' ')).toEqual(false);
            });

            it('invalid spacing', () => {
                expect(isGuid(' 00000000-0000-1000-8000-000000000000 ')).toEqual(false);
            });

            it('invalid value', () => {
                expect(isGuid('NOT_VALID')).toEqual(false);
            });

            it('too many parts', () => {
                expect(isGuid('00000000-0000-1000-8000-000000000000-0000')).toEqual(false);
            });

            it('not enough parts', () => {
                expect(isGuid('00000000-0000-1000-8000')).toEqual(false);
            });

            it('valid', () => {
                expect(isGuid('00000000-0000-1000-8000-000000000000')).toEqual(true);
            });
        });

        describe('isStringInArray', () => {
            let isStringInArray = validation.utilities.isStringInArray;
            let validValues = ['value1', 'value2', 'value3'];
            it('undefined', () => {
                expect(isStringInArray(undefined, validValues)).toEqual(false);
            });

            it('null', () => {
                expect(isStringInArray(null, validValues)).toEqual(false);
            });

            it('empty', () => {
                expect(isStringInArray('', validValues)).toEqual(false);
            });

            it('whitespace', () => {
                expect(isStringInArray(' ', validValues)).toEqual(false);
            });

            it('invalid spacing', () => {
                expect(isStringInArray(' value1 ', validValues)).toEqual(false);
            });

            it('invalid value', () => {
                expect(isStringInArray('NOT_VALID', validValues)).toEqual(false);
            });

            it('valid', () => {
                expect(isStringInArray('value1', validValues)).toEqual(true);
            });
        });

        describe('isNullOrWhitespace', () => {
            let isNullOrWhitespace = validation.utilities.isNullOrWhitespace;
            it('undefined', () => {
                expect(isNullOrWhitespace()).toEqual(true);
            });

            it('null', () => {
                expect(isNullOrWhitespace(null)).toEqual(true);
            });

            it('empty', () => {
                expect(isNullOrWhitespace('')).toEqual(true);
            });

            it('whitespace', () => {
                expect(isNullOrWhitespace(' ')).toEqual(true);
            });

            it('valid', () => {
                expect(isNullOrWhitespace('valid')).toEqual(false);
            });
        });

        describe('isObjectForResourceId', () => {
            let isObjectForResourceId = validation.utilities.isObjectForResourceId;
            it('undefined', () => {
                expect(isObjectForResourceId()).toEqual(true);
            });

            it('null', () => {
                expect(isObjectForResourceId(null)).toEqual(true);
            });

            it('empty', () => {
                expect(isObjectForResourceId({})).toEqual(true);
            });

            it('only name', () => {
                expect(isObjectForResourceId({
                    name: 'my-name'
                })).toEqual(true);
            });

            it('name and resourceGroupName', () => {
                expect(isObjectForResourceId({
                    resourceGroupName: 'test-rg',
                    name: 'my-name'
                })).toEqual(true);
            });

            it('name, resourceGroupName, and subscriptionId', () => {
                expect(isObjectForResourceId({
                    subscriptionId: '00000000-0000-1000-8000-000000000000',
                    resourceGroupName: 'test-rg',
                    name: 'my-name'
                })).toEqual(true);
            });

            it('extra field', () => {
                expect(isObjectForResourceId({
                    subscriptionId: '00000000-0000-1000-8000-000000000000',
                    resourceGroupName: 'test-rg',
                    name: 'my-name',
                    extra: 'NOT_VALID'
                })).toEqual(false);
            });
        });

        describe('networking', () => {
            describe('isValidIpAddress', () => {
                let isValidIpAddress = validation.utilities.networking.isValidIpAddress;
                it('undefined', () => {
                    expect(isValidIpAddress()).toEqual(false);
                });

                it('null', () => {
                    expect(isValidIpAddress(null)).toEqual(false);
                });

                it('empty', () => {
                    expect(isValidIpAddress('')).toEqual(false);
                });

                it('whitespace', () => {
                    expect(isValidIpAddress(' ')).toEqual(false);
                });

                it('invalid spacing', () => {
                    expect(isValidIpAddress(' 10.0.0.1 ')).toEqual(false);
                });

                it('invalid value', () => {
                    expect(isValidIpAddress('NOT_VALID')).toEqual(false);
                });

                it('too many parts', () => {
                    expect(isValidIpAddress('10.0.0.0.1')).toEqual(false);
                });

                it('not enough parts', () => {
                    expect(isValidIpAddress('10.0.0')).toEqual(false);
                });

                it('valid', () => {
                    expect(isValidIpAddress('10.0.0.1')).toEqual(true);
                });
            });

            describe('isValidCidr', () => {
                let isValidCidr = validation.utilities.networking.isValidCidr;
                it('undefined', () => {
                    expect(isValidCidr()).toEqual(false);
                });

                it('null', () => {
                    expect(isValidCidr(null)).toEqual(false);
                });

                it('empty', () => {
                    expect(isValidCidr('')).toEqual(false);
                });

                it('whitespace', () => {
                    expect(isValidCidr(' ')).toEqual(false);
                });

                it('invalid spacing', () => {
                    expect(isValidCidr(' 10.0.0.1/24 ')).toEqual(false);
                });

                it('invalid value', () => {
                    expect(isValidCidr('NOT_VALID')).toEqual(false);
                });

                it('no mask', () => {
                    expect(isValidCidr('10.0.0.1/')).toEqual(false);
                });

                it('mask too big', () => {
                    expect(isValidCidr('10.0.0.1/33')).toEqual(false);
                });

                it('mask too small', () => {
                    expect(isValidCidr('10.0.0.1/-1')).toEqual(false);
                });

                it('valid', () => {
                    expect(isValidCidr('10.0.0.1/24')).toEqual(true);
                });
            });

            describe('isValidPortRange', () => {
                let isValidPortRange = validation.utilities.networking.isValidPortRange;
                it('undefined', () => {
                    expect(isValidPortRange()).toEqual(false);
                });

                it('null', () => {
                    expect(isValidPortRange(null)).toEqual(false);
                });

                it('empty', () => {
                    expect(isValidPortRange('')).toEqual(false);
                });

                it('whitespace', () => {
                    expect(isValidPortRange(' ')).toEqual(false);
                });

                it('Port 0', () => {
                    expect(isValidPortRange(0)).toEqual(false);
                });

                it('Port 65536', () => {
                    expect(isValidPortRange(65536)).toEqual(false);
                });

                it('Port 1', () => {
                    expect(isValidPortRange(1)).toEqual(true);
                });

                it('Port 65535', () => {
                    expect(isValidPortRange(65535)).toEqual(true);
                });

                it('Port *', () => {
                    expect(isValidPortRange('*')).toEqual(true);
                });

                it('Port 0-65535', () => {
                    expect(isValidPortRange('0-65535')).toEqual(false);
                });

                it('Port 1-65536', () => {
                    expect(isValidPortRange('1-65536')).toEqual(false);
                });

                it('Port 1-65535', () => {
                    expect(isValidPortRange('1-65535')).toEqual(true);
                });

                it('Port 1-10-20', () => {
                    expect(isValidPortRange('1-10-20')).toEqual(false);
                });

                it('Port -', () => {
                    expect(isValidPortRange(' - ')).toEqual(false);
                });

                it('100-50', () => {
                    expect(isValidPortRange('100-50')).toEqual(false);
                });
            });
        });
    });

    describe('validationUtilities', () => {
        describe('isBoolean', () => {
            let isBoolean = validation.validationUtilities.isBoolean;
            it('undefined', () => {
                let validationResult = isBoolean();
                expect(validationResult.result).toEqual(false);
                expect(validationResult.message).toBeDefined();
            });

            it('null', () => {
                let validationResult = isBoolean(null);
                expect(validationResult.result).toEqual(false);
                expect(validationResult.message).toBeDefined();
            });

            it('empty', () => {
                let validationResult = isBoolean('');
                expect(validationResult.result).toEqual(false);
                expect(validationResult.message).toBeDefined();
            });

            it('whitespace', () => {
                let validationResult = isBoolean(' ');
                expect(validationResult.result).toEqual(false);
                expect(validationResult.message).toBeDefined();
            });

            it('invalid', () => {
                let validationResult = isBoolean('NOT_VALID');
                expect(validationResult.result).toEqual(false);
                expect(validationResult.message).toBeDefined();
            });

            it('valid', () => {
                let validationResult = isBoolean(true);
                expect(validationResult.result).toEqual(true);
                expect(validationResult.message).toBeDefined();
            });
        });

        describe('isGuid', () => {
            let isGuid = validation.validationUtilities.isGuid;
            it('undefined', () => {
                let validationResult = isGuid();
                expect(validationResult.result).toEqual(false);
                expect(validationResult.message).toBeDefined();
            });

            it('null', () => {
                let validationResult = isGuid(null);
                expect(validationResult.result).toEqual(false);
                expect(validationResult.message).toBeDefined();
            });

            it('empty', () => {
                let validationResult = isGuid('');
                expect(validationResult.result).toEqual(false);
                expect(validationResult.message).toBeDefined();
            });

            it('whitespace', () => {
                let validationResult = isGuid(' ');
                expect(validationResult.result).toEqual(false);
                expect(validationResult.message).toBeDefined();
            });

            it('invalid', () => {
                let validationResult = isGuid('NOT_VALID');
                expect(validationResult.result).toEqual(false);
                expect(validationResult.message).toBeDefined();
            });

            it('valid', () => {
                let validationResult = isGuid('00000000-0000-1000-8000-000000000000');
                expect(validationResult.result).toEqual(true);
                expect(validationResult.message).toBeDefined();
            });
        });

        describe('isValidIpAddress', () => {
            let isValidIpAddress = validation.validationUtilities.isValidIpAddress;
            it('undefined', () => {
                let validationResult = isValidIpAddress();
                expect(validationResult.result).toEqual(false);
                expect(validationResult.message).toBeDefined();
            });

            it('null', () => {
                let validationResult = isValidIpAddress(null);
                expect(validationResult.result).toEqual(false);
                expect(validationResult.message).toBeDefined();
            });

            it('empty', () => {
                let validationResult = isValidIpAddress('');
                expect(validationResult.result).toEqual(false);
                expect(validationResult.message).toBeDefined();
            });

            it('whitespace', () => {
                let validationResult = isValidIpAddress(' ');
                expect(validationResult.result).toEqual(false);
                expect(validationResult.message).toBeDefined();
            });

            it('invalid', () => {
                let validationResult = isValidIpAddress('NOT_VALID');
                expect(validationResult.result).toEqual(false);
                expect(validationResult.message).toBeDefined();
            });

            it('valid', () => {
                let validationResult = isValidIpAddress('10.0.0.1');
                expect(validationResult.result).toEqual(true);
                expect(validationResult.message).toBeDefined();
            });
        });

        describe('isValidCidr', () => {
            let isValidCidr = validation.validationUtilities.isValidCidr;
            it('undefined', () => {
                let validationResult = isValidCidr();
                expect(validationResult.result).toEqual(false);
                expect(validationResult.message).toBeDefined();
            });

            it('null', () => {
                let validationResult = isValidCidr(null);
                expect(validationResult.result).toEqual(false);
                expect(validationResult.message).toBeDefined();
            });

            it('empty', () => {
                let validationResult = isValidCidr('');
                expect(validationResult.result).toEqual(false);
                expect(validationResult.message).toBeDefined();
            });

            it('whitespace', () => {
                let validationResult = isValidCidr(' ');
                expect(validationResult.result).toEqual(false);
                expect(validationResult.message).toBeDefined();
            });

            it('invalid', () => {
                let validationResult = isValidCidr('NOT_VALID');
                expect(validationResult.result).toEqual(false);
                expect(validationResult.message).toBeDefined();
            });

            it('valid', () => {
                let validationResult = isValidCidr('10.0.0.1/24');
                expect(validationResult.result).toEqual(true);
                expect(validationResult.message).toBeDefined();
            });
        });

        describe('isNotNullOrWhitespace', () => {
            let isNotNullOrWhitespace = validation.validationUtilities.isNotNullOrWhitespace;
            it('undefined', () => {
                let validationResult = isNotNullOrWhitespace();
                expect(validationResult.result).toEqual(false);
                expect(validationResult.message).toBeDefined();
            });

            it('null', () => {
                let validationResult = isNotNullOrWhitespace(null);
                expect(validationResult.result).toEqual(false);
                expect(validationResult.message).toBeDefined();
            });

            it('empty', () => {
                let validationResult = isNotNullOrWhitespace('');
                expect(validationResult.result).toEqual(false);
                expect(validationResult.message).toBeDefined();
            });

            it('whitespace', () => {
                let validationResult = isNotNullOrWhitespace(' ');
                expect(validationResult.result).toEqual(false);
                expect(validationResult.message).toBeDefined();
            });

            it('valid', () => {
                let validationResult = isNotNullOrWhitespace('VALID');
                expect(validationResult.result).toEqual(true);
                expect(validationResult.message).toBeDefined();
            });
        });
    });

    describe('tags validations', () => {
        let tagsValidations = {
            tags: validation.tagsValidations
        };

        let tagsSettings = {
            tags: {}
        };

        it('tags undefined', () => {
            let settings = _.cloneDeep(tagsSettings);
            delete settings.tags;
            let errors = validation.validate({
                settings: settings,
                validations: tagsValidations
            });

            expect(errors.length).toEqual(1);
            expect(errors[0].name).toEqual('.tags');
        });

        it('tags null', () => {
            let settings = _.cloneDeep(tagsSettings);
            settings.tags = null;
            let errors = validation.validate({
                settings: settings,
                validations: tagsValidations
            });

            expect(errors.length).toEqual(1);
            expect(errors[0].name).toEqual('.tags');
        });

        it('tags empty', () => {
            let settings = _.cloneDeep(tagsSettings);
            settings.tags = {};
            let errors = validation.validate({
                settings: settings,
                validations: tagsValidations
            });

            expect(errors.length).toEqual(0);
        });

        it('tags not a plain object', () => {
            let settings = _.cloneDeep(tagsSettings);
            settings.tags = [];
            let errors = validation.validate({
                settings: settings,
                validations: tagsValidations
            });

            expect(errors.length).toEqual(1);
            expect(errors[0].name).toEqual('.tags');
        });

        it('tags length exceeded', () => {
            let settings = _.cloneDeep(tagsSettings);
            settings.tags = {};
            for (let i = 0; i < 16; i++) {
                settings.tags[`name${i}`] = `value${i}`;
            }

            let errors = validation.validate({
                settings: settings,
                validations: tagsValidations
            });

            expect(errors.length).toEqual(1);
            expect(errors[0].name).toEqual('.tags');
        });

        it('tags name length exceeded', () => {
            let settings = _.cloneDeep(tagsSettings);
            settings.tags = {};
            let tagName = '';
            for (let i = 0; i < 513; i++) {
                tagName = tagName.concat('a');
            }

            settings.tags[tagName] = 'value';
            settings.tags[tagName + '1'] = 'value';

            let errors = validation.validate({
                settings: settings,
                validations: tagsValidations
            });

            expect(errors.length).toEqual(1);
            expect(errors[0].name).toEqual('.tags');
        });

        it('tags value is empty string', () => {
            let settings = _.cloneDeep(tagsSettings);
            settings.tags = {};
            settings.tags['name1'] = '';
            let errors = validation.validate({
                settings: settings,
                validations: tagsValidations
            });

            expect(errors.length).toEqual(1);
            expect(errors[0].name).toEqual('.tags');
        });

        it('tags value is null', () => {
            let settings = _.cloneDeep(tagsSettings);
            settings.tags = {};
            settings.tags['name1'] = null;
            let errors = validation.validate({
                settings: settings,
                validations: tagsValidations
            });

            expect(errors.length).toEqual(1);
            expect(errors[0].name).toEqual('.tags');
        });

        it('tags value length exceeded', () => {
            let settings = _.cloneDeep(tagsSettings);
            settings.tags = {};
            let tagValue = '';
            for (let i = 0; i < 257; i++) {
                tagValue = tagValue.concat('a');
            }

            settings.tags['name1'] = tagValue;
            settings.tags['name2'] = tagValue;

            let errors = validation.validate({
                settings: settings,
                validations: tagsValidations
            });

            expect(errors.length).toEqual(1);
            expect(errors[0].name).toEqual('.tags');
        });

        it('tags name and value length exceeded', () => {
            let settings = _.cloneDeep(tagsSettings);
            settings.tags = {};
            let tagName = '';
            for (let i = 0; i < 513; i++) {
                tagName = tagName.concat('a');
            }

            settings.tags[tagName] = tagName;
            settings.tags[tagName + '1'] = tagName;

            let errors = validation.validate({
                settings: settings,
                validations: tagsValidations
            });

            expect(errors.length).toEqual(1);
            expect(errors[0].name).toEqual('.tags');
        });
    });

    describe('merge', () => {
        it('invalid settings type', () => {
            expect(() => {
                validation.merge(1, {});
            }).toThrow();
        });
    });

    describe('validate', () => {
        it('array with message', () => {
            let result = validation.validate({
                settings: ['value'],
                validations: (value) => {
                    return {
                        result: _.isFinite(value),
                        message: 'Value must be a finite number'
                    };
                },
                parentKey: '.myarray',
                parentValue: null
            });

            expect(result.length).toEqual(1);
            expect(result[0].name).toEqual('.myarray');
        });

        it('array without message', () => {
            let result = validation.validate({
                settings: ['value'],
                validations: (value) => {
                    return {
                        result: _.isFinite(value)
                    };
                },
                parentKey: '.myarray',
                parentValue: null
            });

            expect(result.length).toEqual(1);
            expect(result[0].name).toEqual('.myarray');
            expect(_.endsWith(result[0].message, '.')).toEqual(true);
        });
    });
});