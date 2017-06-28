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

        describe('bgpSettings', () => {
            let localNetworkGatewaySettingsWithBgp = _.cloneDeep(localNetworkGateway);
            localNetworkGatewaySettingsWithBgp.bgpSettings = {
                asn: 1,
                bgpPeeringAddress: 'bgp-peering-address',
                peerWeight: 10
            };

            it('asn undefined', () => {
                let settings = _.cloneDeep(localNetworkGatewaySettingsWithBgp);
                delete settings.bgpSettings.asn;
                let errors = validation.validate({
                    settings: settings,
                    validations: lgwValidations
                });

                expect(errors.length).toEqual(0);
            });

            it('asn null', () => {
                let settings = _.cloneDeep(localNetworkGatewaySettingsWithBgp);
                settings.bgpSettings.asn = null;
                let errors = validation.validate({
                    settings: settings,
                    validations: lgwValidations
                });

                expect(errors.length).toEqual(0);
            });

            it('asn invalid', () => {
                let settings = _.cloneDeep(localNetworkGatewaySettingsWithBgp);
                settings.bgpSettings.asn = 'NOT_VALID';
                let errors = validation.validate({
                    settings: settings,
                    validations: lgwValidations
                });

                expect(errors.length).toEqual(1);
                expect(errors[0].name).toEqual('.bgpSettings.asn');
            });

            it('bgpPeeringAddress undefined', () => {
                let settings = _.cloneDeep(localNetworkGatewaySettingsWithBgp);
                delete settings.bgpSettings.bgpPeeringAddress;
                let errors = validation.validate({
                    settings: settings,
                    validations: lgwValidations
                });

                expect(errors.length).toEqual(0);
            });

            it('bgpPeeringAddress null', () => {
                let settings = _.cloneDeep(localNetworkGatewaySettingsWithBgp);
                settings.bgpSettings.bgpPeeringAddress = null;
                let errors = validation.validate({
                    settings: settings,
                    validations: lgwValidations
                });

                expect(errors.length).toEqual(0);
            });

            it('bgpPeeringAddress empty', () => {
                let settings = _.cloneDeep(localNetworkGatewaySettingsWithBgp);
                settings.bgpSettings.bgpPeeringAddress = '';
                let errors = validation.validate({
                    settings: settings,
                    validations: lgwValidations
                });

                expect(errors.length).toEqual(1);
                expect(errors[0].name).toEqual('.bgpSettings.bgpPeeringAddress');
            });

            it('bgpPeeringAddress only whitespace', () => {
                let settings = _.cloneDeep(localNetworkGatewaySettingsWithBgp);
                settings.bgpSettings.bgpPeeringAddress = '   ';
                let errors = validation.validate({
                    settings: settings,
                    validations: lgwValidations
                });

                expect(errors.length).toEqual(1);
                expect(errors[0].name).toEqual('.bgpSettings.bgpPeeringAddress');
            });

            it('peerWeight undefined', () => {
                let settings = _.cloneDeep(localNetworkGatewaySettingsWithBgp);
                delete settings.bgpSettings.peerWeight;
                let errors = validation.validate({
                    settings: settings,
                    validations: lgwValidations
                });

                expect(errors.length).toEqual(0);
            });

            it('peerWeight null', () => {
                let settings = _.cloneDeep(localNetworkGatewaySettingsWithBgp);
                settings.bgpSettings.peerWeight = null;
                let errors = validation.validate({
                    settings: settings,
                    validations: lgwValidations
                });

                expect(errors.length).toEqual(0);
            });

            it('peerWeight invalid', () => {
                let settings = _.cloneDeep(localNetworkGatewaySettingsWithBgp);
                settings.bgpSettings.peerWeight = 'NOT_VALID';
                let errors = validation.validate({
                    settings: settings,
                    validations: lgwValidations
                });

                expect(errors.length).toEqual(1);
                expect(errors[0].name).toEqual('.bgpSettings.peerWeight');
            });
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

    describe('merge', () => {
        let merge = localNetworkGatewaySettings.__get__('merge');
        let localNetworkGatewayDefaults = localNetworkGatewaySettings.__get__('LOCALNETWORKGATEWAY_SETTINGS_DEFAULTS');

        let buildingBlockSettings = {
            subscriptionId: '00000000-0000-1000-8000-000000000000',
            resourceGroupName: 'test-vnet-rg',
            location: 'westus'
        };

        it('defaults merged', () => {
            let result = merge({
                settings: {},
                buildingBlockSettings: buildingBlockSettings
            });

            // Remove the resources information so we can compare
            delete result.subscriptionId;
            delete result.resourceGroupName;
            delete result.location;
            expect(result).toEqual(localNetworkGatewayDefaults);
        });

        it('setupResources', () => {
            let result = merge({
                settings: {},
                buildingBlockSettings: buildingBlockSettings
            });

            expect(result.subscriptionId).toEqual(buildingBlockSettings.subscriptionId);
            expect(result.resourceGroupName).toEqual(buildingBlockSettings.resourceGroupName);
            expect(result.location).toEqual(buildingBlockSettings.location);
        });
    });

    if (global.testConfiguration.runTransform) {
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
                resourceGroupName: 'test-rg',
                location: 'westus2'
            };

            it('single localNetworkGateway without bgpSettings', () => {
                let settings = _.cloneDeep(localNetworkGateway);
                delete settings.bgpSettings;
                let merged = localNetworkGatewaySettings.merge({
                    settings: settings,
                    buildingBlockSettings: buildingBlockSettings
                });
                let result = localNetworkGatewaySettings.transform(merged);
                expect(result.name).toEqual(settings.name);
                expect(result.subscriptionId).toEqual(buildingBlockSettings.subscriptionId);
                expect(result.resourceGroupName).toEqual(buildingBlockSettings.resourceGroupName);
                expect(result.location).toEqual(buildingBlockSettings.location);
                expect(result.properties.ipAddress).toEqual(localNetworkGateway.gatewayIpAddress);
                expect(result.properties.localNetworkAddressSpace.addressPrefixes[0]).toEqual(localNetworkGateway.addressPrefixes[0]);
            });

            it('array localNetworkGateway', () => {
                let settings = _.cloneDeep(localNetworkGateway);
                let merged = localNetworkGatewaySettings.merge({
                    settings: settings, 
                    buildingBlockSettings: buildingBlockSettings
                });

                let result = localNetworkGatewaySettings.transform(merged);

                expect(result.localNetworkGateways.length).toBe(1);
                let settingsResult = result.localNetworkGateways[0];
                expect(settingsResult.hasOwnProperty('id')).toBe(true);
                expect(settingsResult.name).toBe(settings.name);
                expect(settingsResult.hasOwnProperty('resourceGroupName')).toBe(true);
                expect(settingsResult.hasOwnProperty('subscriptionId')).toBe(true);

                expect(settingsResult.properties.ipAddress).toBe(localNetworkGateway.gatewayIpAddress);
                expect(settingsResult.properties.localNetworkAddressSpace.addressPrefixes[0]).toBe(localNetworkGateway.addressPrefixes[0]);


                expect(() => {
                    localNetworkGatewaySettings.transform({
                        settings: [settings],
                        buildingBlockSettings: buildingBlockSettings
                    });
                }).toThrow();
            });

            it('single localNetworkGateway with bgpSettings', () => {
                let settings = _.cloneDeep(localNetworkGateway);
                let merged = localNetworkGatewaySettings.merge({
                    settings: settings,
                    buildingBlockSettings: buildingBlockSettings
                });
                let result = localNetworkGatewaySettings.transform(merged);
                expect(result.name).toEqual(settings.name);
                expect(result.subscriptionId).toEqual(buildingBlockSettings.subscriptionId);
                expect(result.resourceGroupName).toEqual(buildingBlockSettings.resourceGroupName);
                expect(result.location).toEqual(buildingBlockSettings.location);

                expect(result.properties.ipAddress).toEqual(localNetworkGateway.gatewayIpAddress);
                expect(result.properties.localNetworkAddressSpace.addressPrefixes[0]).toBe(localNetworkGateway.addressPrefixes[0]);
                expect(result.properties.bgpSettings.asn).toEqual(localNetworkGateway.bgpSettings.asn);
                expect(result.properties.bgpSettings.bgpPeeringAddress).toEqual(localNetworkGateway.bgpSettings.bgpPeeringAddress);
                expect(result.properties.bgpSettings.peerWeight).toEqual(localNetworkGateway.bgpSettings.peerWeight);
            });

            it('single localNetworkGateway with bgpSettings without asn', () => {
                let settings = _.cloneDeep(localNetworkGateway);
                delete settings.bgpSettings.asn;
                let merged = localNetworkGatewaySettings.merge({
                    settings: settings,
                    buildingBlockSettings: buildingBlockSettings
                });
                let result = localNetworkGatewaySettings.transform(merged);
                expect(result.name).toEqual(settings.name);
                expect(result.subscriptionId).toEqual(buildingBlockSettings.subscriptionId);
                expect(result.resourceGroupName).toEqual(buildingBlockSettings.resourceGroupName);
                expect(result.location).toEqual(buildingBlockSettings.location);

                expect(result.properties.ipAddress).toEqual(localNetworkGateway.gatewayIpAddress);
                expect(result.properties.localNetworkAddressSpace.addressPrefixes[0]).toBe(localNetworkGateway.addressPrefixes[0]);
                expect(result.properties.bgpSettings.asn).toBeUndefined();
                expect(result.properties.bgpSettings.bgpPeeringAddress).toEqual(localNetworkGateway.bgpSettings.bgpPeeringAddress);
                expect(result.properties.bgpSettings.peerWeight).toEqual(localNetworkGateway.bgpSettings.peerWeight);
            });

            it('single localNetworkGateway with bgpSettings without bgpPeeringAddress', () => {
                let settings = _.cloneDeep(localNetworkGateway);
                delete settings.bgpSettings.bgpPeeringAddress;
                let merged = localNetworkGatewaySettings.merge({
                    settings: settings,
                    buildingBlockSettings: buildingBlockSettings
                });
                let result = localNetworkGatewaySettings.transform(merged);
                expect(result.name).toEqual(settings.name);
                expect(result.subscriptionId).toEqual(buildingBlockSettings.subscriptionId);
                expect(result.resourceGroupName).toEqual(buildingBlockSettings.resourceGroupName);
                expect(result.location).toEqual(buildingBlockSettings.location);

                expect(result.properties.ipAddress).toEqual(localNetworkGateway.gatewayIpAddress);
                expect(result.properties.localNetworkAddressSpace.addressPrefixes[0]).toBe(localNetworkGateway.addressPrefixes[0]);
                expect(result.properties.bgpSettings.asn).toEqual(localNetworkGateway.bgpSettings.asn);
                expect(result.properties.bgpSettings.bgpPeeringAddress).toBeUndefined();
                expect(result.properties.bgpSettings.peerWeight).toEqual(localNetworkGateway.bgpSettings.peerWeight);
            });

            it('single localNetworkGateway with bgpSettings without peerWeight', () => {
                let settings = _.cloneDeep(localNetworkGateway);
                delete settings.bgpSettings.peerWeight;
                let merged = localNetworkGatewaySettings.merge({
                    settings: settings,
                    buildingBlockSettings: buildingBlockSettings
                });
                let result = localNetworkGatewaySettings.transform(merged);
                expect(result.name).toEqual(settings.name);
                expect(result.subscriptionId).toEqual(buildingBlockSettings.subscriptionId);
                expect(result.resourceGroupName).toEqual(buildingBlockSettings.resourceGroupName);
                expect(result.location).toEqual(buildingBlockSettings.location);

                expect(result.properties.ipAddress).toEqual(localNetworkGateway.gatewayIpAddress);
                expect(result.properties.localNetworkAddressSpace.addressPrefixes[0]).toBe(localNetworkGateway.addressPrefixes[0]);
                expect(result.properties.bgpSettings.asn).toEqual(localNetworkGateway.bgpSettings.asn);
                expect(result.properties.bgpSettings.bgpPeeringAddress).toEqual(localNetworkGateway.bgpSettings.bgpPeeringAddress);
                expect(result.properties.bgpSettings.peerWeight).toBeUndefined();
            });
        });
    }
});