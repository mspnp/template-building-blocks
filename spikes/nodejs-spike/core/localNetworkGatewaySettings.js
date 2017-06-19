'use strict';

let _ = require('lodash');
let v = require('./validation.js');
let r = require('./resources.js');

let localNetworkGatewaySettingsDefaults = {
};

let bgpSettingsValidations = {
    asn: (value) => {
        return _.isNil(value) ? {
            result: true
        } : {
            result: _.isFinite(value),
            message: 'Value must be an integer'
        };
    },
    bgpPeeringAddress: (value) => {
        return _.isNil(value) ? {
            result: true
        } : {
            validations: v.validationUtilities.isNotNullOrWhitespace
        };
    },
    peerWeight: (value) => {
        return _.isNil(value) ? {
            result: true
        } : {
            result: _.isFinite(value),
            message: 'Value must be an integer'
        };
    }
};

let localNetworkGatewayValidations = {
    name: v.validationUtilities.isNotNullOrWhitespace,
    addressPrefixes: v.validationUtilities.isValidCidr,
    ipAddress: v.validationUtilities.isValidIpAddress,
    bgpSettings: (value) => {
        return _.isNil(value) ? {
            result: true
        } : {
            validations: bgpSettingsValidations
        };
    }
};

let transform = (settings) => {
    let result = {
        name: settings.name,
        id: r.resourceId(settings.subscriptionId, settings.resourceGroupName, 'Microsoft.Network/localNetworkGateway', settings.name),
        resourceGroupName: settings.resourceGroupName,
        subscriptionId: settings.subscriptionId,
        location: settings.location,
        properties: {
            localNetworkAddressSpace: {
                addressPrefixes: settings.addressPrefixes
            },
            gatewayIpAddress: settings.ipAddress
        }
    };

    if (settings.bgpSettings) {
        result.properties.bgpSettings = settings.bgpSettings;
    }

    return result;
};

let merge = ({settings, buildingBlockSettings, defaultSettings = localNetworkGatewaySettingsDefaults}) => {
    let merged = r.setupResources(settings, buildingBlockSettings, (parentKey) => {
        return (parentKey === null);
    });

    return v.merge(merged, defaultSettings);
};

exports.validations = localNetworkGatewayValidations;
exports.merge = merge;
exports.transform = function ({ settings, buildingBlockSettings }) {
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
        validations: localNetworkGatewayValidations
    });

    if (errors.length > 0) {
        throw new Error(JSON.stringify(errors));
    }

    results = _.map(results, (setting) => {
        return transform(setting);
    });

    return {
        localNetworkGateways: results
    };
};