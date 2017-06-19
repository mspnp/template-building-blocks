describe('expressRouteCircuitSettings', () => {
    let _ = require('lodash');
    let rewire = require('rewire');
    let ercSettings = rewire('../core/expressRouteCircuitSettings.js');
    let validation = require('../core/validation.js');

    describe('isValidSkuTier', () => {
        let isValidSkuTier = ercSettings.__get__('isValidSkuTier');
        it('undefined', () => {
            expect(isValidSkuTier()).toEqual(false);
        });

        it('null', () => {
            expect(isValidSkuTier(null)).toEqual(false);
        });

        it('empty', () => {
            expect(isValidSkuTier('')).toEqual(false);
        });

        it('whitespace', () => {
            expect(isValidSkuTier(' ')).toEqual(false);
        });

        it('invalid spacing', () => {
            expect(isValidSkuTier(' Standard ')).toEqual(false);
        });

        it('invalid casing', () => {
            expect(isValidSkuTier('standard')).toEqual(false);
        });

        it('invalid value', () => {
            expect(isValidSkuTier('NOT_A_VALID_SKU_TIER')).toEqual(false);
        });

        it('Standard', () => {
            expect(isValidSkuTier('Standard')).toEqual(true);
        });

        it('Premium', () => {
            expect(isValidSkuTier('Premium')).toEqual(true);
        });
    });

    describe('isValidSkuFamily', () => {
        let isValidSkuFamily = ercSettings.__get__('isValidSkuFamily');
        it('undefined', () => {
            expect(isValidSkuFamily()).toEqual(false);
        });

        it('null', () => {
            expect(isValidSkuFamily(null)).toEqual(false);
        });

        it('empty', () => {
            expect(isValidSkuFamily('')).toEqual(false);
        });

        it('whitespace', () => {
            expect(isValidSkuFamily(' ')).toEqual(false);
        });

        it('invalid spacing', () => {
            expect(isValidSkuFamily(' UnlimitedData ')).toEqual(false);
        });

        it('invalid casing', () => {
            expect(isValidSkuFamily('unlimiteddata')).toEqual(false);
        });

        it('invalid value', () => {
            expect(isValidSkuFamily('NOT_A_VALID_SKU_FAMILY')).toEqual(false);
        });

        it('UnlimitedData', () => {
            expect(isValidSkuFamily('UnlimitedData')).toEqual(true);
        });

        it('MeteredData', () => {
            expect(isValidSkuFamily('MeteredData')).toEqual(true);
        });
    });

    describe('validations', () => {
        let ercValidations = ercSettings.__get__('expressRouteCircuitSettingsValidations');
        let expressRouteCircuit = {
            name: 'my-erc',
            skuTier: 'Premium',
            skuFamily: 'MeteredData',
            serviceProviderName: 'Equinix',
            peeringLocation: 'Silicon Valley',
            bandwidthInMbps: 50,
            allowClassicOperations: false
        };

        it('name undefined', () => {
            let settings = _.cloneDeep(expressRouteCircuit);
            delete settings.name;

            let errors = validation.validate({
                settings: settings,
                validations: ercValidations
            });

            expect(errors.length).toEqual(1);
            expect(errors[0].name).toEqual('.name');
        });

        it('name null', () => {
            let settings = _.cloneDeep(expressRouteCircuit);
            settings.name = null;

            let errors = validation.validate({
                settings: settings,
                validations: ercValidations
            });

            expect(errors.length).toEqual(1);
            expect(errors[0].name).toEqual('.name');
        });

        it('name empty', () => {
            let settings = _.cloneDeep(expressRouteCircuit);
            settings.name = '';

            let errors = validation.validate({
                settings: settings,
                validations: ercValidations
            });

            expect(errors.length).toEqual(1);
            expect(errors[0].name).toEqual('.name');
        });

        it('skuTier undefined', () => {
            let settings = _.cloneDeep(expressRouteCircuit);
            delete settings.skuTier;

            let errors = validation.validate({
                settings: settings,
                validations: ercValidations
            });

            expect(errors.length).toEqual(1);
            expect(errors[0].name).toEqual('.skuTier');
        });

        it('skuTier null', () => {
            let settings = _.cloneDeep(expressRouteCircuit);
            settings.skuTier = null;

            let errors = validation.validate({
                settings: settings,
                validations: ercValidations
            });

            expect(errors.length).toEqual(1);
            expect(errors[0].name).toEqual('.skuTier');
        });

        it('skuTier empty', () => {
            let settings = _.cloneDeep(expressRouteCircuit);
            settings.skuTier = '';

            let errors = validation.validate({
                settings: settings,
                validations: ercValidations
            });

            expect(errors.length).toEqual(1);
            expect(errors[0].name).toEqual('.skuTier');
        });

        it('skuFamily undefined', () => {
            let settings = _.cloneDeep(expressRouteCircuit);
            delete settings.skuFamily;

            let errors = validation.validate({
                settings: settings,
                validations: ercValidations
            });

            expect(errors.length).toEqual(1);
            expect(errors[0].name).toEqual('.skuFamily');
        });

        it('skuFamily null', () => {
            let settings = _.cloneDeep(expressRouteCircuit);
            settings.skuFamily = null;

            let errors = validation.validate({
                settings: settings,
                validations: ercValidations
            });

            expect(errors.length).toEqual(1);
            expect(errors[0].name).toEqual('.skuFamily');
        });

        it('skuFamily empty', () => {
            let settings = _.cloneDeep(expressRouteCircuit);
            settings.skuFamily = '';

            let errors = validation.validate({
                settings: settings,
                validations: ercValidations
            });

            expect(errors.length).toEqual(1);
            expect(errors[0].name).toEqual('.skuFamily');
        });

        it('serviceProviderName undefined', () => {
            let settings = _.cloneDeep(expressRouteCircuit);
            delete settings.serviceProviderName;

            let errors = validation.validate({
                settings: settings,
                validations: ercValidations
            });

            expect(errors.length).toEqual(1);
            expect(errors[0].name).toEqual('.serviceProviderName');
        });

        it('serviceProviderName null', () => {
            let settings = _.cloneDeep(expressRouteCircuit);
            settings.serviceProviderName = null;

            let errors = validation.validate({
                settings: settings,
                validations: ercValidations
            });

            expect(errors.length).toEqual(1);
            expect(errors[0].name).toEqual('.serviceProviderName');
        });

        it('serviceProviderName empty', () => {
            let settings = _.cloneDeep(expressRouteCircuit);
            settings.serviceProviderName = '';

            let errors = validation.validate({
                settings: settings,
                validations: ercValidations
            });

            expect(errors.length).toEqual(1);
            expect(errors[0].name).toEqual('.serviceProviderName');
        });

        it('peeringLocation undefined', () => {
            let settings = _.cloneDeep(expressRouteCircuit);
            delete settings.peeringLocation;

            let errors = validation.validate({
                settings: settings,
                validations: ercValidations
            });

            expect(errors.length).toEqual(1);
            expect(errors[0].name).toEqual('.peeringLocation');
        });

        it('peeringLocation null', () => {
            let settings = _.cloneDeep(expressRouteCircuit);
            settings.peeringLocation = null;

            let errors = validation.validate({
                settings: settings,
                validations: ercValidations
            });

            expect(errors.length).toEqual(1);
            expect(errors[0].name).toEqual('.peeringLocation');
        });

        it('peeringLocation empty', () => {
            let settings = _.cloneDeep(expressRouteCircuit);
            settings.peeringLocation = '';

            let errors = validation.validate({
                settings: settings,
                validations: ercValidations
            });

            expect(errors.length).toEqual(1);
            expect(errors[0].name).toEqual('.peeringLocation');
        });

        it('bandwidthInMbps undefined', () => {
            let settings = _.cloneDeep(expressRouteCircuit);
            delete settings.bandwidthInMbps;

            let errors = validation.validate({
                settings: settings,
                validations: ercValidations
            });

            expect(errors.length).toEqual(1);
            expect(errors[0].name).toEqual('.bandwidthInMbps');
        });

        it('bandwidthInMbps null', () => {
            let settings = _.cloneDeep(expressRouteCircuit);
            settings.bandwidthInMbps = null;

            let errors = validation.validate({
                settings: settings,
                validations: ercValidations
            });

            expect(errors.length).toEqual(1);
            expect(errors[0].name).toEqual('.bandwidthInMbps');
        });

        it('bandwidthInMbps string', () => {
            let settings = _.cloneDeep(expressRouteCircuit);
            settings.bandwidthInMbps = '';

            let errors = validation.validate({
                settings: settings,
                validations: ercValidations
            });

            expect(errors.length).toEqual(1);
            expect(errors[0].name).toEqual('.bandwidthInMbps');
        });

        it('allowClassicOperations undefined', () => {
            let settings = _.cloneDeep(expressRouteCircuit);
            delete settings.allowClassicOperations;

            let errors = validation.validate({
                settings: settings,
                validations: ercValidations
            });

            expect(errors.length).toEqual(1);
            expect(errors[0].name).toEqual('.allowClassicOperations');
        });

        it('allowClassicOperations null', () => {
            let settings = _.cloneDeep(expressRouteCircuit);
            settings.allowClassicOperations = null;

            let errors = validation.validate({
                settings: settings,
                validations: ercValidations
            });

            expect(errors.length).toEqual(1);
            expect(errors[0].name).toEqual('.allowClassicOperations');
        });

        it('allowClassicOperations string', () => {
            let settings = _.cloneDeep(expressRouteCircuit);
            settings.allowClassicOperations = '';

            let errors = validation.validate({
                settings: settings,
                validations: ercValidations
            });

            expect(errors.length).toEqual(1);
            expect(errors[0].name).toEqual('.allowClassicOperations');
        });
    });

    describe('merge', () => {
        let ercSettingsDefaults = ercSettings.__get__('expressRouteCircuitSettingsDefaults');

        it('valid', () => {
            let merged = validation.merge([{}], ercSettingsDefaults);
            expect(merged[0].skuTier).toBe('Standard');
            expect(merged[0].skuFamily).toBe('UnlimitedData');
            expect(merged[0].allowClassicOperations).toBe(false);
        });
    });

    describe('transform', () => {
        let expressRouteCircuit = {
            name: 'my-erc',
            skuTier: 'Premium',
            skuFamily: 'MeteredData',
            serviceProviderName: 'Equinix',
            peeringLocation: 'Silicon Valley',
            bandwidthInMbps: 50,
            allowClassicOperations: false
        };

        let buildingBlockSettings = {
            subscriptionId: '00000000-0000-1000-8000-000000000000',
            resourceGroupName: 'test-rg'
        };

        it('single expressRouteCircuit', () => {
            let settings = _.cloneDeep(expressRouteCircuit);
            let result = ercSettings.transform({
                settings: settings,
                buildingBlockSettings: buildingBlockSettings
            });

            expect(result.expressRouteCircuits.length).toBe(1);
            let settingsResult = result.expressRouteCircuits[0];
            expect(settingsResult.hasOwnProperty('id')).toBe(true);
            expect(settingsResult.name).toEqual(settings.name);
            expect(settingsResult.hasOwnProperty('resourceGroupName')).toBe(true);
            expect(settingsResult.hasOwnProperty('subscriptionId')).toBe(true);

            let skuResult = settingsResult.sku;
            expect(skuResult.tier).toEqual(settings.skuTier);
            expect(skuResult.family).toEqual(settings.skuFamily);
            expect(skuResult.name).toEqual(`${settings.skuTier}_${settings.skuFamily}`);

            expect(settingsResult.properties.allowClassicOperations).toEqual(settings.allowClassicOperations);

            let serviceProviderPropertiesResult = settingsResult.properties.serviceProviderProperties;
            expect(serviceProviderPropertiesResult.serviceProviderName).toEqual(settings.serviceProviderName);
            expect(serviceProviderPropertiesResult.peeringLocation).toEqual(settings.peeringLocation);
            expect(serviceProviderPropertiesResult.bandwidthInMbps).toEqual(settings.bandwidthInMbps);
        });

        it('array expressRouteCircuits', () => {
            let settings = _.cloneDeep(expressRouteCircuit);
            let result = ercSettings.transform({
                settings: [settings],
                buildingBlockSettings: buildingBlockSettings
            });

            expect(result.expressRouteCircuits.length).toBe(1);
            let settingsResult = result.expressRouteCircuits[0];
            expect(settingsResult.hasOwnProperty('id')).toBe(true);
            expect(settingsResult.name).toEqual(settings.name);
            expect(settingsResult.hasOwnProperty('resourceGroupName')).toBe(true);
            expect(settingsResult.hasOwnProperty('subscriptionId')).toBe(true);

            let skuResult = settingsResult.sku;
            expect(skuResult.tier).toEqual(settings.skuTier);
            expect(skuResult.family).toEqual(settings.skuFamily);
            expect(skuResult.name).toEqual(`${settings.skuTier}_${settings.skuFamily}`);

            expect(settingsResult.properties.allowClassicOperations).toEqual(settings.allowClassicOperations);

            let serviceProviderPropertiesResult = settingsResult.properties.serviceProviderProperties;
            expect(serviceProviderPropertiesResult.serviceProviderName).toEqual(settings.serviceProviderName);
            expect(serviceProviderPropertiesResult.peeringLocation).toEqual(settings.peeringLocation);
            expect(serviceProviderPropertiesResult.bandwidthInMbps).toEqual(settings.bandwidthInMbps);
        });

        it('test settings validation errors', () => {
            let settings = _.cloneDeep(expressRouteCircuit);
            delete settings.name;
            expect(() => {
                ercSettings.transform({
                    settings: settings,
                    buildingBlockSettings: buildingBlockSettings
                });
            }).toThrow();
        });

        it('test building blocks validation errors', () => {
            let settings = _.cloneDeep(expressRouteCircuit);
            let bbSettings = _.cloneDeep(buildingBlockSettings);
            delete bbSettings.subscriptionId;
            expect(() => {
                ercSettings.transform({
                    settings: settings,
                    buildingBlockSettings: bbSettings
                });
            }).toThrow();
        });
    });
});