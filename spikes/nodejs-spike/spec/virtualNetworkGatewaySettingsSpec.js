describe('virtualNetworkGatewaySettings', () => {
    let rewire = require('rewire');
    let virtualNetworkGatewaySettings = rewire('../core/virtualNetworkGatewaySettings.js');
    let _ = require('lodash');
    let validation = require('../core/validation.js');

    describe('isValidGatewayType', () => {
        let isValidGatewayType = virtualNetworkGatewaySettings.__get__('isValidGatewayType');
        
        it('undefined', () => {
            expect(isValidGatewayType()).toEqual(false);
        });

        it('null', () => {
            expect(isValidGatewayType(null)).toEqual(false);
        });

        it('empty', () => {
            expect(isValidGatewayType('')).toEqual(false);
        });

        it('whitespace', () => {
            expect(isValidGatewayType(' ')).toEqual(false);
        });

        it('invalid spacing', () => {
            expect(isValidGatewayType(' Vpn ')).toEqual(false);
        });

        it('invalid casing', () => {
            expect(isValidGatewayType('vpn')).toEqual(false);
        });

        it('invalid value', () => {
            expect(isValidGatewayType('NOT_A_VALID_GATEWAY_TYPE')).toEqual(false);
        });

        it('Vpn', () => {
            expect(isValidGatewayType('Vpn')).toEqual(true);
        });

        it('ExpressRoute', () => {
            expect(isValidGatewayType('ExpressRoute')).toEqual(true);
        });
    });

    describe('isValidVpnType', () => {
        let isValidVpnType = virtualNetworkGatewaySettings.__get__('isValidVpnType');
        
        it('undefined', () => {
            expect(isValidVpnType()).toEqual(false);
        });

        it('null', () => {
            expect(isValidVpnType(null)).toEqual(false);
        });

        it('empty', () => {
            expect(isValidVpnType('')).toEqual(false);
        });

        it('whitespace', () => {
            expect(isValidVpnType(' ')).toEqual(false);
        });

        it('invalid spacing', () => {
            expect(isValidVpnType(' PolicyBased ')).toEqual(false);
        });

        it('invalid casing', () => {
            expect(isValidVpnType('policybased')).toEqual(false);
        });

        it('invalid value', () => {
            expect(isValidVpnType('NOT_A_VALID_VPN_TYPE')).toEqual(false);
        });

        it('PolicyBased', () => {
            expect(isValidVpnType('PolicyBased')).toEqual(true);
        });

        it('RouteBased', () => {
            expect(isValidVpnType('RouteBased')).toEqual(true);
        });
    });

    describe('isValidSku', () => {
        let isValidSku = virtualNetworkGatewaySettings.__get__('isValidSku');
        
        it('undefined', () => {
            expect(isValidSku()).toEqual(false);
        });

        it('null', () => {
            expect(isValidSku(null)).toEqual(false);
        });

        it('empty', () => {
            expect(isValidSku('')).toEqual(false);
        });

        it('whitespace', () => {
            expect(isValidSku(' ')).toEqual(false);
        });

        it('invalid spacing', () => {
            expect(isValidSku(' Basic ')).toEqual(false);
        });

        it('invalid casing', () => {
            expect(isValidSku('basic')).toEqual(false);
        });

        it('invalid value', () => {
            expect(isValidSku('NOT_VALID')).toEqual(false);
        });

        it('Basic', () => {
            expect(isValidSku('Basic')).toEqual(true);
        });

        it('VpnGw1', () => {
            expect(isValidSku('VpnGw1')).toEqual(true);
        });

        it('VpnGw2', () => {
            expect(isValidSku('VpnGw2')).toEqual(true);
        });

        it('VpnGw3', () => {
            expect(isValidSku('VpnGw3')).toEqual(true);
        });
    });

    describe('validations', () => {
        let vngValidations = virtualNetworkGatewaySettings.__get__('virtualNetworkGatewaySettingsValidations');

        describe('bgpSettings', () => {
            let bgpValidations = vngValidations.bgpSettings;
            let bgpSettings = {
                asn: 1,
                bgpPeeringAddress: 'bgp-peering-address',
                peerWeight: 10
            };

            it('asn undefined', () => {
                let settings = _.cloneDeep(bgpSettings);
                delete settings.asn;

                let errors = validation.validate({
                    settings: settings,
                    validations: bgpValidations
                });

                expect(errors.length).toEqual(0);
            });

            it('asn null', () => {
                let settings = _.cloneDeep(bgpSettings);
                settings.asn = null;

                let errors = validation.validate({
                    settings: settings,
                    validations: bgpValidations
                });

                expect(errors.length).toEqual(0);
            });

            it('asn invalid', () => {
                let settings = _.cloneDeep(bgpSettings);
                settings.asn = 'asn';

                let errors = validation.validate({
                    settings: settings,
                    validations: bgpValidations
                });

                expect(errors.length).toEqual(1);
                expect(errors[0].name).toBe('.asn');
            });

            it('bgpPeeringAddress undefined', () => {
                let settings = _.cloneDeep(bgpSettings);
                delete settings.bgpPeeringAddress;

                let errors = validation.validate({
                    settings: settings,
                    validations: bgpValidations
                });

                expect(errors.length).toEqual(0);
            });

            it('bgpPeeringAddress null', () => {
                let settings = _.cloneDeep(bgpSettings);
                settings.bgpPeeringAddress = null;

                let errors = validation.validate({
                    settings: settings,
                    validations: bgpValidations
                });

                expect(errors.length).toEqual(0);
            });

            it('bgpPeeringAddress empty', () => {
                let settings = _.cloneDeep(bgpSettings);
                settings.bgpPeeringAddress = '';

                let errors = validation.validate({
                    settings: settings,
                    validations: bgpValidations
                });

                expect(errors.length).toEqual(1);
                expect(errors[0].name).toBe('.bgpPeeringAddress');
            });

            it('bgpPeeringAddress whitespace', () => {
                let settings = _.cloneDeep(bgpSettings);
                settings.bgpPeeringAddress = '   ';

                let errors = validation.validate({
                    settings: settings,
                    validations: bgpValidations
                });

                expect(errors.length).toEqual(1);
                expect(errors[0].name).toBe('.bgpPeeringAddress');
            });

            it('peerWeight undefined', () => {
                let settings = _.cloneDeep(bgpSettings);
                delete settings.peerWeight;

                let errors = validation.validate({
                    settings: settings,
                    validations: bgpValidations
                });

                expect(errors.length).toEqual(0);
            });

            it('peerWeight null', () => {
                let settings = _.cloneDeep(bgpSettings);
                settings.peerWeight = null;

                let errors = validation.validate({
                    settings: settings,
                    validations: bgpValidations
                });

                expect(errors.length).toEqual(0);
            });

            it('peerWeight invalid', () => {
                let settings = _.cloneDeep(bgpSettings);
                settings.peerWeight = 'peerWeight';

                let errors = validation.validate({
                    settings: settings,
                    validations: bgpValidations
                });

                expect(errors.length).toEqual(1);
                expect(errors[0].name).toBe('.peerWeight');
            });
        });

        describe('virtualNetworkGatewaySettings', () => {
            let vngSettings = {
                name: 'bb-hybrid-vpn-vgw',
                subscriptionId: '00000000-0000-1000-8000-000000000000',
                resourceGroupName: 'test-rg',
                gatewayType: 'Vpn',
                vpnType: 'RouteBased',
                sku: 'VpnGw1',
                isPublic: true,
                publicIpAddressVersion: 'IPv4',
                virtualNetwork: {
                    name: 'my-virtual-network',
                    subscriptionId: '00000000-0000-1000-8000-000000000000',
                    resourceGroupName: 'test-rg'
                },
                enableBgp: false
            };

            it('name undefined', () => {
                let settings = _.cloneDeep(vngSettings);
                delete settings.name;

                let errors = validation.validate({
                    settings: settings,
                    validations: vngValidations
                });

                expect(errors.length).toEqual(1);
                expect(errors[0].name).toEqual('.name');
            });

            it('name null', () => {
                let settings = _.cloneDeep(vngSettings);
                settings.name = null;

                let errors = validation.validate({
                    settings: settings,
                    validations: vngValidations
                });

                expect(errors.length).toEqual(1);
                expect(errors[0].name).toEqual('.name');
            });

            it('name empty', () => {
                let settings = _.cloneDeep(vngSettings);
                settings.name = '';

                let errors = validation.validate({
                    settings: settings,
                    validations: vngValidations
                });

                expect(errors.length).toEqual(1);
                expect(errors[0].name).toEqual('.name');
            });

            it('subscriptionId undefined', () => {
                let settings = _.cloneDeep(vngSettings);
                delete settings.subscriptionId;

                let errors = validation.validate({
                    settings: settings,
                    validations: vngValidations
                });

                expect(errors.length).toEqual(2);
                expect(errors[0].name).toEqual('.subscriptionId');
                expect(errors[1].name).toEqual('.virtualNetwork');
            });

            it('subscriptionId null', () => {
                let settings = _.cloneDeep(vngSettings);
                settings.subscriptionId = null;

                let errors = validation.validate({
                    settings: settings,
                    validations: vngValidations
                });

                expect(errors.length).toEqual(2);
                expect(errors[0].name).toEqual('.subscriptionId');
                expect(errors[1].name).toEqual('.virtualNetwork');
            });

            it('subscriptionId empty', () => {
                let settings = _.cloneDeep(vngSettings);
                settings.subscriptionId = '';

                let errors = validation.validate({
                    settings: settings,
                    validations: vngValidations
                });

                expect(errors.length).toEqual(2);
                expect(errors[0].name).toEqual('.subscriptionId');
                expect(errors[1].name).toEqual('.virtualNetwork');
            });

            it('resourceGroupName undefined', () => {
                let settings = _.cloneDeep(vngSettings);
                delete settings.resourceGroupName;

                let errors = validation.validate({
                    settings: settings,
                    validations: vngValidations
                });

                expect(errors.length).toEqual(2);
                expect(errors[0].name).toEqual('.resourceGroupName');
                expect(errors[1].name).toEqual('.virtualNetwork');
            });

            it('resourceGroupName null', () => {
                let settings = _.cloneDeep(vngSettings);
                settings.resourceGroupName = null;

                let errors = validation.validate({
                    settings: settings,
                    validations: vngValidations
                });

                expect(errors.length).toEqual(2);
                expect(errors[0].name).toEqual('.resourceGroupName');
                expect(errors[1].name).toEqual('.virtualNetwork');
            });

            it('resourceGroupName empty', () => {
                let settings = _.cloneDeep(vngSettings);
                settings.resourceGroupName = '';

                let errors = validation.validate({
                    settings: settings,
                    validations: vngValidations
                });

                expect(errors.length).toEqual(2);
                expect(errors[0].name).toEqual('.resourceGroupName');
                expect(errors[1].name).toEqual('.virtualNetwork');
            });
            
            

            it('gatewayType undefined', () => {
                let settings = _.cloneDeep(vngSettings);
                delete settings.gatewayType;

                let errors = validation.validate({
                    settings: settings,
                    validations: vngValidations
                });

                expect(errors.length).toEqual(1);
                expect(errors[0].name).toEqual('.gatewayType');
            });

            it('gatewayType null', () => {
                let settings = _.cloneDeep(vngSettings);
                settings.gatewayType = null;

                let errors = validation.validate({
                    settings: settings,
                    validations: vngValidations
                });

                expect(errors.length).toEqual(1);
                expect(errors[0].name).toEqual('.gatewayType');
            });

            it('gatewayType undefined', () => {
                let settings = _.cloneDeep(vngSettings);
                delete settings.gatewayType;

                let errors = validation.validate({
                    settings: settings,
                    validations: vngValidations
                });

                expect(errors.length).toEqual(1);
                expect(errors[0].name).toEqual('.gatewayType');
            });

            it('vpnType undefined', () => {
                let settings = _.cloneDeep(vngSettings);
                delete settings.vpnType;

                let errors = validation.validate({
                    settings: settings,
                    validations: vngValidations
                });

                expect(errors.length).toEqual(1);
                expect(errors[0].name).toEqual('.vpnType');
            });

            it('vpnType null', () => {
                let settings = _.cloneDeep(vngSettings);
                settings.vpnType = null;

                let errors = validation.validate({
                    settings: settings,
                    validations: vngValidations
                });

                expect(errors.length).toEqual(1);
                expect(errors[0].name).toEqual('.vpnType');
            });

            it('sku undefined', () => {
                let settings = _.cloneDeep(vngSettings);
                delete settings.sku;

                let errors = validation.validate({
                    settings: settings,
                    validations: vngValidations
                });

                expect(errors.length).toEqual(1);
                expect(errors[0].name).toEqual('.sku');
            });

            it('sku null', () => {
                let settings = _.cloneDeep(vngSettings);
                settings.sku = null;

                let errors = validation.validate({
                    settings: settings,
                    validations: vngValidations
                });

                expect(errors.length).toEqual(1);
                expect(errors[0].name).toEqual('.sku');
            });

            it('isPublic undefined', () => {
                let settings = _.cloneDeep(vngSettings);
                delete settings.isPublic;

                let errors = validation.validate({
                    settings: settings,
                    validations: vngValidations
                });

                expect(errors.length).toEqual(1);
                expect(errors[0].name).toEqual('.isPublic');
            });

            it('isPublic null', () => {
                let settings = _.cloneDeep(vngSettings);
                settings.isPublic = null;

                let errors = validation.validate({
                    settings: settings,
                    validations: vngValidations
                });

                expect(errors.length).toEqual(1);
                expect(errors[0].name).toBe('.isPublic');
            });

            it('isPublic true', () => {
                let settings = _.cloneDeep(vngSettings);
                // Merge will set this
                settings.publicIpAddress = {
                    name: `${settings.name}-pip`,
                    subscriptionId: '00000000-0000-1000-8000-000000000000',
                    resourceGroupName: 'test-rg',
                    publicIPAllocationMethod: 'Static',
                    publicIPAddressVersion: 'IPv4'
                };

                let errors = validation.validate({
                    settings: settings,
                    validations: vngValidations
                });

                expect(errors.length).toEqual(0);
            });

            it('isPublic true with invalid address version', () => {
                let settings = _.cloneDeep(vngSettings);
                // Merge will set this
                settings.publicIpAddress = {
                    name: `${settings.name}-pip`,
                    subscriptionId: '00000000-0000-1000-8000-000000000000',
                    resourceGroupName: 'test-rg',
                    publicIPAllocationMethod: 'Static',
                    publicIPAddressVersion: 'INVALID_VALUE'
                };

                let errors = validation.validate({
                    settings: settings,
                    validations: vngValidations
                });

                expect(errors.length).toEqual(1);
                expect(errors[0].name).toBe('.publicIpAddress.publicIPAddressVersion');
            });

            it('isPublic true with gatewayType ExpressRoute', () => {
                let settings = _.cloneDeep(vngSettings);
                settings.gatewayType = 'ExpressRoute';
                // Merge will set this
                settings.publicIpAddress = {
                    name: `${settings.name}-pip`,
                    subscriptionId: '00000000-0000-1000-8000-000000000000',
                    resourceGroupName: 'test-rg',
                    publicIPAllocationMethod: 'Static',
                    publicIPAddressVersion: 'IPv4'
                };

                let errors = validation.validate({
                    settings: settings,
                    validations: vngValidations
                });

                expect(errors.length).toEqual(0);
            });

            it('isPublic false with gatewayType ExpressRoute', () => {
                let settings = _.cloneDeep(vngSettings);
                settings.isPublic = false;
                settings.gatewayType = 'ExpressRoute';

                let errors = validation.validate({
                    settings: settings,
                    validations: vngValidations
                });

                expect(errors.length).toEqual(1);
                expect(errors[0].name).toEqual('.isPublic');
            });

            it('virtualNetwork undefined', () => {
                let settings = _.cloneDeep(vngSettings);
                delete settings.virtualNetwork;

                let errors = validation.validate({
                    settings: settings,
                    validations: vngValidations
                });

                expect(errors.length).toEqual(1);
                expect(errors[0].name).toEqual('.virtualNetwork');
            });

            it('virtualNetwork null', () => {
                let settings = _.cloneDeep(vngSettings);
                settings.virtualNetwork = null;

                let errors = validation.validate({
                    settings: settings,
                    validations: vngValidations
                });

                expect(errors.length).toEqual(1);
                expect(errors[0].name).toEqual('.virtualNetwork');
            });

            it('virtualNetwork in different resource group', () => {
                let settings = _.cloneDeep(vngSettings);
                settings.virtualNetwork.resourceGroupName = 'different-rg';

                let errors = validation.validate({
                    settings: settings,
                    validations: vngValidations
                });

                expect(errors.length).toEqual(1);
                expect(errors[0].name).toEqual('.virtualNetwork');
            });

            it('enableBgp undefined', () => {
                let settings = _.cloneDeep(vngSettings);
                delete settings.enableBgp;

                let errors = validation.validate({
                    settings: settings,
                    validations: vngValidations
                });

                expect(errors.length).toEqual(1);
                expect(errors[0].name).toEqual('.enableBgp');
            });

            it('enableBgp null', () => {
                let settings = _.cloneDeep(vngSettings);
                settings.enableBgp = null;

                let errors = validation.validate({
                    settings: settings,
                    validations: vngValidations
                });

                expect(errors.length).toEqual(1);
                expect(errors[0].name).toEqual('.enableBgp');
            });
        });
    });

    describe('merge', () => {
        let merge = virtualNetworkGatewaySettings.__get__('merge');

        let virtualNetworkGateway = {
            name: 'my-gw',
            gatewayType: 'Vpn',
            vpnType: 'RouteBased',
            sku: 'VpnGw1',
            isPublic: true,
            virtualNetwork: {
                name: 'my-virtual-network'
            },
            enableBgp: false,
            bgpSettings: {
                asn: 1,
                bgpPeeringAddress: 'bgp-peering-address',
                peerWeight: 10
            }
        };

        let buildingBlockSettings = {
            subscriptionId: '00000000-0000-1000-8000-000000000000',
            resourceGroupName: 'test-rg',
            location: 'westus'
        };
        let virtualNetworkGatewaySettingsDefaults = virtualNetworkGatewaySettings.__get__('VIRTUALNETWORKGATEWAY_SETTINGS_DEFAULTS');

        it('defaults', () => {
            let merged = merge({
                settings: [{}],
                buildingBlockSettings: buildingBlockSettings,
                defaultSettings: virtualNetworkGatewaySettingsDefaults
            });
            expect(merged[0].gatewayType).toEqual(virtualNetworkGatewaySettingsDefaults.gatewayType);
            expect(merged[0].vpnType).toEqual(virtualNetworkGatewaySettingsDefaults.vpnType);
            expect(merged[0].sku).toEqual(virtualNetworkGatewaySettingsDefaults.sku);
            expect(merged[0].enableBgp).toEqual(virtualNetworkGatewaySettingsDefaults.enableBgp);
        });

        it('setupResources', () => {
            let settings = _.cloneDeep(virtualNetworkGateway);
            let result = merge({
                settings: [settings],
                buildingBlockSettings: buildingBlockSettings
            });

            expect(result[0].subscriptionId).toEqual(buildingBlockSettings.subscriptionId);
            expect(result[0].resourceGroupName).toEqual(buildingBlockSettings.resourceGroupName);
            expect(result[0].location).toEqual(buildingBlockSettings.location);

            expect(result[0].virtualNetwork.subscriptionId).toEqual(buildingBlockSettings.subscriptionId);
            expect(result[0].virtualNetwork.resourceGroupName).toEqual(buildingBlockSettings.resourceGroupName);
            expect(result[0].virtualNetwork.location).toEqual(buildingBlockSettings.location);

            expect(result[0].publicIpAddress.subscriptionId).toEqual(buildingBlockSettings.subscriptionId);
            expect(result[0].publicIpAddress.resourceGroupName).toEqual(buildingBlockSettings.resourceGroupName);
            expect(result[0].publicIpAddress.location).toEqual(buildingBlockSettings.location);
        });

        it('publicIPAddressVersion and domainNameLabel', () => {
            let settings = _.cloneDeep(virtualNetworkGateway);
            settings.publicIPAddressVersion = 'IPv4';
            settings.domainNameLabel = 'mydomainnamelabel';

            let result = merge({
                settings: [settings],
                buildingBlockSettings: buildingBlockSettings
            });

            expect(result[0].subscriptionId).toEqual(buildingBlockSettings.subscriptionId);
            expect(result[0].resourceGroupName).toEqual(buildingBlockSettings.resourceGroupName);
            expect(result[0].location).toEqual(buildingBlockSettings.location);

            expect(result[0].virtualNetwork.subscriptionId).toEqual(buildingBlockSettings.subscriptionId);
            expect(result[0].virtualNetwork.resourceGroupName).toEqual(buildingBlockSettings.resourceGroupName);
            expect(result[0].virtualNetwork.location).toEqual(buildingBlockSettings.location);

            expect(result[0].publicIpAddress.subscriptionId).toEqual(buildingBlockSettings.subscriptionId);
            expect(result[0].publicIpAddress.resourceGroupName).toEqual(buildingBlockSettings.resourceGroupName);
            expect(result[0].publicIpAddress.location).toEqual(buildingBlockSettings.location);

            expect(result[0].publicIpAddress.publicIPAddressVersion).toEqual(settings.publicIPAddressVersion);
            expect(result[0].publicIpAddress.domainNameLabel).toEqual(settings.domainNameLabel);
        });
    });

    if (global.testConfiguration.runTransform) {
        describe('transform', () => {
            let virtualNetworkGateway = [{
                name: 'my-gw',
                gatewayType: 'Vpn',
                vpnType: 'RouteBased',
                sku: 'VpnGw1',
                isPublic: true,
                virtualNetwork: {
                    name: 'my-virtual-network'
                },
                enableBgp: false,
                bgpSettings: {
                    asn: 1,
                    bgpPeeringAddress: 'bgp-peering-address',
                    peerWeight: 10
                }
            }];

            let buildingBlockSettings = {
                subscriptionId: '00000000-0000-1000-8000-000000000000',
                resourceGroupName: 'test-rg',
                location: 'westus'
            };

            it('single virtualNetworkGateway', () => {
                let settings = _.cloneDeep(virtualNetworkGateway);
                settings = settings[0];
                let result = virtualNetworkGatewaySettings.process({
                    settings: settings,
                    buildingBlockSettings: buildingBlockSettings
                });

                expect(result.resourceGroups.length).toEqual(1);
                expect(result.resourceGroups[0].subscriptionId).toEqual(buildingBlockSettings.subscriptionId);
                expect(result.resourceGroups[0].resourceGroupName).toEqual(buildingBlockSettings.resourceGroupName);
                expect(result.resourceGroups[0].location).toEqual(buildingBlockSettings.location);

                expect(result.parameters.virtualNetworkGateways.length).toEqual(1);
                expect(result.parameters.virtualNetworkGateways[0].length).toEqual(1);
                expect(result.parameters.publicIpAddresses.length).toEqual(1);
                let gateway = result.parameters.virtualNetworkGateways[0][0];
                expect(gateway.hasOwnProperty('id')).toEqual(true);
                expect(gateway.name).toEqual(settings.name);
                expect(gateway.resourceGroupName).toEqual(buildingBlockSettings.resourceGroupName);
                expect(gateway.subscriptionId).toEqual(buildingBlockSettings.subscriptionId);

                let propertiesResult = gateway.properties;
                expect(propertiesResult.vpnType).toEqual(settings.vpnType);
                expect(propertiesResult.enableBgp).toEqual(settings.enableBgp);
                expect(propertiesResult.gatewayType).toEqual(settings.gatewayType);

                let bgpSettingsResult = propertiesResult.bgpSettings;
                expect(bgpSettingsResult.asn).toEqual(settings.bgpSettings.asn);
                expect(bgpSettingsResult.bgpPeeringAddress).toEqual(settings.bgpSettings.bgpPeeringAddress);
                expect(bgpSettingsResult.peerWeight).toEqual(settings.bgpSettings.peerWeight);

                let skuResult = propertiesResult.sku;
                expect(skuResult.name).toEqual(settings.sku);
                expect(skuResult.tier).toEqual(settings.sku);

                let ipConfigurationsResult = propertiesResult.ipConfigurations;
                expect(ipConfigurationsResult.length).toEqual(1);
                expect(ipConfigurationsResult[0].name).toEqual(`${settings.name}-ipconfig`);
                expect(ipConfigurationsResult[0].properties.privateIPAllocationMethod).toEqual('Dynamic');
                expect(_.endsWith(ipConfigurationsResult[0].properties.subnet.id, `${settings.virtualNetwork.name}/subnets/GatewaySubnet`)).toEqual(true);
                expect(_.endsWith(ipConfigurationsResult[0].properties.publicIPAddress.id, `/publicIPAddresses/${settings.name}-pip`)).toEqual(true);
            });

            it('array virtualNetworkGateways', () => {
                let settings = _.cloneDeep(virtualNetworkGateway);
                let result = virtualNetworkGatewaySettings.process({
                    settings: settings,
                    buildingBlockSettings: buildingBlockSettings
                });

                expect(result.resourceGroups.length).toEqual(1);
                expect(result.resourceGroups[0].subscriptionId).toEqual(buildingBlockSettings.subscriptionId);
                expect(result.resourceGroups[0].resourceGroupName).toEqual(buildingBlockSettings.resourceGroupName);
                expect(result.resourceGroups[0].location).toEqual(buildingBlockSettings.location);

                expect(result.parameters.virtualNetworkGateways.length).toEqual(1);
                expect(result.parameters.virtualNetworkGateways[0].length).toEqual(1);
                expect(result.parameters.publicIpAddresses.length).toEqual(1);
                let gateway = result.parameters.virtualNetworkGateways[0][0];
                expect(gateway.hasOwnProperty('id')).toEqual(true);
                expect(gateway.name).toEqual(settings[0].name);
                expect(gateway.resourceGroupName).toEqual(buildingBlockSettings.resourceGroupName);
                expect(gateway.subscriptionId).toEqual(buildingBlockSettings.subscriptionId);

                let propertiesResult = gateway.properties;
                expect(propertiesResult.vpnType).toEqual(settings[0].vpnType);
                expect(propertiesResult.enableBgp).toEqual(settings[0].enableBgp);
                expect(propertiesResult.gatewayType).toEqual(settings[0].gatewayType);

                let bgpSettingsResult = propertiesResult.bgpSettings;
                expect(bgpSettingsResult.asn).toEqual(settings[0].bgpSettings.asn);
                expect(bgpSettingsResult.bgpPeeringAddress).toEqual(settings[0].bgpSettings.bgpPeeringAddress);
                expect(bgpSettingsResult.peerWeight).toEqual(settings[0].bgpSettings.peerWeight);

                let skuResult = propertiesResult.sku;
                expect(skuResult.name).toEqual(settings[0].sku);
                expect(skuResult.tier).toEqual(settings[0].sku);

                let ipConfigurationsResult = propertiesResult.ipConfigurations;
                expect(ipConfigurationsResult.length).toEqual(1);
                expect(ipConfigurationsResult[0].name).toEqual(`${settings[0].name}-ipconfig`);
                expect(ipConfigurationsResult[0].properties.privateIPAllocationMethod).toEqual('Dynamic');
                expect(_.endsWith(ipConfigurationsResult[0].properties.subnet.id, `${settings[0].virtualNetwork.name}/subnets/GatewaySubnet`)).toEqual(true);
                expect(_.endsWith(ipConfigurationsResult[0].properties.publicIPAddress.id, `/publicIPAddresses/${settings[0].name}-pip`)).toEqual(true);
            });

            it('virtualNetworkGateway with no public ip address', () => {
                let settings = _.cloneDeep(virtualNetworkGateway);
                settings[0].isPublic = false;
                let result = virtualNetworkGatewaySettings.process({
                    settings: settings,
                    buildingBlockSettings: buildingBlockSettings
                });

                expect(result.resourceGroups.length).toEqual(1);
                expect(result.resourceGroups[0].subscriptionId).toEqual(buildingBlockSettings.subscriptionId);
                expect(result.resourceGroups[0].resourceGroupName).toEqual(buildingBlockSettings.resourceGroupName);
                expect(result.resourceGroups[0].location).toEqual(buildingBlockSettings.location);

                expect(result.parameters.virtualNetworkGateways.length).toEqual(1);
                expect(result.parameters.virtualNetworkGateways[0].length).toEqual(1);
                expect(result.parameters.publicIpAddresses.length).toEqual(0);
                let gateway = result.parameters.virtualNetworkGateways[0][0];
                expect(gateway.hasOwnProperty('id')).toEqual(true);
                expect(gateway.name).toEqual(settings[0].name);
                expect(gateway.resourceGroupName).toEqual(buildingBlockSettings.resourceGroupName);
                expect(gateway.subscriptionId).toEqual(buildingBlockSettings.subscriptionId);

                let propertiesResult = gateway.properties;
                expect(propertiesResult.vpnType).toEqual(settings[0].vpnType);
                expect(propertiesResult.enableBgp).toEqual(settings[0].enableBgp);
                expect(propertiesResult.gatewayType).toEqual(settings[0].gatewayType);

                let bgpSettingsResult = propertiesResult.bgpSettings;
                expect(bgpSettingsResult.asn).toEqual(settings[0].bgpSettings.asn);
                expect(bgpSettingsResult.bgpPeeringAddress).toEqual(settings[0].bgpSettings.bgpPeeringAddress);
                expect(bgpSettingsResult.peerWeight).toEqual(settings[0].bgpSettings.peerWeight);

                let skuResult = propertiesResult.sku;
                expect(skuResult.name).toEqual(settings[0].sku);
                expect(skuResult.tier).toEqual(settings[0].sku);

                let ipConfigurationsResult = propertiesResult.ipConfigurations;
                expect(ipConfigurationsResult.length).toEqual(1);
                expect(ipConfigurationsResult[0].name).toEqual(`${settings[0].name}-ipconfig`);
                expect(ipConfigurationsResult[0].properties.privateIPAllocationMethod).toEqual('Dynamic');
                expect(_.endsWith(ipConfigurationsResult[0].properties.subnet.id, `${settings[0].virtualNetwork.name}/subnets/GatewaySubnet`)).toEqual(true);
                expect(ipConfigurationsResult[0].properties.publicIPAddress).toBeUndefined();
            });

            it('single virtualNetworkGateway with publicIPAddressVersion and domainNameLabel', () => {
                let settings = _.cloneDeep(virtualNetworkGateway);
                settings[0].isPublic = true;
                settings[0].publicIPAddressVersion = 'IPv6';
                settings[0].domainNameLabel = 'mydomain';

                let result = virtualNetworkGatewaySettings.process({
                    settings: settings,
                    buildingBlockSettings: buildingBlockSettings
                });

                expect(result.resourceGroups.length).toEqual(1);
                expect(result.resourceGroups[0].subscriptionId).toEqual(buildingBlockSettings.subscriptionId);
                expect(result.resourceGroups[0].resourceGroupName).toEqual(buildingBlockSettings.resourceGroupName);
                expect(result.resourceGroups[0].location).toEqual(buildingBlockSettings.location);

                expect(result.parameters.virtualNetworkGateways.length).toEqual(1);
                expect(result.parameters.virtualNetworkGateways[0].length).toEqual(1);
                expect(result.parameters.publicIpAddresses.length).toEqual(1);
                let gateway = result.parameters.virtualNetworkGateways[0][0];
                expect(gateway.hasOwnProperty('id')).toEqual(true);
                expect(gateway.name).toEqual(settings[0].name);
                expect(gateway.resourceGroupName).toEqual(buildingBlockSettings.resourceGroupName);
                expect(gateway.subscriptionId).toEqual(buildingBlockSettings.subscriptionId);

                let propertiesResult = gateway.properties;
                expect(propertiesResult.vpnType).toEqual(settings[0].vpnType);
                expect(propertiesResult.enableBgp).toEqual(settings[0].enableBgp);
                expect(propertiesResult.gatewayType).toEqual(settings[0].gatewayType);

                let bgpSettingsResult = propertiesResult.bgpSettings;
                expect(bgpSettingsResult.asn).toEqual(settings[0].bgpSettings.asn);
                expect(bgpSettingsResult.bgpPeeringAddress).toEqual(settings[0].bgpSettings.bgpPeeringAddress);
                expect(bgpSettingsResult.peerWeight).toEqual(settings[0].bgpSettings.peerWeight);

                let skuResult = propertiesResult.sku;
                expect(skuResult.name).toEqual(settings[0].sku);
                expect(skuResult.tier).toEqual(settings[0].sku);

                let ipConfigurationsResult = propertiesResult.ipConfigurations;
                expect(ipConfigurationsResult.length).toEqual(1);
                expect(ipConfigurationsResult[0].name).toEqual(`${settings[0].name}-ipconfig`);
                expect(ipConfigurationsResult[0].properties.privateIPAllocationMethod).toEqual('Dynamic');
                expect(_.endsWith(ipConfigurationsResult[0].properties.subnet.id, `${settings[0].virtualNetwork.name}/subnets/GatewaySubnet`)).toEqual(true);

                let pipSettingsResult = result.parameters.publicIpAddresses[0];
                expect(pipSettingsResult.properties.publicIPAddressVersion).toEqual(settings[0].publicIpAddress.publicIPAddressVersion);
                expect(pipSettingsResult.properties.publicIPAllocationMethod).toEqual('Dynamic');
                expect(pipSettingsResult.properties.dnsSettings.domainNameLabel).toEqual(settings[0].domainNameLabel);
            });

            it('single virtualNetworkGateway with no bgp settings', () => {
                let settings = _.cloneDeep(virtualNetworkGateway);
                delete settings[0].bgpSettings;
                let result = virtualNetworkGatewaySettings.process({
                    settings: settings,
                    buildingBlockSettings: buildingBlockSettings
                });

                expect(result.resourceGroups.length).toEqual(1);
                expect(result.resourceGroups[0].subscriptionId).toEqual(buildingBlockSettings.subscriptionId);
                expect(result.resourceGroups[0].resourceGroupName).toEqual(buildingBlockSettings.resourceGroupName);
                expect(result.resourceGroups[0].location).toEqual(buildingBlockSettings.location);

                expect(result.parameters.virtualNetworkGateways.length).toEqual(1);
                expect(result.parameters.virtualNetworkGateways[0].length).toEqual(1);
                expect(result.parameters.publicIpAddresses.length).toEqual(1);
                let gateway = result.parameters.virtualNetworkGateways[0][0];
                expect(gateway.hasOwnProperty('id')).toEqual(true);
                expect(gateway.name).toEqual(settings[0].name);
                expect(gateway.resourceGroupName).toEqual(buildingBlockSettings.resourceGroupName);
                expect(gateway.subscriptionId).toEqual(buildingBlockSettings.subscriptionId);

                let propertiesResult = gateway.properties;
                expect(propertiesResult.vpnType).toEqual(settings[0].vpnType);
                expect(propertiesResult.enableBgp).toEqual(settings[0].enableBgp);
                expect(propertiesResult.gatewayType).toEqual(settings[0].gatewayType);

                let skuResult = propertiesResult.sku;
                expect(skuResult.name).toEqual(settings[0].sku);
                expect(skuResult.tier).toEqual(settings[0].sku);

                let ipConfigurationsResult = propertiesResult.ipConfigurations;
                expect(ipConfigurationsResult.length).toEqual(1);
                expect(ipConfigurationsResult[0].name).toEqual(`${settings[0].name}-ipconfig`);
                expect(ipConfigurationsResult[0].properties.privateIPAllocationMethod).toEqual('Dynamic');
                expect(_.endsWith(ipConfigurationsResult[0].properties.subnet.id, `${settings[0].virtualNetwork.name}/subnets/GatewaySubnet`)).toEqual(true);

                let pipSettingsResult = result.parameters.publicIpAddresses[0];
                expect(pipSettingsResult.properties.publicIPAllocationMethod).toEqual('Dynamic');
            });

            it('ExpressRoute and Vpn virtualNetworkGateway on same subnet', () => {
                let vpnSettings = [_.cloneDeep(virtualNetworkGateway)[0], _.cloneDeep(virtualNetworkGateway)[0]];
                vpnSettings[0].name = 'my-vpn-gw';
                vpnSettings[1].gatewayType = 'ExpressRoute';
                vpnSettings[1].name = 'my-er-gw';

                let result = virtualNetworkGatewaySettings.process({
                    settings: vpnSettings,
                    buildingBlockSettings: buildingBlockSettings
                });

                expect(result.resourceGroups.length).toEqual(1);
                expect(result.resourceGroups[0].subscriptionId).toEqual(buildingBlockSettings.subscriptionId);
                expect(result.resourceGroups[0].resourceGroupName).toEqual(buildingBlockSettings.resourceGroupName);
                expect(result.resourceGroups[0].location).toEqual(buildingBlockSettings.location);

                expect(result.parameters.virtualNetworkGateways.length).toEqual(1);
                expect(result.parameters.virtualNetworkGateways[0].length).toEqual(2);
                expect(result.parameters.publicIpAddresses.length).toEqual(2);
                let expressRouteGateway = result.parameters.virtualNetworkGateways[0][0];
                expect(expressRouteGateway.properties.vpnType).toEqual(vpnSettings[1].vpnType);
                let vpnGateway = result.parameters.virtualNetworkGateways[0][1];
                expect(vpnGateway.properties.vpnType).toEqual(vpnSettings[0].vpnType);
            });

            it('test settings validation errors', () => {
                let settings = _.cloneDeep(virtualNetworkGateway);
                delete settings[0].name;
                expect(() => {
                    virtualNetworkGatewaySettings.process({
                        settings: settings,
                        buildingBlockSettings: buildingBlockSettings
                    });
                }).toThrow();
            });

            it('test building blocks validation errors', () => {
                let settings = _.cloneDeep(virtualNetworkGateway);
                let bbSettings = _.cloneDeep(buildingBlockSettings);
                delete bbSettings.subscriptionId;
                expect(() => {
                    virtualNetworkGatewaySettings.process({
                        settings: settings,
                        buildingBlockSettings: bbSettings
                    });
                }).toThrow();
            });
        });
    }
});