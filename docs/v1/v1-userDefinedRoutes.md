---
title: User Defined Routes
---

# User Defined Routes

Use the **userDefinedRoutes** template building block to deploy one or more [User Defined Routes (UDRs)](https://docs.microsoft.com/azure/virtual-network/virtual-networks-udr-overview) to an [Azure virtual network (VNet)](https://docs.microsoft.com/azure/virtual-network/virtual-networks-overview). 

UDRs are deployed independently of the VNet, so this building block template requires a pre-existing resource group and VNet. Use the [vnet-n-subnet](https://github.com/mspnp/template-building-blocks/tree/v1.0.0/scenarios/vnet-n-subnet) building block to create these resources if they don't already exist.

> **Note** The pattern for deploying UDRs using this building block template is to first deploy the VNet and VMs and then tighten security with a UDR.

## Parameters

There are two parameters in the building block template: **virtualNetworkSettings** and **routeTableSettings**. 

### virtualNetworkSettings

The **virtualNetworkSettings** parameter specifies the VNet and resource group associated a UDR. It contains the following properties:

- **name**  
_Value_. _Required_.  
Name of the VNet that these UDRs apply to.  
- **resourceGroup**  
_Value_. _Required_.  
Name of the resource group that the UDR belongs to.  

### routeTableSettings

The **routeTableSettings** parameter specifies routes and the subnets and IP ranges that the routes apply to. It contains the following properties:

- **name**  
_Value_. _Required_.  
Name of the route.  
- **subnets**  
_Array of values_. _Required_.  
Specifies the subnet names that these route table settings apply to.  
- **routes**  
_Array of objects_. _Required_.  
Specifies one or more route definitions. A route definition is specified using the following object:  
  - **name**  
  _Value_. _Required_.  
  Name of the route.  
  - **addressPrefix**  
  _Value_. _Required_.  
  The destination CIDR block that the route applies to.  
  - **nextHopType**  
  _Value_. _Required_.  
  The type of Azure resource that the packet should be sent to.  Valid values are available in the **next hop type** row of the **route resource** table in [user-defined routes and IP forwarding](https://docs.microsoft.com/azure/virtual-network/virtual-networks-udr-overview#ip-forwarding).  
  - **nextHopIpAddress**  
  _Value_. _Required if **nextHopType** is `Virtual Appliance`, otherwise not used_.  
  The IP address that packets are fowarded to.  

## Deployment

You can deploy this building block using the Azure portal, PowerShell, or Azure CLI.

### Azure portal

Note that this building block deployment process requires a parameter file stored in a location with a publicly available URI.

1. Click the button below:<br><a href="https://portal.azure.com/#create/Microsoft.Template/uri/https%3A%2F%2Fraw.githubusercontent.com%2Fmspnp%2Ftemplate-building-blocks%2Fv1.0.0%2Fscenarios%2FuserDefinedRoutes%2Fazuredeploy.json" target="_blank"><img src = "http://azuredeploy.net/deploybutton.png"/></a>
2. Wait for the Azure Portal to open.  
3. In the `Basics` section:
  - Select your `Subscription` from the drop-down list.
  - For the `Resource group`, you can either create a new resource group or use an existing resource group.
  - Select the region where you'd like to deploy the VNet in the `Location` drop-down list.  
4. In the `Settings` section, enter a URI to a valid parameter file. There are several [example parameter files](https://github.com/mspnp/template-building-blocks/tree/v1.0.0/scenarios/userDefinedRoutes/parameters) in Github. Note that if you want to use one of these parameter files the URI must be the path to the `raw` file in Github.  These parameter files require pre-existing VNets and subnets and the deployment will fail if they do not exist. You will need to inspect the parameters to determine these requirements.  
5. Review the terms and conditions, then click the **I agree to the terms and conditions stated above** checkbox.  
6. Click the **Purchase** button.  
7. Wait for the deployment to complete.

### PowerShell

To deploy the building block template using a parameter file hosted at a publicly available URI, follow these steps:

1. Upload your parameter file to a location with a publicly available URI.
2. Log in to Azure using your selected subscription:
```powershell
Login-AzureRmAccount -SubscriptionId <your subscription ID>
```
3. If you do not have an existing resource group, run the `New-AzureRmResourceGroup` cmdlet to create one as shown below:
```powershell
New-AzureRmResourceGroup -Location <Target Azure Region> -Name <Resource Group Name> 
```
4. Deploy a VNet. For more information see the [vnet-n-subnet](https://github.com/mspnp/template-building-blocks/blob/v1.0.0/templates/buildingBlocks/vnet-n-subnet/README.md) building block template.  
5. Run the `New-AzureRmResourceGroupDeployment` cmdlet as shown below.  
```powershell
New-AzureRmResourceGroupDeployment -ResourceGroupName <Resource Group Name> -TemplateUri https://raw.githubusercontent.com/mspnp/template-building-blocks/v1.0.0/scenarios/userDefinedRoutes/azuredeploy.json -templateParameterUriFromTemplate <URI of parameter file>
```

**Example**  
The cmdlet below deploys the [multiple-routes-on-subnets](https://raw.githubusercontent.com/mspnp/template-building-blocks/v1.0.0/scenarios/userDefinedRoutes/parameters/multiple-routes-on-subnets.json) parameter file from the [scenarios folder](https://github.com/mspnp/template-building-blocks/tree/v1.0.0/scenarios/userDefinedRoutes) in Github.

> Note that this deployment requires an existing VNet named **bb-dev-vnet** in the **bb-dev-rg** resource group. **bb-dev-vnet** also requires subnets named **web**, **biz**, and **data**.

```powershell
New-AzureRmResourceGroupDeployment -ResourceGroupName bb-dev-rg -TemplateUri https://raw.githubusercontent.com/mspnp/template-building-blocks/v1.0.0/scenarios/userDefinedRoutes/azuredeploy.json -templateParameterUriFromTemplate https://raw.githubusercontent.com/mspnp/template-building-blocks/v1.0.0/scenarios/userDefinedRoutes/parameters/multiple-routes-on-subnets.parameters.json 
```

### Azure CLI

Before you begin, install the latest version of the [Azure CLI](https://docs.microsoft.com/cli/azure/install-azure-cli).

To deploy the building block template using a parameter file hosted at a publicly available URI, follow these steps:

1. Upload your parameter file to a location with a publicly available URI.  
2. Log in to Azure using your selected subscripton:  
```batch
az login
```
3. Set your selected subscription:
```batch
az account set --subscription <your subscripton ID>
```
4. If you do not have an existing resource group, create a new one using the following command:
```batch
az group create -l <Target Azure Region> -n <Resource Group Name> 
```
5. Deploy a VNet. For more information see the [vnet-n-subnet](https://github.com/mspnp/template-building-blocks/blob/v1.0.0/templates/buildingBlocks/vnet-n-subnet/README.md) building block template.  
6. Run the command shown below to deploy the VNet
```batch
az group deployment create -g <Resource Group Name> --template-uri https://raw.githubusercontent.com/mspnp/template-building-blocks/v1.0.0/scenarios/userDefinedRoutes/azuredeploy.json --parameters "{\"templateParameterUri\":{\"value\":\"<parameter file public URI>\"}}"
```

**Example**  
The command below creates a resource group named **bb-dev-rg** in the **westus** region, then deploys the [multiple-routes-on-subnets](https://raw.githubusercontent.com/mspnp/template-building-blocks/v1.0.0/scenarios/userDefinedRoutes/parameters/multiple-routes-on-subnets.parameters.json) parameter file from the [scenarios folder](https://github.com/mspnp/template-building-blocks/tree/v1.0.0/scenarios/userDefinedRoutes) in Github.

> Note that this deployment requires an existing VNet named **bb-dev-vnet** in the **bb-dev-rg** resource group. **bb-dev-vnet** also requires subnets named **web**, **biz**, and **data**.

```batch
az login
az group deployment create -g bb-dev-rg --template-uri https://raw.githubusercontent.com/mspnp/template-building-blocks/v1.0.0/scenarios/userDefinedRoutes/azuredeploy.json --parameters "{\"templateParameterUri\":{\"value\":\"https://raw.githubusercontent.com/mspnp/template-building-blocks/v1.0.0/scenarios/userDefinedRoutes/parameters/multiple-routes-on-subnets.parameters.json\"}}"
```