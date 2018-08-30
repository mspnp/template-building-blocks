#!/bin/bash

#############
# Parameters
#############
# Validate that all arguments are supplied
if [ $# -lt 13 ]; then echo "Insufficient parameters supplied. Exiting"; exit 1; fi

NODE_TYPE=$1
AZUREUSER=$2
ARTIFACTS_URL_PREFIX=$3
NODE_INDEX=$4
CA_PREFIX=$5
CA_NUM=$6
ORDERER_PREFIX=$7
ORDERER_NUM=$8
PEER_PREFIX=$9
PEER_NUM=${10}
CA_USER=${11}
CA_PASSWORD=${12}
PREFIX=${13}

###########
# Constants
###########
HOMEDIR="/home/$AZUREUSER";
CONFIG_LOG_FILE_PATH="$HOMEDIR/config.log";

###########################################
# System packages to be installed as root #
###########################################

# Docker installation: https://docs.docker.com/engine/installation/linux/ubuntu/#install-using-the-repository

# Install packages to allow apt to use a repository over HTTPS:
apt-get -y install apt-transport-https ca-certificates curl software-properties-common

# Add Docker’s official GPG key:
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | apt-key add -

# Set up the stable repository:
sudo add-apt-repository "deb [arch=amd64] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable"

# Update the apt package index:
apt-get update

# Install the latest version of Docker:
apt-get -y install docker-ce

# Create the docker group:
groupadd docker

# Add the Azure user to the docker group:
usermod -aG docker $AZUREUSER

################################################
# System configuration to be performed as root #
################################################

curl -sL https://deb.nodesource.com/setup_6.x | bash
apt-get -y install nodejs build-essential
npm install gulp -g

#############
# Get the script for running as Azure user
#############
cd "/home/$AZUREUSER";

sudo -u $AZUREUSER /bin/bash -c "wget -N ${ARTIFACTS_URL_PREFIX}/scripts/configure-fabric-azureuser.sh";

##################################
# Initiate loop for error checking
##################################
for LOOPCOUNT in `seq 1 5`; do
	sudo -u $AZUREUSER /bin/bash /home/$AZUREUSER/configure-fabric-azureuser.sh "$1" "$2" "$3" "$4" "$5" "$6" "$7" "$8" "$9" "${10}" "${11}" "${12}" "${13}" "${14}" "${15}" "${16}" "${17}" "${18}" >> $CONFIG_LOG_FILE_PATH 2>&1;
	if [ $? -ne 0 ]; then
		echo "Command failed on try $LOOPCOUNT, retrying..." >> $CONFIG_LOG_FILE_PATH;
		sleep 5;
		continue;
	else
		echo "======== Deployment successful! ======== " >> $CONFIG_LOG_FILE_PATH;
		exit 0;
	fi
done

echo "One or more commands failed after 5 tries. Deployment failed." >> $CONFIG_LOG_FILE_PATH;
exit 1