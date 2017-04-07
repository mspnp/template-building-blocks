# virtualMachine-extensions

Use the **virtualMachine-extensions** template building block to deploy one or more [virtual machine extensions](https://docs.microsoft.com/azure/virtual-machines/windows/extensions-features) to an Azure virtual machine.

Extensions can also be configured when using the [multi-vm-n-nic-m-storage](https://github.com/mspnp/template-building-blocks/blob/v1.0.0/templates/buildingBlocks/multi-vm-n-nic-m-storage/README.md) building block, using the same **extensions** parameter structure used in this block.


## Parameters

The **virtualMachine-extensions** building block template contains one parameter named **virtualMachinesExtensionSettings**.
 
### virtualMachinesExtensionSettings

The **virtualMachinesExtensionSettings** parameter specifies the extensions to be installed on VMs. It contains the following properties:

- **vms**  
_Array of values_. _Required_.  
Specifies an array of names of pre-existing VMs that the extensions will be installed on.    
- **extensions**  
_Array of objects_. _Required_.  
Specifies one or more extension definitions. Each extension definition is specified using the following object:  
  - **name**  
  _Value_. _Required_.  
  Defines the display name of this extension.  
  - **publisher**
  _Value_. _Required_.  
  Extension publisher name.  
  - **type**  
  _Value_. _Required_.  
  Extension type.  
  - **typeHandlerVersion**  
  _Value_. _Required_.  
  Version of extension to use.  
  - **autoUpgradeMinorVersion**
  _Value_. _Required_.  
  Valid values: `true` | `false`  
  Set to `true` if the extension can upgrade automatically. Otherwise `false`.  
  - **settingsConfigMapperUri**  
  _Value_. _Required_.  
  Valid value:  `https://raw.githubusercontent.com/mspnp/template-building-blocks/v1.0.0/templates/resources/Microsoft.Compute/virtualMachines/extensions/vm-extension-passthrough-settings-mapper.json`  
  URL of template used during deployment process.  
  - **settingsConfig**  
  _Object_. _Required_.  
  Specifies extension specific settings.  Set to an empty object for no extension specific settings.  
  - **protectedSettingsConfig**  
  _Object_. _Required_.  
  Specifies extension specific settings that are encrypted during deployment. Set to an empty object for no extension specific settings.  

## Deployment

You can deploy a building block by using the Azure portal, PowerShell, or Azure CLI. The examples below show how to deploy the building block using the sample parameters file above.

### Azure portal

You can deploy this building block template using the Azure portal, PowerShell, or Azure CLI.

### Azure portal

Note that this building block deployment process requires a parameter file stored in a location with a publicly available URI.

1. Right click the button below and select the option to open the link in a new tab or a new window:<br><a href="https://portal.azure.com/#create/Microsoft.Template/uri/https%3A%2F%2Fraw.githubusercontent.com%2Fmspnp%2Ftemplate-building-blocks%2Fv1.0.0%2Fscenarios%2FvirtualMachine-extensions%2Fazuredeploy.json"><img src = "http://azuredeploy.net/deploybutton.png"/></a>
2. Wait for the Azure Portal to open.  
3. In the `Basics` section:
  - Select your `Subscription` from the drop-down list.
  - For the `Resource group`, you can either create a new resource group or use an existing resource group.
  - Select the region where you'd like to deploy the VNet in the `Location` drop-down list.  
4. In the `Settings` section, enter a URI to a valid parameter file. There are several [example parameter files](https://github.com/mspnp/template-building-blocks/tree/v1.0.0/scenarios/virtualMachine-extensions/parameters) in Github. Note that if you want to use one of these parameter files the URI must be the path to the `raw` file in Github. These parameter files require pre-existing VNets and subnets and the deployment will fail if they do not exist. You will need to inspect the parameters to determine these requirements.  
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
  New-AzureRmResourceGroupDeployment -ResourceGroupName <Resource Group Name> -TemplateUri https://raw.githubusercontent.com/mspnp/template-building-blocks/v1.0.0/scenarios/virtualMachine-extensions/azuredeploy.json -templateParameterUriFromTemplate <URI of parameter file>
  ```

**Example**  
The cmdlet below deploys the [multiple-extensions-multiple-vms](https://raw.githubusercontent.com/mspnp/template-building-blocks/v1.0.0/scenarios/virtualMachine-extensions/parameters/multiple-extensions-multiple-vms.parameters.json) parameter file from the [scenarios folder](https://github.com/mspnp/template-building-blocks/tree/v1.0.0/scenarios/virtualMachine-extensions) in Github.

> Note that this deployment requires two existing VMs, one named **bb-dev-biz-vm1** and one named **bb-dev-biz-vm2**.

```PowerShell
New-AzureRmResourceGroupDeployment -ResourceGroupName bb-dev-rg -TemplateUri https://raw.githubusercontent.com/mspnp/template-building-blocks/v1.0.0/scenarios/virtualMachine-extensions/azuredeploy.json -templateParameterUriFromTemplate https://raw.githubusercontent.com/mspnp/template-building-blocks/v1.0.0/scenarios/virtualMachine-extensions/parameters/multiple-extensions-multiple-vms.parameters.json

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
  --template-uri https://raw.githubusercontent.com/mspnp/template-building-blocks/v1.0.0/scenarios/virtualMachine-extensions/azuredeploy.json
  --parameters "{\"templateParameterUri\":{\"value\":\"<parameter file public URI>\"}}"
  ```

**Example**  
The command below deploys the [vpn](https://raw.githubusercontent.com/mspnp/template-building-blocks/v1.0.0/scenarios/virtualMachine-extensions/parameters/multiple-extensions-multiple-vms.parameters.json) parameter file from the [scenarios folder](https://github.com/mspnp/template-building-blocks/tree/v1.0.0/scenarios/virtualMachine-extensions) in Github.

> Note that this deployment requires two existing VMs, one named **bb-dev-biz-vm1** and one named **bb-dev-biz-vm2**.

```AzureCLI
az login
az group deployment create -g bb-dev-rg --template-uri https://raw.githubusercontent.com/mspnp/template-building-blocks/v1.0.0/scenarios/virtualMachine-extensions/azuredeploy.json --parameters "{\"templateParameterUri\":{\"value\":\"https://raw.githubusercontent.com/mspnp/template-building-blocks/v1.0.0/scenarios/virtualMachine-extensions/parameters/multiple-extensions-multiple-vms.parameters.json\"}}"
```