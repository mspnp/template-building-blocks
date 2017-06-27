'use strict';

let _ = require('lodash');
let v = require('./validation.js');
let r = require('./resources.js');
let localNetworkGateway = require('./localNetworkGatewaySettings.js');

const CONNECTION_SETTINGS_DEFAULTS  = {
    tags: {}
};

let validConnectionTypes = ['IPsec', 'Vnet2Vnet', 'ExpressRoute'];

let isValidConnectionType = (connectionType) => {
    return v.utilities.isStringInArray(connectionType, validConnectionTypes);
};

let expressRouteCircuitValidations = {
    name: v.validationUtilities.isNotNullOrWhitespace
};

let virtualNetworkGatewayValidations = {
    name: v.validationUtilities.isNotNullOrWhitespace
};

let connectionSettingsValidations = {
    name: v.validationUtilities.isNotNullOrWhitespace,
    tags: v.tagsValidations,
    connectionType: (value) => {
        return {
            result: isValidConnectionType(value),
            message: `Valid values are ${validConnectionTypes.join(',')}`
        };
    },
    routingWeight: (value) => {
        return {
            result: _.isFinite(value),
            message: 'Value must be a finite number'
        };
    },
    sharedKey: (value, parent) => {
        let result = {
            result: true
        };

        if (parent.connectionType) {
            // If connectionType is not specified, this may be confusing for the user, so we will simply return true as
            // there will be a validation failure for the connectionType
            if (parent.connectionType === 'ExpressRoute') {
                if (!_.isUndefined(value)) {
                    result = {
                        result: false,
                        message: 'sharedKey cannot be specified for an ExpressRoute connection'
                    };
                }
            } else {
                result = {
                    validations: v.validationUtilities.isNotNullOrWhitespace
                };
            }
        }

        return result;
    },
    virtualNetworkGateway: (value, parent) => {
        let result = {
            result: true
        };

        if (parent.connectionType) {
            // If connectionType is not specified, this may be confusing for the user, so we will simply return true as
            // there will be a validation failure for the connectionType
            if (v.utilities.isStringInArray(parent.connectionType, ['IPsec', 'ExpressRoute'])) {
                if (_.isNil(value)) {
                    result = {
                        result: false,
                        message: 'Value cannot be null or undefined if connectionType is IPsec or ExpressRoute'
                    };
                } else {
                    result = {
                        validations: virtualNetworkGatewayValidations
                    };
                }
            } else if (!_.isNil(value)) {
                result = {
                    result: false,
                    message: 'virtualNetworkGateway cannot be specified if connectionType is not IPsec or ExpressRoute'
                };
            }
        }

        return result;
    },
    localNetworkGateway: (value, parent) => {
        let result = {
            result: true
        };

        if (parent.connectionType) {
            // If connectionType is not specified, this may be confusing for the user, so we will simply return true as
            // there will be a validation failure for the connectionType
            if (parent.connectionType === 'IPsec') {
                if (_.isNil(value)) {
                    result = {
                        result: false,
                        message: 'Value cannot be null or undefined if connectionType is IPsec'
                    };
                } else {
                    result = {
                        validations: localNetworkGateway.validations
                    };
                }
            } else if (!_.isNil(value)) {
                result = {
                    result: false,
                    message: 'localNetworkGateway cannot be specified if connectionType is not IPsec'
                };
            }
        }

        return result;
    },
    expressRouteCircuit: (value, parent) => {
        let result = {
            result: true
        };

        if (parent.connectionType) {
            // If connectionType is not specified, this may be confusing for the user, so we will simply return true as
            // there will be a validation failure for the connectionType
            if (parent.connectionType !== 'ExpressRoute') {
                if (!_.isUndefined(value)) {
                    result = {
                        result: false,
                        message: 'expressRouteCircuit cannot be specified if connectionType is not ExpressRoute'
                    };
                }
            } else {
                result = {
                    validations: expressRouteCircuitValidations
                };
            }
        }

        return result;
    },
    virtualNetworkGateway1: (value, parent) => {
        let result = {
            result: true
        };

        if (parent.connectionType) {
            // If connectionType is not specified, this may be confusing for the user, so we will simply return true as
            // there will be a validation failure for the connectionType
            if ((parent.connectionType === 'Vnet2Vnet')) {
                if ((_.isNil(value))) {
                    result = {
                        result: false,
                        message: 'Value cannot be null or undefined if connectionType is Vnet2Vnet'
                    };
                } else {
                    result = {
                        validations: virtualNetworkGatewayValidations
                    };
                }
            } else {
                if ((!_.isNil(value))) {
                    result = {
                        result: false,
                        message: 'Value cannot be specified if connectionType is not Vnet2Vnet'
                    };
                }
            }
        }

        return result;
    },
    virtualNetworkGateway2: (value, parent) => {
        let result = {
            result: true
        };

        if (parent.connectionType) {
            // If connectionType is not specified, this may be confusing for the user, so we will simply return true as
            // there will be a validation failure for the connectionType
            if ((parent.connectionType === 'Vnet2Vnet')) {
                if ((_.isNil(value))) {
                    result = {
                        result: false,
                        message: 'Value cannot be null or undefined if connectionType is Vnet2Vnet'
                    };
                } else {
                    result = {
                        validations: virtualNetworkGatewayValidations
                    };
                }
            } else {
                if ((!_.isNil(value))) {
                    result = {
                        result: false,
                        message: 'Value cannot be specified if connectionType is not Vnet2Vnet'
                    };
                }
            }
        }

        return result;
    }
};

