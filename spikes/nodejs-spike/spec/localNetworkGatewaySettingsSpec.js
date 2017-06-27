describe('localNetworkGatewaySettings', () => {
    let rewire = require('rewire');
    let localNetworkGatewaySettings = rewire('../core/localNetworkGatewaySettings.js');
    let _ = require('lodash');
    let validation = require('../core/validation.js');

    describe('validations', () => {
        let lgwValidations = localNetworkGatewaySettings.__get__('localNetworkGatewayValidations');
        let localNetworkGateway = {
            name: 'my-lgw',
            ipAddress: '40.50.60.70',
            addressPrefixes: [
                '10.0.1.0/24'
            ]
        };

        it('name undefined', () => {
            let settings = _.cloneDeep(localNetworkGateway);
            delete settings.name;

            let errors = validation.validate({
                settings: settings,
                validations: lgwValidations
            });

            expect(errors.length).toEqual(1);
            expect(errors[0].name).toEqual('.name');
        });

        it('name null', () => {
            let settings = _.cloneDeep(localNetworkGateway);
            settings.name = null;

            let errors = validation.validate({
                settings: settings,
                validations: lgwValidations
            });

            expect(errors.length).toEqual(1);
            expect(errors[0].name).toEqual('.name');
        });

        it('name empty', () => {
            let settings = _.cloneDeep(localNetworkGateway);
            settings.name = '';

            let errors = validation.validate({
                settings: settings,
                validations: lgwValidations
            });

            expect(errors.length).toEqual(1);
            expect(errors[0].name).toEqual('.name');
        });

        it('ipAddress undefined', () => {
            let settings = _.cloneDeep(localNetworkGateway);
            delete settings.ipAddress;

            let errors = validation.validate({
                settings: settings,
                validations: lgwValidations
            });

            expect(errors.length).toEqual(1);
            expect(errors[0].name).toEqual('.ipAddress');
        });

        it('ipAddress null', () => {
            let settings = _.cloneDeep(localNetworkGateway);
            settings.ipAddress = null;

            let errors = validation.validate({
                settings: settings,
                validations: lgwValidations
            });

            expect(errors.length).toEqual(1);
            expect(errors[0].name).toEqual('.ipAddress');
        });

        it('addressPrefixes undefined', () => {
            let settings = _.cloneDeep(localNetworkGateway);
            delete settings.addressPrefixes;

            let errors = validation.validate({
                settings: settings,
                validations: lgwValidations
            });

            expect(errors.length).toEqual(1);
            expect(errors[0].name).toEqual('.addressPrefixes');
        });

        it('addressPrefixes null', () => {
            let settings = _.cloneDeep(localNetworkGateway);
            settings.addressPrefixes = null;

            let errors = validation.validate({
                settings: settings,
                validations: lgwValidations
            });

            expect(errors.length).toEqual(1);
            expect(errors[0].name).toEqual('.addressPrefixes');
        });

        it('addressPrefixes empty', () => {
            let settings = _.cloneDeep(localNetworkGateway);
            settings.addressPrefixes = [];

            let errors = validation.validate({
                settings: settings,
                validations: lgwValidations
            });

            expect(errors.length).toEqual(1);
            expect(errors[0].name).toEqual('.addressPrefixes');
        });

        it('addressPrefixes invalid', () => {
            let settings = _.cloneDeep(localNetworkGateway);
            settings.addressPrefixes = [
                'NOT_VALID'
            ];

            let errors = validation.validate({
                settings: settings,
                validations: lgwValidations
            });

            expect(errors.length).toEqual(1);
            expect(errors[0].name).toEqual('.addressPrefixes');
        });

        it('Valid', () => {
            let settings = _.cloneDeep(localNetworkGateway);

            let errors = validation.validate({
                settings: settings,
                validations: lgwValidations
            });

            expect(errors.length).toEqual(0);
        });
    });

    describe('transform', () => {
        let localNetworkGateway = {
            name: 'my-lgw',
            ipAddress: '40.50.60.70',
            addressPrefixes: [
                '10.0.1.0/24'
            ],
            bgpSettings: {
                asn: 1,
                bgpPeeringAddress: 'bgp-peering-address',
                peerWeight: 10
            }
        };

        let buildingBlockSettings = {
            subscriptionId: '00000000-0000-1000-8000-000000000000',
            resourceGroupName: 'test-rg'
        };

        it('single localNetworkGateway without bgpSettings', () => {
            let settings = _.cloneDeep(localNetworkGateway);
            delete settings.bgpSettings;
            let result = localNetworkGatewaySettings.transform({
                settings: settings,
                buildingBlockSettings: buildingBlockSettings
            });

            expect(result.localNetworkGateways.length).toBe(1);
            let settingsResult = result.localNetworkGateways[0];
            expect(settingsResult.hasOwnProperty('id')).toBe(true);
            expect(settingsResult.name).toBe(settings.name);
            expect(settingsResult.hasOwnProperty('resourceGroupName')).toBe(true);
            expect(settingsResult.hasOwnProperty('subscriptionId')).toBe(true);

            expect(settingsResult.properties.ipAddress).toBe(localNetworkGateway.gatewayIpAddress);
            expect(settingsResult.properties.localNetworkAddressSpace.addressPrefixes[0]).toBe(localNetworkGateway.addressPrefixes[0]);
        });

        it('array localNetworkGateway', () => {
            let settings = _.cloneDeep(localNetworkGateway);
            let result = localNetworkGatewaySettings.transform({
                settings: [settings],
                buildingBlockSettings: buildingBlockSettings
            });

            expect(result.localNetworkGateways.length).toBe(1);
            let settingsResult = result.localNetworkGateways[0];
            expect(settingsResult.hasOwnProperty('id')).toBe(true);
            expect(settingsResult.name).toBe(settings.name);
            expect(settingsResult.hasOwnProperty('resourceGroupName')).toBe(true);
            expect(settingsResult.hasOwnProperty('subscriptionId')).toBe(true);

            expect(settingsResult.properties.ipAddress).toBe(localNetworkGateway.gatewayIpAddress);
            expect(settingsResult.properties.localNetworkAddressSpace.addressPrefixes[0]).toBe(localNetworkGateway.addressPrefixes[0]);
        });

        it('single localNetworkGateway with bgpSettings', () => {
            let settings = _.cloneDeep(localNetworkGateway);
            let result = localNetworkGatewaySettings.transform({
                settings: settings,
                buildingBlockSettings: buildingBlockSettings
            });

            expect(result.localNetworkGateways.length).toBe(1);
            let settingsResult = result.localNetworkGateways[0];
            expect(settingsResult.hasOwnProperty('id')).toBe(true);
            expect(settingsResult.name).toBe(settings.name);
            expect(settingsResult.hasOwnProperty('resourceGroupName')).toBe(true);
            expect(settingsResult.hasOwnProperty('subscriptionId')).toBe(true);

            expect(settingsResult.properties.ipAddress).toBe(localNetworkGateway.gatewayIpAddress);
            expect(settingsResult.properties.localNetworkAddressSpace.addressPrefixes[0]).toBe(localNetworkGateway.addressPrefixes[0]);
            expect(settingsResult.properties.bgpSettings.asn).toBe(1);
            expect(settingsResult.properties.bgpSettings.bgpPeeringAddress).toBe('bgp-peering-address');
            expect(settingsResult.properties.bgpSettings.peerWeight).toBe(10);
        });

        it('single localNetworkGateway with bgpSettings without asn', () => {
            let settings = _.cloneDeep(localNetworkGateway);
            delete settings.bgpSettings.asn;
            let result = localNetworkGatewaySettings.transform({
                settings: settings,
                buildingBlockSettings: buildingBlockSettings
            });

            expect(result.localNetworkGateways.length).toBe(1);
            let settingsResult = result.localNetworkGateways[0];
            expect(settingsResult.hasOwnProperty('id')).toBe(true);
            expect(settingsResult.name).toBe(settings.name);
            expect(settingsResult.hasOwnProperty('resourceGroupName')).toBe(true);
            expect(settingsResult.hasOwnProperty('subscriptionId')).toBe(true);

            expect(settingsResult.properties.ipAddress).toBe(localNetworkGateway.gatewayIpAddress);
            expect(settingsResult.properties.localNetworkAddressSpace.addressPrefixes[0]).toBe(localNetworkGateway.addressPrefixes[0]);
            expect(settingsResult.properties.bgpSettings.asn).toBeUndefined();
            expect(settingsResult.properties.bgpSettings.bgpPeeringAddress).toBe('bgp-peering-address');
            expect(settingsResult.properties.bgpSettings.peerWeight).toBe(10);
        });

        it('single localNetworkGateway with bgpSettings without bgpPeeringAddress', () => {
            let settings = _.cloneDeep(localNetworkGateway);
            delete settings.bgpSettings.bgpPeeringAddress;
            let result = localNetworkGatewaySettings.transform({
                settings: settings,
                buildingBlockSettings: buildingBlockSettings
            });

            expect(result.localNetworkGateways.length).toBe(1);
            let settingsResult = result.localNetworkGateways[0];
            expect(settingsResult.hasOwnProperty('id')).toBe(true);
            expect(settingsResult.name).toBe(settings.name);
            expect(settingsResult.hasOwnProperty('resourceGroupName')).toBe(true);
            expect(settingsResult.hasOwnProperty('subscriptionId')).toBe(true);

            expect(settingsResult.properties.ipAddress).toBe(localNetworkGateway.gatewayIpAddress);
            expect(settingsResult.properties.localNetworkAddressSpace.addressPrefixes[0]).toBe(localNetworkGateway.addressPrefixes[0]);
            expect(settingsResult.properties.bgpSettings.asn).toBe(1);
            expect(settingsResult.properties.bgpSettings.bgpPeeringAddress).toBeUndefined();
            expect(settingsResult.properties.bgpSettings.peerWeight).toBe(10);
        });

        it('single localNetworkGateway with bgpSettings without peerWeight', () => {
            let settings = _.cloneDeep(localNetworkGateway);
            delete settings.bgpSettings.peerWeight;
            let result = localNetworkGatewaySettings.transform({
                settings: settings,
                buildingBlockSettings: buildingBlockSettings
            });

            expect(result.localNetworkGateways.length).toBe(1);
            let settingsResult = result.localNetworkGateways[0];
            expect(settingsResult.hasOwnProperty('id')).toBe(true);
            expect(settingsResult.name).toBe(settings.name);
            expect(settingsResult.hasOwnProperty('resourceGroupName')).toBe(true);
            expect(settingsResult.hasOwnProperty('subscriptionId')).toBe(true);

            expect(settingsResult.properties.ipAddress).toBe(localNetworkGateway.gatewayIpAddress);
            expect(settingsResult.properties.localNetworkAddressSpace.addressPrefixes[0]).toBe(localNetworkGateway.addressPrefixes[0]);
            expect(settingsResult.properties.bgpSettings.asn).toBe(1);
            expect(settingsResult.properties.bgpSettings.bgpPeeringAddress).toBe('bgp-peering-address');
            expect(settingsResult.properties.bgpSettings.peerWeight).toBeUndefined();
        });

        it('test settings validation errors', () => {
            let settings = _.cloneDeep(localNetworkGateway);
            delete settings.name;
            expect(() => {
                localNetworkGatewaySettings.transform({
                    settings: settings,
                    buildingBlockSettings: buildingBlockSettings
                });
            }).toThrow();
        });

        it('test building blocks validation errors', () => {
            let settings = _.cloneDeep(localNetworkGateway);
            let bbSettings = _.cloneDeep(buildingBlockSettings);
            delete bbSettings.subscriptionId;
            expect(() => {
                localNetworkGatewaySettings.transform({
                    settings: settings,
                    buildingBlockSettings: bbSettings
                });
            }).toThrow();
        });
    });
});