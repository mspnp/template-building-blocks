describe('publicIpAddressSettings', () => {
    let rewire = require('rewire');
    let publicIpAddressSettings = rewire('../core/publicIpAddressSettings.js');
    let _ = require('lodash');
    let validation = require('../core/validation.js');

    describe('isValidIPAllocationMethod', () => {
        let isValidIPAllocationMethod = publicIpAddressSettings.__get__('isValidIPAllocationMethod');
        
        it('undefined', () => {
            expect(isValidIPAllocationMethod()).toEqual(false);
        });

        it('null', () => {
            expect(isValidIPAllocationMethod(null)).toEqual(false);
        });

        it('empty', () => {
            expect(isValidIPAllocationMethod('')).toEqual(false);
        });

        it('whitespace', () => {
            expect(isValidIPAllocationMethod(' ')).toEqual(false);
        });

        it('invalid spacing', () => {
            expect(isValidIPAllocationMethod(' Public ')).toEqual(false);
        });

        it('invalid casing', () => {
            expect(isValidIPAllocationMethod('public')).toEqual(false);
        });

        it('invalid value', () => {
            expect(isValidIPAllocationMethod('NOT_VALID')).toEqual(false);
        });

        it('Dynamic', () => {
            expect(isValidIPAllocationMethod('Dynamic')).toEqual(true);
        });

        it('Static', () => {
            expect(isValidIPAllocationMethod('Static')).toEqual(true);
        });
    });

    describe('isValidIPAddressVersion', () => {
        let isValidIPAddressVersion = publicIpAddressSettings.__get__('isValidIPAddressVersion');
        
        it('undefined', () => {
            expect(isValidIPAddressVersion()).toEqual(false);
        });

        it('null', () => {
            expect(isValidIPAddressVersion(null)).toEqual(false);
        });

        it('empty', () => {
            expect(isValidIPAddressVersion('')).toEqual(false);
        });

        it('whitespace', () => {
            expect(isValidIPAddressVersion(' ')).toEqual(false);
        });

        it('invalid spacing', () => {
            expect(isValidIPAddressVersion(' Public ')).toEqual(false);
        });

        it('invalid casing', () => {
            expect(isValidIPAddressVersion('public')).toEqual(false);
        });

        it('invalid value', () => {
            expect(isValidIPAddressVersion('NOT_VALID')).toEqual(false);
        });

        it('IPv4', () => {
            expect(isValidIPAddressVersion('IPv4')).toEqual(true);
        });

        it('IPv6', () => {
            expect(isValidIPAddressVersion('IPv6')).toEqual(true);
        });
    });

    describe('validations', () => {
        let pipValidations = publicIpAddressSettings.__get__('publicIpAddressValidations');
        let publicIpAddress = {
            name: 'my-pip',
            subscriptionId: '00000000-0000-1000-8000-000000000000',
            resourceGroupName: 'test-rg',
            publicIPAllocationMethod: 'Static',
            publicIPAddressVersion: 'IPv4',
            idleTimeoutInMinutes: 1,
            domainNameLabel: 'mydomain',
            reverseFqdn: 'niamodym'
        };

        it('name undefined', () => {
            let settings = _.cloneDeep(publicIpAddress);
            delete settings.name;

            let errors = validation.validate({
                settings: settings,
                validations: pipValidations
            });

            expect(errors.length).toEqual(1);
            expect(errors[0].name).toEqual('.name');
        });

        it('name null', () => {
            let settings = _.cloneDeep(publicIpAddress);
            settings.name = null;

            let errors = validation.validate({
                settings: settings,
                validations: pipValidations
            });

            expect(errors.length).toEqual(1);
            expect(errors[0].name).toEqual('.name');
        });

        it('name empty', () => {
            let settings = _.cloneDeep(publicIpAddress);
            settings.name = '';

            let errors = validation.validate({
                settings: settings,
                validations: pipValidations
            });

            expect(errors.length).toEqual(1);
            expect(errors[0].name).toEqual('.name');
        });

        it('subscriptionId undefined', () => {
            let settings = _.cloneDeep(publicIpAddress);
            delete settings.subscriptionId;

            let errors = validation.validate({
                settings: settings,
                validations: pipValidations
            });

            expect(errors.length).toEqual(1);
            expect(errors[0].name).toEqual('.subscriptionId');
        });

        it('subscriptionId null', () => {
            let settings = _.cloneDeep(publicIpAddress);
            settings.subscriptionId = null;

            let errors = validation.validate({
                settings: settings,
                validations: pipValidations
            });

            expect(errors.length).toEqual(1);
            expect(errors[0].name).toEqual('.subscriptionId');
        });

        it('subscriptionId empty', () => {
            let settings = _.cloneDeep(publicIpAddress);
            settings.subscriptionId = '';

            let errors = validation.validate({
                settings: settings,
                validations: pipValidations
            });

            expect(errors.length).toEqual(1);
            expect(errors[0].name).toEqual('.subscriptionId');
        });

        it('resourceGroupName undefined', () => {
            let settings = _.cloneDeep(publicIpAddress);
            delete settings.resourceGroupName;

            let errors = validation.validate({
                settings: settings,
                validations: pipValidations
            });

            expect(errors.length).toEqual(1);
            expect(errors[0].name).toEqual('.resourceGroupName');
        });

        it('resourceGroupName null', () => {
            let settings = _.cloneDeep(publicIpAddress);
            settings.resourceGroupName = null;

            let errors = validation.validate({
                settings: settings,
                validations: pipValidations
            });

            expect(errors.length).toEqual(1);
            expect(errors[0].name).toEqual('.resourceGroupName');
        });

        it('resourceGroupName empty', () => {
            let settings = _.cloneDeep(publicIpAddress);
            settings.resourceGroupName = '';

            let errors = validation.validate({
                settings: settings,
                validations: pipValidations
            });

            expect(errors.length).toEqual(1);
            expect(errors[0].name).toEqual('.resourceGroupName');
        });

        it('publicIPAllocationMethod undefined', () => {
            let settings = _.cloneDeep(publicIpAddress);
            delete settings.publicIPAllocationMethod;

            let errors = validation.validate({
                settings: settings,
                validations: pipValidations
            });

            expect(errors.length).toEqual(1);
            expect(errors[0].name).toEqual('.publicIPAllocationMethod');
        });

        it('publicIPAllocationMethod null', () => {
            let settings = _.cloneDeep(publicIpAddress);
            settings.publicIPAllocationMethod = null;

            let errors = validation.validate({
                settings: settings,
                validations: pipValidations
            });

            expect(errors.length).toEqual(1);
            expect(errors[0].name).toEqual('.publicIPAllocationMethod');
        });

        it('publicIPAddressVersion undefined', () => {
            let settings = _.cloneDeep(publicIpAddress);
            delete settings.publicIPAddressVersion;

            let errors = validation.validate({
                settings: settings,
                validations: pipValidations
            });

            expect(errors.length).toEqual(1);
            expect(errors[0].name).toEqual('.publicIPAddressVersion');
        });

        it('publicIPAddressVersion null', () => {
            let settings = _.cloneDeep(publicIpAddress);
            settings.publicIPAddressVersion = null;

            let errors = validation.validate({
                settings: settings,
                validations: pipValidations
            });

            expect(errors.length).toEqual(1);
            expect(errors[0].name).toEqual('.publicIPAddressVersion');
        });

        it('idleTimeoutInMinutes undefined', () => {
            let settings = _.cloneDeep(publicIpAddress);
            delete settings.idleTimeoutInMinutes;

            let errors = validation.validate({
                settings: settings,
                validations: pipValidations
            });

            expect(errors.length).toEqual(0);
        });

        it('idleTimeoutInMinutes null', () => {
            let settings = _.cloneDeep(publicIpAddress);
            settings.idleTimeoutInMinutes = null;

            let errors = validation.validate({
                settings: settings,
                validations: pipValidations
            });

            expect(errors.length).toEqual(1);
            expect(errors[0].name).toEqual('.idleTimeoutInMinutes');
        });

        it('domainNameLabel undefined', () => {
            let settings = _.cloneDeep(publicIpAddress);
            delete settings.domainNameLabel;

            let errors = validation.validate({
                settings: settings,
                validations: pipValidations
            });

            expect(errors.length).toEqual(0);
        });

        it('domainNameLabel null', () => {
            let settings = _.cloneDeep(publicIpAddress);
            settings.domainNameLabel = null;

            let errors = validation.validate({
                settings: settings,
                validations: pipValidations
            });

            expect(errors.length).toEqual(1);
            expect(errors[0].name).toEqual('.domainNameLabel');
        });

        it('reverseFqdn undefined', () => {
            let settings = _.cloneDeep(publicIpAddress);
            delete settings.reverseFqdn;

            let errors = validation.validate({
                settings: settings,
                validations: pipValidations
            });

            expect(errors.length).toEqual(0);
        });

        it('reverseFqdn null', () => {
            let settings = _.cloneDeep(publicIpAddress);
            settings.reverseFqdn = null;

            let errors = validation.validate({
                settings: settings,
                validations: pipValidations
            });

            expect(errors.length).toEqual(1);
            expect(errors[0].name).toEqual('.reverseFqdn');
        });

        it('reverseFqdn specified and IPv6', () => {
            let settings = _.cloneDeep(publicIpAddress);
            settings.publicIPAddressVersion = 'IPv6';

            let errors = validation.validate({
                settings: settings,
                validations: pipValidations
            });

            expect(errors.length).toEqual(1);
            expect(errors[0].name).toEqual('.reverseFqdn');
        });

        it('Valid', () => {
            let settings = _.cloneDeep(publicIpAddress);

            let errors = validation.validate({
                settings: settings,
                validations: pipValidations
            });

            expect(errors.length).toEqual(0);
        });
    });

    describe('transform', () => {
        let publicIpAddress = {
            name: 'my-pip',
            subscriptionId: '00000000-0000-1000-8000-000000000000',
            resourceGroupName: 'test-rg',
            publicIPAllocationMethod: 'Static',
            publicIPAddressVersion: 'IPv4',
            idleTimeoutInMinutes: 1,
            domainNameLabel: 'mydomain',
            reverseFqdn: 'niamodym'
        };

        let buildingBlockSettings = {
            subscriptionId: '00000000-0000-1000-8000-000000000000',
            resourceGroupName: 'test-rg'
        };

        it('single publicIpAddress without idleTimeoutInMinutes', () => {
            let settings = _.cloneDeep(publicIpAddress);
            delete settings.idleTimeoutInMinutes;
            let result = publicIpAddressSettings.transform({
                settings: settings,
                buildingBlockSettings: buildingBlockSettings
            });

            expect(result.publicIpAddresses.length).toBe(1);
            let settingsResult = result.publicIpAddresses[0];
            expect(settingsResult.hasOwnProperty('id')).toBe(true);
            expect(settingsResult.name).toBe(settings.name);
            expect(settingsResult.hasOwnProperty('resourceGroupName')).toBe(true);
            expect(settingsResult.hasOwnProperty('subscriptionId')).toBe(true);

            expect(settingsResult.properties.publicIPAllocationMethod).toBe(publicIpAddress.publicIPAllocationMethod);
            expect(settingsResult.properties.publicIPAddressVersion).toBe(publicIpAddress.publicIPAddressVersion);
            expect(settingsResult.properties.idleTimeoutInMinutes).toBeUndefined();
            expect(settingsResult.properties.dnsSettings.domainNameLabel).toBe(publicIpAddress.domainNameLabel);
            expect(settingsResult.properties.dnsSettings.reverseFqdn).toBe(publicIpAddress.reverseFqdn);
        });

        it('single publicIpAddress without dnsSettings', () => {
            let settings = _.cloneDeep(publicIpAddress);
            delete settings.domainNameLabel;
            delete settings.reverseFqdn;

            let result = publicIpAddressSettings.transform({
                settings: settings,
                buildingBlockSettings: buildingBlockSettings
            });

            expect(result.publicIpAddresses.length).toBe(1);
            let settingsResult = result.publicIpAddresses[0];
            expect(settingsResult.hasOwnProperty('id')).toBe(true);
            expect(settingsResult.name).toBe(settings.name);
            expect(settingsResult.hasOwnProperty('resourceGroupName')).toBe(true);
            expect(settingsResult.hasOwnProperty('subscriptionId')).toBe(true);

            expect(settingsResult.properties.publicIPAllocationMethod).toBe(publicIpAddress.publicIPAllocationMethod);
            expect(settingsResult.properties.publicIPAddressVersion).toBe(publicIpAddress.publicIPAddressVersion);
            expect(settingsResult.properties.idleTimeoutInMinutes).toBe(1);
            expect(settingsResult.properties.dnsSettings).toBeUndefined();
        });

        it('single publicIpAddress without domainNameLabel', () => {
            let settings = _.cloneDeep(publicIpAddress);
            delete settings.domainNameLabel;
            let result = publicIpAddressSettings.transform({
                settings: settings,
                buildingBlockSettings: buildingBlockSettings
            });

            expect(result.publicIpAddresses.length).toBe(1);
            let settingsResult = result.publicIpAddresses[0];
            expect(settingsResult.hasOwnProperty('id')).toBe(true);
            expect(settingsResult.name).toBe(settings.name);
            expect(settingsResult.hasOwnProperty('resourceGroupName')).toBe(true);
            expect(settingsResult.hasOwnProperty('subscriptionId')).toBe(true);

            expect(settingsResult.properties.publicIPAllocationMethod).toBe(publicIpAddress.publicIPAllocationMethod);
            expect(settingsResult.properties.publicIPAddressVersion).toBe(publicIpAddress.publicIPAddressVersion);
            expect(settingsResult.properties.idleTimeoutInMinutes).toBe(1);
            expect(settingsResult.properties.dnsSettings.domainNameLabel).toBeUndefined();
            expect(settingsResult.properties.dnsSettings.reverseFqdn).toBe(publicIpAddress.reverseFqdn);
        });

        it('single publicIpAddress without reverseFqdn', () => {
            let settings = _.cloneDeep(publicIpAddress);
            delete settings.reverseFqdn;
            let result = publicIpAddressSettings.transform({
                settings: settings,
                buildingBlockSettings: buildingBlockSettings
            });

            expect(result.publicIpAddresses.length).toBe(1);
            let settingsResult = result.publicIpAddresses[0];
            expect(settingsResult.hasOwnProperty('id')).toBe(true);
            expect(settingsResult.name).toBe(settings.name);
            expect(settingsResult.hasOwnProperty('resourceGroupName')).toBe(true);
            expect(settingsResult.hasOwnProperty('subscriptionId')).toBe(true);

            expect(settingsResult.properties.publicIPAllocationMethod).toBe(publicIpAddress.publicIPAllocationMethod);
            expect(settingsResult.properties.publicIPAddressVersion).toBe(publicIpAddress.publicIPAddressVersion);
            expect(settingsResult.properties.idleTimeoutInMinutes).toBe(1);
            expect(settingsResult.properties.dnsSettings.domainNameLabel).toBe(publicIpAddress.domainNameLabel);
            expect(settingsResult.properties.dnsSettings.reverseFqdn).toBeUndefined();
        });

        it('array publicIpAddress', () => {
            let settings = _.cloneDeep(publicIpAddress);
            let result = publicIpAddressSettings.transform({
                settings: [settings],
                buildingBlockSettings: buildingBlockSettings
            });

            expect(result.publicIpAddresses.length).toBe(1);
            let settingsResult = result.publicIpAddresses[0];
            expect(settingsResult.hasOwnProperty('id')).toBe(true);
            expect(settingsResult.name).toBe(settings.name);
            expect(settingsResult.hasOwnProperty('resourceGroupName')).toBe(true);
            expect(settingsResult.hasOwnProperty('subscriptionId')).toBe(true);

            expect(settingsResult.properties.publicIPAllocationMethod).toBe(publicIpAddress.publicIPAllocationMethod);
            expect(settingsResult.properties.publicIPAddressVersion).toBe(publicIpAddress.publicIPAddressVersion);
            expect(settingsResult.properties.idleTimeoutInMinutes).toBe(1);
            expect(settingsResult.properties.dnsSettings.domainNameLabel).toBe(publicIpAddress.domainNameLabel);
            expect(settingsResult.properties.dnsSettings.reverseFqdn).toBe(publicIpAddress.reverseFqdn);
        });

        it('test settings validation errors', () => {
            let settings = _.cloneDeep(publicIpAddress);
            delete settings.name;
            expect(() => {
                publicIpAddressSettings.transform({
                    settings: settings,
                    buildingBlockSettings: buildingBlockSettings
                });
            }).toThrow();
        });

        it('test building blocks validation errors', () => {
            let settings = _.cloneDeep(publicIpAddress);
            let bbSettings = _.cloneDeep(buildingBlockSettings);
            delete bbSettings.subscriptionId;
            expect(() => {
                publicIpAddressSettings.transform({
                    settings: settings,
                    buildingBlockSettings: bbSettings
                });
            }).toThrow();
        });
    });
});