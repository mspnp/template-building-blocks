describe('virtualNetworkSettings', () => {
    let rewire = require('rewire');
    let virtualNetworkSettings = rewire('../src/core/virtualNetworkSettings.js');
    let _ = require('lodash');
    let validation = require('../src/core/validation.js');

    describe('validations', () => {
        let virtualNetworkSettingsValidations = virtualNetworkSettings.__get__('virtualNetworkSettingsValidations');

        describe('virtualNetworkSubnetsValidations', () => {
            let subnetValidations = virtualNetworkSettings.__get__('virtualNetworkSettingsSubnetsValidations');
            let subnetsSettings = [
                {
                    name: 'web',
                    addressPrefix: '10.0.1.0/24'
                },
                {
                    name: 'biz',
                    addressPrefix: '10.0.2.0/24'
                }
            ];

            let settings;
            beforeEach(() => {
                settings = _.cloneDeep(subnetsSettings);
            });

            it('name undefined', () => {
                delete settings[0].name;
                let errors = validation.validate({
                    settings: settings,
                    validations: subnetValidations
                });

                expect(errors.length).toEqual(1);
                expect(errors[0].name).toEqual('[0].name');
            });

            it('name empty', () => {
                settings[0].name = '';
                let errors = validation.validate({
                    settings: settings,
                    validations: subnetValidations
                });

                expect(errors.length).toEqual(1);
                expect(errors[0].name).toEqual('[0].name');
            });

            it('name whitespace', () => {
                settings[0].name = '   ';
                let errors = validation.validate({
                    settings: settings,
                    validations: subnetValidations
                });

                expect(errors.length).toEqual(1);
                expect(errors[0].name).toEqual('[0].name');
            });

            it('addressPrefix undefined', () => {
                delete settings[0].addressPrefix;
                let errors = validation.validate({
                    settings: settings,
                    validations: subnetValidations
                });

                expect(errors.length).toEqual(1);
                expect(errors[0].name).toEqual('[0].addressPrefix');
            });

            it('addressPrefix empty', () => {
                settings[0].addressPrefix = '';
                let errors = validation.validate({
                    settings: settings,
                    validations: subnetValidations
                });

                expect(errors.length).toEqual(1);
                expect(errors[0].name).toEqual('[0].addressPrefix');
            });

            it('addressPrefix whitespace', () => {
                settings[0].addressPrefix = '   ';
                let errors = validation.validate({
                    settings: settings,
                    validations: subnetValidations
                });

                expect(errors.length).toEqual(1);
                expect(errors[0].name).toEqual('[0].addressPrefix');
            });

            it('addressPrefix invalid cidr', () => {
                settings[0].addressPrefix = '10.0.0.1';
                let errors = validation.validate({
                    settings: settings,
                    validations: subnetValidations
                });

                expect(errors.length).toEqual(1);
                expect(errors[0].name).toEqual('[0].addressPrefix');
            });
        });

        describe('virtualNetworkSettingsPeeringValidations', () => {
            let peeringValidations = virtualNetworkSettings.__get__('virtualNetworkSettingsPeeringValidations');
            let peeringSettings = [
                {
                    name: 'another-provided-peering-name',
                    remoteVirtualNetwork: {
                        name: 'my-third-virtual-network'
                    },
                    allowForwardedTraffic: false,
                    allowGatewayTransit: false,
                    useRemoteGateways: true
                }
            ];

            let settings;
            beforeEach(() => {
                settings = _.cloneDeep(peeringSettings);
            });

            it('name undefined', () => {
                delete settings[0].name;
                let errors = validation.validate({
                    settings: settings,
                    validations: peeringValidations
                });

                expect(errors.length).toEqual(0);
            });

            it('name empty', () => {
                settings[0].name = '';
                let errors = validation.validate({
                    settings: settings,
                    validations: peeringValidations
                });

                expect(errors.length).toEqual(1);
                expect(errors[0].name).toEqual('[0].name');
            });

            it('name only whitespace', () => {
                settings[0].name = '   ';
                let errors = validation.validate({
                    settings: settings,
                    validations: peeringValidations
                });

                expect(errors.length).toEqual(1);
                expect(errors[0].name).toEqual('[0].name');
            });

            it('allowForwardedTraffic undefined', () => {
                delete settings[0].allowForwardedTraffic;
                let errors = validation.validate({
                    settings: settings,
                    validations: peeringValidations
                });

                expect(errors.length).toEqual(1);
                expect(errors[0].name).toEqual('[0].allowForwardedTraffic');
            });

            it('allowForwardedTraffic null', () => {
                settings[0].allowForwardedTraffic = null;
                let errors = validation.validate({
                    settings: settings,
                    validations: peeringValidations
                });

                expect(errors.length).toEqual(1);
                expect(errors[0].name).toEqual('[0].allowForwardedTraffic');
            });

            it('allowGatewayTransit undefined', () => {
                delete settings[0].allowGatewayTransit;
                let errors = validation.validate({
                    settings: settings,
                    validations: peeringValidations
                });

                expect(errors.length).toEqual(1);
                expect(errors[0].name).toEqual('[0].allowGatewayTransit');
            });

            it('allowGatewayTransit null', () => {
                settings[0].allowGatewayTransit = null;
                let errors = validation.validate({
                    settings: settings,
                    validations: peeringValidations
                });

                expect(errors.length).toEqual(1);
                expect(errors[0].name).toEqual('[0].allowGatewayTransit');
            });

            it('useRemoteGateways undefined', () => {
                delete settings[0].useRemoteGateways;
                let errors = validation.validate({
                    settings: settings,
                    validations: peeringValidations
                });

                expect(errors.length).toEqual(1);
                expect(errors[0].name).toEqual('[0].useRemoteGateways');
            });

            it('useRemoteGateways null', () => {
                settings[0].useRemoteGateways = null;
                let errors = validation.validate({
                    settings: settings,
                    validations: peeringValidations
                });

                expect(errors.length).toEqual(1);
                expect(errors[0].name).toEqual('[0].useRemoteGateways');
            });

            describe('remoteVirtualNetworkValidations', () => {
                let remoteVirtualNetworkValidations = peeringValidations.remoteVirtualNetwork;
                let remoteVirtualNetworkSettings = peeringSettings[0].remoteVirtualNetwork;

                it('name undefined', () => {
                    let settings = _.cloneDeep(remoteVirtualNetworkSettings);
                    delete settings.name;
                    let errors = validation.validate({
                        settings: settings,
                        validations: remoteVirtualNetworkValidations
                    });

                    expect(errors.length).toEqual(1);
                    expect(errors[0].name).toEqual('.name');
                });

                it('name empty', () => {
                    let settings = _.cloneDeep(remoteVirtualNetworkSettings);
                    settings.name = '';
                    let errors = validation.validate({
                        settings: settings,
                        validations: remoteVirtualNetworkValidations
                    });

                    expect(errors.length).toEqual(1);
                    expect(errors[0].name).toEqual('.name');
                });

                it('name whitespace', () => {
                    let settings = _.cloneDeep(remoteVirtualNetworkSettings);
                    settings.name = '   ';
                    let errors = validation.validate({
                        settings: settings,
                        validations: remoteVirtualNetworkValidations
                    });

                    expect(errors.length).toEqual(1);
                    expect(errors[0].name).toEqual('.name');
                });
            });
        });

        describe('virtualNetworkValidations', () => {
            let virtualNetworkValidations = virtualNetworkSettingsValidations;
            let virtualNetworkSettings = {
                name: 'my-virtual-network',
                addressPrefixes: [
                    '10.0.0.0/16'
                ],
                subnets: [
                    {
                        name: 'web',
                        addressPrefix: '10.0.1.0/24'
                    },
                    {
                        name: 'biz',
                        addressPrefix: '10.0.2.0/24'
                    }
                ],
                dnsServers: ['10.0.0.1'],
                virtualNetworkPeerings: [
                    {
                        name: 'another-provided-peering-name',
                        remoteVirtualNetwork: {
                            name: 'my-third-virtual-network'
                        },
                        allowForwardedTraffic: false,
                        allowGatewayTransit: false,
                        useRemoteGateways: true
                    }
                ],
                tags: {
                    name1: 'value1',
                    name2: 'value2',
                    name3: 'value3'
                }
            };

            let settings;
            beforeEach(() => {
                settings = _.cloneDeep(virtualNetworkSettings);
            });

            it('name undefined', () => {
                delete settings.name;

                let errors = validation.validate({
                    settings: settings,
                    validations: virtualNetworkValidations
                });

                expect(errors.length).toEqual(1);
                expect(errors[0].name).toEqual('.name');
            });

            it('addressPrefixes undefined', () => {
                delete settings.addressPrefixes;

                let errors = validation.validate({
                    settings: settings,
                    validations: virtualNetworkValidations
                });

                expect(errors.length).toEqual(1);
                expect(errors[0].name).toEqual('.addressPrefixes');
            });

            it('addressPrefixes empty', () => {
                settings.addressPrefixes = [];

                let errors = validation.validate({
                    settings: settings,
                    validations: virtualNetworkValidations
                });

                expect(errors.length).toEqual(1);
                expect(errors[0].name).toEqual('.addressPrefixes');
            });

            it('addressPrefixes invalid cidr', () => {
                settings.addressPrefixes = ['10.0.0.1'];

                let errors = validation.validate({
                    settings: settings,
                    validations: virtualNetworkValidations
                });

                expect(errors.length).toEqual(1);
                expect(errors[0].name).toEqual('.addressPrefixes');
            });

            it('addressPrefixes can be more than one cidr', () => {
                settings.addressPrefixes = ['10.0.0.0/16', '11.0.0.0/16'];

                let errors = validation.validate({
                    settings: settings,
                    validations: virtualNetworkValidations
                });

                expect(errors.length).toEqual(0);
            });

            it('subnets undefined', () => {
                delete settings.subnets;

                let errors = validation.validate({
                    settings: settings,
                    validations: virtualNetworkValidations
                });

                expect(errors.length).toEqual(1);
                expect(errors[0].name).toEqual('.subnets');
            });

            it('subnets empty', () => {
                settings.subnets = [];

                let errors = validation.validate({
                    settings: settings,
                    validations: virtualNetworkValidations
                });

                expect(errors.length).toEqual(1);
                expect(errors[0].name).toEqual('.subnets');
            });

            it('dnsServers undefined', () => {
                delete settings.dnsServers;

                let errors = validation.validate({
                    settings: settings,
                    validations: virtualNetworkValidations
                });

                expect(errors.length).toEqual(1);
                expect(errors[0].name).toEqual('.dnsServers');
            });

            it('dnsServers null', () => {
                settings.dnsServers = null;

                let errors = validation.validate({
                    settings: settings,
                    validations: virtualNetworkValidations
                });

                expect(errors.length).toEqual(1);
                expect(errors[0].name).toEqual('.dnsServers');
            });

            it('dnsServers empty', () => {
                settings.dnsServers = [];

                let errors = validation.validate({
                    settings: settings,
                    validations: virtualNetworkValidations
                });

                expect(errors.length).toEqual(0);
            });

            it('dnsServers invalid ip address', () => {
                settings.dnsServers = ['10.0.0'];

                let errors = validation.validate({
                    settings: settings,
                    validations: virtualNetworkValidations
                });

                expect(errors.length).toEqual(1);
                expect(errors[0].name).toEqual('.dnsServers[0]');
            });

            it('virtualNetworkPeerings undefined', () => {
                delete settings.virtualNetworkPeerings;

                let errors = validation.validate({
                    settings: settings,
                    validations: virtualNetworkValidations
                });

                expect(errors.length).toEqual(1);
                expect(errors[0].name).toEqual('.virtualNetworkPeerings');
            });

            it('virtualNetworkPeerings null', () => {
                settings.virtualNetworkPeerings = null;

                let errors = validation.validate({
                    settings: settings,
                    validations: virtualNetworkValidations
                });

                expect(errors.length).toEqual(1);
                expect(errors[0].name).toEqual('.virtualNetworkPeerings');
            });

            it('virtualNetworkPeerings empty', () => {
                settings.virtualNetworkPeerings = [];

                let errors = validation.validate({
                    settings: settings,
                    validations: virtualNetworkValidations
                });

                expect(errors.length).toEqual(0);
            });

            it('valid', () => {
                let errors = validation.validate({
                    settings: settings,
                    validations: virtualNetworkValidations
                });

                expect(errors.length).toEqual(0);
            });
        });
    });

    describe('merge', () => {
        let merge = virtualNetworkSettings.__get__('merge');
        let validate = virtualNetworkSettings.__get__('validate');
        let virtualNetworkSettingsDefaults = virtualNetworkSettings.__get__('VIRTUALNETWORK_SETTINGS_DEFAULTS');
        let buildingBlockSettings = {
            subscriptionId: '00000000-0000-1000-8000-000000000000',
            resourceGroupName: 'test-rg',
            location: 'westus'
        };

        describe('customizer', () => {
            let virtualNetworkSettings = [
                {
                    name: 'my-virtual-network',
                    addressPrefixes: [
                        '10.0.0.0/16'
                    ],
                    subnets: [
                        {
                            name: 'web',
                            addressPrefix: '10.0.1.0/24'
                        }
                    ],
                    dnsServers: ['10.0.0.1'],
                    virtualNetworkPeerings: [
                        {
                            name: 'peering-name',
                            remoteVirtualNetwork: {
                                name: 'my-other-virtual-network'
                            },
                            allowForwardedTraffic: false,
                            allowGatewayTransit: false,
                            useRemoteGateways: true
                        }
                    ]
                }
            ];

            it('defaults', () => {
                let result = merge({
                    settings: [{}],
                    buildingBlockSettings: buildingBlockSettings
                });

                expect(result[0].addressPrefixes).toEqual(virtualNetworkSettingsDefaults.addressPrefixes);
                expect(result[0].subnets).toEqual(virtualNetworkSettingsDefaults.subnets);
                expect(result[0].dnsServers).toEqual(virtualNetworkSettingsDefaults.dnsServers);
                expect(result[0].tags).toEqual(virtualNetworkSettingsDefaults.tags);
                expect(result[0].virtualNetworkPeerings).toEqual([]);
            });

            describe('', () => {
                let settings;
                beforeEach(() => {
                    settings = _.cloneDeep(virtualNetworkSettings);
                });

                it('subnets undefined', () => {
                    delete settings[0].subnets;
                    let merged = validation.merge(settings, virtualNetworkSettingsDefaults);
                    expect(merged[0].subnets.length).toEqual(0);
                });

                it('subnets null', () => {
                    settings[0].subnets = null;
                    let merged = validation.merge(settings, virtualNetworkSettingsDefaults);
                    expect(merged[0].subnets.length).toEqual(0);
                });

                it('subnets present', () => {
                    let merged = validation.merge(settings, virtualNetworkSettingsDefaults);
                    expect(merged[0].subnets.length).toEqual(1);
                    expect(merged[0].subnets[0].name).toEqual('web');
                    expect(merged[0].subnets[0].addressPrefix).toEqual('10.0.1.0/24');
                });

                it('virtualNetworkPeerings undefined', () => {
                    delete settings[0].virtualNetworkPeerings;
                    let merged = validation.merge(settings, virtualNetworkSettingsDefaults);
                    expect(merged[0].virtualNetworkPeerings.length).toEqual(0);
                });

                it('virtualNetworkPeerings null', () => {
                    settings[0].virtualNetworkPeerings = null;
                    let merged = validation.merge(settings, virtualNetworkSettingsDefaults);
                    expect(merged[0].virtualNetworkPeerings.length).toEqual(0);
                });

                it('virtualNetworkPeerings present', () => {
                    let merged = validation.merge(settings, virtualNetworkSettingsDefaults);
                    expect(merged[0].virtualNetworkPeerings.length).toEqual(1);
                    expect(merged[0].virtualNetworkPeerings[0].name).toEqual('peering-name');
                });

                it('virtual network location and peering cannot be different', () => {
                    settings[0].location = 'westus';
                    settings[0].virtualNetworkPeerings[0].remoteVirtualNetwork.location = 'centralus';

                    let merged = merge({
                        settings: settings,
                        buildingBlockSettings: buildingBlockSettings
                    });
                    let results = validate({settings: merged});
                    expect(results.length).toEqual(1);
                });

                it('multiple virtualNetworkPeerings present with missing properties (defaults)', () => {
                    settings[0].virtualNetworkPeerings.push(
                        {
                            name: 'peering-name1',
                            remoteVirtualNetwork: {
                                name: 'my-other-virtual-network1'
                            },
                            allowForwardedTraffic: true
                        }
                    );
                    let merged = validation.merge(settings, virtualNetworkSettingsDefaults);
                    expect(merged[0].virtualNetworkPeerings.length).toEqual(2);
                    expect(merged[0].virtualNetworkPeerings[0].name).toEqual('peering-name');
                    expect(merged[0].virtualNetworkPeerings[0].remoteVirtualNetwork.name).toEqual('my-other-virtual-network');
                    expect(merged[0].virtualNetworkPeerings[0].allowForwardedTraffic).toEqual(false);
                    expect(merged[0].virtualNetworkPeerings[0].allowGatewayTransit).toEqual(false);
                    expect(merged[0].virtualNetworkPeerings[0].useRemoteGateways).toEqual(true);
                    expect(merged[0].virtualNetworkPeerings[1].name).toEqual('peering-name1');
                    expect(merged[0].virtualNetworkPeerings[1].remoteVirtualNetwork.name).toEqual('my-other-virtual-network1');
                    expect(merged[0].virtualNetworkPeerings[1].allowForwardedTraffic).toEqual(true);
                    expect(merged[0].virtualNetworkPeerings[1].allowGatewayTransit).toEqual(false);
                    expect(merged[0].virtualNetworkPeerings[1].useRemoteGateways).toEqual(false);
                });

                it('multiple virtualNetworkSettings with multiple virtualNetworkPeerings with missing properties (defaults)', () => {
                    settings.push(_.cloneDeep(virtualNetworkSettings[0]));
                    delete settings[0].subnets;
                    settings[0].virtualNetworkPeerings.push(
                        {
                            name: 'peering-name1',
                            remoteVirtualNetwork: {
                                name: 'my-other-virtual-network1'
                            },
                            allowForwardedTraffic: true
                        }
                    );
                    settings[1].virtualNetworkPeerings.push(
                        {
                            name: 'peering-name1',
                            remoteVirtualNetwork: {
                                name: 'my-other-virtual-network1'
                            },
                            allowForwardedTraffic: true,
                            allowGatewayTransit: true
                        }
                    );
                    let merged = validation.merge(settings, virtualNetworkSettingsDefaults);
                    expect(merged[0].subnets.length).toEqual(0);
                    expect(merged[0].virtualNetworkPeerings.length).toEqual(2);
                    expect(merged[0].virtualNetworkPeerings[0].name).toEqual('peering-name');
                    expect(merged[0].virtualNetworkPeerings[0].remoteVirtualNetwork.name).toEqual('my-other-virtual-network');
                    expect(merged[0].virtualNetworkPeerings[0].allowForwardedTraffic).toEqual(false);
                    expect(merged[0].virtualNetworkPeerings[0].allowGatewayTransit).toEqual(false);
                    expect(merged[0].virtualNetworkPeerings[0].useRemoteGateways).toEqual(true);
                    expect(merged[0].virtualNetworkPeerings[1].name).toEqual('peering-name1');
                    expect(merged[0].virtualNetworkPeerings[1].remoteVirtualNetwork.name).toEqual('my-other-virtual-network1');
                    expect(merged[0].virtualNetworkPeerings[1].allowForwardedTraffic).toEqual(true);
                    expect(merged[0].virtualNetworkPeerings[1].allowGatewayTransit).toEqual(false);
                    expect(merged[0].virtualNetworkPeerings[1].useRemoteGateways).toEqual(false);
                    expect(merged[1].subnets.length).toEqual(1);
                    expect(merged[1].virtualNetworkPeerings.length).toEqual(2);
                    expect(merged[1].virtualNetworkPeerings[0].name).toEqual('peering-name');
                    expect(merged[1].virtualNetworkPeerings[0].remoteVirtualNetwork.name).toEqual('my-other-virtual-network');
                    expect(merged[1].virtualNetworkPeerings[0].allowForwardedTraffic).toEqual(false);
                    expect(merged[1].virtualNetworkPeerings[0].allowGatewayTransit).toEqual(false);
                    expect(merged[1].virtualNetworkPeerings[0].useRemoteGateways).toEqual(true);
                    expect(merged[1].virtualNetworkPeerings[1].name).toEqual('peering-name1');
                    expect(merged[1].virtualNetworkPeerings[1].remoteVirtualNetwork.name).toEqual('my-other-virtual-network1');
                    expect(merged[1].virtualNetworkPeerings[1].allowForwardedTraffic).toEqual(true);
                    expect(merged[1].virtualNetworkPeerings[1].allowGatewayTransit).toEqual(true);
                    expect(merged[1].virtualNetworkPeerings[1].useRemoteGateways).toEqual(false);
                });

                it('setupResources', () => {
                    let result = merge({
                        settings: settings,
                        buildingBlockSettings: buildingBlockSettings
                    });

                    expect(result[0].subscriptionId).toEqual(buildingBlockSettings.subscriptionId);
                    expect(result[0].resourceGroupName).toEqual(buildingBlockSettings.resourceGroupName);
                    expect(result[0].location).toEqual(buildingBlockSettings.location);

                    expect(result[0].virtualNetworkPeerings[0].remoteVirtualNetwork.subscriptionId).toEqual(buildingBlockSettings.subscriptionId);
                    expect(result[0].virtualNetworkPeerings[0].remoteVirtualNetwork.resourceGroupName).toEqual(buildingBlockSettings.resourceGroupName);
                    expect(result[0].virtualNetworkPeerings[0].remoteVirtualNetwork.location).toEqual(buildingBlockSettings.location);
                });
            });
        });
    });

    describe('userDefaults', () => {
        let merge = virtualNetworkSettings.__get__('merge');
        let buildingBlockSettings = {
            subscriptionId: '00000000-0000-1000-8000-000000000000',
            resourceGroupName: 'test-rg',
            location: 'westus'
        };

        describe('customizer', () => {
            let virtualNetworkSettings = [
                {
                    name: 'my-virtual-network',
                    addressPrefixes: [
                        '10.0.0.0/16'
                    ],
                    subnets: [
                        {
                            name: 'web',
                            addressPrefix: '10.0.1.0/24'
                        }
                    ],
                    dnsServers: ['10.0.0.1'],
                    virtualNetworkPeerings: [
                        {
                            name: 'peering-name',
                            remoteVirtualNetwork: {
                                name: 'my-other-virtual-network'
                            },
                            allowForwardedTraffic: false,
                            allowGatewayTransit: false,
                            useRemoteGateways: true
                        }
                    ]
                }
            ];

            let defaultsVirtualNetwork = [
                {
                    name: 'default-virtual-network',
                    addressPrefixes: [
                        '10.1.0.0/16'
                    ],
                    subnets: [
                        {
                            name: 'default2subnet',
                            addressPrefix: '10.1.1.0/26'
                        },
                        {
                            name: 'default2subnet',
                            addressPrefix: '10.1.1.64/26'
                        },
                        {
                            name: 'default3subnet',
                            addressPrefix: '10.1.1.128/25'
                        }
                    ],
                    dnsServers: ['10.1.0.1'],
                    virtualNetworkPeerings: [
                        {
                            name: 'default-peering-name',
                            remoteVirtualNetwork: {
                                name: 'default-secondary-virtual-network'
                            },
                            allowForwardedTraffic: true,
                            allowGatewayTransit: true,
                            useRemoteGateways: false
                        }
                    ]
                }
            ];

            let settings;
            let defaults;
            beforeEach(() => {
                settings = _.cloneDeep(virtualNetworkSettings);
                defaults = _.cloneDeep(defaultsVirtualNetwork);
            });

            it('subnets undefined both at user-params and user-defaults', () => {
                delete settings[0].subnets;
                delete defaults[0].subnets;

                let merged = merge({
                    settings,
                    buildingBlockSettings,
                    defaultSettings: defaults });
                expect(merged[0].subnets.length).toEqual(0);
            });

            it('subnets null', () => {
                settings[0].subnets = null;

                defaults[0].subnets = null;

                let merged = merge({
                    settings,
                    buildingBlockSettings,
                    defaultSettings: defaults });
                expect(merged[0].subnets.length).toEqual(0);
            });

            it('subnets present', () => {
                let merged = merge({
                    settings,
                    buildingBlockSettings,
                    defaultSettings: defaults });

                expect(merged[0].subnets.length).toEqual(1);
                expect(merged[0].subnets[0].name).toEqual('web');
                expect(merged[0].subnets[0].addressPrefix).toEqual('10.0.1.0/24');
            });

            it('virtualNetworkPeerings undefined', () => {
                delete settings[0].virtualNetworkPeerings;
                delete defaults[0].virtualNetworkPeerings;

                let merged = merge({
                    settings,
                    buildingBlockSettings,
                    defaultSettings: defaults });

                expect(merged[0].virtualNetworkPeerings.length).toEqual(0);
            });

            it('virtualNetworkPeerings null', () => {
                settings[0].virtualNetworkPeerings = null;

                defaults[0].virtualNetworkPeerings = null;

                let merged = merge({
                    settings,
                    buildingBlockSettings,
                    defaultSettings: defaults });

                expect(merged[0].virtualNetworkPeerings.length).toEqual(0);
            });

            it('virtualNetworkPeerings present', () => {
                let merged = merge({
                    settings,
                    buildingBlockSettings,
                    defaultSettings: defaults });

                expect(merged[0].virtualNetworkPeerings.length).toEqual(1);
                expect(merged[0].virtualNetworkPeerings[0].name).toEqual('peering-name');
            });

            it('multiple virtualNetworkPeerings present with missing properties (defaults)', () => {
                settings[0].virtualNetworkPeerings.push(
                    {
                        name: 'peering-name1',
                        remoteVirtualNetwork: {
                            name: 'my-other-virtual-network1'
                        },
                        allowForwardedTraffic: true,
                        allowGatewayTransit: false,
                        useRemoteGateways: true
                    }
                );
                defaults[0].virtualNetworkPeerings.push(
                    {
                        name: 'defasult2-peering-name',
                        remoteVirtualNetwork: {
                            name: 'default2-secondary-virtual-network'
                        },
                        allowForwardedTraffic: false
                    }
                );

                let merged = merge({
                    settings,
                    buildingBlockSettings,
                    defaultSettings: defaults });

                expect(merged[0].virtualNetworkPeerings.length).toEqual(2);
                expect(merged[0].virtualNetworkPeerings[0].name).toEqual('peering-name');
                expect(merged[0].virtualNetworkPeerings[0].remoteVirtualNetwork.name).toEqual('my-other-virtual-network');
                expect(merged[0].virtualNetworkPeerings[0].allowForwardedTraffic).toEqual(false);
                expect(merged[0].virtualNetworkPeerings[0].allowGatewayTransit).toEqual(false);
                expect(merged[0].virtualNetworkPeerings[0].useRemoteGateways).toEqual(true);
                expect(merged[0].virtualNetworkPeerings[1].name).toEqual('peering-name1');
                expect(merged[0].virtualNetworkPeerings[1].remoteVirtualNetwork.name).toEqual('my-other-virtual-network1');
                expect(merged[0].virtualNetworkPeerings[1].allowForwardedTraffic).toEqual(true);
                expect(merged[0].virtualNetworkPeerings[1].allowGatewayTransit).toEqual(false);
                expect(merged[0].virtualNetworkPeerings[1].useRemoteGateways).toEqual(true);
            });

            it('multiple virtualNetworkSettings with multiple virtualNetworkPeerings with missing properties (defaults)', () => {
                settings.push(_.cloneDeep(virtualNetworkSettings[0]));
                defaults.push(_.cloneDeep(defaultsVirtualNetwork[0]));
                delete settings[0].subnets;
                delete defaults[0].subnets;
                settings[0].virtualNetworkPeerings.push(
                    {
                        name: 'peering-name1',
                        remoteVirtualNetwork: {
                            name: 'my-other-virtual-network1'
                        },
                        allowForwardedTraffic: true
                    }
                );
                settings[1].virtualNetworkPeerings.push(
                    {
                        name: 'peering-name1',
                        remoteVirtualNetwork: {
                            name: 'my-other-virtual-network1'
                        },
                        allowForwardedTraffic: true,
                        allowGatewayTransit: true
                    }
                );
                defaults[0].virtualNetworkPeerings.push(
                    {
                        name: 'default-peering-name1',
                        remoteVirtualNetwork: {
                            name: 'default-virtual-network1'
                        },
                        allowForwardedTraffic: false
                    }
                );
                defaults[1].virtualNetworkPeerings.push(
                    {
                        name: 'default-peering-name1',
                        remoteVirtualNetwork: {
                            name: 'default-virtual-network1'
                        },
                        allowForwardedTraffic: false,
                        allowGatewayTransit: false
                    }
                );
                let merged = merge({
                    settings,
                    buildingBlockSettings,
                    defaultSettings: defaults });

                expect(merged[0].subnets.length).toEqual(0);
                expect(merged[0].virtualNetworkPeerings.length).toEqual(2);
                expect(merged[0].virtualNetworkPeerings[0].name).toEqual('peering-name');
                expect(merged[0].virtualNetworkPeerings[0].remoteVirtualNetwork.name).toEqual('my-other-virtual-network');
                expect(merged[0].virtualNetworkPeerings[0].allowForwardedTraffic).toEqual(false);
                expect(merged[0].virtualNetworkPeerings[0].allowGatewayTransit).toEqual(false);
                expect(merged[0].virtualNetworkPeerings[0].useRemoteGateways).toEqual(true);
                expect(merged[0].virtualNetworkPeerings[1].name).toEqual('peering-name1');
                expect(merged[0].virtualNetworkPeerings[1].remoteVirtualNetwork.name).toEqual('my-other-virtual-network1');
                expect(merged[0].virtualNetworkPeerings[1].allowForwardedTraffic).toEqual(true);
                expect(merged[0].virtualNetworkPeerings[1].allowGatewayTransit).toEqual(true);
                expect(merged[0].virtualNetworkPeerings[1].useRemoteGateways).toEqual(false);
                expect(merged[1].subnets.length).toEqual(1);
                expect(merged[1].virtualNetworkPeerings.length).toEqual(2);
                expect(merged[1].virtualNetworkPeerings[0].name).toEqual('peering-name');
                expect(merged[1].virtualNetworkPeerings[0].remoteVirtualNetwork.name).toEqual('my-other-virtual-network');
                expect(merged[1].virtualNetworkPeerings[0].allowForwardedTraffic).toEqual(false);
                expect(merged[1].virtualNetworkPeerings[0].allowGatewayTransit).toEqual(false);
                expect(merged[1].virtualNetworkPeerings[0].useRemoteGateways).toEqual(true);
                expect(merged[1].virtualNetworkPeerings[1].name).toEqual('peering-name1');
                expect(merged[1].virtualNetworkPeerings[1].remoteVirtualNetwork.name).toEqual('my-other-virtual-network1');
                expect(merged[1].virtualNetworkPeerings[1].allowForwardedTraffic).toEqual(true);
                expect(merged[1].virtualNetworkPeerings[1].allowGatewayTransit).toEqual(true);
                expect(merged[1].virtualNetworkPeerings[1].useRemoteGateways).toEqual(false);
            });

            it('if user-defaults object arrays contain elements, but userparams comes empty, all object array properties will come empty', () => {
                let merged = merge({
                    settings: [{}],
                    buildingBlockSettings: buildingBlockSettings,
                    defaultSettings: defaults
                });

                expect(merged[0].name).toEqual('default-virtual-network');
                expect(merged[0].addressPrefixes.length).toEqual(1);
                expect(merged[0].subnets.length).toEqual(0);
                expect(merged[0].dnsServers).toEqual(defaultsVirtualNetwork[0].dnsServers);
                expect(merged[0].tags).toEqual({});
                expect(merged[0].virtualNetworkPeerings.length).toEqual(0);
            });

            it('setupResources with user-defaults', () => {
                let merged = merge({
                    settings: settings,
                    buildingBlockSettings: buildingBlockSettings,
                    defaultSettings: defaults
                });

                expect(merged[0].subscriptionId).toEqual(buildingBlockSettings.subscriptionId);
                expect(merged[0].resourceGroupName).toEqual(buildingBlockSettings.resourceGroupName);
                expect(merged[0].location).toEqual(buildingBlockSettings.location);

                expect(merged[0].virtualNetworkPeerings[0].remoteVirtualNetwork.subscriptionId).toEqual(buildingBlockSettings.subscriptionId);
                expect(merged[0].virtualNetworkPeerings[0].remoteVirtualNetwork.resourceGroupName).toEqual(buildingBlockSettings.resourceGroupName);
                expect(merged[0].virtualNetworkPeerings[0].remoteVirtualNetwork.location).toEqual(buildingBlockSettings.location);
            });
        });
    });

    if (global.testConfiguration.runTransform) {
        describe('process', () => {
            let virtualNetworkSettingsWithPeering = [
                {
                    name: 'my-virtual-network',
                    addressPrefixes: [
                        '10.0.0.0/16'
                    ],
                    subnets: [
                        {
                            name: 'web',
                            addressPrefix: '10.0.1.0/24'
                        },
                        {
                            name: 'biz',
                            addressPrefix: '10.0.2.0/24'
                        }
                    ],
                    dnsServers: [],
                    virtualNetworkPeerings: [
                        {
                            remoteVirtualNetwork: {
                                name: 'my-other-virtual-network'
                            },
                            allowGatewayTransit: true,
                            useRemoteGateways: false
                        },
                        {
                            name: 'provided-peering-name',
                            remoteVirtualNetwork: {
                                name: 'my-third-virtual-network',
                                resourceGroupName: 'different-resource-group'
                            },
                            allowForwardedTraffic: false,
                            allowGatewayTransit: false,
                            useRemoteGateways: true
                        }
                    ],
                    tags: {
                        tag1: 'value1',
                        tag2: 'value2',
                        tag3: 'value3'
                    }
                },
                {
                    name: 'my-other-virtual-network',
                    addressPrefixes: [
                        '10.1.0.0/16'
                    ],
                    subnets: [
                        {
                            name: 'web',
                            addressPrefix: '10.1.1.0/24'
                        },
                        {
                            name: 'biz',
                            addressPrefix: '10.1.2.0/24'
                        }
                    ],
                    dnsServers: [],
                    virtualNetworkPeerings: [
                        {
                            name: 'another-provided-peering-name',
                            remoteVirtualNetwork: {
                                name: 'my-third-virtual-network',
                                resourceGroupName: 'different-resource-group'
                            },
                            allowForwardedTraffic: false,
                            allowGatewayTransit: false,
                            useRemoteGateways: true
                        }
                    ]
                },
                {
                    name: 'my-third-virtual-network',
                    addressPrefixes: [
                        '10.2.0.0/16'
                    ],
                    subnets: [
                        {
                            name: 'web',
                            addressPrefix: '10.2.1.0/24'
                        },
                        {
                            name: 'biz',
                            addressPrefix: '10.2.2.0/24'
                        }
                    ],
                    dnsServers: [],
                    virtualNetworkPeerings: []
                }
            ];

            let buildingBlockSettings = {
                subscriptionId: '00000000-0000-1000-8000-000000000000',
                resourceGroupName: 'test-rg',
                location: 'westus'
            };

            let settings;
            beforeEach(() => {
                settings = _.cloneDeep(virtualNetworkSettingsWithPeering);
            });

            it('single virtual network with no peers', () => {
                settings = settings[0];
                delete settings.virtualNetworkPeerings;
                let result = virtualNetworkSettings.process({
                    settings: settings,
                    buildingBlockSettings: buildingBlockSettings
                });

                expect(result.resourceGroups.length).toEqual(1);
                expect(result.parameters.virtualNetworks.length).toBe(1);
            });

            it('single virtual network with defaults', () => {
                settings = settings[0];
                delete settings.subnets[0].name;
                delete settings.virtualNetworkPeerings[0].allowForwardedTraffic;
                delete settings.virtualNetworkPeerings[0].allowGatewayTransit;
                delete settings.virtualNetworkPeerings[0].useRemoteGateways;
                let defaults = [{
                    subnets: [
                        {
                            name: 'default'
                        }
                    ],
                    virtualNetworkPeerings: [
                        {
                            allowForwardedTraffic: true,
                            allowGatewayTransit: true,
                            useRemoteGateways: true
                        }
                    ]
                }];

                let result = virtualNetworkSettings.process({
                    settings: [settings],
                    buildingBlockSettings: buildingBlockSettings,
                    defaultSettings: defaults
                });

                expect(result.resourceGroups.length).toEqual(1);
                expect(result.parameters.virtualNetworks.length).toBe(1);
                expect(result.parameters.virtualNetworks[0].properties.subnets[0].name).toEqual('default');
                expect(result.parameters.virtualNetworkPeerings[0].properties.allowForwardedTraffic).toEqual(true);
                expect(result.parameters.virtualNetworkPeerings[0].properties.allowGatewayTransit).toEqual(true);
                expect(result.parameters.virtualNetworkPeerings[0].properties.useRemoteGateways).toEqual(true);
            });

            it('single virtual network with peers', () => {
                settings = settings[0];

                let result = virtualNetworkSettings.process({
                    settings: settings,
                    buildingBlockSettings: buildingBlockSettings
                });

                expect(result.parameters.virtualNetworks.length).toBe(1);
                expect(result.parameters.virtualNetworkPeerings.length).toBe(2);
                expect(Object.keys(result.parameters.virtualNetworks[0].tags).length).toEqual(3);
                expect(result.parameters.virtualNetworks[0].tags.tag1).toEqual('value1');
                expect(result.parameters.virtualNetworks[0].tags.tag2).toEqual('value2');
                expect(result.parameters.virtualNetworks[0].tags.tag3).toEqual('value3');
            });

            it('multiple virtual network with peers', () => {
                let result = virtualNetworkSettings.process({
                    settings: settings,
                    buildingBlockSettings: buildingBlockSettings
                });

                expect(result.parameters.virtualNetworks.length).toBe(3);
                expect(result.parameters.virtualNetworkPeerings.length).toBe(3);
                expect(Object.keys(result.parameters.virtualNetworks[0].tags).length).toEqual(3);
                expect(result.parameters.virtualNetworks[0].tags.tag1).toEqual('value1');
                expect(result.parameters.virtualNetworks[0].tags.tag2).toEqual('value2');
                expect(result.parameters.virtualNetworks[0].tags.tag3).toEqual('value3');
            });

            it('test settings validation errors', () => {
                delete settings[0].name;
                expect(() => {
                    virtualNetworkSettings.process({
                        settings: settings,
                        buildingBlockSettings: buildingBlockSettings
                    });
                }).toThrow();
            });

            it('test building blocks validation errors', () => {
                let bbSettings = _.cloneDeep(buildingBlockSettings);
                delete bbSettings.subscriptionId;
                expect(() => {
                    virtualNetworkSettings.process({
                        settings: settings,
                        buildingBlockSettings: bbSettings
                    });
                }).toThrow();
            });

            it('virtual network location and peering cannot be different', () => {
                settings[0].location = 'westus';
                settings[0].virtualNetworkPeerings[0].remoteVirtualNetwork.location = 'centralus';

                expect(() => {
                    virtualNetworkSettings.process({
                        settings: settings,
                        buildingBlockSettings: buildingBlockSettings
                    });
                }).toThrow();
            });
        });
    }
});