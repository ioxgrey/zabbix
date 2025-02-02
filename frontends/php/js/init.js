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


/**
 * An object that is used to namespace objects, allows to retrieve and write objects via arbitrary path.
 */
window.ZABBIX = Object.create({

	/**
	 * @param {string} path  Dot separated path. Each segment is used as object key.
	 * @param {mixed} value  Optional value to be written into path only if path held undefined before.
	 *
	 * @return {mixed}  Value underlaying the path is returned.
	 */
	namespace: function(path, value) {
		return path.split('.').reduce(function(obj, pt, idx, src) {
			var last = (idx + 1 == src.length);

			if (typeof obj[pt] === 'undefined') {
				obj[pt] = last ? value : {};
			}

			return obj[pt];
		}, this);
	},

	/**
	 * Logs user out, also, handles side effects before that.
	 */
	logout: function() {
		var ls = this.namespace('instances.localStorage');
		ls && ls.destruct();

		redirect('index.php?reconnect=1', 'post', 'sid', true);
	}
});

jQuery(function($) {

	$.propHooks.disabled = {
		set: function (el, val) {
			if (el.disabled !== val) {
				el.disabled = val;
				$(el).trigger(val ? 'disable' : 'enable');
			}
		}
	};

	var $search = $('#search');

	if ($search.length) {
		createSuggest('search');

		$search.keyup(function() {
			$search
				.siblings('button')
				.prop('disabled', ($.trim($search.val()) === ''));
		}).closest('form').submit(function() {
			if ($.trim($search.val()) === '') {
				return false;
			}
		});
	}

	if (IE) {
		setTimeout(function () { $('[autofocus]').focus(); }, 10);
	}

	/**
	 * Change combobox color according selected option.
	 */
	$('select').each(function() {
		var comboBox = $(this),
			changeClass = function(obj) {
				if (obj.find('option.red:selected').length > 0) {
					obj.addClass('red');
				}
				else {
					obj.removeClass('red');
				}
			};

		comboBox.change(function() {
			changeClass($(this));
		});

		changeClass(comboBox);
	});

	function uncheckedHandler($checkbox) {
		var $hidden = $checkbox.prev('input[type=hidden][name="' + $checkbox.prop('name') + '"]');

		if ($checkbox.is(':checked') || $checkbox.prop('disabled')) {
			$hidden.remove();
		}
		else if (!$hidden.length) {
			$('<input>', {'type': 'hidden', 'name': $checkbox.prop('name')})
				.val($checkbox.attr('unchecked-value'))
				.insertBefore($checkbox);
		}
	}

	$('input[unchecked-value]').each(function() {
		var $this = $(this);

		uncheckedHandler($this);
		$this.on('change enable disable', function() {
			uncheckedHandler($(this));
		});
	});

	function showMenuPopup($obj, data, event, options) {
		var sections;

		switch (data.type) {
			case 'history':
				sections = getMenuPopupHistory(data);
				break;

			case 'host':
				sections = getMenuPopupHost(data, $obj);
				break;

			case 'map_element_submap':
				sections = getMenuPopupMapElementSubmap(data);
				break;

			case 'map_element_group':
				sections = getMenuPopupMapElementGroup(data);
				break;

			case 'map_element_trigger':
				sections = getMenuPopupMapElementTrigger(data);
				break;

			case 'map_element_image':
				sections = getMenuPopupMapElementImage(data);
				break;

			case 'refresh':
				sections = getMenuPopupRefresh(data, $obj);
				break;

			case 'trigger':
				sections = getMenuPopupTrigger(data, $obj);
				break;

			case 'trigger_macro':
				sections = getMenuPopupTriggerMacro(data);
				break;

			case 'dashboard':
				sections = getMenuPopupDashboard(data, $obj);
				break;

			case 'item':
				sections = getMenuPopupItem(data, $obj);
				break;

			case 'item_prototype':
				sections = getMenuPopupItemPrototype(data);
				break;

			case 'submenu':
				sections = getMenuPopupSubmenu(data);
				break;

			default:
				return;
		}

		$obj.menuPopup(sections, event, options);
	}

	/**
	 * Create preloader elements for the menu popup.
	 */
	function createMenuPopupPreloader() {
		return $('<div>', {
			'id': 'menu-popup-preloader',
			'class': 'preloader-container menu-popup-preloader'
		})
			.append($('<div>').addClass('preloader'))
			.appendTo($('body'))
			.on('click', function(e) {
				e.stopPropagation();
			})
			.hide();
	}

	/**
	 * Event handler for the preloader elements destroy.
	 */
	function menuPopupPreloaderCloseHandler(event) {
		overlayPreloaderDestroy(event.data.id, event.data.xhr);
	}

	/**
	 * Is request to a server required to process and update the data passed to the popup menu?
	 *
	 * @param string type  A menu popup type.
	 *
	 * @returns boolean
	 */
	function isServerRequestRequired(type) {
		switch (type) {
			case 'submenu':
				return false;

			default:
				return true;
		}
	}

	/**
	 * Make a default position object for the menu popup, based on it's type.
	 *
	 * @param object $obj   Menu popup opener object.
	 * @param object data   Menu popup data object.
	 * @param object event  Original opener event.
	 */
	function makeDefaultPosition($obj, data, event) {
		switch (data.type) {
			case 'submenu':
				return {
					of: $obj,
					my: 'left top',
					at: 'left bottom+10'
				};

			default:
				return {
					of: event,
					my: 'left top',
					at: 'left bottom'
				};
		}
	}

	/**
	 * Build menu popup for given elements.
	 */
	$(document).on('keydown click', '[data-menu-popup]', function(event) {
		var $obj = $(this),
			data = $obj.data('menu-popup');

		if (event.type === 'keydown' && event.which != 13) {
			return;
		}

		// Manually trigger event for menuPopupPreloaderCloseHandler call for the previous preloader.
		if ($('#menu-popup-preloader').length) {
			$(document).trigger('click');
		}

		// Close other action menus and prevent focus jumping before opening a new popup.
		$('.menu-popup-top').menuPopup('close', null, false);

		// Create options object based on original options.
		var options = $.extend({
			position: makeDefaultPosition($obj, data, event)
		}, data.options || {});

		if (isServerRequestRequired(data.type)) {
			var url = new Curl('zabbix.php');

			url.setArgument('action', 'menu.popup');
			url.setArgument('type', data.type);

			var xhr = $.ajax({
					url: url.getUrl(),
					method: 'POST',
					data: {
						data: data.data
					},
					dataType: 'json'
				});

			var	$preloader = createMenuPopupPreloader();

			setTimeout(function() {
				$preloader.fadeIn(200).position(options.position);
			}, 500);

			addToOverlaysStack($preloader.prop('id'), event.target, 'preloader', xhr);

			xhr.done(function(resp) {
				overlayPreloaderDestroy($preloader.prop('id'));
				showMenuPopup($obj, resp.data, event, options);
			});

			$(document)
				.off('click', menuPopupPreloaderCloseHandler)
				.on('click', {id: $preloader.prop('id'), xhr: xhr}, menuPopupPreloaderCloseHandler);
		}
		else {
			showMenuPopup($obj, jQuery.extend({type: data.type}, data.data), event, options);
		}

		return false;
	});

	/**
	 * add.popup event
	 *
	 * Call multiselect method 'addData' if parent was multiselect, execute addPopupValues function
	 * or just update input field value
	 *
	 * @param object data
	 * @param string data.object   object name
	 * @param array  data.values   values
	 * @param string data.parentId parent id
	 */
	$(document).on('add.popup', function(e, data) {
		// multiselect check
		if ($('#' + data.parentId).hasClass('multiselect')) {
			var items = [];
			for (var i = 0; i < data.values.length; i++) {
				if (typeof data.values[i].id !== 'undefined') {
					var item = {
						'id': data.values[i].id,
						'name': data.values[i].name
					};

					if (typeof data.values[i].prefix !== 'undefined') {
						item.prefix = data.values[i].prefix;
					}
					items.push(item);
				}
			}

			$('#' + data.parentId).multiSelect('addData', items);
		}
		else if (!$('[name="' + data.parentId + '"]').hasClass('simple-textbox')
				&& typeof addPopupValues !== 'undefined') {
			// execute function if they exist
			addPopupValues(data);
		}
		else {
			$('#' + data.parentId).val(data.values[0].name);
		}
	});

	// redirect buttons
	$('button[data-url]').click(function() {
		var button = $(this);
		var confirmation = button.data('confirmation');

		if (typeof confirmation === 'undefined' || (typeof confirmation !== 'undefined' && confirm(confirmation))) {
			window.location = button.data('url');
		}
	});

	// Initialize hintBox event handlers.
	hintBox.bindEvents();
});
