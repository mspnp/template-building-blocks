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
            expect(isValidSku('NOT_A_VALID_SKU')).toEqual(false);
        });

        it('Basic', () => {
            expect(isValidSku('Basic')).toEqual(true);
        });

        it('HighPerformance', () => {
            expect(isValidSku('HighPerformance')).toEqual(true);
        });

        it('Standard', () => {
            expect(isValidSku('Standard')).toEqual(true);
        });

        it('UltraPerformance', () => {
            expect(isValidSku('UltraPerformance')).toEqual(true);
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
                sku: 'Standard',
                isPublic: true,
                publicIpAddressVersion: 'IPv4',
                // publicIpAddress: {
                //     name: 'my-pip',
                //     subscriptionId: '00000000-0000-1000-8000-000000000000',
                //     resourceGroupName: 'test-rg'
                // },
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

                expect(errors.length).toEqual(1);
                expect(errors[0].name).toEqual('.subscriptionId');
            });

            it('subscriptionId null', () => {
                let settings = _.cloneDeep(vngSettings);
                settings.subscriptionId = null;

                let errors = validation.validate({
                    settings: settings,
                    validations: vngValidations
                });

                expect(errors.length).toEqual(1);
                expect(errors[0].name).toEqual('.subscriptionId');
            });

            it('subscriptionId empty', () => {
                let settings = _.cloneDeep(vngSettings);
                settings.subscriptionId = '';

                let errors = validation.validate({
                    settings: settings,
                    validations: vngValidations
                });

                expect(errors.length).toEqual(1);
                expect(errors[0].name).toEqual('.subscriptionId');
            });

            it('resourceGroupName undefined', () => {
                let settings = _.cloneDeep(vngSettings);
                delete settings.resourceGroupName;

                let errors = validation.validate({
                    settings: settings,
                    validations: vngValidations
                });

                expect(errors.length).toEqual(1);
                expect(errors[0].name).toEqual('.resourceGroupName');
            });

            it('resourceGroupName null', () => {
                let settings = _.cloneDeep(vngSettings);
                settings.resourceGroupName = null;

                let errors = validation.validate({
                    settings: settings,
                    validations: vngValidations
                });

                expect(errors.length).toEqual(1);
                expect(errors[0].name).toEqual('.resourceGroupName');
            });

            it('resourceGroupName empty', () => {
                let settings = _.cloneDeep(vngSettings);
                settings.resourceGroupName = '';

                let errors = validation.validate({
                    settings: settings,
                    validations: vngValidations
                });

                expect(errors.length).toEqual(1);
                expect(errors[0].name).toEqual('.resourceGroupName');
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
        let virtualNetworkGatewaySettingsDefaults = virtualNetworkGatewaySettings.__get__('virtualNetworkGatewaySettingsDefaults');

        it('valid', () => {
            let merged = validation.merge([{}], virtualNetworkGatewaySettingsDefaults);
            expect(merged[0].gatewayType).toBe('Vpn');
            expect(merged[0].vpnType).toBe('RouteBased');
            expect(merged[0].sku).toBe('Standard');
            expect(merged[0].enableBgp).toBe(false);
        });
    });

    describe('transform', () => {
        let virtualNetworkGateway = {
            name: 'my-gw',
            gatewayType: 'Vpn',
            vpnType: 'RouteBased',
            sku: 'Standard',
            isPublic: true,
            // publicIpAddress: {
            //     name: 'my-pip'
            // },
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
            resourceGroupName: 'test-rg'
        };

        it('single virtualNetworkGateway', () => {
            let settings = _.cloneDeep(virtualNetworkGateway);
            let result = virtualNetworkGatewaySettings.process({
                settings: settings,
                buildingBlockSettings: buildingBlockSettings
            });

            expect(result.virtualNetworkGateways.length).toBe(1);
            expect(result.publicIpAddresses.length).toBe(1);
            expect(result.virtualNetworkGateways[0].length).toBe(1);
            let gateway = result.virtualNetworkGateways[0][0];
            expect(gateway.hasOwnProperty('id')).toBe(true);
            expect(gateway.name).toBe(settings.name);
            expect(gateway.resourceGroupName).toBe(buildingBlockSettings.resourceGroupName);
            expect(gateway.subscriptionId).toBe(buildingBlockSettings.subscriptionId);

            expect(gateway.hasOwnProperty('properties')).toBe(true);
            let propertiesResult = gateway.properties;
            expect(propertiesResult.vpnType).toBe(settings.vpnType);
            expect(propertiesResult.enableBgp).toBe(false);
            expect(propertiesResult.gatewayType).toBe('Vpn');

            expect(propertiesResult.hasOwnProperty('bgpSettings')).toBe(true);
            let bgpSettingsResult = propertiesResult.bgpSettings;
            expect(bgpSettingsResult.asn).toBe(1);
            expect(bgpSettingsResult.bgpPeeringAddress).toBe('bgp-peering-address');
            expect(bgpSettingsResult.peerWeight).toBe(10);

            expect(propertiesResult.hasOwnProperty('sku')).toBe(true);
            let skuResult = propertiesResult.sku;
            expect(skuResult.hasOwnProperty('name')).toBe(true);
            expect(skuResult.hasOwnProperty('tier')).toBe(true);
            expect(skuResult.name).toEqual(skuResult.tier);

            expect(propertiesResult.hasOwnProperty('ipConfigurations')).toBe(true);
            let ipConfigurationsResult = propertiesResult.ipConfigurations;
            expect(ipConfigurationsResult.length).toEqual(1);
            expect(ipConfigurationsResult[0].name).toBe('my-gw-ipconfig');
            expect(ipConfigurationsResult[0].properties.privateIPAllocationMethod).toBe('Dynamic');
            expect(_.endsWith(ipConfigurationsResult[0].properties.subnet.id, `${settings.virtualNetwork.name}/subnets/GatewaySubnet`)).toBe(true);
            expect(_.endsWith(ipConfigurationsResult[0].properties.publicIPAddress.id, `/publicIPAddresses/${settings.name}-pip`)).toBe(true);
        });

        it('array virtualNetworkGateways', () => {
            let settings = _.cloneDeep(virtualNetworkGateway);
            let result = virtualNetworkGatewaySettings.process({
                settings: [settings],
                buildingBlockSettings: buildingBlockSettings
            });

            expect(result.virtualNetworkGateways.length).toBe(1);
            expect(result.virtualNetworkGateways[0].length).toBe(1);
            expect(result.publicIpAddresses.length).toBe(1);
            let gateway = result.virtualNetworkGateways[0][0];
            expect(gateway.hasOwnProperty('id')).toBe(true);
            expect(gateway.name).toBe(settings.name);
            expect(gateway.resourceGroupName).toBe(buildingBlockSettings.resourceGroupName);
            expect(gateway.subscriptionId).toBe(buildingBlockSettings.subscriptionId);

            expect(gateway.hasOwnProperty('properties')).toBe(true);
            let propertiesResult = gateway.properties;
            expect(propertiesResult.vpnType).toBe(settings.vpnType);
            expect(propertiesResult.enableBgp).toBe(false);
            expect(propertiesResult.gatewayType).toBe('Vpn');

            expect(propertiesResult.hasOwnProperty('bgpSettings')).toBe(true);
            let bgpSettingsResult = propertiesResult.bgpSettings;
            expect(bgpSettingsResult.asn).toBe(1);
            expect(bgpSettingsResult.bgpPeeringAddress).toBe('bgp-peering-address');
            expect(bgpSettingsResult.peerWeight).toBe(10);

            expect(propertiesResult.hasOwnProperty('sku')).toBe(true);
            let skuResult = propertiesResult.sku;
            expect(skuResult.hasOwnProperty('name')).toBe(true);
            expect(skuResult.hasOwnProperty('tier')).toBe(true);
            expect(skuResult.name).toEqual(skuResult.tier);

            expect(propertiesResult.hasOwnProperty('ipConfigurations')).toBe(true);
            let ipConfigurationsResult = propertiesResult.ipConfigurations;
            expect(ipConfigurationsResult.length).toEqual(1);
            expect(ipConfigurationsResult[0].name).toBe('my-gw-ipconfig');
            expect(ipConfigurationsResult[0].properties.privateIPAllocationMethod).toBe('Dynamic');
            expect(_.endsWith(ipConfigurationsResult[0].properties.subnet.id, `${settings.virtualNetwork.name}/subnets/GatewaySubnet`)).toBe(true);
            expect(_.endsWith(ipConfigurationsResult[0].properties.publicIPAddress.id, `/publicIPAddresses/${settings.name}-pip`)).toBe(true);
        });

        it('single virtualNetworkGateway with no public ip address', () => {
            let settings = _.cloneDeep(virtualNetworkGateway);
            settings.isPublic = false;
            let result = virtualNetworkGatewaySettings.process({
                settings: settings,
                buildingBlockSettings: buildingBlockSettings
            });

            expect(result.virtualNetworkGateways.length).toBe(1);
            expect(result.virtualNetworkGateways[0].length).toBe(1);
            expect(result.publicIpAddresses.length).toBe(0);
            let gateway = result.virtualNetworkGateways[0][0];
            expect(gateway.hasOwnProperty('id')).toBe(true);
            expect(gateway.name).toBe(settings.name);
            expect(gateway.resourceGroupName).toBe(buildingBlockSettings.resourceGroupName);
            expect(gateway.subscriptionId).toBe(buildingBlockSettings.subscriptionId);

            expect(gateway.hasOwnProperty('properties')).toBe(true);
            let propertiesResult = gateway.properties;
            expect(propertiesResult.vpnType).toBe(settings.vpnType);
            expect(propertiesResult.enableBgp).toBe(false);
            expect(propertiesResult.gatewayType).toBe('Vpn');

            expect(propertiesResult.hasOwnProperty('bgpSettings')).toBe(true);
            let bgpSettingsResult = propertiesResult.bgpSettings;
            expect(bgpSettingsResult.asn).toBe(1);
            expect(bgpSettingsResult.bgpPeeringAddress).toBe('bgp-peering-address');
            expect(bgpSettingsResult.peerWeight).toBe(10);

            expect(propertiesResult.hasOwnProperty('sku')).toBe(true);
            let skuResult = propertiesResult.sku;
            expect(skuResult.hasOwnProperty('name')).toBe(true);
            expect(skuResult.hasOwnProperty('tier')).toBe(true);
            expect(skuResult.name).toEqual(skuResult.tier);

            expect(propertiesResult.hasOwnProperty('ipConfigurations')).toBe(true);
            let ipConfigurationsResult = propertiesResult.ipConfigurations;
            expect(ipConfigurationsResult.length).toEqual(1);
            expect(ipConfigurationsResult[0].name).toBe('my-gw-ipconfig');
            expect(ipConfigurationsResult[0].properties.privateIPAllocationMethod).toBe('Dynamic');
            expect(_.endsWith(ipConfigurationsResult[0].properties.subnet.id, `${settings.virtualNetwork.name}/subnets/GatewaySubnet`)).toBe(true);
            expect(ipConfigurationsResult[0].properties.hasOwnProperty('publicIPAddress')).toBe(false);
        });

        it('single virtualNetworkGateway with embedded public ip address', () => {
            let settings = _.cloneDeep(virtualNetworkGateway);
            settings.isPublic = true;
            settings.publicIPAddressVersion = 'IPv6';

            let result = virtualNetworkGatewaySettings.process({
                settings: settings,
                buildingBlockSettings: buildingBlockSettings
            });

            expect(result.virtualNetworkGateways.length).toBe(1);
            expect(result.virtualNetworkGateways[0].length).toBe(1);
            expect(result.publicIpAddresses.length).toBe(1);
            let gateway = result.virtualNetworkGateways[0][0];
            expect(gateway.hasOwnProperty('id')).toBe(true);
            expect(gateway.name).toBe(settings.name);
            expect(gateway.resourceGroupName).toBe(buildingBlockSettings.resourceGroupName);
            expect(gateway.subscriptionId).toBe(buildingBlockSettings.subscriptionId);

            expect(gateway.hasOwnProperty('properties')).toBe(true);
            let propertiesResult = gateway.properties;
            expect(propertiesResult.vpnType).toBe(settings.vpnType);
            expect(propertiesResult.enableBgp).toBe(false);
            expect(propertiesResult.gatewayType).toBe('Vpn');

            expect(propertiesResult.hasOwnProperty('bgpSettings')).toBe(true);
            let bgpSettingsResult = propertiesResult.bgpSettings;
            expect(bgpSettingsResult.asn).toBe(1);
            expect(bgpSettingsResult.bgpPeeringAddress).toBe('bgp-peering-address');
            expect(bgpSettingsResult.peerWeight).toBe(10);

            expect(propertiesResult.hasOwnProperty('sku')).toBe(true);
            let skuResult = propertiesResult.sku;
            expect(skuResult.hasOwnProperty('name')).toBe(true);
            expect(skuResult.hasOwnProperty('tier')).toBe(true);
            expect(skuResult.name).toEqual(skuResult.tier);

            expect(propertiesResult.hasOwnProperty('ipConfigurations')).toBe(true);
            let ipConfigurationsResult = propertiesResult.ipConfigurations;
            expect(ipConfigurationsResult.length).toEqual(1);
            expect(ipConfigurationsResult[0].name).toBe('my-gw-ipconfig');
            expect(ipConfigurationsResult[0].properties.privateIPAllocationMethod).toBe('Dynamic');
            expect(_.endsWith(ipConfigurationsResult[0].properties.subnet.id, `${settings.virtualNetwork.name}/subnets/GatewaySubnet`)).toBe(true);

            let pipSettingsResult = result.publicIpAddresses[0];
            expect(pipSettingsResult.properties.publicIPAddressVersion).toBe(settings.publicIpAddress.publicIPAddressVersion);
            expect(pipSettingsResult.properties.publicIPAllocationMethod).toBe('Dynamic');
        });

        it('single virtualNetworkGateway with embedded public ip address with domainNameLabel', () => {
            let settings = _.cloneDeep(virtualNetworkGateway);
            settings.isPublic = true;
            settings.publicIPAddressVersion = 'IPv6';
            settings.domainNameLabel = 'mydomain';

            let result = virtualNetworkGatewaySettings.process({
                settings: settings,
                buildingBlockSettings: buildingBlockSettings
            });

            expect(result.virtualNetworkGateways.length).toBe(1);
            expect(result.virtualNetworkGateways[0].length).toBe(1);
            expect(result.publicIpAddresses.length).toBe(1);
            let gateway = result.virtualNetworkGateways[0][0];
            expect(gateway.hasOwnProperty('id')).toBe(true);
            expect(gateway.name).toBe(settings.name);
            expect(gateway.resourceGroupName).toBe(buildingBlockSettings.resourceGroupName);
            expect(gateway.subscriptionId).toBe(buildingBlockSettings.subscriptionId);

            expect(gateway.hasOwnProperty('properties')).toBe(true);
            let propertiesResult = gateway.properties;
            expect(propertiesResult.vpnType).toBe(settings.vpnType);
            expect(propertiesResult.enableBgp).toBe(false);
            expect(propertiesResult.gatewayType).toBe('Vpn');

            expect(propertiesResult.hasOwnProperty('bgpSettings')).toBe(true);
            let bgpSettingsResult = propertiesResult.bgpSettings;
            expect(bgpSettingsResult.asn).toBe(1);
            expect(bgpSettingsResult.bgpPeeringAddress).toBe('bgp-peering-address');
            expect(bgpSettingsResult.peerWeight).toBe(10);

            expect(propertiesResult.hasOwnProperty('sku')).toBe(true);
            let skuResult = propertiesResult.sku;
            expect(skuResult.hasOwnProperty('name')).toBe(true);
            expect(skuResult.hasOwnProperty('tier')).toBe(true);
            expect(skuResult.name).toEqual(skuResult.tier);

            expect(propertiesResult.hasOwnProperty('ipConfigurations')).toBe(true);
            let ipConfigurationsResult = propertiesResult.ipConfigurations;
            expect(ipConfigurationsResult.length).toEqual(1);
            expect(ipConfigurationsResult[0].name).toBe('my-gw-ipconfig');
            expect(ipConfigurationsResult[0].properties.privateIPAllocationMethod).toBe('Dynamic');
            expect(_.endsWith(ipConfigurationsResult[0].properties.subnet.id, `${settings.virtualNetwork.name}/subnets/GatewaySubnet`)).toBe(true);

            let pipSettingsResult = result.publicIpAddresses[0];
            expect(pipSettingsResult.properties.publicIPAddressVersion).toBe(settings.publicIpAddress.publicIPAddressVersion);
            expect(pipSettingsResult.properties.publicIPAllocationMethod).toBe('Dynamic');
            expect(pipSettingsResult.properties.dnsSettings.domainNameLabel).toBe(settings.domainNameLabel);
        });

        it('single virtualNetworkGateway with no bgp settings', () => {
            let settings = _.cloneDeep(virtualNetworkGateway);
            delete settings.bgpSettings;
            let result = virtualNetworkGatewaySettings.process({
                settings: settings,
                buildingBlockSettings: buildingBlockSettings
            });

            expect(result.virtualNetworkGateways.length).toBe(1);
            expect(result.virtualNetworkGateways[0].length).toBe(1);
            expect(result.publicIpAddresses.length).toBe(1);
            let gateway = result.virtualNetworkGateways[0][0];
            expect(gateway.hasOwnProperty('id')).toBe(true);
            expect(gateway.name).toBe(settings.name);
            expect(gateway.resourceGroupName).toBe(buildingBlockSettings.resourceGroupName);
            expect(gateway.subscriptionId).toBe(buildingBlockSettings.subscriptionId);

            expect(gateway.hasOwnProperty('properties')).toBe(true);
            let propertiesResult = gateway.properties;
            expect(propertiesResult.vpnType).toBe(settings.vpnType);
            expect(propertiesResult.enableBgp).toBe(false);
            expect(propertiesResult.gatewayType).toBe('Vpn');

            expect(propertiesResult.hasOwnProperty('bgpSettings')).toBe(false);

            expect(propertiesResult.hasOwnProperty('sku')).toBe(true);
            let skuResult = propertiesResult.sku;
            expect(skuResult.hasOwnProperty('name')).toBe(true);
            expect(skuResult.hasOwnProperty('tier')).toBe(true);
            expect(skuResult.name).toEqual(skuResult.tier);

            expect(propertiesResult.hasOwnProperty('ipConfigurations')).toBe(true);
            let ipConfigurationsResult = propertiesResult.ipConfigurations;
            expect(ipConfigurationsResult.length).toEqual(1);
            expect(ipConfigurationsResult[0].name).toBe('my-gw-ipconfig');
            expect(ipConfigurationsResult[0].properties.privateIPAllocationMethod).toBe('Dynamic');
            expect(_.endsWith(ipConfigurationsResult[0].properties.subnet.id, `${settings.virtualNetwork.name}/subnets/GatewaySubnet`)).toBe(true);

            let pipSettingsResult = result.publicIpAddresses[0];
            expect(pipSettingsResult.properties.publicIPAllocationMethod).toBe('Dynamic');
        });

        it('ExpressRoute and Vpn virtualNetworkGateway on same subnet', () => {
            let vpnSettings = _.cloneDeep(virtualNetworkGateway);
            vpnSettings.name = 'my-vpn-gw';
            let expressRouteSettings = _.cloneDeep(virtualNetworkGateway);
            expressRouteSettings.gatewayType = 'ExpressRoute';
            expressRouteSettings.name = 'my-er-gw';

            let result = virtualNetworkGatewaySettings.process({
                settings: [vpnSettings, expressRouteSettings],
                buildingBlockSettings: buildingBlockSettings
            });

            expect(result.virtualNetworkGateways.length).toBe(1);
            expect(result.virtualNetworkGateways[0].length).toBe(2);
            expect(result.publicIpAddresses.length).toBe(2);
            let expressRouteGateway = result.virtualNetworkGateways[0][0];
            expect(expressRouteGateway.properties.vpnType).toBe(expressRouteSettings.vpnType);
            let vpnGateway = result.virtualNetworkGateways[0][1];
            expect(vpnGateway.properties.vpnType).toBe(vpnSettings.vpnType);
        });

        it('test settings validation errors', () => {
            let settings = _.cloneDeep(virtualNetworkGateway);
            delete settings.name;
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
});