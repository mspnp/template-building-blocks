'use strict';

let _ = require('lodash');
let v = require('./validation');
let resources = require('./resources');
let publicIpAddressSettings = require('./publicIpAddressSettings');

const LOADBALANCER_SETTINGS_DEFAULTS = {
    frontendIPConfigurations: [
        {
            name: 'default-feConfig',
            loadBalancerType: 'Public'
        }
    ],
    loadBalancingRules: [
        {
            loadDistribution: 'Default'
        }
    ],
    probes: [
        {
            intervalInSeconds: 15,
            numberOfProbes: 2
        }
    ],
    backendPools: [],
    inboundNatRules: [{
        enableFloatingIP: false
    }],
    inboundNatPools: [],
    tags: {
        'deployedWith': 'bbv2'
    }
};

function merge({ settings, buildingBlockSettings, defaultSettings }) {

    let defaults = (defaultSettings) ? [LOADBALANCER_SETTINGS_DEFAULTS, defaultSettings] : LOADBALANCER_SETTINGS_DEFAULTS;
    let mergedSettings = v.merge(settings, defaults, defaultsCustomizer);

    mergedSettings.frontendIPConfigurations = _.map(mergedSettings.frontendIPConfigurations, (config) => {
        // If needed, we need to build up a publicIpAddress from the information we have here so it can be merged and validated.
        if (config.loadBalancerType === 'Public') {
            let publicIpAddress = {
                name: `${settings.name}-${config.name}-pip`,
                publicIPAllocationMethod: 'Static',
                domainNameLabel: config.domainNameLabel,
                publicIPAddressVersion: config.publicIPAddressVersion,
                resourceGroupName: mergedSettings.resourceGroupName,
                subscriptionId: mergedSettings.subscriptionId,
                location: mergedSettings.location
            };
            config.publicIpAddress = publicIpAddressSettings.merge({ settings: publicIpAddress });
        }
        return config;
    });

    return mergedSettings;
}

function defaultsCustomizer(objValue, srcValue, key) {
    if (key === 'frontendIPConfigurations') {
        if (_.isNil(srcValue) || srcValue.length === 0) {
            return objValue;
        } else {
            delete objValue[0].name;
        }
    }
}

let validLoadBalancerTypes = ['Public', 'Internal'];
let validProtocols = ['Tcp', 'Udp'];
let validProbeProtocols = ['Http', 'Tcp'];
let validLoadDistributions = ['Default', 'SourceIP', 'SourceIPProtocol'];

let isValidLoadBalancerType = (loadBalancerType) => {
    return v.utilities.isStringInArray(loadBalancerType, validLoadBalancerTypes);
};

let isValidProtocol = (protocol) => {
    return v.utilities.isStringInArray(protocol, validProtocols);
};

let isValidProbeProtocol = (probeProtocol) => {
    return v.utilities.isStringInArray(probeProtocol, validProbeProtocols);
};

let isValidLoadDistribution = (loadDistribution) => {
    return v.utilities.isStringInArray(loadDistribution, validLoadDistributions);
};

let frontendIPConfigurationValidations = {
    name: v.validationUtilities.isNotNullOrWhitespace,
    loadBalancerType: (value) => {
        return {
            result: isValidLoadBalancerType(value),
            message: `Valid values are ${validLoadBalancerTypes.join(' ,')}`
        };
    },
    internalLoadBalancerSettings: (value, parent) => {
        if (parent.loadBalancerType === 'Public') {
            if (!_.isNil(value)) {
                return {
                    result: false,
                    message: 'If loadBalancerType is Public, internalLoadBalancerSettings cannot be specified'
                };
            } else {
                return { result: true };
            }
        }
        let internalLoadBalancerSettingsValidations = {
            privateIPAddress: (value) => {
                return {
                    result: v.utilities.networking.isValidIpAddress(value),
                    message: 'Value must be a valid IP address'
                };
            },
            subnetName: v.validationUtilities.isNotNullOrWhitespace,
        };
        return {
            validations: internalLoadBalancerSettingsValidations
        };
    },
    publicIpAddress: (value) => {
        return _.isNil(value) ? {
            result: true
        } : {
                validations: publicIpAddressSettings.validations
            };
    }
};

