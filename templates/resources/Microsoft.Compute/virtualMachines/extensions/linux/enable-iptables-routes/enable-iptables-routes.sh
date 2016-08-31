#!/bin/bash
bash -c "echo net.ipv4.ip_forward=1 >> /etc/sysctl.conf"
sysctl -p /etc/sysctl.conf

LB_TYPE=$1
DEST_IP_ADDRESS=$2
if [[ "$LB_TYPE" == "public" ]] 
then
	IP_ADDRESS=$(wget http://ipinfo.io/ip -qO -)
else
	IP_ADDRESS=$(/sbin/ifconfig eth0 | grep 'inet addr:' | cut -d: -f2 | awk '{ print $1}')
fi

iptables -F
iptables -t nat -F
iptables -X
iptables -t nat -A PREROUTING -p tcp --dport 80 -j DNAT --to-destination "${DEST_IP_ADDRESS}:80"
iptables -t nat -A PREROUTING -p tcp --dport 443 -j DNAT --to-destination "${DEST_IP_ADDRESS}:443"
iptables -t nat -A POSTROUTING -p tcp -d $DEST_IP_ADDRESS --dport 80 -j SNAT --to-source $IP_ADDRESS
iptables -t nat -A POSTROUTING -p tcp -d $DEST_IP_ADDRESS --dport 80 -j SNAT --to-source $IP_ADDRESS

service ufw stop
service ufw start

DEBIAN_FRONTEND=noninteractive aptitude install -y -q iptables-persistent
/etc/init.d/iptables-persistent save
update-rc.d iptables-persistent defaults
