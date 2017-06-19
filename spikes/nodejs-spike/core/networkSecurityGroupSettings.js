'use strict';

let _ = require('lodash');
let v = require('./validation.js');
let r = require('./resources.js');

let networkSecurityGroupSettingsDefaults = [
    {
        virtualNetworks: [
            {
                subnets: []
            }
        ],
        networkInterfaces: [],
        securityRules: [],
        tags: {}
    }
];

let validProtocols = ['TCP', 'UDP', '*'];
let validDefaultTags = ['VirtualNetwork', 'AzureLoadBalancer', 'Internet', '*'];
let validDirections = ['Inbound', 'Outbound'];
let validAccesses = ['Allow', 'Deny'];

let isValidProtocol = (protocol) => {
    return v.utilities.isStringInArray(protocol, validProtocols);
};

let isValidAddressPrefix = (addressPrefix) => {
    return ((v.utilities.networking.isValidIpAddress(addressPrefix)) ||
        (v.utilities.networking.isValidCidr(addressPrefix)) ||
        (v.utilities.isStringInArray(addressPrefix, validDefaultTags)));
};

let isValidDirection = (direction) => {
    return v.utilities.isStringInArray(direction, validDirections);
};

let isValidPriority = (priority) => {
    priority = _.toNumber(priority);
    return ((!_.isUndefined(priority)) && (_.isFinite(priority)) && (_.inRange(priority, 100, 4097)));
};

let isValidAccess = (access) => {
    return v.utilities.isStringInArray(access, validAccesses);
};

let networkSecurityGroupSettingsSecurityRulesValidations = {
    name: v.validationUtilities.isNotNullOrWhitespace,
    protocol: (value) => {
        return {
            result: isValidProtocol(value),
            message: `Valid values are ${validProtocols.join(',')}`
        };
    },
    sourcePortRange: v.validationUtilities.isValidPortRange,
    destinationPortRange: v.validationUtilities.isValidPortRange,
    sourceAddressPrefix: (value) => {
        return {
            result: isValidAddressPrefix(value),
            message: `Valid values are an IPAddress, a CIDR, or one of the following values: ${validDefaultTags.join(',')}`
        };
    },
    destinationAddressPrefix: (value) => {
        return {
            result: isValidAddressPrefix(value),
            message: `Valid values are an IPAddress, a CIDR, or one of the following values: ${validDefaultTags.join(',')}`
        };
    },
    direction: (value) => {
        return {
            result: isValidDirection(value),
            message: `Valid values are ${validDirections.join(',')}`
        };
    },
    priority: (value) => {
        return {
            result: isValidPriority(value),
            message: 'Valid value is between 100 and 4096, inclusive'
        };
    },
    access: (value) => {
        return {
            result: isValidAccess(value),
            message: `Valid values are ${validAccesses.join(',')}`
        };
    }
};

let virtualNetworkValidations = {
    name: v.validationUtilities.isNotNullOrWhitespace,
    subnets: (value) => {
        if ((_.isNil(value)) || (value.length === 0)) {
            return {
                result: false,
                message: 'Value cannot be null, undefined, or an empty array'
            };
        } else {
            return {
                validations: v.validationUtilities.isNotNullOrWhitespace
            };
        }
    }
};

let networkInterfaceValidations = {
    name: v.validationUtilities.isNotNullOrWhitespace
};

let networkSecurityGroupSettingsValidations = {
    name: v.validationUtilities.isNotNullOrWhitespace,
    tags: v.tagsValidations,
    securityRules: (value) => {
        // We allow empty arrays
        let result = {
            result: true
        };

        if (value.length > 0) {
            // We need to validate if the array isn't empty
            result = {
                validations: networkSecurityGroupSettingsSecurityRulesValidations
            };
        }

        return result;
    },
    virtualNetworks: (value) => {
        // We allow empty arrays
        let result = {
            result: true
        };

        if (value.length > 0) {
            // We need to validate if the array isn't empty
            result = {
                validations: virtualNetworkValidations
            };
        }

        return result;
    },
    networkInterfaces: (value) => {
        // We allow empty arrays
        let result = {
            result: true
        };

        if (value.length > 0) {
            // We need to validate if the array isn't empty
            result = {
                validations: networkInterfaceValidations
            };
        }

        return result;
    }
};

