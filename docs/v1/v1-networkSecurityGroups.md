# networkSecurityGroups

Use the **networkSecurityGroups** building block template to deploy one or more [Network Security Groups (NSG)][virtual-networks-nsg]. The one or more NSGs are with a subnet on an existing [Azure virtual network (VNet)](https://docs.microsoft.com/azure/virtual-network/virtual-networks-overview). 

NSGs are deployed independently of the VNet, so this building block template requires a pre-existing resource group and VNet. Use the [vnet-n-subnet](https://github.com/mspnp/template-building-blocks/tree/v1.0.0/scenarios/vnet-n-subnet) building block to create these resources if they don't already exist.

> **Note** The pattern for deploying NSGs using this building block template is to first deploy the VNet and VMs and then tighten security with a NSG.

## Parameters

There are two parameters in this building block template: **virtualNetworkSettings** and **networkSecurityGroupsSettings**. 

### virtualNetworkSettings

The **virtualNetworkSettings** parameter specifies the VNet and resource group associated with a NSG. It contains the following properties:

- **name**  
_Value_. _Required_.  
Name of the VNet that the NSG applies to.  

- **resourceGroup**  
_Value_. _Required_.  
Name of the resource group that the NSG belongs to.  

### networkSecurityGroupsSettings

The **networkSecurityGroupsSettings** parameter specifies security rules as well as the associated subnets and NICs those rules apply to. It contains the following properties:

- **name**  
_Value_. _Required_.  
Name of the NSG.  
- **subnets**  
_Array of values_. _Required_.  
Specifies the subnet names that the NSG rules apply to.  
- **networkInterfaces**  
_Array of values_. _Required_.  
Specifies one or more virtual network interface cards (NICs) that the NSG rules apply to. Leave empty to apply NSG rules all NICs on the subnet.  
- **securityRules**  
_Array of objects_. _Required_.  
Specifies one or more security rules.  Security rules are specified using the following object:  
  - **name**  
  _Value_. _Required_.  
  Name of the rule.  
  - **direction**  
  _Value_. _Required_.  
  Valid values: `Inbound` | `Outbound`  
  Direction of traffic to match for the rule.  
  - **priority**  
  _Value_. _Required_.  
  Valid values: integers between 100 and 4096  
  Specifies priority of the rule. Rules are applied in priority order. Once a rule is applied, rule processing terminates.  
  - **sourceAddressPrefix**  
  _Value_. _Required_.  
  Valid values: Single IP address (i.e. 10.10.10.10), CIDR Block (i.e. 192.168.1.0/24), [default tag][virtual-networks-nsg] to specify a category of IP addresses(VIRTUAL_NETWORK, AZURE_LOADBALANCER, or INTERNET), or * (for all addresses)  
  Source address prefix or tag to match for the rule.  
  - **destinationAddressPrefix**  
  _Value_. _Required_.  
  Valid values: Single IP address (i.e. 10.10.10.10), CIDR Block (i.e. 192.168.1.0/24), [default tag][virtual-networks-nsg] to specify a category of IP addresses(VIRTUAL_NETWORK, AZURE_LOADBALANCER, or INTERNET), or * (for all addresses)  
  Required. Destination address prefix or tag to match for the rule.  
  - **sourcePortRange**  
  _Value_. _Required_.  
  Valid values: Single port number from 1 to 65535, port range (i.e. 1-65635), or * (for all ports) 
  Source port range to match for the rule.  
  - **destinationPortRange**  
  _Value_. _Required_.  
  Allowable values: Single port number from 1 to 65535, port range (i.e. 1-65635), or * (for all ports) 
  Destination port range to match for the rule.  
  - **access**  
  _Value_. _Required_.  
  Valid values: `Allow` | `Deny`  
  Allow or deny access if this rule applies.  
  - **protocol**  
  _Value_. _Required_.  
  Valid values: `TCP` | `UDP` | `*` (all protocols)  
  Specifies type of protocol evaluated for the rule.  

## Deployment

YYou can deploy this building block using the Azure portal, PowerShell, or Azure CLI.

### Azure portal

Note that this building block deployment process requires a parameter file stored in a location with a publicly available URI.

1. Right click the button below and select the option to open the link in a new tab or a new window:<br><a href="https://portal.azure.com/#create/Microsoft.Template/uri/https%3A%2F%2Fraw.githubusercontent.com%2Fmspnp%2Ftemplate-building-blocks%2Fv1.0.0%2Fscenarios%2FnetworkSecurityGroups%2Fazuredeploy.json"><img src = "http://azuredeploy.net/deploybutton.png"/></a>
2. Wait for the Azure Portal to open.  
3. In the `Basics` section:
  - Select your `Subscription` from the drop-down list.
  - For the `Resource group`, you can either create a new resource group or use an existing resource group.
  - Select the region where you'd like to deploy the VNet in the `Location` drop-down list.  
4. In the `Settings` section, enter a URI to a valid parameter file. There are several [example parameter files](https://github.com/mspnp/template-building-blocks/tree/v1.0.0/scenarios/networkSecurityGroups/parameters) in Github. Note that if you want to use one of these parameter files the URI must be the path to the `raw` file in Github.
  > These parameter files require pre-existing VNets and subnets and the deployment will fail if they do not exist. You will need to inspect the parameters to determine these requirements.  
5. Review the terms and conditions, then click the **I agree to the terms and conditions stated above** checkbox.  
6. Click the **Purchase** button.  
7. Wait for the deployment to complete.

### PowerShell

To deploy the building block template using a parameter file hosted at a publicly available URI, follow these steps:

1. Upload your parameter file to a location with a publicly available URI.
2. Log in to Azure using your selected subscription:
  ```Powershell
  Login-AzureRmAccount -SubscriptionId <your subscription ID>
  ```
3. If you do not have an existing resource group, run the `New-AzureRmResourceGroup` cmdlet to create one as shown below:
  ```PowerShell
  New-AzureRmResourceGroup -Location <Target Azure Region> -Name <Resource Group Name> 
  ```
4. Deploy a VNet. For more information see the [vnet-n-subnet](https://github.com/mspnp/template-building-blocks/blob/v1.0.0/templates/buildingBlocks/vnet-n-subnet/README.md) building block template.  
5. Run the `New-AzureRmResourceGroupDeployment` cmdlet as shown below.  
  ```PowerShell
  New-AzureRmResourceGroupDeployment -ResourceGroupName <Resource Group Name> -TemplateUri https://raw.githubusercontent.com/mspnp/template-building-blocks/v1.0.0/scenarios/networkSecurityGroups/azuredeploy.json -templateParameterUriFromTemplate <URI of parameter file>
  ```

**Example**  
The cmdlet below deploys the [3-nsgs-on-3-subnets](https://raw.githubusercontent.com/mspnp/template-building-blocks/v1.0.0/scenarios/networkSecurityGroups/parameters/3-nsgs-on-3-subnets.parameters.json) parameter file from the [scenarios folder](https://github.com/mspnp/template-building-blocks/tree/v1.0.0/scenarios/networkSecurityGroups) in Github.

> Note that this deployment requires an existing VNet named **bb-dev-vnet** in a resource group named **bb-dev-rg**. **bb-dev-vnet** also requires subnets named **web**, **biz**, and **data**.

```PowerShell
New-AzureRmResourceGroupDeployment -ResourceGroupName bb-dev-rg -TemplateUri https://raw.githubusercontent.com/mspnp/template-building-blocks/v1.0.0/scenarios/networkSecurityGroups/azuredeploy.json -templateParameterUriFromTemplate https://raw.githubusercontent.com/mspnp/template-building-blocks/v1.0.0/scenarios/networkSecurityGroups/parameters/3-nsgs-on-3-subnets.parameters.json
```

### Azure CLI

Before you begin, install the latest version of the [Azure CLI](https://docs.microsoft.com/cli/azure/install-azure-cli).

To deploy the building block template using a parameter file hosted at a publicly available URI, follow these steps:

1. Upload your parameter file to a location with a publicly available URI.  
2. Log in to Azure using your selected subscripton:  
  ```AzureCLI
  az login
  ```
3. Set your selected subscription:
  ```AzureCLI
  az account set --subscription <your subscripton ID>
  ```
4. If you do not have an existing resource group, create a new one using the following command:
  ```AzureCLI
  az group create -l <Target Azure Region> -n <Resource Group Name> 
  ```
5. Deploy a VNet. For more information see the [vnet-n-subnet](https://github.com/mspnp/template-building-blocks/blob/v1.0.0/templates/buildingBlocks/vnet-n-subnet/README.md) building block template.  
6. Run the command shown below:
  ```AzureCLI
  az group deployment create -g <Resource Group Name>
  --template-uri https://raw.githubusercontent.com/mspnp/template-building-blocks/v1.0.0/scenarios/networkSecurityGroups/azuredeploy.json
  --parameters "{\"templateParameterUri\":{\"value\":\"<parameter file public URI>\"}}"
  ```

**Example**  
The command below deploys the [3-nsgs-on-3-subnets](https://raw.githubusercontent.com/mspnp/template-building-blocks/v1.0.0/scenarios/networkSecurityGroups/parameters/multiple-routes-on-subnets.parameters.json) parameter file from the [scenarios folder](https://github.com/mspnp/template-building-blocks/tree/v1.0.0/scenarios/networkSecurityGroups) in Github.

> Note that this deployment requires an existing VNet named **bb-dev-vnet** in the **bb-dev-rg** resource group. **bb-dev-vnet** also requires subnets named **web**, **biz**, and **data**.

```AzureCLI
az login
az group deployment create -g bb-dev-rg --template-uri https://raw.githubusercontent.com/mspnp/template-building-blocks/v1.0.0/scenarios/networkSecurityGroups/azuredeploy.json --parameters "{\"templateParameterUri\":{\"value\":\"https://raw.githubusercontent.com/mspnp/template-building-blocks/v1.0.0/scenarios/networkSecurityGroups/parameters/3-nsgs-on-3-subnets.parameters.json\"}}"
```

<!-- links -->
[virtual-networks-nsg]: https://docs.microsoft.com/azure/virtual-network/virtual-networks-nsg