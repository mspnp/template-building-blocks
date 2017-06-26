'use strict';

var _ = require('lodash');
let v = require('./validation.js');

const AVAILABILITYSET_SETTINGS_DEFAULTS = {
    useExistingAvailabilitySet: false,
    platformFaultDomainCount: 3,
    platformUpdateDomainCount: 5,
    name: 'default-as'
};

function merge(settings, userDefaults) {
    let defaults = (userDefaults) ? [AVAILABILITYSET_SETTINGS_DEFAULTS, userDefaults] : AVAILABILITYSET_SETTINGS_DEFAULTS;

    return v.merge(settings, defaults);
}

let availabilitySetValidations = {
    useExistingAvailabilitySet: v.validationUtilities.isBoolean,
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

function transform(settings, parent) {
    if (settings.useExistingAvailabilitySet) {
        return { availabilitySet: [] };
    }

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
