'use strict';

let _ = require('lodash');
let validation = require('./validation.js');
let validationMessages = require('./validationMessages.js');

function getObject(collection, parentKey, stack, callback) {
    if (_.isPlainObject(collection)) {
        // See if we need to add the information
        if (callback(parentKey)) {
            collection.subscriptionId = stack[stack.length - 1].subscriptionId;
            collection.resourceGroupName = stack[stack.length - 1].resourceGroupName;
            collection.location = stack[stack.length - 1].location;
        }
    }

    return _.each(collection, (item, keyOrIndex) => {
        let hasPushed = false;
        if (_.isPlainObject(item)) {
            if ((item.hasOwnProperty('resourceGroupName')) || (item.hasOwnProperty('subscriptionId'))) {
                stack.push(_.merge({}, stack[stack.length - 1], {
                    subscriptionId: item.subscriptionId,
                    resourceGroupName: item.resourceGroupName,
                    location: item.location
                }));
                hasPushed = true;
            }

            item = getObject(item, _.isFinite(keyOrIndex) ? parentKey : keyOrIndex, stack, callback);

            if (hasPushed) {
                stack.pop();
            }
        } else if (_.isArray(item)) {
            item = getObject(item, keyOrIndex, stack, callback);
        }
    });
}

exports.resourceId = function (subscriptionId, resourceGroupName, resourceType, resourceName, subresourceName) {
    if (validation.utilities.isNullOrWhitespace(subscriptionId)) {
        throw `subscriptionId: ${validationMessages.StringCannotBeNullUndefinedEmptyOrOnlyWhitespace}`;
    }

    if (!validation.utilities.isGuid(subscriptionId)) {
        throw `subscriptionId: ${validationMessages.StringIsNotAValidGuid}`;
    }

    if (validation.utilities.isNullOrWhitespace(resourceGroupName)) {
        throw `resourceGroupName: ${validationMessages.StringCannotBeNullUndefinedEmptyOrOnlyWhitespace}`;
    }

    if (validation.utilities.isNullOrWhitespace(resourceType)) {
        throw `resourceType: ${validationMessages.StringCannotBeNullUndefinedEmptyOrOnlyWhitespace}`;
    }

    let resourceTypeParts = _.split(_.trimEnd(resourceType, '/'), '/');
    if ((resourceTypeParts.length < 2) || (resourceTypeParts.length > 3)) {
        throw `resourceType: Invalid length ${resourceTypeParts.length}`;
    }

    if ((resourceTypeParts.length === 2) && (validation.utilities.isNullOrWhitespace(resourceName))) {
        throw `resourceName: ${validationMessages.StringCannotBeNullUndefinedEmptyOrOnlyWhitespace}`;
    }

    // This is not strictly necessary, but could save from some misuse
    if ((resourceTypeParts.length === 2) && (!validation.utilities.isNullOrWhitespace(subresourceName))) {
        throw `subresourceName: ${validationMessages.resources.SubresourceNameShouldNotBeSpecifiedForTopLevelResourceType}`;
    }

    if ((resourceTypeParts.length === 3) && (validation.utilities.isNullOrWhitespace(subresourceName))) {
        throw `subresourceName: ${validationMessages.StringCannotBeNullUndefinedEmptyOrOnlyWhitespace}`;
    }

    let resourceId = `/subscriptions/${subscriptionId}/resourceGroups/${resourceGroupName}/providers/${resourceTypeParts[0]}/${resourceTypeParts[1]}/${resourceName}`;
    if (resourceTypeParts.length === 3) {
        resourceId = `${resourceId}/${resourceTypeParts[2]}/${subresourceName}`;
    }

    return resourceId;
};

exports.setupResources = function (settings, buildingBlockSettings, keyCallback) {
    let clone = _.cloneDeep(settings);
    return getObject(clone, null, [buildingBlockSettings], keyCallback);
};

exports.extractResourceGroups = (...resources) => {
    return _.uniqWith(_.map(_.reject(_.flattenDeep(resources), (value) => {
        return _.isNil(value);
    }), (value) => {
        return {
            subscriptionId: value.subscriptionId,
            resourceGroupName: value.resourceGroupName,
            location: value.location
        };
    }), _.isEqual);
};

exports.resourceReferenceValidations = {
    name: validation.validationUtilities.isNotNullOrWhitespace,
    subscriptionId: validation.validationUtilities.isGuid,
    resourceGroupName: validation.validationUtilities.isNotNullOrWhitespace
};