let probeValidations = {
    name: v.validationUtilities.isNotNullOrWhitespace,
    protocol: (value) => {
        return {
            result: isValidProbeProtocol(value),
            message: `Valid values are ${validProbeProtocols.join(',')}`
        };
    },
    port: (value) => {
        return {
            result: _.inRange(_.toSafeInteger(value), 1, 65536),
            message: 'Valid values are from 1 to 65535'
        };
    },
    intervalInSeconds: (value) => {
        return {
            // TODO - Not sure what the upper limit is, so I chose five minutes at random.
            result: _.inRange(_.toSafeInteger(value), 5, 300),
            message: 'Valid values are from 5 to 300'
        };
    },
    requestPath: (value, parent) => {
        let result = {
            result: true
        };

        if ((parent.protocol === 'Http') && (v.utilities.isNullOrWhitespace(value))) {
            result = {
                result: false,
                message: 'If protocol is Http, requestPath cannot be null, undefined, or only whitespace'
            };
        } else if ((parent.protocol === 'Tcp') && (!_.isNil(value))) {
            result = {
                result: false,
                message: 'If protocol is Tcp, requestPath cannot be provided'
            };
        }

        return result;
    },
    numberOfProbes: (value) => {
        return {
            // TODO: get the range for # of probes property
            result: _.inRange(_.toSafeInteger(value), 1, 20),
            message: 'Valid values are from 1 to 65535'
        };
    }
};

let loadBalancerValidations = {
    frontendIPConfigurations: () => {
        return {
            validations: frontendIPConfigurationValidations
        };
    },
    loadBalancingRules: (value, parent) => {
        let baseSettings = parent;
        let loadBalancingRuleValidations = {
            name: v.validationUtilities.isNotNullOrWhitespace,
            frontendIPConfigurationName: (value, parent) => {
                let result = {
                    result: false,
                    message: `Invalid frontendIPConfigurationName. loadBalancingRule: ${parent.name}, frontendIPConfigurationName: ${value}`
                };
                let matched = _.filter(baseSettings.frontendIPConfigurations, (o) => { return (o.name === value); });

                return ((matched.length > 0) ? { result: true } : result);
            },
            backendPoolName: (value, parent) => {
                let result = {
                    result: false,
                    message: `Invalid backendPoolName. loadBalancingRule: ${parent.name}, backendPoolName: ${value}`
                };
                let matched = _.filter(baseSettings.backendPools, (o) => { return (o.name === value); });

                return ((matched.length > 0) ? { result: true } : result);
            },
            frontendPort: (value) => {
                return {
                    result: _.inRange(_.toSafeInteger(value), 1, 65535),
                    message: 'Valid values are from 1 to 65534'
                };
            },
            backendPort: (value) => {
                return {
                    result: _.inRange(_.toSafeInteger(value), 1, 65536),
                    message: 'Valid values are from 1 to 65535'
                };
            },
            protocol: (value) => {
                return {
                    result: isValidProtocol(value),
                    message: `Valid values are ${validProtocols.join(',')}`
                };
            },
            enableFloatingIP: v.validationUtilities.isBoolean,
            idleTimeoutInMinutes: (value, parent) => {
                let result = {
                    result: true
                };

                if ((parent.protocol === 'Tcp') && (!_.isNil(value) && !_.inRange(value, 4, 31))) {
                    result = {
                        result: false,
                        message: 'Valid values are from 4 to 30'
                    };
                } else if ((parent.protocol === 'Udp') && (!_.isNil(value))) {
                    result = {
                        result: false,
                        message: 'If protocol is Udp, idleTimeoutInMinutes cannot be specified'
                    };
                }

                return result;
            },
            probeName: (value, parent) => {
                let result = {
                    result: false,
                    message: `Invalid probeName. loadBalancingRule: ${parent.name}, probeName: ${value}`
                };
                let matched = _.filter(baseSettings.probes, (o) => { return (o.name === value); });

                return ((matched.length > 0) ? { result: true } : result);
            },
            loadDistribution: (value) => {
                let result = {
                    result: true
                };

                // loadDistribution is not required.
                if (!_.isUndefined(value)) {
                    result = {
                        result: isValidLoadDistribution(value),
                        message: `Valid values are ${validLoadDistributions.join(',')}`
                    };
                }

                return result;
            }
        };
        return {
            validations: loadBalancingRuleValidations
        };
    },
    probes: () => {
        return {
            validations: probeValidations
        };
    },
    backendPools: () => {
        let backendPoolsValidations = {
            name: v.validationUtilities.isNotNullOrWhitespace,
        };
        return {
            validations: backendPoolsValidations
        };
    },
    inboundNatRules: (value, parent) => {
        let baseSettings = parent;
        let inboundNatRuleValidations = {
            name: v.validationUtilities.isNotNullOrWhitespace,
            protocol: (value) => {
                return {
                    result: isValidProtocol(value),
                    message: `Valid values are ${validProtocols.join(',')}`
                };
            },
            startingFrontendPort: (value) => {
                return {
                    result: _.inRange(_.toSafeInteger(value), 1, 65535),
                    message: 'Valid values are from 1 to 65534'
                };
            },
            backendPort: (value) => {
                return {
                    result: _.inRange(_.toSafeInteger(value), 1, 65536),
                    message: 'Valid values are from 1 to 65535'
                };
            },
            idleTimeoutInMinutes: (value, parent) => {
                let result = {
                    result: true
                };

                if ((parent.protocol === 'Tcp') && (!_.isNil(value) && !_.inRange(value, 4, 31))) {
                    result = {
                        result: false,
                        message: 'Valid values are from 4 to 30'
                    };
                } else if ((parent.protocol === 'Udp') && (!_.isNil(value))) {
                    result = {
                        result: false,
                        message: 'If protocol is Udp, idleTimeoutInMinutes cannot be specified'
                    };
                }

                return result;
            },
            enableFloatingIP: v.validationUtilities.isBoolean,
            frontendIPConfigurationName: (value, parent) => {
                let result = {
                    result: false,
                    message: `Invalid frontendIPConfigurationName. inboundNatRule: ${parent.name}, frontendIPConfigurationName: ${value}`
                };
                let matched = _.filter(baseSettings.frontendIPConfigurations, (o) => { return (o.name === value); });

                return ((matched.length > 0) ? { result: true } : result);
            }
        };
        return {
            validations: inboundNatRuleValidations
        };
    },
    inboundNatPools: (value, parent) => {
        let baseSettings = parent;
        let inboundNatPoolValidations = {
            name: v.validationUtilities.isNotNullOrWhitespace,
            protocol: (value) => {
                return {
                    result: isValidProtocol(value),
                    message: `Valid values are ${validProtocols.join(',')}`
                };
            },
            startingFrontendPort: (value) => {
                return {
                    result: _.inRange(_.toSafeInteger(value), 1, 65535),
                    message: 'Valid values are from 1 to 65534'
                };
            },
            frontendPortRangeEnd: (value) => {
                return {
                    result: _.inRange(_.toSafeInteger(value), 1, 65535),
                    message: 'Valid values are from 1 to 65534'
                };
            },
            backendPort: (value) => {
                return {
                    result: _.inRange(_.toSafeInteger(value), 1, 65536),
                    message: 'Valid values are from 1 to 65535'
                };
            },
            frontendIPConfigurationName: (value, parent) => {
                let result = {
                    result: false,
                    message: `Invalid frontendIPConfigurationName. inboundNatPool: ${parent.name}, frontendIPConfigurationName: ${value}`
                };
                let matched = _.filter(baseSettings.frontendIPConfigurations, (o) => { return (o.name === value); });

                return ((matched.length > 0) ? { result: true } : result);
            }
        };
        return {
            validations: inboundNatPoolValidations
        };
    }
};

