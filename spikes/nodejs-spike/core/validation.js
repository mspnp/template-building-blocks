'use strict';

let _ = require('lodash');
let validationMessages = require('./validationMessages.js');

function merge(settings, defaultSettings, mergeCustomizer) {
    let baseMergeCustomizer = function (objValue, srcValue, key, object, source, stack) {
        let result;
        if (mergeCustomizer) {
            result = mergeCustomizer(objValue, srcValue, key, object, source, stack);
            if (!_.isUndefined(result)) {
                return result;
            }
        }

        if ((srcValue) && _.isArray(srcValue)) {
            if (srcValue.length > 0) {
                if (_.isNil(objValue) || objValue.length === 0) {
                    return srcValue;
                } else {
                    return merge(srcValue, objValue, mergeCustomizer);
                }
            } else {
                return [];
            }
        }

    };

    if (_.isArray(defaultSettings) && defaultSettings.length > 1) {
        // we are merging local defaults with user defaults
        // update user defaults to be same type as local defaults
        let localDefaults = defaultSettings[0];
        let userDefaults = defaultSettings[1];
        if (_.isPlainObject(localDefaults) && _.isArray(userDefaults)) {
            userDefaults = userDefaults[0];
        } else if (_.isArray(localDefaults) && _.isPlainObject(userDefaults)) {
            userDefaults = [userDefaults];
        }

        defaultSettings = _.merge(localDefaults, userDefaults);
    }
    
    if(_.isArray(settings) && !_.isArray(defaultSettings)){
        defaultSettings = [defaultSettings];
    }

    if (_.isPlainObject(settings)) {
        // Add missing properties to the settings object, so that the customizer will get invoked when merge operation is called
        _.keys(defaultSettings).forEach((key) => {
            if (_.isNil(settings[key])) {
                if (_.isArray(defaultSettings[key])) {
                    settings[key] = [];
                } else if (_.isPlainObject(defaultSettings[key])) {
                    settings[key] = {};
                }
            }
        });
        let mergedSettings = _.mergeWith(_.cloneDeep(defaultSettings), settings, baseMergeCustomizer);
        return mergedSettings;
    } else if (_.isArray(settings)) {
        // The first item of the defaultSettings has the default properties to be used for all items of settings
        let defaultProperties = defaultSettings[0];
        let mergedSettings = _.transform(settings, (result, value) => {
            let mergedSetting = (mergeCustomizer ? merge(value, defaultProperties, mergeCustomizer) : merge(value, defaultProperties));
            result.push(mergedSetting);
        }, []);

        return mergedSettings;
    } else {
        // We only support plain objects and arrays right now, so we should throw an exception.
        throw new Error('Merge only supports plain objects and arrays');
    }
}

let toString = (value) => {
    return _.isUndefined(value) ? '<undefined>' : _.isNull(value) ? '<null>' : _.isString(value) ? `'${value}'` : _.isArray(value) ? '[array Array]' : _.toString(value);
};

function validate({ settings, validations, parentKey = '', parentValue = null }) {
    return reduce({
        validations: validations,
        value: settings,
        parentKey: parentKey,
        parentValue: parentValue,
        accumulator: []
    });
}

function reduce({ validations, value, parentKey, parentValue, accumulator }) {
    if (_.isPlainObject(validations)) {
        // We are working with a validation OBJECT, so we need to iterate the keys
        if (_.isNil(value)) {
            accumulator.push({
                name: `${parentKey}`,
                message: validationMessages.ValueCannotBeNull
            });
        } else if (_.isArray(value)) {
            // The value is an array, so we need to iterate it and then reduce
            // By default, we will not allow undefined or empty arrays.  The null or undefined check will be caught by the earlier check, but we need to check this here.
            if (value.length === 0) {
                accumulator.push({
                    name: `${parentKey}`,
                    message: validationMessages.ArrayCannotBeEmpty
                });
            } else {
                _.reduce(value, (accumulator, item, index) => {
                    reduce({
                        validations: validations,
                        value: item,
                        parentKey: `${parentKey}[${index}]`,
                        parentValue: parentValue,
                        accumulator: accumulator
                    });
                    return accumulator;
                }, accumulator);
            }
        } else {
            // The value is a plain object, so iterate the validations and run them against value[key]
            _.reduce(validations, (accumulator, validation, key) => {
                reduce({
                    validations: validation,
                    value: value[key],
                    parentKey: `${parentKey}.${key}`,
                    parentValue: value,
                    accumulator: accumulator
                });
                return accumulator;
            }, accumulator);
        }
    } else if (_.isFunction(validations)) {
        // If the value is an array, reduce, then call validation inside
        // Otherwise, just call the validation
        if (_.isArray(value)) {
            // Since we don't know if this is a function for the array as a whole, or the individual elements, we need to do a check here.
            let result = validations(value, parentValue);
            if ((_.isBoolean(result.result)) && (!result.result)) {
                let { message } = result;
                accumulator.push({
                    name: `${parentKey}`,
                    message: `Invalid value: ${toString(value)}.` + (message ? '  ' + message : '')
                });
            } else {
                _.reduce(value, (accumulator, item, index) => {
                    // We got back more validations to run
                    reduce({
                        validations: result.validations,
                        value: item,
                        parentKey: `${parentKey}[${index}]`,
                        parentValue: parentValue,
                        accumulator: accumulator
                    });

                    return accumulator;
                }, accumulator);
            }
        } else {
            // We're just a value
            let result = validations(value, parentValue);
            if ((_.isBoolean(result.result)) && (!result.result)) {
                let { message } = result;
                accumulator.push({
                    name: `${parentKey}`,
                    message: `Invalid value: ${toString(value)}.` + (message ? '  ' + message : '')
                });
            } else if (result.validations) {
                // We got back more validations to run
                reduce({
                    validations: result.validations,
                    value: value,
                    parentKey: `${parentKey}`,
                    parentValue: parentValue,
                    accumulator: accumulator
                });
            }
        }
    }

    return accumulator;
}

