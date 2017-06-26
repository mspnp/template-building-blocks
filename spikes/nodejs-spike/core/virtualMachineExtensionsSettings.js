let _ = require('lodash');
let v = require('./validation.js');

function merge(settings) {
    return settings;
}

let vmExtensionValidations = {
    vms: (value) => {
        if (_.isNil(value) || !_.isArray(value) || value.length === 0) {
            return {
                result: false,
                message: 'Value (Array) cannot be null, undefined or empty'
            };
        } else {
            return {
                result: true
            };
        }
    },
    extensions: (value) => {
        if (_.isNil(value) || !_.isArray(value) || value.length === 0) {
            return {
                result: false,
                message: 'Value (Array) cannot be null, undefined or empty'
            };
        }
        let extensionValidations = {
            name: v.validationUtilities.isNotNullOrWhitespace,
            publisher: v.validationUtilities.isNotNullOrWhitespace,
            type: v.validationUtilities.isNotNullOrWhitespace,
            typeHandlerVersion: v.validationUtilities.isNotNullOrWhitespace,
            autoUpgradeMinorVersion: v.validationUtilities.isBoolean,
            settings: v.validationUtilities.isValidJsonObject,
            protectedSettings: v.validationUtilities.isValidJsonObject
        };
        return {
            validations: extensionValidations
        };
    },
};

function validate(settings) {
    return v.validate({
        settings: settings,
        validations: vmExtensionValidations
    });
}

function process(param) {
    let accumulator = { extensions: [] };
    param.forEach((value) => {
        value.extensions.forEach((ext) => {
            let setting = {
                name: ext.name,
                vms: value.vms
            };

            if (ext.protectedSettings.hasOwnProperty('reference') && ext.protectedSettings.reference.hasOwnProperty('keyVault')) {
                setting.extensionProtectedSettings = ext.protectedSettings;
            } else {
                setting.extensionProtectedSettings = { value: JSON.stringify(ext.protectedSettings) };
            }
            let extension = _.cloneDeep(ext);
            delete extension.protectedSettings;
            delete extension.name;
            setting.extensionSettings = extension;
            accumulator.extensions.push(setting);
        });
    });
    return accumulator;
}

function mergeAndProcess(param, buildingBlockSettings) {
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

    let merged = merge(param);

    let errors = v.validate({
        settings: merged,
        validations: vmExtensionValidations
    });

    if (errors.length > 0) {
        throw new Error(JSON.stringify(errors));
    }

    return process(merged, buildingBlockSettings);
}

exports.process = mergeAndProcess;