function transform(settings) {
    let result = {
        name: settings.name,
        id: r.resourceId(settings.subscriptionId, settings.resourceGroupName, 'Microsoft.Network/networkSecurityGroups', settings.name),
        resourceGroupName: settings.resourceGroupName,
        subscriptionId: settings.subscriptionId,
        location: settings.location,
        properties: {
            securityRules: _.map(settings.securityRules, (value) => {
                let result = {
                    name: value.name,
                    tags: settings.tags,
                    properties: {
                        direction: value.direction,
                        priority: value.priority,
                        sourceAddressPrefix: value.sourceAddressPrefix,
                        destinationAddressPrefix: value.destinationAddressPrefix,
                        sourcePortRange: value.sourcePortRange,
                        destinationPortRange: value.destinationPortRange,
                        access: value.access,
                        protocol: value.protocol
                    }
                };

                return result;
            })
        }
    };

    return result;
}

let merge = ({ settings, buildingBlockSettings, defaultSettings = networkSecurityGroupSettingsDefaults }) => {
    let merged = r.setupResources(settings, buildingBlockSettings, (parentKey) => {
        return ((parentKey === null) || (v.utilities.isStringInArray(parentKey, ['virtualNetworks', 'networkInterfaces'])));
    });

    return v.merge(merged, defaultSettings);
};

function process ({ settings, buildingBlockSettings }) {
    if (_.isPlainObject(settings)) {
        settings = [settings];
    }

    let buildingBlockErrors = v.validate({
        settings: buildingBlockSettings,
        validations: {
            subscriptionId: v.validationUtilities.isGuid,
            resourceGroupName: v.validationUtilities.isNotNullOrWhitespace,
        }
    });

    if (buildingBlockErrors.length > 0) {
        throw new Error(JSON.stringify(buildingBlockErrors));
    }

    let results = merge({
        settings: settings,
        buildingBlockSettings: buildingBlockSettings
    });

    let errors = v.validate({
        settings: results,
        validations: networkSecurityGroupSettingsValidations
    });

    if (errors.length > 0) {
        throw new Error(JSON.stringify(errors));
    }

    results = _.transform(results, (result, setting) => {
        result.networkSecurityGroups.push(transform(setting));
        if (setting.virtualNetworks.length > 0) {
            result.subnets = result.subnets.concat(_.transform(setting.virtualNetworks, (result, virtualNetwork) => {
                _.each(virtualNetwork.subnets, (subnet) => {
                    result.push({
                        id: r.resourceId(virtualNetwork.subscriptionId, virtualNetwork.resourceGroupName, 'Microsoft.Network/virtualNetworks/subnets',
                            virtualNetwork.name, subnet),
                        properties: {
                            networkSecurityGroup: {
                                id: r.resourceId(setting.subscriptionId, setting.resourceGroupName, 'Microsoft.Network/networkSecurityGroups', setting.name),
                            }
                        }
                    });
                });
            }, []));
        }

        if (setting.networkInterfaces.length > 0) {
            result.networkInterfaces = result.networkInterfaces.concat(_.transform(setting.networkInterfaces, (result, networkInterface) => {
                result.push({
                    id: r.resourceId(networkInterface.subscriptionId, networkInterface.resourceGroupName, 'Microsoft.Network/networkInterfaces',
                        networkInterface.name),
                    properties: {
                        networkSecurityGroup: {
                            id: r.resourceId(setting.subscriptionId, setting.resourceGroupName, 'Microsoft.Network/networkSecurityGroups', setting.name),
                        }
                    }
                });
            }, []));
        }
    }, {
        networkSecurityGroups: [],
        subnets: [],
        networkInterfaces: []
    });

    return results;
}

exports.process = process;
