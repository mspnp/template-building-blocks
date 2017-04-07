# vnet-n-subnet

Use the vnet-n-subnet building block template to deploy an [Azure virtual network (VNet)](https://docs.microsoft.com/en-us/azure/virtual-network/virtual-networks-overview). This building block deploys a virtual network with no additional resources. To deploy a VNet with that includes Network Security Groups (NSGs) or User Defined Routes (UDRs), use the following building blocks: 

- [Network Security Groups](https://github.com/mspnp/template-building-blocks/tree/v1.0.0/templates/buildingBlocks/networkSecurityGroups)
- [User Defined Routes](https://github.com/mspnp/template-building-blocks/tree/v1.0.0/templates/buildingBlocks/userDefinedRoutes)


## Parameters

There is one parameter in this building block template named **virtualNetworkSettings**. It contains the following properties:

- **name**  
_Value_. _Required_.  
Name of the VNet.
- **addressPrefixes**  
_Array of values_. _Required_.  
Specifies the CIDR address blocks for the entire VNet. Supports multiple CIDR prefixes.  
- **subnets**  
_Array of objects_. _Required_.  
Specifies the subnets within the VNet. Subnets are specified by the following object:
  - **name**  
   _Value_. _Required._  
   Name of the subnet.  
  - **addressPrefix**  
  _Value_. _Required_.  
  CIDR address block for the subnet (must be valid within the VNet address space definition).
- **dnsServers**  
  _Array of values_. _Required_.  
  Defines one or more custom DNS Server address for the VNet. Leave the array empty to use Azure internal name resolution.

## Deployment

You can deploy a building block template using the Azure portal, PowerShell, or Azure CLI. 

### Azure portal

Note that the building block deployment process will require you store your parameters file in a location with a publicly available URI, which you provide during deployment.

1. Right click the button below and select the option to open the link in a new tab or a new window:<br><a href="https://portal.azure.com/#create/Microsoft.Template/uri/https%3A%2F%2Fraw.githubusercontent.com%2Fmspnp%2Ftemplate-building-blocks%2Fv1.0.0%2Fscenarios%2Fvnet-n-subnet%2Fazuredeploy.json" target="_blank"><img src = "http://azuredeploy.net/deploybutton.png"/></a>
2. Wait for the Azure Portal to open.
3. In the `Basics` section:
  - Select your `Subscription` from the drop-down list.
  - For the `Resource group`, you can either create a new resource group or use an existing resource group.
  - Select the region where you'd like to deploy the VNet in the `Location` drop-down list.
4. In the `Settings` section, enter a URI to a valid parameter file. There are several [example parameter files](https://github.com/mspnp/template-building-blocks/tree/v1.0.0/scenarios/vnet-n-subnet/parameters) in Github. Note that if you want to use one of these parameter files the URI must be the path to the `raw` file in Github. 
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
3. If you do not have an existing resource group, run the **New-AzureRmResourceGroup** cmdlet to create one as shown below:
  ```PowerShell
  New-AzureRmResourceGroup -Location <Target Azure Region> -Name <Resource Group Name> 
  ```
4. Run the **New-AzureRmResourceGroupDeployment** cmdlet as shown below.
  ```PowerShell
  New-AzureRmResourceGroupDeployment -ResourceGroupName <Resource Group Name> -TemplateUri https://raw.githubusercontent.com/mspnp/template-building-blocks/v1.0.0/scenarios/vnet-n-subnet/azuredeploy.json -templateParameterUriFromTemplate <URI of parameter file>
  ```

**Example**  
The cmdlet below creates a resource group named **app1-rg** in the **westus** region, then deploys the [vnet-multiple-subnet-dns](https://raw.githubusercontent.com/mspnp/template-building-blocks/v1.0.0/scenarios/vnet-n-subnet/parameters/vnet-multiple-subnet-dns.parameters.json) parameter file from the [scenarios folder](https://github.com/mspnp/template-building-blocks/tree/v1.0.0/scenarios/vnet-n-subnet) in Github.

```PowerShell
Login-AzureRmAccount -SubscriptionId <your subscription ID>
New-AzureRmResourceGroup -Location westus -Name app1-rg
New-AzureRmResourceGroupDeployment -ResourceGroupName app1-rg -TemplateUri https://raw.githubusercontent.com/mspnp/template-building-blocks/v1.0.0/scenarios/vnet-n-subnet/azuredeploy.json -templateParameterUriFromTemplate https://raw.githubusercontent.com/mspnp/template-building-blocks/v1.0.0/scenarios/vnet-n-subnet/parameters/vnet-multiple-subnet-dns.parameters.json
```

### Azure CLI

Before you begin, install the latest version of the [Azure CLI](https://docs.microsoft.com/en-us/cli/azure/install-azure-cli).

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
5. Run the command shown below to deploy the VNet
  ```AzureCLI
  az group deployment create -g <Resource Group Name>
  --template-uri https://raw.githubusercontent.com/mspnp/template-building-blocks/v1.0.0/scenarios/vnet-n-subnet/azuredeploy.json 
  --parameters "{\"templateParameterUri\":{\"value\":\"<parameter file public URI>\"}}"
  ```

**Example**  
The command below creates a resource group named **app1-rg** in the **westus** region, then deploys the [vnet-multiple-subnet-dns](https://raw.githubusercontent.com/mspnp/template-building-blocks/v1.0.0/scenarios/vnet-n-subnet/parameters/vnet-multiple-subnet-dns.parameters.json) parameter file from the [scenarios folder](https://raw.githubusercontent.com/mspnp/template-building-blocks/v1.0.0/scenarios/vnet-n-subnet/parameters/vnet-multiple-subnet-dns.parameters.json) in Github.

```AzureCLI
az login
az group create -l "westus" -n "app1-rg"
az group deployment create -g app1-rg --template-uri https://raw.githubusercontent.com/mspnp/template-building-blocks/v1.0.0/scenarios/vnet-n-subnet/azuredeploy.json --parameters "{\"templateParameterUri\":{\"value\":\"https://raw.githubusercontent.com/mspnp/template-building-blocks/v1.0.0/scenarios/vnet-n-subnet/parameters/vnet-multiple-subnet-dns.parameters.json\"}}"
```