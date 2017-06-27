'use strict';

var _ = require('lodash');
let v = require('./validation.js');
let murmurHash = require('murmurhash-native').murmurHash64;

const STORAGE_SETTINGS_DEFAULTS = {
    nameSuffix: 'st',
    count: 1,
    skuType: 'Premium_LRS',
    accounts: [],
    managed: true
};

const DIAGNOSTIC_STORAGE_SETTINGS_DEFAULTS = {
    nameSuffix: 'diag',
    count: 1,
    skuType: 'Standard_LRS',
    accounts: [],
    managed: false
};

function merge(settings, key) {
    let defaults = ((key === 'storageAccounts') ? STORAGE_SETTINGS_DEFAULTS : DIAGNOSTIC_STORAGE_SETTINGS_DEFAULTS);

    return v.merge(settings, defaults);
}

let storageValidations = {
    count: (value, parent) => {
        return {
            result: (parent.managed) || ((_.isFinite(value)) && value > 0),
            message: 'Value must be greater than 0'
        };
    },
    managed: v.validationUtilities.isBoolean,
    nameSuffix: v.validationUtilities.isNotNullOrWhitespace,
    skuType: (value, parent) => {
        return {
            result: (parent.managed) || !v.utilities.isNullOrWhitespace(value),
            message: 'Value cannot be null or empty string if managed is set to false'
        };
    },
    accounts: (value) => {
        return {
            result: _.isArray(value),
            message: 'Value cannot be null'
        };
    }
};

let diagnosticValidations = {
    managed: (value) => {
        if (!_.isBoolean(value)) {
            return {
                result: false,
                message: 'Value must be Boolean'
            };
        }
        return {
            result: !value,
            message: 'Diagnostic storage cannot be managed.'
        };
    },
    skuType: (value) => {
        return {
            result: (!v.utilities.isNullOrWhitespace(value)) && !_.includes(_.toLower(value), 'premium'),
            message: 'Diagnostic storage cannot use premium storage.'
        };
    },
    count: (value) => {
        return {
            result: ((_.isFinite(value)) && value > 0),
            message: 'Value must be greater than 0'
        };
    },
    nameSuffix: v.validationUtilities.isNotNullOrWhitespace,
    accounts: (value) => {
        return {
            result: _.isArray(value),
            message: 'Value cannot be null'
        };
    }
};

function convertToBase32(carryOverValue, carryOverBits, buffer) {
    if (buffer.length === 0) return '';

    let charSet = 'abcdefghijklmnopqrstuvwxyz234567';
    let base32String = '';
    let valueToProcess = carryOverValue * 256 + buffer[0];
    let bitsCount = carryOverBits + 8;

    do {
        let value = valueToProcess;
        if (bitsCount >= 5) {
            bitsCount -= 5;
            value = valueToProcess >> bitsCount;
        }
        base32String += charSet[value];
        value <<= bitsCount;
        valueToProcess -= value;
    } while (valueToProcess > 32 || (buffer.length === 1 && valueToProcess > 0));

    base32String += convertToBase32(valueToProcess, bitsCount, buffer.slice(1));
    return base32String;
}

function getUniqueString(input) {
    let buffer = murmurHash(JSON.stringify(input), 'buffer');

    return convertToBase32(0, 0, buffer);
}

function createStamps(settings) {
    // deep clone settings for the number of VMs required (vmCount)  
    return _.transform(_.castArray(settings), (result, n) => {
        for (let i = 0; i < settings.count - settings.accounts.length; i++) {
            result.push(_.cloneDeep(n));
        }
        return result;
    }, []);
}

function transform(settings, parent) {
    if (settings.managed) {
        return { accounts: [] };
    }
    let accounts = _.transform(createStamps(settings, parent), (result, n, index) => {
        let instance = {
            resourceGroupName: n.resourceGroupName,
            subscriptionId: n.subscriptionId,
            location: n.location,
            name: `vm${getUniqueString(parent)}${n.nameSuffix}${index + 1}`,
            kind: 'Storage',
            sku: {
                name: n.skuType
            }
        };
        result.push(instance);
        return result;
    }, []);

    return {
        accounts: accounts
    };
}

exports.transform = transform;
exports.merge = merge;
exports.storageValidations = storageValidations;
exports.diagnosticValidations = diagnosticValidations;
