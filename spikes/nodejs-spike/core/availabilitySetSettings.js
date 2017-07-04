'use strict';

let _ = require('lodash');
let v = require('./validation');

const AVAILABILITYSET_SETTINGS_DEFAULTS = {
    platformFaultDomainCount: 3,
    platformUpdateDomainCount: 5
};

let availabilitySetValidations = {
    platformFaultDomainCount: (value) => {
        return {
            result: ((_.isFinite(value)) && value > 0 && value <= 3),
            message: 'Value must be greater than 0 and less than 3'
        };
    },
    platformUpdateDomainCount: (value) => {
        return {
            result: ((_.isFinite(value)) && value > 0 && value <= 20),
            message: 'Value must be greater than 0 and less tham 20'
        };
    },
    name: v.validationUtilities.isNotNullOrWhitespace
};

function merge({ settings, buildingBlockSettings, defaultSettings }) {
    let defaults = (defaultSettings) ? [AVAILABILITYSET_SETTINGS_DEFAULTS, defaultSettings] : AVAILABILITYSET_SETTINGS_DEFAULTS;

    return v.merge(settings, defaults);
}

function transform(settings, parent) {
    let instance = {
        resourceGroupName: settings.resourceGroupName,
        subscriptionId: settings.subscriptionId,
        location: settings.location,
        name: settings.name,
        properties: {
            platformFaultDomainCount: settings.platformFaultDomainCount,
            platformUpdateDomainCount: settings.platformUpdateDomainCount
        }
    };

    if (parent.storageAccounts.managed) {
        instance.properties.managed = true;
    }

    return {
        availabilitySet: _.castArray(instance)
    };
}

exports.transform = transform;
exports.merge = merge;
exports.validations = availabilitySetValidations;