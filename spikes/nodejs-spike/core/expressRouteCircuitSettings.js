'use strict';

let _ = require('lodash');
let v = require('./validation.js');
let r = require('./resources.js');

const EXPRESSROUTECIRCUIT_SETTINGS_DEFAULTS = [
    {
        skuTier: 'Standard',
        skuFamily: 'UnlimitedData',
        allowClassicOperations: false
    }
];

let validSkuTiers = ['Standard', 'Premium'];
let validSkuFamilies = ['UnlimitedData', 'MeteredData'];

let isValidSkuTier = (tier) => {
    return v.utilities.isStringInArray(tier, validSkuTiers);
};

let isValidSkuFamily = (family) => {
    return v.utilities.isStringInArray(family, validSkuFamilies);
};

let expressRouteCircuitSettingsValidations = {
    name: v.validationUtilities.isNotNullOrWhitespace,
    skuTier: (value) => {
        return {
            result: isValidSkuTier(value),
            message: `Valid values are ${validSkuTiers.join(',')}`
        };
    },
    skuFamily: (value) => {
        return {
            result: isValidSkuFamily(value),
            message: `Valid values are ${validSkuFamilies.join(',')}`
        };
    },
    serviceProviderName: v.validationUtilities.isNotNullOrWhitespace,
    peeringLocation: v.validationUtilities.isNotNullOrWhitespace,
    bandwidthInMbps: (value) => {
        return {
            result: _.isFinite(value),
            message: 'Value must be a finite number'
        };
    },
    allowClassicOperations: v.validationUtilities.isBoolean
};

function transform(settings) {
    let result = {
        name: settings.name,
        id: r.resourceId(settings.subscriptionId, settings.resourceGroupName, 'Microsoft.Network/connections', settings.name),
        resourceGroupName: settings.resourceGroupName,
        subscriptionId: settings.subscriptionId,
        location: settings.location,
        sku: {
            name: `${settings.skuTier}_${settings.skuFamily}`,
            tier: settings.skuTier,
            family: settings.skuFamily
        },
        properties: {
            serviceProviderProperties: {
                serviceProviderName: settings.serviceProviderName,
                peeringLocation: settings.peeringLocation,
                bandwidthInMbps: settings.bandwidthInMbps
            },
            allowClassicOperations: settings.allowClassicOperations
        }
    };

    return result;
}

let merge = ({ settings, buildingBlockSettings, defaultSettings = EXPRESSROUTECIRCUIT_SETTINGS_DEFAULTS }) => {
    let merged = r.setupResources(settings, buildingBlockSettings, (parentKey) => {
        return (parentKey === null);
    });

    return v.merge(merged, defaultSettings);
};

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
        validations: expressRouteCircuitSettingsValidations
    });

    if (errors.length > 0) {
        throw new Error(JSON.stringify(errors));
    }

    results = _.map(results, (setting) => {
        return transform(setting);
    });

    return {
        expressRouteCircuits: results
    };
};