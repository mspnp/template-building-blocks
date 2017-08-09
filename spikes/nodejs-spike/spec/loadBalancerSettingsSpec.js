describe('loadBalancerSettings', () => {
    let rewire = require('rewire');
    let loadBalancerSettings = rewire('../core/loadBalancerSettings.js');
    let validation = require('../core/validation.js');
    let _ = require('lodash');

    describe('isValidLoadBalancerType', () => {
        let isValidLoadBalancerType = loadBalancerSettings.__get__('isValidLoadBalancerType');

        it('undefined', () => {
            expect(isValidLoadBalancerType()).toEqual(false);
        });

        it('null', () => {
            expect(isValidLoadBalancerType(null)).toEqual(false);
        });

        it('empty', () => {
            expect(isValidLoadBalancerType('')).toEqual(false);
        });

        it('whitespace', () => {
            expect(isValidLoadBalancerType(' ')).toEqual(false);
        });

        it('invalid spacing', () => {
            expect(isValidLoadBalancerType(' Public ')).toEqual(false);
        });

        it('invalid casing', () => {
            expect(isValidLoadBalancerType('public')).toEqual(false);
        });

        it('invalid value', () => {
            expect(isValidLoadBalancerType('NOT_VALID')).toEqual(false);
        });

        it('Public', () => {
            expect(isValidLoadBalancerType('Public')).toEqual(true);
        });

        it('Internal', () => {
            expect(isValidLoadBalancerType('Internal')).toEqual(true);
        });
    });

    describe('isValidProtocol', () => {
        let isValidProtocol = loadBalancerSettings.__get__('isValidProtocol');

        it('undefined', () => {
            expect(isValidProtocol()).toEqual(false);
        });

        it('null', () => {
            expect(isValidProtocol(null)).toEqual(false);
        });

        it('empty', () => {
            expect(isValidProtocol('')).toEqual(false);
        });

        it('whitespace', () => {
            expect(isValidProtocol(' ')).toEqual(false);
        });

        it('invalid spacing', () => {
            expect(isValidProtocol(' Public ')).toEqual(false);
        });

        it('invalid casing', () => {
            expect(isValidProtocol('public')).toEqual(false);
        });

        it('invalid value', () => {
            expect(isValidProtocol('NOT_VALID')).toEqual(false);
        });

        it('Tcp', () => {
            expect(isValidProtocol('Tcp')).toEqual(true);
        });

        it('Udp', () => {
            expect(isValidProtocol('Udp')).toEqual(true);
        });
    });

    describe('isValidLoadDistribution', () => {
        let isValidLoadDistribution = loadBalancerSettings.__get__('isValidLoadDistribution');

        it('undefined', () => {
            expect(isValidLoadDistribution()).toEqual(false);
        });

        it('null', () => {
            expect(isValidLoadDistribution(null)).toEqual(false);
        });

        it('empty', () => {
            expect(isValidLoadDistribution('')).toEqual(false);
        });

        it('whitespace', () => {
            expect(isValidLoadDistribution(' ')).toEqual(false);
        });

        it('invalid spacing', () => {
            expect(isValidLoadDistribution(' Default ')).toEqual(false);
        });

        it('invalid casing', () => {
            expect(isValidLoadDistribution('default')).toEqual(false);
        });

        it('invalid value', () => {
            expect(isValidLoadDistribution('NOT_VALID')).toEqual(false);
        });

        it('Default', () => {
            expect(isValidLoadDistribution('Default')).toEqual(true);
        });

        it('SourceIP', () => {
            expect(isValidLoadDistribution('SourceIP')).toEqual(true);
        });

        it('SourceIPProtocol', () => {
            expect(isValidLoadDistribution('SourceIPProtocol')).toEqual(true);
        });
    });

    describe('isValidProbeProtocol', () => {
        let isValidProbeProtocol = loadBalancerSettings.__get__('isValidProbeProtocol');

        it('undefined', () => {
            expect(isValidProbeProtocol()).toEqual(false);
        });

        it('null', () => {
            expect(isValidProbeProtocol(null)).toEqual(false);
        });

        it('empty', () => {
            expect(isValidProbeProtocol('')).toEqual(false);
        });

        it('whitespace', () => {
            expect(isValidProbeProtocol(' ')).toEqual(false);
        });

        it('invalid spacing', () => {
            expect(isValidProbeProtocol(' Public ')).toEqual(false);
        });

        it('invalid casing', () => {
            expect(isValidProbeProtocol('public')).toEqual(false);
        });

        it('invalid value', () => {
            expect(isValidProbeProtocol('NOT_VALID')).toEqual(false);
        });

        it('Http', () => {
            expect(isValidProbeProtocol('Http')).toEqual(true);
        });

        it('Tcp', () => {
            expect(isValidProbeProtocol('Tcp')).toEqual(true);
        });
    });

    describe('public IP addresses', () => {
        let settings = {
            frontendIPConfigurations: [
                {
                    name: 'test',
                    loadBalancerType: 'Public',
                    domainNameLabel: 'test',
                    publicIPAddressVersion: 'IPv4'
                }
            ],
            subscriptionId: '00000000-0000-1000-8000-000000000000',
            resourceGroupName: 'test-rg',
            location: 'westus'
        };

        it('merge', () => {
            let merged = loadBalancerSettings.merge({ settings: settings });
            expect(merged.frontendIPConfigurations[0].publicIpAddress.publicIPAllocationMethod).toEqual('Static');
            expect(merged.frontendIPConfigurations[0].publicIpAddress.domainNameLabel).toEqual('test');
            expect(merged.frontendIPConfigurations[0].publicIpAddress.publicIPAddressVersion).toEqual('IPv4');
        });

        it('userDefaults', () => {
            let defaults = {
                frontendIPConfigurations: [
                    {
                        name: 'xyz-test',
                        loadBalancerType: 'Internal',
                        domainNameLabel: 'xyz-test',
                        publicIPAddressVersion: 'IPv6'
                    }
                ]
            };

            let merged = loadBalancerSettings.merge({
                settings: settings,
                defaultSettings: defaults
            });

            expect(merged.frontendIPConfigurations[0].publicIpAddress.publicIPAllocationMethod).toEqual('Static');
            expect(merged.frontendIPConfigurations[0].publicIpAddress.domainNameLabel).toEqual('test');
            expect(merged.frontendIPConfigurations[0].publicIpAddress.publicIPAddressVersion).toEqual('IPv4');
        });

        it('validations', () => {
            let merged = loadBalancerSettings.merge({ settings: settings });
            let validations = validation.validate({
                settings: merged,
                validations: loadBalancerSettings.validations
            });
            expect(validations.length).toEqual(0);
        });

        it('validations with userDefaults', () => {
            let defaults = {
                frontendIPConfigurations: [
                    {
                        name: 'xyz-test',
                        loadBalancerType: 'Internal',
                        domainNameLabel: 'xyz-test',
                        publicIPAddressVersion: 'IPv6'
                    }
                ]
            };

            let merged = loadBalancerSettings.merge({
                settings: settings,
                defaultSettings: defaults
            });

            let validations = validation.validate({
                settings: merged,
                validations: loadBalancerSettings.validations
            });
            expect(validations.length).toEqual(0);
        });

        it('transform', () => {
            let merged = loadBalancerSettings.merge({ settings: settings});
            let transformed = loadBalancerSettings.transform(merged);
            expect(transformed.loadBalancer[0].properties.frontendIPConfigurations[0].properties.publicIpAddress).not.toEqual(null);
        });
    });
    describe('validations', () => {
        let settings = {
            frontendIPConfigurations: [
                {
                    name: 'test',
                    loadBalancerType: 'Public',
                    domainNameLabel: 'test',
                    publicIPAddressVersion: 'IPv4'
                }
            ],
            subscriptionId: '00000000-0000-1000-8000-000000000000',
            resourceGroupName: 'test-rg',
            location: 'westus'
        };
        let testSettings;
        beforeEach(() => {
            testSettings = _.cloneDeep(settings);
        });
        it('internalLoadBalancerSettings cannot be set when loadBalancerType is public', () => {
            testSettings.frontendIPConfigurations[0].internalLoadBalancerSettings = {};
            let merged = loadBalancerSettings.merge({ settings: testSettings });
            let validations = validation.validate({
                settings: merged,
                validations: loadBalancerSettings.validations
            });
            expect(validations.length).toEqual(1);
            expect(validations[0].name).toEqual('.frontendIPConfigurations[0].internalLoadBalancerSettings');
        });
        it('internalLoadBalancerSettings subnet name must be set', () => {
            testSettings.frontendIPConfigurations[0].loadBalancerType = 'Internal';
            testSettings.frontendIPConfigurations[0].internalLoadBalancerSettings = {
                privateIPAddress: '192.168.1.1'
            };
            let merged = loadBalancerSettings.merge({ settings: testSettings });
            let validations = validation.validate({
                settings: merged,
                validations: loadBalancerSettings.validations
            });
            expect(validations.length).toEqual(1);
            expect(validations[0].name).toEqual('.frontendIPConfigurations[0].internalLoadBalancerSettings.subnetName');
        });
        it('internalLoadBalancerSettings IP must be valid', () => {
            testSettings.frontendIPConfigurations[0].loadBalancerType = 'Internal';
            testSettings.frontendIPConfigurations[0].internalLoadBalancerSettings = {
                privateIPAddress: 'invalid',
                subnetName: 'foo'
            };
            let merged = loadBalancerSettings.merge({ settings: testSettings });
            let validations = validation.validate({
                settings: merged,
                validations: loadBalancerSettings.validations
            });
            expect(validations.length).toEqual(1);
            expect(validations[0].name).toEqual('.frontendIPConfigurations[0].internalLoadBalancerSettings.privateIPAddress');
        });
        it('valid probes', () => {
            testSettings.probes = [
                {
                    name: 'lbp1',
                    port: 80,
                    protocol: 'Http',
                    requestPath: '/'
                },
                {
                    name: 'lbp2',
                    port: 443,
                    protocol: 'Http',
                    requestPath: '/'
                }
            ];

            let merged = loadBalancerSettings.merge({ settings: testSettings });
            let validations = validation.validate({
                settings: merged,
                validations: loadBalancerSettings.validations
            });
            expect(validations.length).toEqual(0);
        });
        it('probes when protocol is http, requestPath must be set', () => {
            testSettings.probes = [
                {
                    name: 'lbp1',
                    port: 80,
                    protocol: 'Http'
                }
            ];

            let merged = loadBalancerSettings.merge({ settings: testSettings });
            let validations = validation.validate({
                settings: merged,
                validations: loadBalancerSettings.validations
            });
            expect(validations.length).toEqual(1);
            expect(validations[0].name).toEqual('.probes[0].requestPath');
        });
        it('probes when protocol is tcp, requestPath must not be set', () => {
            testSettings.probes = [
                {
                    name: 'lbp1',
                    port: 80,
                    protocol: 'Tcp',
                    requestPath: '/invalid'
                }
            ];

            let merged = loadBalancerSettings.merge({ settings: testSettings });
            let validations = validation.validate({
                settings: merged,
                validations: loadBalancerSettings.validations
            });
            expect(validations.length).toEqual(1);
            expect(validations[0].name).toEqual('.probes[0].requestPath');
        });
        it('valid loadBalancingRules', () => {
            testSettings.frontendIPConfigurations = [
                {
                    name: 'feConfig1',
                    loadBalancerType: 'Public'
                }
            ];
            testSettings.backendPools = [
                {
                    name: 'lb-bep1'
                },
                {
                    name: 'lb-bep2'
                }
            ];
            testSettings.loadBalancingRules = [
                {
                    name: 'lbr1',
                    frontendPort: 80,
                    backendPort: 80,
                    protocol: 'Tcp',
                    backendPoolName: 'lb-bep1',
                    frontendIPConfigurationName: 'feConfig1',
                    enableFloatingIP: false,
                    loadDistribution: 'SourceIP',
                    probeName: 'lbp1'
                },
                {
                    name: 'lbr2',
                    frontendPort: 443,
                    backendPort: 443,
                    protocol: 'Tcp',
                    backendPoolName: 'lb-bep2',
                    frontendIPConfigurationName: 'feConfig1',
                    enableFloatingIP: false,
                    probeName: 'lbp2'
                }
            ];
            testSettings.probes = [
                {
                    name: 'lbp1',
                    port: 80,
                    protocol: 'Http',
                    requestPath: '/'
                },
                {
                    name: 'lbp2',
                    port: 443,
                    protocol: 'Http',
                    requestPath: '/'
                }
            ];
            let merged = loadBalancerSettings.merge({ settings: testSettings });
            let validations = validation.validate({
                settings: merged,
                validations: loadBalancerSettings.validations
            });
            expect(validations.length).toEqual(0);
        });
        it('loadBalancingRules invalid frontendIPConfigurationName', () => {
            testSettings.frontendIPConfigurations = [
                {
                    name: 'feConfig1',
                    loadBalancerType: 'Public'
                }
            ];
            testSettings.backendPools = [
                {
                    name: 'lb-bep1'
                },
                {
                    name: 'lb-bep2'
                }
            ];
            testSettings.loadBalancingRules = [
                {
                    name: 'lbr1',
                    frontendPort: 80,
                    backendPort: 80,
                    protocol: 'Tcp',
                    backendPoolName: 'lb-bep1',
                    frontendIPConfigurationName: 'feConfig1',
                    enableFloatingIP: false,
                    loadDistribution: 'SourceIP',
                    probeName: 'lbp1'
                },
                {
                    name: 'lbr2',
                    frontendPort: 443,
                    backendPort: 443,
                    protocol: 'Tcp',
                    backendPoolName: 'lb-bep2',
                    frontendIPConfigurationName: 'invalid',
                    enableFloatingIP: false,
                    probeName: 'lbp2'
                }
            ];
            testSettings.probes = [
                {
                    name: 'lbp1',
                    port: 80,
                    protocol: 'Http',
                    requestPath: '/'
                },
                {
                    name: 'lbp2',
                    port: 443,
                    protocol: 'Http',
                    requestPath: '/'
                }
            ];
            let merged = loadBalancerSettings.merge({ settings: testSettings });
            let validations = validation.validate({
                settings: merged,
                validations: loadBalancerSettings.validations
            });
            expect(validations.length).toEqual(1);
            expect(validations[0].name).toEqual('.loadBalancingRules[1].frontendIPConfigurationName');
        });
        it('loadBalancingRules invalid backendPoolName', () => {
            testSettings.frontendIPConfigurations = [
                {
                    name: 'feConfig1',
                    loadBalancerType: 'Public'
                }
            ];
            testSettings.backendPools = [
                {
                    name: 'lb-bep1'
                },
                {
                    name: 'lb-bep2'
                }
            ];
            testSettings.loadBalancingRules = [
                {
                    name: 'lbr1',
                    frontendPort: 80,
                    backendPort: 80,
                    protocol: 'Tcp',
                    backendPoolName: 'invalid',
                    frontendIPConfigurationName: 'feConfig1',
                    enableFloatingIP: false,
                    loadDistribution: 'SourceIP',
                    probeName: 'lbp1'
                },
                {
                    name: 'lbr2',
                    frontendPort: 443,
                    backendPort: 443,
                    protocol: 'Tcp',
                    backendPoolName: 'lb-bep2',
                    frontendIPConfigurationName: 'feConfig1',
                    enableFloatingIP: false,
                    probeName: 'lbp2'
                }
            ];
            testSettings.probes = [
                {
                    name: 'lbp1',
                    port: 80,
                    protocol: 'Http',
                    requestPath: '/'
                },
                {
                    name: 'lbp2',
                    port: 443,
                    protocol: 'Http',
                    requestPath: '/'
                }
            ];
            let merged = loadBalancerSettings.merge({ settings: testSettings });
            let validations = validation.validate({
                settings: merged,
                validations: loadBalancerSettings.validations
            });
            expect(validations.length).toEqual(1);
            expect(validations[0].name).toEqual('.loadBalancingRules[0].backendPoolName');
        });
        it('loadBalancingRules invalid backendPoolName', () => {
            testSettings.frontendIPConfigurations = [
                {
                    name: 'feConfig1',
                    loadBalancerType: 'Public'
                }
            ];
            testSettings.backendPools = [
                {
                    name: 'lb-bep1'
                },
                {
                    name: 'lb-bep2'
                }
            ];
            testSettings.loadBalancingRules = [
                {
                    name: 'lbr1',
                    frontendPort: 80,
                    backendPort: 80,
                    protocol: 'Tcp',
                    backendPoolName: 'lb-bep1',
                    frontendIPConfigurationName: 'feConfig1',
                    enableFloatingIP: false,
                    loadDistribution: 'SourceIP',
                    probeName: 'invalid'
                },
                {
                    name: 'lbr2',
                    frontendPort: 443,
                    backendPort: 443,
                    protocol: 'Tcp',
                    backendPoolName: 'lb-bep2',
                    frontendIPConfigurationName: 'feConfig1',
                    enableFloatingIP: false,
                    probeName: 'lbp2'
                }
            ];
            testSettings.probes = [
                {
                    name: 'lbp1',
                    port: 80,
                    protocol: 'Http',
                    requestPath: '/'
                },
                {
                    name: 'lbp2',
                    port: 443,
                    protocol: 'Http',
                    requestPath: '/'
                }
            ];
            let merged = loadBalancerSettings.merge({ settings: testSettings });
            let validations = validation.validate({
                settings: merged,
                validations: loadBalancerSettings.validations
            });
            expect(validations.length).toEqual(1);
            expect(validations[0].name).toEqual('.loadBalancingRules[0].probeName');
        });
        it('loadBalancingRules idleTimeoutInMinutes cannot be specified when UDP', () => {
            testSettings.frontendIPConfigurations = [
                {
                    name: 'feConfig1',
                    loadBalancerType: 'Public'
                }
            ];
            testSettings.backendPools = [
                {
                    name: 'lb-bep1'
                },
                {
                    name: 'lb-bep2'
                }
            ];
            testSettings.loadBalancingRules = [
                {
                    name: 'lbr1',
                    frontendPort: 80,
                    backendPort: 80,
                    protocol: 'Tcp',
                    backendPoolName: 'lb-bep1',
                    frontendIPConfigurationName: 'feConfig1',
                    enableFloatingIP: false,
                    loadDistribution: 'SourceIP',
                    probeName: 'lbp1'
                },
                {
                    name: 'lbr2',
                    frontendPort: 443,
                    backendPort: 443,
                    protocol: 'Udp',
                    backendPoolName: 'lb-bep2',
                    frontendIPConfigurationName: 'feConfig1',
                    enableFloatingIP: false,
                    probeName: 'lbp2',
                    idleTimeoutInMinutes: 5
                }
            ];
            testSettings.probes = [
                {
                    name: 'lbp1',
                    port: 80,
                    protocol: 'Http',
                    requestPath: '/'
                },
                {
                    name: 'lbp2',
                    port: 443,
                    protocol: 'Http',
                    requestPath: '/'
                }
            ];
            let merged = loadBalancerSettings.merge({ settings: testSettings });
            let validations = validation.validate({
                settings: merged,
                validations: loadBalancerSettings.validations
            });
            expect(validations.length).toEqual(1);
            expect(validations[0].name).toEqual('.loadBalancingRules[1].idleTimeoutInMinutes');
        });
        it('loadBalancingRules idleTimeoutInMinutes must be between 4 and 30', () => {
            testSettings.frontendIPConfigurations = [
                {
                    name: 'feConfig1',
                    loadBalancerType: 'Public'
                }
            ];
            testSettings.backendPools = [
                {
                    name: 'lb-bep1'
                }
            ];
            testSettings.loadBalancingRules = [
                {
                    name: 'lbr1',
                    frontendPort: 80,
                    backendPort: 80,
                    protocol: 'Tcp',
                    backendPoolName: 'lb-bep1',
                    frontendIPConfigurationName: 'feConfig1',
                    enableFloatingIP: false,
                    loadDistribution: 'SourceIP',
                    probeName: 'lbp1',
                    idleTimeoutInMinutes: 1
                }
            ];
            testSettings.probes = [
                {
                    name: 'lbp1',
                    port: 80,
                    protocol: 'Http',
                    requestPath: '/'
                }
            ];
            let merged = loadBalancerSettings.merge({ settings: testSettings });
            let validations = validation.validate({
                settings: merged,
                validations: loadBalancerSettings.validations
            });
            expect(validations.length).toEqual(1);
            expect(validations[0].name).toEqual('.loadBalancingRules[0].idleTimeoutInMinutes');
        });

        it('valid inboundNatRules', () => {
            testSettings.frontendIPConfigurations = [
                {
                    name: 'feConfig1',
                    loadBalancerType: 'Public'
                }
            ];
            testSettings.inboundNatRules = [
                {
                    name: 'natP1',
                    frontendIPConfigurationName: 'feConfig1',
                    startingFrontendPort: 60001,
                    frontendPortRangeEnd: 60020,
                    backendPort: 3389,
                    protocol: 'Tcp'
                },
                {
                    name: 'natP2',
                    frontendIPConfigurationName: 'feConfig1',
                    startingFrontendPort: 55001,
                    frontendPortRangeEnd: 55020,
                    backendPort: 22,
                    protocol: 'Tcp'
                }
            ];
            let merged = loadBalancerSettings.merge({ settings: testSettings });
            let validations = validation.validate({
                settings: merged,
                validations: loadBalancerSettings.validations
            });
            expect(validations.length).toEqual(0);
        });
        it('inboundNatRules invalid frontendIPConfigurationName', () => {
            testSettings.frontendIPConfigurations = [
                {
                    name: 'feConfig1',
                    loadBalancerType: 'Public'
                }
            ];
            testSettings.inboundNatRules = [
                {
                    name: 'natP1',
                    frontendIPConfigurationName: 'feConfig1',
                    startingFrontendPort: 60001,
                    frontendPortRangeEnd: 60020,
                    backendPort: 3389,
                    protocol: 'Tcp'
                },
                {
                    name: 'natP2',
                    frontendIPConfigurationName: 'invalid',
                    startingFrontendPort: 55001,
                    frontendPortRangeEnd: 55020,
                    backendPort: 22,
                    protocol: 'Tcp'
                }
            ];
            let merged = loadBalancerSettings.merge({ settings: testSettings });
            let validations = validation.validate({
                settings: merged,
                validations: loadBalancerSettings.validations
            });
            expect(validations.length).toEqual(1);
            expect(validations[0].name).toEqual('.inboundNatRules[1].frontendIPConfigurationName');
        });
        it('inboundNatRules idleTimeoutInMinutes should not be specified when UDP', () => {
            testSettings.frontendIPConfigurations = [
                {
                    name: 'feConfig1',
                    loadBalancerType: 'Public'
                }
            ];
            testSettings.inboundNatRules = [
                {
                    name: 'natP1',
                    frontendIPConfigurationName: 'feConfig1',
                    startingFrontendPort: 60001,
                    frontendPortRangeEnd: 60020,
                    backendPort: 3389,
                    protocol: 'Udp',
                    idleTimeoutInMinutes: 5
                }
            ];
            let merged = loadBalancerSettings.merge({ settings: testSettings });
            let validations = validation.validate({
                settings: merged,
                validations: loadBalancerSettings.validations
            });
            expect(validations.length > 0).toEqual(true);
            expect(validations[0].name).toEqual('.inboundNatRules[0].idleTimeoutInMinutes');
        });
        it('inboundNatRules idleTimeoutInMinutes should be between 4 and 30', () => {
            testSettings.frontendIPConfigurations = [
                {
                    name: 'feConfig1',
                    loadBalancerType: 'Public'
                }
            ];
            testSettings.inboundNatRules = [
                {
                    name: 'natP1',
                    frontendIPConfigurationName: 'feConfig1',
                    startingFrontendPort: 60001,
                    frontendPortRangeEnd: 60020,
                    backendPort: 3389,
                    protocol: 'Tcp',
                    idleTimeoutInMinutes: 55
                }
            ];
            let merged = loadBalancerSettings.merge({ settings: testSettings });
            let validations = validation.validate({
                settings: merged,
                validations: loadBalancerSettings.validations
            });
            expect(validations.length > 0).toEqual(true);
            expect(validations[0].name).toEqual('.inboundNatRules[0].idleTimeoutInMinutes');
        });

        it('valid inboundNatPools', () => {
            testSettings.frontendIPConfigurations = [
                {
                    name: 'feConfig1',
                    loadBalancerType: 'Public'
                }
            ];
            testSettings.inboundNatPools = [
                {
                    name: 'natP1',
                    frontendIPConfigurationName: 'feConfig1',
                    startingFrontendPort: 60001,
                    frontendPortRangeEnd: 60020,
                    backendPort: 3389,
                    protocol: 'Tcp'
                },
                {
                    name: 'natP2',
                    frontendIPConfigurationName: 'feConfig1',
                    startingFrontendPort: 55001,
                    frontendPortRangeEnd: 55020,
                    backendPort: 22,
                    protocol: 'Tcp'
                }
            ];
            let merged = loadBalancerSettings.merge({ settings: testSettings });
            let validations = validation.validate({
                settings: merged,
                validations: loadBalancerSettings.validations
            });
            expect(validations.length).toEqual(0);
        });
        it('inboundNatPools invalid frontendIPConfigurationName', () => {
            testSettings.frontendIPConfigurations = [
                {
                    name: 'feConfig1',
                    loadBalancerType: 'Public'
                }
            ];
            testSettings.inboundNatPools = [
                {
                    name: 'natP1',
                    frontendIPConfigurationName: 'feConfig1',
                    startingFrontendPort: 60001,
                    frontendPortRangeEnd: 60020,
                    backendPort: 3389,
                    protocol: 'Tcp'
                },
                {
                    name: 'natP2',
                    frontendIPConfigurationName: 'invalid',
                    startingFrontendPort: 55001,
                    frontendPortRangeEnd: 55020,
                    backendPort: 22,
                    protocol: 'Tcp'
                }
            ];
            let merged = loadBalancerSettings.merge({ settings: testSettings });
            let validations = validation.validate({
                settings: merged,
                validations: loadBalancerSettings.validations
            });
            expect(validations.length).toEqual(1);
            expect(validations[0].name).toEqual('.inboundNatPools[1].frontendIPConfigurationName');
        });
    });

    if (global.testConfiguration.runTransform) {
        describe('Transform', () => {
            let settings = {
                frontendIPConfigurations: [
                    {
                        name: 'test',
                        loadBalancerType: 'Public',
                        domainNameLabel: 'test',
                        publicIPAddressVersion: 'IPv4'
                    }
                ],
                subscriptionId: '00000000-0000-1000-8000-000000000000',
                resourceGroupName: 'test-rg',
                location: 'westus'
            };
            let testSettings;
            beforeEach(() => {
                testSettings = _.cloneDeep(settings);
            });

            it('loadBalancingRules idleTimeoutInMinutes is specified', () => {
                testSettings.frontendIPConfigurations = [
                    {
                        name: 'feConfig1',
                        loadBalancerType: 'Public'
                    }
                ];
                testSettings.backendPools = [
                    {
                        name: 'lb-bep1'
                    }
                ];
                testSettings.loadBalancingRules = [
                    {
                        name: 'lbr1',
                        frontendPort: 80,
                        backendPort: 80,
                        protocol: 'Tcp',
                        backendPoolName: 'lb-bep1',
                        frontendIPConfigurationName: 'feConfig1',
                        enableFloatingIP: false,
                        loadDistribution: 'SourceIP',
                        probeName: 'lbp1',
                        idleTimeoutInMinutes: 5
                    }
                ];
                testSettings.probes = [
                    {
                        name: 'lbp1',
                        port: 80,
                        protocol: 'Http',
                        requestPath: '/'
                    }
                ];
                let merged = loadBalancerSettings.merge({ settings: testSettings });
                let result = loadBalancerSettings.transform(merged);
                expect(result.loadBalancer[0].properties.loadBalancingRules[0].properties.idleTimeoutInMinutes).toEqual(5);
            });
            it('loadBalancingRules idleTimeoutInMinutes takes default when not specified', () => {
                testSettings.frontendIPConfigurations = [
                    {
                        name: 'feConfig1',
                        loadBalancerType: 'Public'
                    }
                ];
                testSettings.backendPools = [
                    {
                        name: 'lb-bep1'
                    }
                ];
                testSettings.loadBalancingRules = [
                    {
                        name: 'lbr1',
                        frontendPort: 80,
                        backendPort: 80,
                        protocol: 'Tcp',
                        backendPoolName: 'lb-bep1',
                        frontendIPConfigurationName: 'feConfig1',
                        enableFloatingIP: false,
                        loadDistribution: 'SourceIP',
                        probeName: 'lbp1'
                    }
                ];
                testSettings.probes = [
                    {
                        name: 'lbp1',
                        port: 80,
                        protocol: 'Http',
                        requestPath: '/'
                    }
                ];
                let merged = loadBalancerSettings.merge({ settings: testSettings });
                let result = loadBalancerSettings.transform(merged);
                expect(result.loadBalancer[0].properties.loadBalancingRules[0].properties.idleTimeoutInMinutes).toEqual(4);
            });
        });
    }
});