let cidrRegex = /^(?:([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])\.)(?:([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])\.)(?:([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])\.)([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])(?:\/([0-9]|[1-2][0-9]|3[0-2]))$/;
let ipAddressRegex = /^(?:([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])\.)(?:([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])\.)(?:([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])\.)(?:[0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])$/;

let guidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

let utilities = {
    isGuid: (guid) => guidRegex.test(guid),
    isStringInArray: (value, array) => _.indexOf(array, value) > -1,
    isNullOrWhitespace: (value) => {
        value = _.toString(value);
        return !value || !value.trim();
    },
    isObjectForResourceId: (obj) => {
        // Omit the three fields we need.  If the length of the result is !== 0, this is likely a "full" object, so we can use the "full" validations
        let remainingKeys = _.keys(_.omit(obj, ['subscriptionId', 'resourceGroupName', 'name']));
        return (remainingKeys.length === 0);
    },
    networking: {
        isValidIpAddress: function (value) {
            return ipAddressRegex.test(value);
        },
        isValidCidr: function (value) {
            return cidrRegex.test(value);
        },
        isValidPortRange: value => {
            if (_.isFinite(value)) {
                // If value is a number, make sure it's in the proper range.
                return _.inRange(_.toSafeInteger(value), 1, 65536);
            } else if (value === '*') {
                return true;
            } else {
                let split = _.split(value, '-');
                if (split.length !== 2) {
                    return false;
                }

                var [low, high] = _.map(split, (value) => {
                    return _.toSafeInteger(value);
                });

                // Make sure both numbers are in the valid range
                return _.inRange(low, 1, 65536) && _.inRange(high, 1, 65536) && (low < high);
            }
        }
    }
};

let validationUtilities = {
    isBoolean: (value) => {
        return {
            result: _.isBoolean(value),
            message: 'Value must be Boolean'
        };
    },
    isGuid: (value) => {
        return {
            result: utilities.isGuid(value),
            message: 'Value is not a valid GUID'
        };
    },
    isValidIpAddress: (value) => {
        return {
            result: utilities.networking.isValidIpAddress(value),
            message: 'Value is not a valid IP Address'
        };
    },
    isValidCidr: (value) => {
        return {
            result: utilities.networking.isValidCidr(value),
            message: 'Value is not a valid CIDR'
        };
    },
    isValidPortRange: (value) => {
        return {
            result: utilities.networking.isValidPortRange(value),
            message: 'Value must be a single integer, a range of integers between 1-65535 in the form low-high, or * for any port'
        };
    },
    isNotNullOrWhitespace: (value) => {
        return {
            result: !utilities.isNullOrWhitespace(value),
            message: 'Value cannot be undefined, null, empty, or only whitespace'
        };
    },
    isValidJsonObject: (value) => {
        return {
            result: _.isPlainObject(value),
            message: 'Value must be Json object'
        };
    }
};

let tagsValidations = (value) => {
    let result = {
        result: true
    };

    // Tags are optional, but all defaults should have an empty object set
    if (_.isNil(value)) {
        result = {
            result: false,
            message: 'Value cannot be undefined or null'
        };
    } else if (!_.isPlainObject(value)) {
        // If this is not an object, the value is invalid
        result = {
            result: false,
            message: 'tags must be a json object'
        };
    } else {
        // If we have tags, we need to validate them
        // 1.  We can only have 15 tags per resource
        // 2.  Name is limited to 512 characters
        // 3.  Value is limited to 256 characters
        let keys = Object.keys(value);
        if (keys.length > 15) {
            result = {
                result: false,
                message: 'Only 15 tags are allowed'
            };
        } else {

            let nameLengthViolated = _.some(value, (value, key) => {
                return !_.inRange(key.length, 1, 513);
            });

            let valueLengthViolated = _.some(value, (value) => {
                return utilities.isNullOrWhitespace(value) || (value.length > 256);
            });

            let message = '';
            if (nameLengthViolated) {
                message = message.concat('Tag names must be between 1 and 512 characters in length.  ');
            }

            if (valueLengthViolated) {
                message = message.concat('Tag values cannot be null, empty, or greater than 256 characters in length.');
            }

            result = {
                result: (!nameLengthViolated && !valueLengthViolated),
                message: message.trim()
            };
        }
    }

    return result;
};

exports.utilities = utilities;
exports.validationUtilities = validationUtilities;
exports.merge = merge;
exports.validate = validate;
exports.reduce = reduce;
exports.tagsValidations = tagsValidations;