'use strict';

let _ = require('lodash');
let v = require('./validation');
let r = require('./resources');

const ROUTETABLE_SETTINGS_DEFAULTS = {
    virtualNetworks: [
        {
            subnets: []
        }
    ],
    routes: [],
    tags: {
        'deployedWith': 'bbv2'
    }
};

let validNextHopTypes = ['VirtualNetworkGateway', 'VnetLocal', 'Internet', 'HyperNetGateway', 'None'];

let isValidNextHop = (nextHop) => {
    return ((v.utilities.networking.isValidIpAddress(nextHop)) ||
        (v.utilities.isStringInArray(nextHop, validNextHopTypes)));
};

let routeValidations = {
    name: v.validationUtilities.isNotNullOrWhitespace,
    addressPrefix: v.validationUtilities.isValidCidr,
    nextHop: (value) => {
        return {
            result: isValidNextHop(value),
            message: `Valid values are an IPAddress or one of the following values: ${validNextHopTypes.join(',')}`
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

let routeTableSettingsValidations = {
    name: v.validationUtilities.isNotNullOrWhitespace,
    tags: v.tagsValidations,
    routes: (value) => {
        if ((_.isNil(value)) || (value.length === 0)) {
            return {
                result: false,
                message: 'Value cannot be null, undefined, or an empty array'
            };
        }

        // Validate route names
        let names = _.reduce(value, (accumulator, value) => {
            if (!v.utilities.isNullOrWhitespace(value.name)) {
                if (!accumulator[value.name]) {
                    accumulator[value.name] = 0;
                }
                accumulator[value.name] = accumulator[value.name] + 1;
            }

            return accumulator;
        }, {});

        let duplicates = _.reduce(names, (accumulator, value, key) => {
            if (value > 1) {
                accumulator.push(key);
            }

            return accumulator;
        }, []);

        if (duplicates.length > 0) {
            return {
                result: false,
                message: `Duplicate route names: ${duplicates.join(',')}`
            };
        }

        return {
            validations: routeValidations
        };
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
    }
};

let validate = (settings) => {
    let errors = v.validate({
        settings: settings,
        validations: routeTableSettingsValidations
    });

    _.map(settings, (config) => {
        if (!_.isNil(config.virtualNetworks) && config.virtualNetworks.length > 0) {
            _.map(config.virtualNetworks, (vnet) => {
                if (vnet.location !== config.location) {
                    errors.push({
                        result: false,
                        message: 'Virtual network and route table location cannot be different'
                    });
                }
                if (vnet.subscriptionId !== config.subscriptionId) {
                    errors.push({
                        result: false,
                        message: 'Virtual network and route table subscriptionId cannot be different'
                    });
                }
            });
        }
    });
    return errors;
};

let merge = ({ settings, buildingBlockSettings, defaultSettings }) => {
    let defaults = (defaultSettings) ? [ROUTETABLE_SETTINGS_DEFAULTS, defaultSettings] : ROUTETABLE_SETTINGS_DEFAULTS;

    let merged = r.setupResources(settings, buildingBlockSettings, (parentKey) => {
        return ((parentKey === null) || (parentKey === 'virtualNetworks'));
    });

    return v.merge(merged, defaults);
};

function transform(settings) {
    let result = {
        name: settings.name,
        tags: settings.tags,
        id: r.resourceId(settings.subscriptionId, settings.resourceGroupName, 'Microsoft.Network/routeTables', settings.name),
        resourceGroupName: settings.resourceGroupName,
        subscriptionId: settings.subscriptionId,
        location: settings.location,
        properties: {
            routes: _.map(settings.routes, (value) => {
                let result = {
                    name: value.name,
                    properties: {
                        addressPrefix: value.addressPrefix
                    }
                };

                if (v.utilities.networking.isValidIpAddress(value.nextHop)) {
                    result.properties.nextHopType = 'VirtualAppliance';
                    result.properties.nextHopIpAddress = value.nextHop;
                } else {
                    result.properties.nextHopType = value.nextHop;
                }

                return result;
            })
        }
    };

    return result;
}

function process ({ settings, buildingBlockSettings, defaultSettings }) {
    settings = _.castArray(settings);

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
        buildingBlockSettings: buildingBlockSettings,
        defaultSettings: defaultSettings
    });

    let errors = validate(results);

    if (errors.length > 0) {
        throw new Error(JSON.stringify(errors));
    }

    results = _.transform(results, (result, setting) => {
        result.routeTables.push(transform(setting));
        if (setting.virtualNetworks.length > 0) {
            result.subnets = result.subnets.concat(_.transform(setting.virtualNetworks, (result, virtualNetwork) => {
                _.each(virtualNetwork.subnets, (subnet) => {
                    result.push({
                        id: r.resourceId(virtualNetwork.subscriptionId, virtualNetwork.resourceGroupName, 'Microsoft.Network/virtualNetworks/subnets',
                            virtualNetwork.name, subnet),
                        subscriptionId: virtualNetwork.subscriptionId,
                        resourceGroupName: virtualNetwork.resourceGroupName,
                        location: virtualNetwork.location,
                        virtualNetwork: virtualNetwork.name,
                        name: subnet,
                        properties: {
                            routeTable: {
                                id: r.resourceId(setting.subscriptionId, setting.resourceGroupName, 'Microsoft.Network/routeTables', setting.name),
                            }
                        }
                    });
                });
            }, []));
        }
    }, {
        routeTables: [],
        subnets: []
    });

    // Get needed resource groups information.
    let resourceGroups = r.extractResourceGroups(results.routeTables);
    return {
        resourceGroups: resourceGroups,
        parameters: results
    };
}

exports.process = process;
