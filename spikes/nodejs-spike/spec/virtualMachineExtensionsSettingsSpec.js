describe('extensionSettings:', () => {
    let rewire = require('rewire');
    let extensionSettings = rewire('../core/virtualMachineExtensionsSettings.js');
    let _ = require('lodash');
    let v = require('../core/validation.js');

    let buildingBlockSettings = {
        subscriptionId: '00000000-0000-1000-8000-000000000000',
        resourceGroupName: 'test-rg'
    };

    describe('merge:', () => {
        it('validate merge is nop.', () => {
            let settings = [
                {
                    vms: [
                        'test-vm1'
                    ],
                    extensions: [
                        {
                            name: 'foo',
                            publisher: 'Microsoft.Compute',
                            type: 'CustomScriptExtension',
                            typeHandlerVersion: '1.8',
                            autoUpgradeMinorVersion: true,
                            settings: {
                                fileUris: [
                                    'https://[TEST-SA].blob.core.windows.net/extensions/test.ps1'
                                ],
                                commandToExecute: 'powershell -ExecutionPolicy Unrestricted -File ./test.ps1'
                            },
                            protectedSettings: {}
                        }
                    ]
                }
            ];

            let mergedValue = extensionSettings.process(settings, buildingBlockSettings);
            expect(mergedValue.extensions[0].vms[0]).toEqual('test-vm1');
            expect(mergedValue.extensions[0].hasOwnProperty('name')).toEqual(true);
            expect(mergedValue.extensions[0].extensionSettings.autoUpgradeMinorVersion).toEqual(true);
        });
    });
    describe('validations:', () => {
        let settings = [
            {
                vms: [
                    'test-vm1'
                ],
                extensions: [
                    {
                        name: 'testextension',
                        publisher: 'Microsoft.Compute',
                        type: 'CustomScriptExtension',
                        typeHandlerVersion: '1.8',
                        autoUpgradeMinorVersion: true,
                        settings: {
                            fileUris: [
                                'https://[TEST-SA].blob.core.windows.net/extensions/test.ps1'
                            ],
                            commandToExecute: 'powershell -ExecutionPolicy Unrestricted -File ./test.ps1'
                        },
                        protectedSettings: {}
                    }
                ]
            }
        ];
        describe('vms:', () => {
            let validation = extensionSettings.__get__('vmExtensionValidations').vms;
            it('validates value has to an array.', () => {
                let result = validation({}, settings);
                expect(result.result).toEqual(false);

                result = validation('test', settings);
                expect(result.result).toEqual(false);

                result = validation(['test-vm1'], settings);
                expect(result.result).toEqual(true);
            });
            it('validates value cannt be empty array.', () => {
                let result = validation([], settings);
                expect(result.result).toEqual(false);
            });
            it('validates vms is a mandatory property.', () => {
                let result = validation(null, settings);
                expect(result.result).toEqual(false);
            });
        });
        describe('extensions:', () => {
            let validation = extensionSettings.__get__('vmExtensionValidations').extensions;
            it('validates value has to an array.', () => {
                let result = validation({}, settings);
                expect(result.result).toEqual(false);

                result = validation('test', settings);
                expect(result.result).toEqual(false);

                let errors = v.validate({
                    settings: settings[0].extensions,
                    validations: validation
                });
                expect(errors.length).toEqual(0);
            });
            it('validates value cannt be empty array.', () => {
                let result = validation([], settings);
                expect(result.result).toEqual(false);
            });
            it('validates extensions is a mandatory property.', () => {
                let result = validation(null, settings);
                expect(result.result).toEqual(false);
            });
            it('validates extension.name cannot be null or empty.', () => {
                let updatedSettings = _.cloneDeep(settings[0].extensions);
                updatedSettings[0].name = '';
                let errors = v.validate({
                    settings: updatedSettings,
                    validations: validation
                });
                expect(errors.length).toEqual(1);
                expect(errors[0].name).toEqual('[0].name');
            });
            it('validates extension.publisher cannot be null or empty.', () => {
                let updatedSettings = _.cloneDeep(settings[0].extensions);
                updatedSettings[0].publisher = null;
                let errors = v.validate({
                    settings: updatedSettings,
                    validations: validation
                });
                expect(errors.length).toEqual(1);
                expect(errors[0].name).toEqual('[0].publisher');
            });
            it('validates extension.type cannot be null or empty.', () => {
                let updatedSettings = _.cloneDeep(settings[0].extensions);
                updatedSettings[0].type = '';
                let errors = v.validate({
                    settings: updatedSettings,
                    validations: validation
                });
                expect(errors.length).toEqual(1);
                expect(errors[0].name).toEqual('[0].type');
            });
            it('validates extension.typeHandlerVersion cannot be null or empty.', () => {
                let updatedSettings = _.cloneDeep(settings[0].extensions);
                updatedSettings[0].typeHandlerVersion = '';
                let errors = v.validate({
                    settings: updatedSettings,
                    validations: validation
                });
                expect(errors.length).toEqual(1);
                expect(errors[0].name).toEqual('[0].typeHandlerVersion');
            });
            it('validates extension.autoUpgradeMinorVersion cannot be null or empty.', () => {
                let updatedSettings = _.cloneDeep(settings[0].extensions);
                updatedSettings[0].autoUpgradeMinorVersion = null;
                let errors = v.validate({
                    settings: updatedSettings,
                    validations: validation
                });
                expect(errors.length).toEqual(1);
                expect(errors[0].name).toEqual('[0].autoUpgradeMinorVersion');
            });
            it('validates extension.settings must be a valid json object (typeof "object").', () => {
                let updatedSettings = _.cloneDeep(settings[0].extensions);
                updatedSettings[0].settings = null;
                let errors = v.validate({
                    settings: updatedSettings,
                    validations: validation
                });
                expect(errors.length).toEqual(1);
                expect(errors[0].name).toEqual('[0].settings');

                updatedSettings[0].settings = 'test';
                errors = v.validate({
                    settings: updatedSettings,
                    validations: validation
                });
                expect(errors.length).toEqual(1);
                expect(errors[0].name).toEqual('[0].settings');

                updatedSettings[0].settings = [];
                errors = v.validate({
                    settings: updatedSettings,
                    validations: validation
                });
                expect(errors.length).toEqual(1);
                expect(errors[0].name).toEqual('[0].settings');

                updatedSettings[0].settings = {};
                errors = v.validate({
                    settings: updatedSettings,
                    validations: validation
                });
                expect(errors.length).toEqual(0);
            });
            it('validates extension.protectedSettings must be a valid json object (typeof "object").', () => {
                let updatedSettings = _.cloneDeep(settings[0].extensions);
                updatedSettings[0].protectedSettings = null;
                let errors = v.validate({
                    settings: updatedSettings,
                    validations: validation
                });
                expect(errors.length).toEqual(1);
                expect(errors[0].name).toEqual('[0].protectedSettings');

                updatedSettings[0].protectedSettings = 'test';
                errors = v.validate({
                    settings: updatedSettings,
                    validations: validation
                });
                expect(errors.length).toEqual(1);
                expect(errors[0].name).toEqual('[0].protectedSettings');

                updatedSettings[0].protectedSettings = [];
                errors = v.validate({
                    settings: updatedSettings,
                    validations: validation
                });
                expect(errors.length).toEqual(1);
                expect(errors[0].name).toEqual('[0].protectedSettings');

                updatedSettings[0].protectedSettings = {};
                errors = v.validate({
                    settings: updatedSettings,
                    validations: validation
                });
                expect(errors.length).toEqual(0);
            });
        });
    });
    describe('process:', () => {
        let settings = [
            {
                vms: [
                    'test-vm1',
                    'test-vm2'
                ],
                extensions: [
                    {
                        name: 'testCustomExtension1',
                        publisher: 'Microsoft.Compute',
                        type: 'CustomScriptExtension',
                        typeHandlerVersion: '1.8',
                        autoUpgradeMinorVersion: true,
                        settings: {
                            fileUris: [
                                'https://[TEST-SA].blob.core.windows.net/extensions/test.ps1'
                            ],
                            commandToExecute: 'powershell -ExecutionPolicy Unrestricted -File ./test.ps1'
                        },
                        protectedSettings: {}
                    },
                    {
                        name: 'testCustomExtension2',
                        publisher: 'Microsoft.Compute',
                        type: 'CustomScriptExtension',
                        typeHandlerVersion: '1.7',
                        autoUpgradeMinorVersion: false,
                        settings: {
                            fileUris: [
                                'https://[TEST-SA].blob.core.windows.net/extensions/test.ps1'
                            ],
                            commandToExecute: 'powershell -ExecutionPolicy Unrestricted -File ./test.ps1'
                        },
                        protectedSettings: {
                            reference: {
                                keyVault: {
                                    id: '/subscriptions/SUB-ID/resourceGroups/KEYVAULT-RG/providers/Microsoft.KeyVault/vaults/VAULT-NAME'
                                },
                                secretName: 'TEST-SECRET'
                            }
                        }
                    }
                ]
            },
            {
                vms: [
                    'test-vm3'
                ],
                extensions: [
                    {
                        name: 'testCustomExtension3',
                        publisher: 'Test.Publisher',
                        type: 'CustomScriptExtension',
                        typeHandlerVersion: '1.4',
                        autoUpgradeMinorVersion: false,
                        settings: {
                            fileUris: [
                                'https://[STORAGE-ACCOUNT].blob.core.windows.net/extensions/test.ps1'
                            ],
                            commandToExecute: 'powershell -ExecutionPolicy Unrestricted -File ./test.ps1'
                        },
                        protectedSettings: {
                            storageAccountName: 'STORAGE-ACCOUNT',
                            storageAccountKey: 'STORAGE-ACCOUNT-KEY'
                        }
                    }
                ]
            }
        ];

        it('validates that output contains 3 extensions', () => {
            let result = extensionSettings.process(settings, buildingBlockSettings);

            expect(result.extensions.length).toEqual(3);
        });
        it('validates that vms are correctly configured for each extension', () => {
            let result = extensionSettings.process(settings, buildingBlockSettings);

            _.forEach(result.extensions, (ext) => {
                switch (ext.name) {
                case 'testCustomExtension1':
                case 'testCustomExtension2':
                    expect(ext.vms.length).toEqual(2);
                    expect(_.includes(ext.vms, 'test-vm1')).toEqual(true);
                    expect(_.includes(ext.vms, 'test-vm2')).toEqual(true);
                    break;
                case 'testCustomExtension3':
                    expect(ext.vms.length).toEqual(1);
                    expect(_.includes(ext.vms, 'test-vm3')).toEqual(true);
                    break;
                }
            });
        });
        it('validates that extensionSettings contains all properties except protectedSettings', () => {
            let result = extensionSettings.process(settings, buildingBlockSettings);

            _.forEach(result.extensions, (ext) => {
                switch (ext.name) {
                case 'testCustomExtension1':
                    expect(ext.extensionSettings.publisher).toEqual('Microsoft.Compute');
                    expect(ext.extensionSettings.type).toEqual('CustomScriptExtension');
                    expect(ext.extensionSettings.typeHandlerVersion).toEqual('1.8');
                    expect(ext.extensionSettings.autoUpgradeMinorVersion).toEqual(true);
                    expect(ext.extensionSettings.settings.fileUris[0]).toEqual('https://[TEST-SA].blob.core.windows.net/extensions/test.ps1');
                    expect(ext.extensionSettings.settings.commandToExecute).toEqual('powershell -ExecutionPolicy Unrestricted -File ./test.ps1');
                    expect(ext.extensionSettings.hasOwnProperty('protectedSettings')).toEqual(false);
                    break;
                case 'testCustomExtension2':
                    expect(ext.extensionSettings.publisher).toEqual('Microsoft.Compute');
                    expect(ext.extensionSettings.type).toEqual('CustomScriptExtension');
                    expect(ext.extensionSettings.typeHandlerVersion).toEqual('1.7');
                    expect(ext.extensionSettings.autoUpgradeMinorVersion).toEqual(false);
                    expect(ext.extensionSettings.settings.fileUris[0]).toEqual('https://[TEST-SA].blob.core.windows.net/extensions/test.ps1');
                    expect(ext.extensionSettings.settings.commandToExecute).toEqual('powershell -ExecutionPolicy Unrestricted -File ./test.ps1');
                    expect(ext.extensionSettings.hasOwnProperty('protectedSettings')).toEqual(false);
                    break;
                case 'testCustomExtension3':
                    expect(ext.extensionSettings.publisher).toEqual('Test.Publisher');
                    expect(ext.extensionSettings.type).toEqual('CustomScriptExtension');
                    expect(ext.extensionSettings.typeHandlerVersion).toEqual('1.4');
                    expect(ext.extensionSettings.autoUpgradeMinorVersion).toEqual(false);
                    expect(ext.extensionSettings.settings.fileUris[0]).toEqual('https://[STORAGE-ACCOUNT].blob.core.windows.net/extensions/test.ps1');
                    expect(ext.extensionSettings.settings.commandToExecute).toEqual('powershell -ExecutionPolicy Unrestricted -File ./test.ps1');
                    expect(ext.extensionSettings.hasOwnProperty('protectedSettings')).toEqual(false);
                    break;
                }
            });
        });
        it('validates that process handles empty protected settings', () => {
            let result = extensionSettings.process(settings, buildingBlockSettings);

            _.forEach(result.extensions, (ext) => {
                if (ext.name === 'testCustomExtension1') {
                    expect(ext.extensionProtectedSettings).toEqual({
                        value: '{}'
                    });
                }
            });
        });
        it('validates that process handles plain text protected settings', () => {
            let result = extensionSettings.process(settings, buildingBlockSettings);

            _.forEach(result.extensions, (ext) => {
                if (ext.name === 'testCustomExtension3') {
                    expect(ext.extensionProtectedSettings).toEqual({
                        value: '{\"storageAccountName\":\"STORAGE-ACCOUNT\",\"storageAccountKey\":\"STORAGE-ACCOUNT-KEY\"}'
                    });
                }
            });
        });
        it('validates that process handles keyvault reference for protected settings', () => {
            let result = extensionSettings.process(settings, buildingBlockSettings);

            _.forEach(result.extensions, (ext) => {
                if (ext.name === 'testCustomExtension2') {
                    expect(ext.extensionProtectedSettings).toEqual({
                        reference: {
                            keyVault: {
                                id: '/subscriptions/SUB-ID/resourceGroups/KEYVAULT-RG/providers/Microsoft.KeyVault/vaults/VAULT-NAME'
                            },
                            secretName: 'TEST-SECRET'
                        }
                    });
                }
            });
        });
    });
});