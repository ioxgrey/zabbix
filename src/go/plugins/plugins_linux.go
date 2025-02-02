/*
** Zabbix
** Copyright (C) 2001-2019 Zabbix SIA
**
** This program is free software; you can redistribute it and/or modify
** it under the terms of the GNU General Public License as published by
** the Free Software Foundation; either version 2 of the License, or
** (at your option) any later version.
**
** This program is distributed in the hope that it will be useful,
** but WITHOUT ANY WARRANTY; without even the implied warranty of
** MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
** GNU General Public License for more details.
**
** You should have received a copy of the GNU General Public License
** along with this program; if not, write to the Free Software
** Foundation, Inc., 51 Franklin Street, Fifth Floor, Boston, MA  02110-1301, USA.
**/

package plugins

import (
	_ "zabbix.com/plugins/kernel"
	_ "zabbix.com/plugins/net/netif"
	_ "zabbix.com/plugins/proc"
	_ "zabbix.com/plugins/system/cpucollector"
	_ "zabbix.com/plugins/system/uname"
	_ "zabbix.com/plugins/system/uptime"
	_ "zabbix.com/plugins/systemd"
	_ "zabbix.com/plugins/vfs/dev"
	_ "zabbix.com/plugins/vfs/file"
)
