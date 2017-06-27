describe('routeTableSettings', () => {
    let rewire = require('rewire');
    let routeTableSettings = rewire('../core/routeTableSettings.js');
    let _ = require('lodash');
    let validation = require('../core/validation.js');

    describe('isValidNextHop', () => {
        let isValidNextHop = routeTableSettings.__get__('isValidNextHop');

        it('undefined', () => {
            expect(isValidNextHop()).toEqual(false);
        });

        it('null', () => {
            expect(isValidNextHop(null)).toEqual(false);
        });

        it('empty', () => {
            expect(isValidNextHop('')).toEqual(false);
        });

        it('whitespace', () => {
            expect(isValidNextHop(' ')).toEqual(false);
        });

        it('invalid spacing', () => {
            expect(isValidNextHop(' VirtualNetworkGateway ')).toEqual(false);
        });

        it('invalid casing', () => {
            expect(isValidNextHop('virtualnetworkgateway')).toEqual(false);
        });

        it('invalid value', () => {
            expect(isValidNextHop('NOT_VALID')).toEqual(false);
        });

        it('VirtualNetworkGateway', () => {
            expect(isValidNextHop('VirtualNetworkGateway')).toEqual(true);
        });

        it('VnetLocal', () => {
            expect(isValidNextHop('VnetLocal')).toEqual(true);
        });

        it('Internet', () => {
            expect(isValidNextHop('Internet')).toEqual(true);
        });

        it('HyperNetGateway', () => {
            expect(isValidNextHop('HyperNetGateway')).toEqual(true);
        });

        it('None', () => {
            expect(isValidNextHop('None')).toEqual(true);
        });

        it('IPAddress', () => {
            expect(isValidNextHop('127.0.0.1')).toEqual(true);
        });
    });

    describe('validations', () => {
        let routeTableSettingsValidations = routeTableSettings.__get__('routeTableSettingsValidations');

        describe('virtualNetworkValidations', () => {
            let virtualNetworkValidations = routeTableSettingsValidations.virtualNetworks;
            let virtualNetworkSettings = [
                {
                    name: 'my-virtual-network',
                    subnets: ['web', 'biz']
                }
            ];

            it('empty array', () => {
                let errors = validation.validate({
                    settings: [],
                    validations: virtualNetworkValidations
                });

                expect(errors.length).toEqual(0);
            });

            it('name undefined', () => {
                let settings = _.cloneDeep(virtualNetworkSettings);
                delete settings[0].name;

                let errors = validation.validate({
                    settings: settings,
                    validations: virtualNetworkValidations
                });

                expect(errors.length).toEqual(1);
                expect(errors[0].name).toEqual('[0].name');
            });

            it('subnets undefined', () => {
                let settings = _.cloneDeep(virtualNetworkSettings);
                delete settings[0].subnets;

                let errors = validation.validate({
                    settings: settings,
                    validations: virtualNetworkValidations
                });

                expect(errors.length).toEqual(1);
                expect(errors[0].name).toEqual('[0].subnets');
            });

            it('subnets empty', () => {
                let settings = _.cloneDeep(virtualNetworkSettings);
                settings[0].subnets = [];

                let errors = validation.validate({
                    settings: settings,
                    validations: virtualNetworkValidations
                });

                expect(errors.length).toEqual(1);
                expect(errors[0].name).toEqual('[0].subnets');
            });

            it('subnets empty string', () => {
                let settings = _.cloneDeep(virtualNetworkSettings);
                settings[0].subnets = [''];

                let errors = validation.validate({
                    settings: settings,
                    validations: virtualNetworkValidations
                });

                expect(errors.length).toEqual(1);
                expect(errors[0].name).toEqual('[0].subnets[0]');
            });
        });

        describe('routeValidations', () => {
            let routeValidations = routeTableSettingsValidations.routes;

            let valid = {
                name: 'name',
                addressPrefix: '10.0.0.1/24',
                nextHop: 'VirtualNetworkGateway'
            };

            it('name undefined', () => {
                let invalid = _.cloneDeep(valid);
                delete invalid.name;
                let errors = validation.validate({
                    settings: [invalid],
                    validations: routeValidations
                });

                expect(errors.length).toEqual(1);
                expect(errors[0].name).toEqual('[0].name');
            });

            it('addressPrefix undefined', () => {
                let invalid = _.cloneDeep(valid);
                delete invalid.addressPrefix;
                let errors = validation.validate({
                    settings: [invalid],
                    validations: routeValidations
                });

                expect(errors.length).toEqual(1);
                expect(errors[0].name).toEqual('[0].addressPrefix');
            });

            it('nextHop undefined', () => {
                let invalid = _.cloneDeep(valid);
                delete invalid.nextHop;
                let errors = validation.validate({
                    settings: [invalid],
                    validations: routeValidations
                });

                expect(errors.length).toEqual(1);
                expect(errors[0].name).toEqual('[0].nextHop');
            });
        });

        describe('routeTableSettingsValidations', () => {
            let routeTableSettings = {
                name: 'my-route-table',
                virtualNetworks: [
                    {
                        name: 'my-virtual-network',
                        subnets: [
                            'biz',
                            'web'
                        ]
                    }
                ],
                routes: [
                    {
                        name: 'route1',
                        addressPrefix: '10.0.1.0/24',
                        nextHop: 'VnetLocal'
                    },
                    {
                        name: 'route2',
                        addressPrefix: '10.0.2.0/24',
                        nextHop: '192.168.1.1'
                    }
                ],
                tags: {}
            };

            it('name undefined', () => {
                let settings = _.cloneDeep(routeTableSettings);
                delete settings.name;
                let errors = validation.validate({
                    settings: settings,
                    validations: routeTableSettingsValidations
                });

                expect(errors.length).toEqual(1);
                expect(errors[0].name).toEqual('.name');
            });

            it('virtualNetwork empty', () => {
                let settings = _.cloneDeep(routeTableSettings);
                settings.virtualNetworks = [];
                let errors = validation.validate({
                    settings: settings,
                    validations: routeTableSettingsValidations
                });

                expect(errors.length).toEqual(0);
            });

            it('routes undefined', () => {
                let settings = _.cloneDeep(routeTableSettings);
                delete settings.routes;
                let errors = validation.validate({
                    settings: settings,
                    validations: routeTableSettingsValidations
                });

                expect(errors.length).toEqual(1);
                expect(errors[0].name).toEqual('.routes');
            });

            it('routes null', () => {
                let settings = _.cloneDeep(routeTableSettings);
                settings.routes = null;
                let errors = validation.validate({
                    settings: settings,
                    validations: routeTableSettingsValidations
                });

                expect(errors.length).toEqual(1);
                expect(errors[0].name).toEqual('.routes');
            });

            it('routes empty', () => {
                let settings = _.cloneDeep(routeTableSettings);
                settings.routes = [];
                let errors = validation.validate({
                    settings: settings,
                    validations: routeTableSettingsValidations
                });

                expect(errors.length).toEqual(1);
                expect(errors[0].name).toEqual('.routes');
            });

            it('duplicate route name', () => {
                let settings = _.cloneDeep(routeTableSettings);
                settings.routes[1].name = 'route1';
                let errors = validation.validate({
                    settings: settings,
                    validations: routeTableSettingsValidations
                });

                expect(errors.length).toEqual(1);
                expect(errors[0].name).toEqual('.routes');
            });
        });
    });

    describe('merge', () => {
        let routeTableSettingsMerge = routeTableSettings.__get__('merge');

        let routeTable = [{
            name: 'my-route-table',
            virtualNetworks: [
                {
                    name: 'my-virtual-network',
                    subnets: [
                        'biz',
                        'web'
                    ]
                }
            ],
            routes: [
                {
                    name: 'route1',
                    addressPrefix: '10.0.1.0/24',
                    nextHopType: 'VnetLocal'
                },
                {
                    name: 'route2',
                    addressPrefix: '10.0.2.0/24',
                    nextHopType: 'VirtualAppliance',
                    nextHopIpAddress: '192.168.1.1'
                }
            ]
        }];
        let buildingBlockSettings = {
            subscriptionId: '00000000-0000-1000-8000-000000000000',
            resourceGroupName: 'test-rg'
        };

        it('virtualNetworks undefined', () => {
            let settings = _.cloneDeep(routeTable);
            delete settings[0].virtualNetworks;
            let merged = routeTableSettingsMerge({settings, buildingBlockSettings});
            expect(merged[0].virtualNetworks.length).toBe(0);
        });

        it('virtualNetworks null', () => {
            let settings = _.cloneDeep(routeTable);
            settings[0].virtualNetworks = null;
            let merged = routeTableSettingsMerge({settings, buildingBlockSettings});
            expect(merged[0].virtualNetworks.length).toBe(0);
        });

        it('virtualNetworks present', () => {
            let settings = _.cloneDeep(routeTable);
            let merged = routeTableSettingsMerge({settings, buildingBlockSettings});
            expect(merged[0].virtualNetworks[0].name).toBe('my-virtual-network');
        });

        it('routes undefined', () => {
            let settings = _.cloneDeep(routeTable);
            delete settings[0].routes;
            let merged = routeTableSettingsMerge({settings, buildingBlockSettings});
            expect(merged[0].routes.length).toBe(0);
        });

        it('routes null', () => {
            let settings = _.cloneDeep(routeTable);
            settings[0].routes = null;
            let merged = routeTableSettingsMerge({settings, buildingBlockSettings});
            expect(merged[0].routes.length).toBe(0);
        });

        it('routes present', () => {
            let settings = _.cloneDeep(routeTable);
            let merged = routeTableSettingsMerge({settings, buildingBlockSettings});
            expect(merged[0].routes[0].name).toBe('route1');
        });
    });

    describe('transform', () => {
        let routeTable = [
            {
                name: 'my-route-table',
                virtualNetworks: [
                    {
                        name: 'my-virtual-network',
                        subnets: [
                            'biz',
                            'web'
                        ]
                    }
                ],
                routes: [
                    {
                        name: 'route1',
                        addressPrefix: '10.0.1.0/24',
                        nextHop: 'VnetLocal'
                    },
                    {
                        name: 'route2',
                        addressPrefix: '10.0.2.0/24',
                        nextHop: '192.168.1.1'
                    }
                ],
                tags: {}
            }
        ];

        let buildingBlockSettings = {
            subscriptionId: '00000000-0000-1000-8000-000000000000',
            resourceGroupName: 'test-rg',
            location: 'westus'
        };

        it('single route table', () => {
            let settings = _.cloneDeep(routeTable);
            settings = settings[0];
            let result = routeTableSettings.process({
                settings: settings,
                buildingBlockSettings: buildingBlockSettings
            });

            expect(result.resourceGroups.length).toEqual(1);
            expect(result.resourceGroups[0].subscriptionId).toEqual(buildingBlockSettings.subscriptionId);
            expect(result.resourceGroups[0].resourceGroupName).toEqual(buildingBlockSettings.resourceGroupName);
            expect(result.resourceGroups[0].location).toEqual(buildingBlockSettings.location);

            expect(result.parameters.routeTables.length).toBe(1);
            let settingsResult = result.parameters.routeTables[0];
            expect(settingsResult.hasOwnProperty('id')).toBe(true);
            expect(settingsResult.name).toBe(settings.name);
            expect(settingsResult.resourceGroupName).toEqual(buildingBlockSettings.resourceGroupName);
            expect(settingsResult.subscriptionId).toEqual(buildingBlockSettings.subscriptionId);
            expect(settingsResult.location).toEqual(buildingBlockSettings.location);

            expect(settingsResult.properties.routes.length).toBe(2);
            let routesResult = settingsResult.properties.routes;
            expect(routesResult[0].name).toEqual(settings.routes[0].name);
            expect(routesResult[0].properties.addressPrefix).toEqual(settings.routes[0].addressPrefix);
            expect(routesResult[0].properties.nextHopType).toEqual(settings.routes[0].nextHop);
            expect(routesResult[1].name).toEqual(settings.routes[1].name);
            expect(routesResult[1].properties.addressPrefix).toEqual(settings.routes[1].addressPrefix);
            expect(routesResult[1].properties.nextHopType).toEqual('VirtualAppliance');
            expect(routesResult[1].properties.nextHopIpAddress).toEqual(settings.routes[1].nextHop);

            expect(result.parameters.subnets.length).toEqual(2);
            expect(result.parameters.subnets[0].id.endsWith('my-virtual-network/subnets/biz')).toBe(true);
            expect(result.parameters.subnets[0].subscriptionId).toEqual(buildingBlockSettings.subscriptionId);
            expect(result.parameters.subnets[0].resourceGroupName).toEqual(buildingBlockSettings.resourceGroupName);
            expect(result.parameters.subnets[0].virtualNetwork).toEqual(settings.virtualNetworks[0].name);
            expect(result.parameters.subnets[0].name).toEqual(settings.virtualNetworks[0].subnets[0]);
            expect(result.parameters.subnets[1].id.endsWith('my-virtual-network/subnets/web')).toBe(true);
            expect(result.parameters.subnets[1].subscriptionId).toEqual(buildingBlockSettings.subscriptionId);
            expect(result.parameters.subnets[1].resourceGroupName).toEqual(buildingBlockSettings.resourceGroupName);
            expect(result.parameters.subnets[1].virtualNetwork).toEqual(settings.virtualNetworks[0].name);
            expect(result.parameters.subnets[1].name).toEqual(settings.virtualNetworks[0].subnets[1]);
        });

        it('single route table with no virtual networks', () => {
            let settings = _.cloneDeep(routeTable);
            settings = settings[0];
            delete settings.virtualNetworks;
            let result = routeTableSettings.process({
                settings: settings,
                buildingBlockSettings: buildingBlockSettings
            });

            expect(result.resourceGroups.length).toEqual(1);
            expect(result.resourceGroups[0].subscriptionId).toEqual(buildingBlockSettings.subscriptionId);
            expect(result.resourceGroups[0].resourceGroupName).toEqual(buildingBlockSettings.resourceGroupName);
            expect(result.resourceGroups[0].location).toEqual(buildingBlockSettings.location);

            expect(result.parameters.routeTables.length).toBe(1);
            let settingsResult = result.parameters.routeTables[0];
            expect(settingsResult.hasOwnProperty('id')).toBe(true);
            expect(settingsResult.name).toBe(settings.name);
            expect(settingsResult.resourceGroupName).toEqual(buildingBlockSettings.resourceGroupName);
            expect(settingsResult.subscriptionId).toEqual(buildingBlockSettings.subscriptionId);
            expect(settingsResult.location).toEqual(buildingBlockSettings.location);

            expect(settingsResult.properties.routes.length).toBe(2);
            let routesResult = settingsResult.properties.routes;
            expect(routesResult[0].name).toEqual(settings.routes[0].name);
            expect(routesResult[0].properties.addressPrefix).toEqual(settings.routes[0].addressPrefix);
            expect(routesResult[0].properties.nextHopType).toEqual(settings.routes[0].nextHop);
            expect(routesResult[1].name).toEqual(settings.routes[1].name);
            expect(routesResult[1].properties.addressPrefix).toEqual(settings.routes[1].addressPrefix);
            expect(routesResult[1].properties.nextHopType).toEqual('VirtualAppliance');
            expect(routesResult[1].properties.nextHopIpAddress).toEqual(settings.routes[1].nextHop);

            expect(result.parameters.subnets.length).toEqual(0);
        });

        it('test settings validation errors', () => {
            let settings = _.cloneDeep(routeTable);
            delete settings[0].name;
            expect(() => {
                routeTableSettings.process({
                    settings: settings,
                    buildingBlockSettings: buildingBlockSettings
                });
            }).toThrow();
        });

        it('test building blocks validation errors', () => {
            let settings = _.cloneDeep(routeTable);
            let bbSettings = _.cloneDeep(buildingBlockSettings);
            delete bbSettings.subscriptionId;
            expect(() => {
                routeTableSettings.process({
                    settings: settings,
                    buildingBlockSettings: bbSettings
                });
            }).toThrow();
        });
    });
});