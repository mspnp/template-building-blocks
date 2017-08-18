'use strict';

let _ = require('lodash');
let v = require('./validation');
let r = require('./resources');
let validationMessages = require('./validationMessages');

const VIRTUALNETWORK_SETTINGS_DEFAULTS = {
    addressPrefixes: ['10.0.0.0/16'],
    subnets: [
        {
            'name': 'subnet1',
            'addressPrefix': '10.0.0.0/24'
        }
    ],
    dnsServers: [],
    virtualNetworkPeerings: [
        {
            allowForwardedTraffic: false,
            allowGatewayTransit: false,
            useRemoteGateways: false
        }
    ],
    tags: {
        'deployedWith': 'bbv2'
    }
};

let virtualNetworkSettingsSubnetsValidations = {
    name: v.validationUtilities.isNotNullOrWhitespace,
    addressPrefix: v.validationUtilities.isValidCidr
};

let virtualNetworkSettingsPeeringValidations = {
    name: (value) => {
        // Undefined is okay, as it will be generated, but null or whitespace is not.
        if (_.isUndefined(value)) {
            return {
                result: true
            };
        } else {
            return {
                validations: v.validationUtilities.isNotNullOrWhitespace
            };
        }
    },
    remoteVirtualNetwork: {
        name: v.validationUtilities.isNotNullOrWhitespace
    },
    allowForwardedTraffic: v.validationUtilities.isBoolean,
    allowGatewayTransit: v.validationUtilities.isBoolean,
    useRemoteGateways: v.validationUtilities.isBoolean
};

let virtualNetworkSettingsValidations = {
    name: v.validationUtilities.isNotNullOrWhitespace,
    addressPrefixes: v.validationUtilities.isValidCidr,
    subnets: (value) => {
        if (_.isNil(value)) {
            return {
                result: false,
                message: validationMessages.ValueCannotBeNull
            };
        } else if (value.length === 0) {
            return {
                result: false,
                message: 'At least one subnet must be provided'
            };
        } else {
            return {
                validations: virtualNetworkSettingsSubnetsValidations
            };
        }
    },
    dnsServers: (value) => {
        // An empty array is okay
        let result = {
            result: true
        };

        if (_.isNil(value)) {
            result = {
                result: false,
                message: validationMessages.ValueCannotBeNull
            };
        } else if (value.length > 0) {
            result = {
                validations: v.validationUtilities.isValidIpAddress
            };
        }

        return result;
    },
    tags: v.tagsValidations,
    virtualNetworkPeerings: (value) => {
        // An empty array is okay
        let result = {
            result: true
        };

        if (_.isNil(value)) {
            result = {
                result: false,
                message: validationMessages.ValueCannotBeNull
            };
        } else if (value.length > 0) {
            result = {
                validations: virtualNetworkSettingsPeeringValidations
            };
        }

        return result;
    }
};

let validate = ({ settings }) => {
    let errors = v.validate({
        settings: settings,
        validations: virtualNetworkSettingsValidations
    });

    _.map(settings, (config) => {
        if (!_.isNil(config.virtualNetworkPeerings) && config.virtualNetworkPeerings.length > 0) {
            _.map(config.virtualNetworkPeerings, (peering) => {
                if (!_.isNil(peering.remoteVirtualNetwork)
                    && peering.remoteVirtualNetwork.location !== config.location) {
                    errors.push({
                        result: false,
                        message: 'Virtual network and peering location cannot be different'
                    });
                }
            });
        }
    });
    return errors;
};

let merge = ({ settings, buildingBlockSettings, defaultSettings }) => {
    let defaults = (defaultSettings) ? [VIRTUALNETWORK_SETTINGS_DEFAULTS, defaultSettings] : VIRTUALNETWORK_SETTINGS_DEFAULTS;

    let merged = r.setupResources(settings, buildingBlockSettings, (parentKey) => {
        return ((parentKey === null) || (parentKey === 'remoteVirtualNetwork'));
    });

    merged = v.merge(merged, defaults);
    return merged;
};

function transform(settings) {
    let result = {
        name: settings.name,
        tags: settings.tags,
        resourceGroupName: settings.resourceGroupName,
        subscriptionId: settings.subscriptionId,
        location: settings.location,
        properties: {
            addressSpace: {
                addressPrefixes: settings.addressPrefixes
            },
            subnets: _.map(settings.subnets, (value) => {
                return {
                    name: value.name,
                    properties: {
                        addressPrefix: value.addressPrefix
                    }
                };
            }),
            dhcpOptions: {
                dnsServers: settings.dnsServers
            }
        }
    };

    return result;
}

function transformVirtualNetworkPeering({ settings, parentSettings }) {
    let peeringName = settings.name ? settings.name : `${settings.remoteVirtualNetwork.name}-peer`;
    return {
        name: `${parentSettings.name}/${peeringName}`,
        resourceGroupName: parentSettings.resourceGroupName,
        subscriptionId: parentSettings.subscriptionId,
        location: parentSettings.location,
        properties: {
            remoteVirtualNetwork: {
                id: r.resourceId(settings.remoteVirtualNetwork.subscriptionId, settings.remoteVirtualNetwork.resourceGroupName,
                    'Microsoft.Network/virtualNetworks', settings.remoteVirtualNetwork.name)
            },
            allowForwardedTraffic: settings.allowForwardedTraffic,
            allowGatewayTransit: settings.allowGatewayTransit,
            useRemoteGateways: settings.useRemoteGateways
        }
    };
}

function process({ settings, buildingBlockSettings, defaultSettings }) {
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

    let errors = validate({ settings: results });

    if (errors.length > 0) {
        throw new Error(JSON.stringify(errors));
    }

    results = _.transform(results, (result, setting) => {
        result.virtualNetworks.push(transform(setting));
        if ((setting.virtualNetworkPeerings) && (setting.virtualNetworkPeerings.length > 0)) {
            result.virtualNetworkPeerings = result.virtualNetworkPeerings.concat(_.transform(setting.virtualNetworkPeerings,
                (result, virtualNetworkPeeringSettings) => {
                    result.push(transformVirtualNetworkPeering({ settings: virtualNetworkPeeringSettings, parentSettings: setting }));
                }, []));
        }
    }, {
            virtualNetworks: [],
            virtualNetworkPeerings: []
        });

    // Get needed resource groups information.
    let resourceGroups = r.extractResourceGroups(results.virtualNetworks);
    return {
        resourceGroups: resourceGroups,
        parameters: results
    };
}

exports.process = process;
