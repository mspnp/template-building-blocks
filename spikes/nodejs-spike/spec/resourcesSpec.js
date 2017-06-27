let resources = require('../core/resources.js');
let validationMessages = require('../core/validationMessages.js');

describe('resources', () => {
    describe('resourceId function', () => {
        let subscriptionId = '00000000-0000-1000-8000-000000000000';
        let resourceGroupName = 'test-rg';
        let virtualNetworksResourceType = 'Microsoft.Network/virtualNetworks';
        let subnetsResourceType = `${virtualNetworksResourceType}/subnets`;
        let resourceName = 'my-virtual-network';
        let subresourceName = 'my-subnet';

        describe('subscriptionId validations', () => {
            it('null subscriptionId', () => {
                expect(() => {
                    resources.resourceId(null, null, null, null, null);
                }).toThrow(`subscriptionId: ${validationMessages.StringCannotBeNullUndefinedEmptyOrOnlyWhitespace}`);
            });

            it('empty subscriptionId', () => {
                expect(() => {
                    resources.resourceId('', null, null, null, null);
                }).toThrow(`subscriptionId: ${validationMessages.StringCannotBeNullUndefinedEmptyOrOnlyWhitespace}`);
            });

            it('whitespace subscriptionId', () => {
                expect(() => {
                    resources.resourceId(' ', null, null, null, null);
                }).toThrow(`subscriptionId: ${validationMessages.StringCannotBeNullUndefinedEmptyOrOnlyWhitespace}`);
            });

            it('invalid subscriptionId', () => {
                expect(() => {
                    resources.resourceId('NOT_VALID', null, null, null, null);
                }).toThrow(`subscriptionId: ${validationMessages.StringIsNotAValidGuid}`);
            });
        });

        describe('resourceGroupName validations', () => {
            it('null resourceGroupName', () => {
                expect(() => {
                    resources.resourceId(subscriptionId, null, null, null, null);
                }).toThrow(`resourceGroupName: ${validationMessages.StringCannotBeNullUndefinedEmptyOrOnlyWhitespace}`);
            });

            it('empty resourceGroupName', () => {
                expect(() => {
                    resources.resourceId(subscriptionId, '', null, null, null);
                }).toThrow(`resourceGroupName: ${validationMessages.StringCannotBeNullUndefinedEmptyOrOnlyWhitespace}`);
            });

            it('whitespace resourceGroupName', () => {
                expect(() => {
                    resources.resourceId(subscriptionId, ' ', null, null, null);
                }).toThrow(`resourceGroupName: ${validationMessages.StringCannotBeNullUndefinedEmptyOrOnlyWhitespace}`);
            });
        });

        describe('resourceType validations', () => {
            it('null resourceType', () => {
                expect(() => {
                    resources.resourceId(subscriptionId, resourceGroupName, null, null, null);
                }).toThrow(`resourceType: ${validationMessages.StringCannotBeNullUndefinedEmptyOrOnlyWhitespace}`);
            });

            it('empty resourceType', () => {
                expect(() => {
                    resources.resourceId(subscriptionId, resourceGroupName, '', null, null);
                }).toThrow(`resourceType: ${validationMessages.StringCannotBeNullUndefinedEmptyOrOnlyWhitespace}`);
            });

            it('whitespace resourceType', () => {
                expect(() => {
                    resources.resourceId(subscriptionId, resourceGroupName, ' ', null, null);
                }).toThrow(`resourceType: ${validationMessages.StringCannotBeNullUndefinedEmptyOrOnlyWhitespace}`);
            });

            it('resourceType parts less than 2', () => {
                expect(() => {
                    resources.resourceId(subscriptionId, resourceGroupName, 'Microsoft.Network', null, null);
                }).toThrow('resourceType: Invalid length 1');
            });

            it('resourceType parts greater than 3', () => {
                expect(() => {
                    resources.resourceId(subscriptionId, resourceGroupName, 'Microsoft.Network/virtualNetworks/subnets/extra', null, null);
                }).toThrow('resourceType: Invalid length 4');
            });
        });

        describe('resourceName validations', () => {
            it('null resourceName', () => {
                expect(() => {
                    resources.resourceId(subscriptionId, resourceGroupName, virtualNetworksResourceType, null, null);
                }).toThrow(`resourceName: ${validationMessages.StringCannotBeNullUndefinedEmptyOrOnlyWhitespace}`);
            });

            it('empty resourceName', () => {
                expect(() => {
                    resources.resourceId(subscriptionId, resourceGroupName, virtualNetworksResourceType, '', null);
                }).toThrow(`resourceName: ${validationMessages.StringCannotBeNullUndefinedEmptyOrOnlyWhitespace}`);
            });

            it('whitespace resourceName', () => {
                expect(() => {
                    resources.resourceId(subscriptionId, resourceGroupName, virtualNetworksResourceType, ' ', null);
                }).toThrow(`resourceName: ${validationMessages.StringCannotBeNullUndefinedEmptyOrOnlyWhitespace}`);
            });
        });

        describe('subresourceName validations', () => {
            it('null subresourceName', () => {
                expect(() => {
                    resources.resourceId(subscriptionId, resourceGroupName, subnetsResourceType, resourceName, null);
                }).toThrow(`subresourceName: ${validationMessages.StringCannotBeNullUndefinedEmptyOrOnlyWhitespace}`);
            });

            it('empty subresourceName', () => {
                expect(() => {
                    resources.resourceId(subscriptionId, resourceGroupName, subnetsResourceType, resourceName, '');
                }).toThrow(`subresourceName: ${validationMessages.StringCannotBeNullUndefinedEmptyOrOnlyWhitespace}`);
            });

            it('whitespace subresourceName', () => {
                expect(() => {
                    resources.resourceId(subscriptionId, resourceGroupName, subnetsResourceType, resourceName, ' ');
                }).toThrow(`subresourceName: ${validationMessages.StringCannotBeNullUndefinedEmptyOrOnlyWhitespace}`);
            });

            it('invalid resource type for subresourceName', () => {
                expect(() => {
                    resources.resourceId(subscriptionId, resourceGroupName, virtualNetworksResourceType, resourceName, subresourceName);
                }).toThrow(`subresourceName: ${validationMessages.resources.SubresourceNameShouldNotBeSpecifiedForTopLevelResourceType}`);
            });
        });

        describe('valid resourceId parameters', () => {
            it('valid resource', () => {
                let returnValue = resources.resourceId(subscriptionId, resourceGroupName, virtualNetworksResourceType, resourceName);
                expect(returnValue).toBe(`/subscriptions/${subscriptionId}/resourceGroups/${resourceGroupName}/providers/Microsoft.Network/virtualNetworks/${resourceName}`);
            });

            it('valid subresource', () => {
                let returnValue = resources.resourceId(subscriptionId, resourceGroupName, subnetsResourceType, resourceName,subresourceName);
                expect(returnValue).toBe(`/subscriptions/${subscriptionId}/resourceGroups/${resourceGroupName}/providers/Microsoft.Network/virtualNetworks/${resourceName}/subnets/${subresourceName}`);
            });
        });
    });

    describe('setupResources', () => {
        it('properties set', () => {
            let buildingBlockSettings = {
                subscriptionId: '00000000-0000-1000-8000-000000000000',
                resourceGroupName: 'test-rg',
                location: 'westus2'
            };

            let settings = {
                resource: {
                    name: 'my-name'
                }
            };

            let result = resources.setupResources(settings, buildingBlockSettings, (parentKey) => {
                return ((parentKey === null) || (parentKey === 'resource'));
            });

            expect(result.subscriptionId).toEqual(buildingBlockSettings.subscriptionId);
            expect(result.resourceGroupName).toEqual(buildingBlockSettings.resourceGroupName);
            expect(result.location).toEqual(buildingBlockSettings.location);

            expect(result.resource.subscriptionId).toEqual(buildingBlockSettings.subscriptionId);
            expect(result.resource.resourceGroupName).toEqual(buildingBlockSettings.resourceGroupName);
            expect(result.resource.location).toEqual(buildingBlockSettings.location);
        });

        it('properties overridden', () => {
            let buildingBlockSettings = {
                subscriptionId: '00000000-0000-1000-8000-000000000000',
                resourceGroupName: 'test-rg',
                location: 'westus2'
            };

            let settings = {
                resource: {
                    subscriptionId: '11111111-0000-1000-8000-000000000000',
                    name: 'my-name'
                }
            };

            let result = resources.setupResources(settings, buildingBlockSettings, (parentKey) => {
                return ((parentKey === null) || (parentKey === 'resource'));
            });

            expect(result.subscriptionId).toEqual(buildingBlockSettings.subscriptionId);
            expect(result.resourceGroupName).toEqual(buildingBlockSettings.resourceGroupName);
            expect(result.location).toEqual(buildingBlockSettings.location);

            expect(result.resource.subscriptionId).toEqual(settings.resource.subscriptionId);
            expect(result.resource.resourceGroupName).toEqual(buildingBlockSettings.resourceGroupName);
            expect(result.resource.location).toEqual(buildingBlockSettings.location);
        });

        it('properties inherited', () => {
            let buildingBlockSettings = {
                subscriptionId: '00000000-0000-1000-8000-000000000000',
                resourceGroupName: 'test-rg'
            };

            let settings = {
                resource: {
                    subscriptionId: '11111111-0000-1000-8000-000000000000',
                    name: 'my-name',
                    subresource: {
                        name: 'my-subresource'
                    }
                }
            };

            let result = resources.setupResources(settings, buildingBlockSettings, (parentKey) => {
                return ((parentKey === null) || (parentKey === 'resource') || (parentKey === 'subresource'));
            });

            expect(result.subscriptionId).toEqual(buildingBlockSettings.subscriptionId);
            expect(result.resourceGroupName).toEqual(buildingBlockSettings.resourceGroupName);
            expect(result.location).toEqual(buildingBlockSettings.location);

            expect(result.resource.subscriptionId).toEqual(settings.resource.subscriptionId);
            expect(result.resource.resourceGroupName).toEqual(buildingBlockSettings.resourceGroupName);
            expect(result.resource.location).toEqual(buildingBlockSettings.location);

            expect(result.resource.subresource.subscriptionId).toEqual(settings.resource.subscriptionId);
            expect(result.resource.subresource.resourceGroupName).toEqual(buildingBlockSettings.resourceGroupName);
            expect(result.resource.subresource.location).toEqual(buildingBlockSettings.location);
        });
    });

    describe('extractResourceGroups', () => {
        it('single resource group with settings array', () => {
            let settings = [
                {
                    subscriptionId: '11111111-0000-1000-8000-000000000000',
                    resourceGroupName: 'my-test-rg',
                    location: 'westus2',
                    name: 'my-name',
                    subresource: {
                        name: 'my-subresource',
                        subscriptionId: '11111111-0000-1000-8000-000000000000',
                        resourceGroupName: 'my-test-rg',
                        location: 'westus2',
                    }
                }
            ];

            let result = resources.extractResourceGroups(settings);
            expect(result.length).toEqual(1);

            expect(result[0].subscriptionId).toEqual(settings[0].subscriptionId);
            expect(result[0].resourceGroupName).toEqual(settings[0].resourceGroupName);
            expect(result[0].location).toEqual(settings[0].location);
        });

        it('single resource group with settings object', () => {
            let settings = {
                subscriptionId: '11111111-0000-1000-8000-000000000000',
                resourceGroupName: 'my-test-rg',
                location: 'westus2',
                name: 'my-name',
                subresource: {
                    name: 'my-subresource',
                    subscriptionId: '11111111-0000-1000-8000-000000000000',
                    resourceGroupName: 'my-test-rg',
                    location: 'westus2',
                }
            };

            let result = resources.extractResourceGroups(settings);
            expect(result.length).toEqual(1);

            expect(result[0].subscriptionId).toEqual(settings.subscriptionId);
            expect(result[0].resourceGroupName).toEqual(settings.resourceGroupName);
            expect(result[0].location).toEqual(settings.location);
        });

        it('multiple resource group with settings array', () => {
            let settings = [
                {
                    subscriptionId: '11111111-0000-1000-8000-000000000000',
                    resourceGroupName: 'my-test-rg',
                    location: 'westus2',
                    name: 'my-name',
                    subresource: {
                        name: 'my-subresource',
                        subscriptionId: '11111111-0000-1000-8000-000000000000',
                        resourceGroupName: 'my-test-rg2',
                        location: 'westus2',
                    }
                }
            ];

            let result = resources.extractResourceGroups(settings, settings[0].subresource);
            expect(result.length).toEqual(2);

            expect(result[0].subscriptionId).toEqual(settings[0].subscriptionId);
            expect(result[0].resourceGroupName).toEqual(settings[0].resourceGroupName);
            expect(result[0].location).toEqual(settings[0].location);

            expect(result[1].subscriptionId).toEqual(settings[0].subresource.subscriptionId);
            expect(result[1].resourceGroupName).toEqual(settings[0].subresource.resourceGroupName);
            expect(result[1].location).toEqual(settings[0].subresource.location);
        });

        it('multiple resource group with settings object', () => {
            let settings = {
                subscriptionId: '11111111-0000-1000-8000-000000000000',
                resourceGroupName: 'my-test-rg',
                location: 'westus2',
                name: 'my-name',
                subresource: {
                    name: 'my-subresource',
                    subscriptionId: '11111111-0000-1000-8000-000000000000',
                    resourceGroupName: 'my-test-rg2',
                    location: 'westus2',
                }
            };

            let result = resources.extractResourceGroups(settings, settings.subresource);
            expect(result.length).toEqual(2);

            expect(result[0].subscriptionId).toEqual(settings.subscriptionId);
            expect(result[0].resourceGroupName).toEqual(settings.resourceGroupName);
            expect(result[0].location).toEqual(settings.location);

            expect(result[1].subscriptionId).toEqual(settings.subresource.subscriptionId);
            expect(result[1].resourceGroupName).toEqual(settings.subresource.resourceGroupName);
            expect(result[1].location).toEqual(settings.subresource.location);
        });
    });
});