function transform(settings) {
    let result = {
        name: settings.name,
        id: r.resourceId(settings.subscriptionId, settings.resourceGroupName, 'Microsoft.Network/connections', settings.name),
        resourceGroupName: settings.resourceGroupName,
        subscriptionId: settings.subscriptionId,
        location: settings.location,
        tags: settings.tags,
        properties: {
            connectionType: settings.connectionType,
            routingWeight: settings.routingWeight
        }
    };

    switch (settings.connectionType) {
    case 'IPsec': {
        result.properties.sharedKey = settings.sharedKey;
        result.properties.virtualNetworkGateway1 = {
            id: r.resourceId(settings.virtualNetworkGateway.subscriptionId, settings.virtualNetworkGateway.resourceGroupName,
                'Microsoft.Network/virtualNetworkGateways', settings.virtualNetworkGateway.name)
        };
        result.properties.localNetworkGateway2 = {
            id: r.resourceId(settings.localNetworkGateway.subscriptionId, settings.localNetworkGateway.resourceGroupName,
                'Microsoft.Network/localNetworkGateways', settings.localNetworkGateway.name)
        };
        break;
    }
    case 'Vnet2Vnet': {
        result.properties.sharedKey = settings.sharedKey;
        result.properties.virtualNetworkGateway1 = {
            id: r.resourceId(settings.virtualNetworkGateway1.subscriptionId, settings.virtualNetworkGateway1.resourceGroupName,
                'Microsoft.Network/virtualNetworkGateways', settings.virtualNetworkGateway1.name)
        };
        result.properties.virtualNetworkGateway2 = {
            id: r.resourceId(settings.virtualNetworkGateway2.subscriptionId, settings.virtualNetworkGateway2.resourceGroupName,
                'Microsoft.Network/virtualNetworkGateways', settings.virtualNetworkGateway2.name)
        };
        break;
    }
    case 'ExpressRoute': {
        result.properties.virtualNetworkGateway1 = {
            id: r.resourceId(settings.virtualNetworkGateway.subscriptionId, settings.virtualNetworkGateway.resourceGroupName,
                'Microsoft.Network/virtualNetworkGateways', settings.virtualNetworkGateway.name)
        };
        result.properties.peer = {
            id: r.resourceId(settings.expressRouteCircuit.subscriptionId, settings.expressRouteCircuit.resourceGroupName,
                'Microsoft.Network/expressRouteCircuits', settings.expressRouteCircuit.name)
        };
        break;
    }
    }

    return result;
}

let merge = ({settings, buildingBlockSettings, defaultSettings }) => {
    let defaults = (defaultSettings) ? [CONNECTION_SETTINGS_DEFAULTS, defaultSettings] : CONNECTION_SETTINGS_DEFAULTS;

    let merged = r.setupResources(settings, buildingBlockSettings, (parentKey) => {
        return ((parentKey === null) ||
               (v.utilities.isStringInArray(parentKey,
               ['virtualNetworkGateway', 'localNetworkGateway', 'expressRouteCircuit', 'virtualNetworkGateway1', 'virtualNetworkGateway2'])));
    });

    return v.merge(merged, defaults);
};

function process ({ settings, buildingBlockSettings, defaultSettings }) {
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
        buildingBlockSettings: buildingBlockSettings,
        defaultSettings: defaultSettings
    });

    let errors = v.validate({
        settings: results,
        validations: connectionSettingsValidations
    });

    if (errors.length > 0) {
        throw new Error(JSON.stringify(errors));
    }

    results = _.transform(results, (result, setting) => {
        if (setting.localNetworkGateway) {
            let lng = localNetworkGateway.transform({
                settings: setting.localNetworkGateway,
                buildingBlockSettings: buildingBlockSettings
            });
            result.localNetworkGateways.push(lng.localNetworkGateways[0]);
        }

        setting = transform(setting);
        result.connections.push(setting);
    }, {
        connections: [],
        localNetworkGateways: []
    });

    // Get needed resource groups information.
    let resourceGroups = r.extractResourceGroups(results.connections, results.localNetworkGateways);
    return {
        resourceGroups: resourceGroups,
        parameters: results
    };
}

exports.process = process;