let processProperties = {
    frontendIPConfigurations: (value, key, parent, properties) => {
        let feIpConfigs = [];
        value.forEach((config) => {
            if (config.loadBalancerType === 'Internal') {
                feIpConfigs.push({
                    name: config.name,
                    properties: {
                        privateIPAllocationMethod: 'Static',
                        privateIPAddress: config.internalLoadBalancerSettings.privateIPAddress,
                        subnet: {
                            id: resources.resourceId(parent.virtualNetwork.subscriptionId, parent.virtualNetwork.resourceGroupName, 'Microsoft.Network/virtualNetworks/subnets', parent.virtualNetwork.name, config.internalLoadBalancerSettings.subnetName),
                        }
                    }
                });
            } else if (config.loadBalancerType === 'Public') {
                feIpConfigs.push({
                    name: config.name,
                    properties: {
                        privateIPAllocationMethod: 'Dynamic',
                        publicIPAddress: {
                            id: resources.resourceId(parent.subscriptionId, parent.resourceGroupName, 'Microsoft.Network/publicIPAddresses', config.publicIpAddress.name)
                        }
                    }
                });
            }
        });
        properties['frontendIPConfigurations'] = feIpConfigs;
    },
    loadBalancingRules: (value, key, parent, properties) => {
        let lbRules = [];
        value.forEach((rule) => {
            let lbRule = {
                name: rule.name,
                properties: {
                    frontendIPConfiguration: {
                        id: resources.resourceId(parent.subscriptionId, parent.resourceGroupName, 'Microsoft.Network/loadBalancers/frontendIPConfigurations', parent.name, rule.frontendIPConfigurationName)
                    },
                    backendAddressPool: {
                        id: resources.resourceId(parent.subscriptionId, parent.resourceGroupName, 'Microsoft.Network/loadBalancers/backendAddressPools', parent.name, rule.backendPoolName)
                    },
                    frontendPort: rule.frontendPort,
                    backendPort: rule.backendPort,
                    protocol: rule.protocol,
                    enableFloatingIP: rule.enableFloatingIP,
                    loadDistribution: rule.loadDistribution,
                    probe: {
                        id: resources.resourceId(parent.subscriptionId, parent.resourceGroupName, 'Microsoft.Network/loadBalancers/probes', parent.name, rule.probeName)
                    },
                }
            };
            if (!_.isNil(rule.idleTimeoutInMinutes)) {
                lbRule.properties.idleTimeoutInMinutes = rule.idleTimeoutInMinutes;
            }
            lbRules.push(lbRule);
        });
        properties['loadBalancingRules'] = lbRules;
    },
    probes: (value, key, parent, properties) => {
        let probes = [];
        value.forEach((probe) => {
            probes.push({
                name: probe.name,
                properties: {
                    port: probe.port,
                    protocol: probe.protocol,
                    requestPath: probe.requestPath,
                    intervalInSeconds: probe.intervalInSeconds,
                    numberOfProbes: probe.numberOfProbes
                }
            });
        });
        properties['probes'] = probes;
    },
    backendPools: (value, key, parent, properties) => {
        properties['backendAddressPools'] = _.map(value, (pool) => { return { name: pool.name }; });
    },
    inboundNatRules: (value, key, parent, properties) => {
        let natRules = [];
        value.forEach((rule) => {
            for (let i = 0; i < parent.vmCount; i++) {
                let natRule = {
                    name: `${rule.name}-${i}`,
                    properties: {
                        frontendIPConfiguration: {
                            id: resources.resourceId(parent.subscriptionId, parent.resourceGroupName, 'Microsoft.Network/loadBalancers/frontendIPConfigurations', parent.name, rule.frontendIPConfigurationName)
                        },
                        protocol: rule.protocol,
                        enableFloatingIP: rule.enableFloatingIP,
                        frontendPort: rule.startingFrontendPort + i,
                        backendPort: rule.backendPort
                    }
                };
                if (!_.isNil(rule.idleTimeoutInMinutes)) {
                    natRule.properties.idleTimeoutInMinutes = rule.idleTimeoutInMinutes;
                }
                natRules.push(natRule);
            }
        });
        properties['inboundNatRules'] = natRules;
    },
    inboundNatPools: (value, key, parent, properties) => {
        let natPools = [];
        value.forEach((pool) => {
            natPools.push({
                name: pool.name,
                properties: {
                    frontendIPConfiguration: {
                        id: resources.resourceId(parent.subscriptionId, parent.resourceGroupName, 'Microsoft.Network/loadBalancers/frontendIPConfigurations', parent.name, pool.frontendIPConfigurationName)
                    },
                    protocol: pool.protocol,
                    frontendPortRangeStart: pool.startingFrontendPort,
                    // TODO: infer frontendPortRangeEnd from vmCount
                    frontendPortRangeEnd: pool.frontendPortRangeEnd,
                    backendPort: pool.backendPort
                }
            });
        });
        properties['inboundNatPools'] = natPools;
    }
};

function transform(param) {
    let accumulator = {};

    // Get all the publicIpAddresses required for the load balancer
    let publicConfigs = _.filter(param.frontendIPConfigurations, c => { return c.loadBalancerType === 'Public'; });
    let pips = _.map(publicConfigs, (config) => {
        if (config.loadBalancerType === 'Public') {
            return publicIpAddressSettings.transform(config.publicIpAddress).publicIpAddresses;
        }
    });
    if (pips.length > 0) {
        accumulator['publicIpAddresses'] = pips;
    }

    // transform all properties of the loadbalancerSettings in RP shape
    let lbProperties = _.transform(param, (properties, value, key, obj) => {
        if (typeof processProperties[key] === 'function') {
            processProperties[key](value, key, obj, properties);
        }
        return properties;
    }, {});

    accumulator['loadBalancer'] = [{
        name: param.name,
        resourceGroupName: param.resourceGroupName,
        subscriptionId: param.subscriptionId,
        location: param.location,
        properties: lbProperties
    }];

    return accumulator;
}

exports.merge = merge;
exports.validations = loadBalancerValidations;
exports.transform = transform;
