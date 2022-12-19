(function () {

	var self = {};

	var elementType = getElementType();
	var lineError = getLineError();

	/**
	 * [SVG 인지 XML 인지 구분]
	 * @return {[string]} [SVG 인지 XML 인지 구분]
	 */
	function getElementType () {

		var g = {doc: document, win: window};

		var elementType = (g.win.SVGAngle || g.doc.implementation.hasFeature("http://www.w3.org/TR/SVG11/feature#BasicStructure", "1.1") ? "SVG" : "VML");

		return elementType;
	}

	/**
	 * [SVG 의 경우 라인 두께를 0.5 만큼 다르게 인식하기 때문에 계산에 필요함]
	 * @return {number} [라인 두께 차이]
	 */
	function getLineError () {
		
		var lineError = 0;

		if ( elementType == 'SVG' ) {

			lineError = 0.5;
		}

		return lineError;
	}

	/**
	 * [기본 스타일]
	 * @return {[object]} [기본 스타일]
	 */
	function getDefaultStyles () {

		var defaultStyles = {

			item : {

				// 면 색상
				'fill': '#eee',

				// 면 투명도
				'fill-opacity' : 1,

				// 선 색상
				'stroke': '#000',

				// 선 두께
				'stroke-width': 1,

				// 선 투명도
				'stroke-opacity': 1,

				// 선 스타일 ['', '-', '.', '-.', '-..', '. ', '- ', '--', '- .', '--.', '--..']
				'stroke-dasharray': '',

				// 폰트 패밀리
				'font-family': 'dotum',

				// 폰트 사이즈
				'font-size': 40,

				// 폰트 두께
				'font-weight': 'bold',

				// 폰트 스타일
				'font-style': 'normal',

				// 폰트 색상
				'font-color': '#000',

				// font edge color
				'font-edge-color': '#fff',

				// font edge width
				'font-edge-width': '1'

			},

			handler : {

				draggable : {

					// 면 색상
					'fill': '#0000ff',

					// 면 투명도
					'fill-opacity' : 0.2,

					// 선 색상
					'stroke': '#0000ff',

					// 선 두께
					'stroke-width': 1,

					// 선 투명도
					'stroke-opacity': 1,

					// 선 스타일 ['', '-', '.', '-.', '-..', '. ', '- ', '--', '- .', '--.', '--..']
					'stroke-dasharray': '- '
				},

				resizable : {

					// 면 색상
					'fill': '#d6f1f4',

					// 면 투명도
					'fill-opacity' : 1,

					// 선 색상
					'stroke': '#767676',

					// 선 두께
					'stroke-width': 1,

					// 선 투명도
					'stroke-opacity': 1,

					// 선 스타일 ['', '-', '.', '-.', '-..', '. ', '- ', '--', '- .', '--.', '--..']
					'stroke-dasharray': '',

					// 리사이저 사이즈
					'size': 5
				}
			}
		};

		return defaultStyles;
	};

	/**
	 * [그림판의 세팅 정보를 담고 있다]
	 * @return {[object]} [세팅 정보]
	 */
	function cloneSettingModel () {

		var settingModel = {

			/**
			 * [이미지 url]
			 * @type {[string]}
			 */
			url: null,

			/**
			 * [이미지 width]
			 * @type {[string]}
			 */
			width: null,

			/**
			 * [이미지 height]
			 * @type {[string]}
			 */
			height: null,

			/**
			 * [리사이즈가 가능한 아이템 리스트]
			 * @type {Array}
			 */
			resizable: ['line', 'rectangle', 'circle', 'text']
		};

		return settingModel;
	}

	/**
	 * [그림판을 구성하는 아이탬]
	 * @return {[object]} [아이템 정보]
	 */
	function cloneItemModel () {

		var itemModel = {

			/**
			 * [그려진 도형들의 정보를 저장하는 배열]
			 * @type {Array}
			 */
			renderedItem: [],

			/**
			 * [선택된 도형]
			 * @type {object}
			 */
			selectedItem: null
		};

		return itemModel;
	}

	/**
	 * [기본 스타일과 사용자가 설정한 스타일을 extend 해준다]
	 * @param  {[object]} settingOptions [사용자가 설정한 스타일]
	 * @return {[object]}                [extend 된 스타일]
	 */
	function extendStyles (settingStyles) {

		var defaultStyles = getDefaultStyles();

		var styles = $.extend(true, defaultStyles, settingStyles);

		return styles;
	}

	/**
	 * [Which HTML element is the target of the event]
	 */
	function mouseTarget(e) {

		var targ;

		if (!e) {

			var e = window.event;
		}

		if (e.target) {

			targ = e.target;

		} else if (e.srcElement) {

			targ = e.srcElement;
		}

		if (targ.nodeType == 3) {	// defeat Safari bug

			targ = targ.parentNode;
		}

		return targ;
	}

	/**
	 * [Mouse position relative to the document]
	 */
	function mousePositionDocument(e) {

		var posx = 0;
		var posy = 0;

		if (!e) {

			var e = window.event;
		}

		if (e.pageX || e.pageY) {

			posx = e.pageX;
			posy = e.pageY;

		} else if (e.clientX || e.clientY) {

			posx = e.clientX + document.body.scrollLeft + document.documentElement.scrollLeft;
			posy = e.clientY + document.body.scrollTop + document.documentElement.scrollTop;
		}

		return {
			x : posx,
			y : posy
		};
	}

	/**
	 * [Find out where an element is on the page]
	 */
	function findPos(obj) {

		var curleft = 0;
		var curtop = 0;

		if (obj.offsetParent) {

			do {

				curleft += obj.offsetLeft;
				curtop += obj.offsetTop;

			} while (obj = obj.offsetParent);
		}

		return {
			left : curleft,
			top : curtop
		};
	}

	 /**
	 * [Mouse position relative to the element]
	 * [not working on IE7 and below]
	 */
	function getMousePosition(e) {

		var mousePosDoc = mousePositionDocument(e);
		var target = mouseTarget(e);
		var targetPos = findPos(target);
		var posx = mousePosDoc.x - targetPos.left - 10;
		var posy = mousePosDoc.y - targetPos.top - 10;

		return {
			x : posx,
			y : posy
		};
	}

	/**
	 * [그림판 wrapper 에 svg element 를 추가한다]
	 * @param  {[object]} sketch [그림판 객체]
	 * @return {[raphael]}         [svg]
	 */
	function appendSvg (sketch) {

		var wrapper = sketch.wrapper;

		var width = sketch.settings.width;
		var height = sketch.settings.height;

		var svg = Raphael(wrapper[0], width, height);

		svg.canvas.setAttribute('xmlns:xlink', 'http://www.w3.org/1999/xlink');
		svg.canvas.setAttribute('preserveAspectRatio', 'none');

		return svg;
	}

	/**
	 * [그림판에 이미지 element 를 추가한다]
	 * @param  {[object]} sketch [그림판 객체]
	 * @return {[element]}         [image element]
	 */
	function appendImageElement (sketch) {

		var width = sketch.settings.width;
		var height = sketch.settings.height;

		var imageElement = sketch.paper.image(sketch.settings.url, 0, 0, width, height);

		return imageElement;
	}

	/**
	 * [연필로 그린다]
	 * @param  {[object]} sketch [그림판 객체]
	 * @return {[element]}        [rect element]
	 */
	function drawPencil (sketch) {

		var drawingCheck = false;
		var item = null;
		var path = null;

		sketch.wrapper.off('mousedown').on('mousedown', function (e) {

			drawingCheck = true;

			item = sketch.paper.path();

			var position = getMousePosition(e);
			var x = position.x;
			var y = position.y;

			path = 'M' + x + ',' + y + 'L' + (x - 1) + ',' + (y - 1);

			item.attr({
				'path' : path
			});

			setItemStrokeStyles(item, sketch.settings.styles.item);
		});

		sketch.wrapper.off('mousemove').on('mousemove', function (e) {

			if (drawingCheck) {

				var position = getMousePosition(e);
				var x = position.x;
				var y = position.y;

				path += 'L' + x + ',' + y;

				item.attr({
					'path' : path
				});
			}
		});

		sketch.wrapper.off('mouseup').on('mouseup', function (e) {

			drawingCheck = false;
			path = null;

			var itemObject = addHandler(sketch, item, 'pencil');

			sketch.event.trigger('drewItem', [itemObject]);
			sketch.event.trigger('selectedItem', [itemObject]);
		});
	}

	/**
	 * [라인을 그린다]
	 * @param  {[object]} sketch [그림판 객체]
	 * @return {[element]}        [rect element]
	 */
	function drawLine (sketch) {

		var drawingCheck = false;
		var item = null;
		var x = 0;
		var y = 0;

		sketch.wrapper.off('mousedown').on('mousedown', function (e) {

			drawingCheck = true;

			item = sketch.paper.path();

			var position = getMousePosition(e);
			x = position.x;
			y = position.y;

			var path = getItemPath('line', x, y, x, y);

			item.attr({
				'path' : path
			});

			setItemStrokeStyles(item, sketch.settings.styles.item);
		});

		sketch.wrapper.off('mousemove').on('mousemove', function (e) {

			if (drawingCheck) {

				var position = getMousePosition(e);
				var x2 = position.x;
				var y2 = position.y;
				var path = getItemPath('line', x, y, x2, y2);

				item.attr({
					'path' : path
				});
			}
		});

		sketch.wrapper.off('mouseup').on('mouseup', function (e) {

			drawingCheck = false;

			var itemObject = addHandler(sketch, item, 'line');

			sketch.event.trigger('drewItem', [itemObject]);
			sketch.event.trigger('selectedItem', [itemObject]);
		});
	}

	/**
	 * [사각형을 그린다]
	 * @param  {[object]} sketch [그림판 객체]
	 * @return {[element]}        [rect element]
	 */
	function drawRectangle (sketch) {

		var drawingCheck = false;
		var item = null;
		var x = 0;
		var y = 0;

		sketch.wrapper.off('mousedown').on('mousedown', function (e) {

			drawingCheck = true;

			item = sketch.paper.path();

			var position = getMousePosition(e);
			x = position.x;
			y = position.y;

			var path = getItemPath('rectangle', x, y, x, y);

			item.attr({
				'path' : path
			});

			setItemAreaStyles(item, sketch.settings.styles.item);
			setItemStrokeStyles(item, sketch.settings.styles.item);
		});

		sketch.wrapper.off('mousemove').on('mousemove', function (e) {

			if (drawingCheck) {

				var position = getMousePosition(e);
				var x2 = position.x;
				var y2 = position.y;
				var path = getItemPath('rectangle', x, y, x2, y2);

				item.attr({
					'path' : path
				});
			}
		});

		sketch.wrapper.off('mouseup').on('mouseup', function (e) {

			drawingCheck = false;

			var itemObject = addHandler(sketch, item, 'rectangle');

			sketch.event.trigger('drewItem', [itemObject]);
			sketch.event.trigger('selectedItem', [itemObject]);
		});
	}

	/**
	 * [원을 그린다]
	 * @param  {[object]} sketch [그림판 객체]
	 * @return {[element]}        [rect element]
	 */
	function drawCircle (sketch) {

		var drawingCheck = false;
		var item = null;
		var x = 0;
		var y = 0;

		sketch.wrapper.off('mousedown').on('mousedown', function (e) {

			drawingCheck = true;

			item = sketch.paper.path();

			var position = getMousePosition(e);
			x = position.x;
			y = position.y;

			var path = getItemPath('circle', x, y, x, y);

			item.attr({
				'path' : path
			});

			setItemAreaStyles(item, sketch.settings.styles.item);
			setItemStrokeStyles(item, sketch.settings.styles.item);
		});

		sketch.wrapper.off('mousemove').on('mousemove', function (e) {

			if (drawingCheck) {

				var position = getMousePosition(e);
				var x2 = position.x;
				var y2 = position.y;
				var path = getItemPath('circle', x, y, x2, y2);

				item.attr({
					'path' : path
				});
			}
		});

		sketch.wrapper.off('mouseup').on('mouseup', function (e) {

			drawingCheck = false;

			var itemObject = addHandler(sketch, item, 'circle');

			sketch.event.trigger('drewItem', [itemObject]);
			sketch.event.trigger('selectedItem', [itemObject]);
		});
	}

	/**
	 * [텍스트를 입력한다]
	 * @param  {[object]} sketch [그림판 객체]
	 * @return {[element]}        [rect element]
	 */
	function drawText (sketch) {

		var drawingCheck = false;
		var x = 0;
		var y = 0;
		var x2 = 0;
		var y2 = 0;

		var textArea = null;

		sketch.wrapper.off('mousedown').on('mousedown', function (e) {

			drawingCheck = true;

			var position = getMousePosition(e);

			x = position.x;
			y = position.y;
		});

		sketch.wrapper.off('mouseup').on('mouseup', function (e) {

			drawingCheck = false;

			sketch.wrapper.off('mousedown');
			sketch.wrapper.off('mousemove');
			sketch.wrapper.off('mouseup');

			var setting = {
				'value': '',
				'x': x,
				'y': y,
				'width': 150,
				'height': sketch.settings.styles.item['font-size'] + 6
			};

			textArea = appendTextArea(sketch, setting);

			textArea.focusout(function (e) {

				var _this = $(this);

				if (!_this.val()) {

					sketch.removeItem();

					_this.remove();

					$('.text-preview').remove();

					return;
				}

				var setting = {
					'value': _this.val(),
					'x': x,
					'y': y,
					'width': _this.prop('scrollWidth'),
					'height': _this.prop('scrollHeight')
				};

				_this.remove();

				$('.text-preview').remove();

				var item = appendTextElement(sketch, setting);
				var itemObject = addHandler(sketch, item, 'text');

				sketch.event.trigger('drewItem', [itemObject]);
				sketch.event.trigger('selectedItem', [itemObject]);
			});
		});
	}

	/**
	 * [textarea 태그 append]
	 * @param  {[object]} sketch 	[그림판 객체]
	 * @param  {[number]} x      	[x]
	 * @param  {[number]} y      	[y]
	 * @param  {[number]} width     [width]
	 * @param  {[number]} height    [height]
	 * @return {[element]}        	[textarea]
	 */
	function appendTextArea (sketch, setting) {

		var textArea = null;

		textArea = $('<textarea></textarea>');

		textArea.val(setting.value);

		sketch.wrapper.append(textArea);

		textArea.css({
			'position': 'absolute',
			'overflow': 'hidden',
			'top': setting.y,
			'left': setting.x,
			'width': setting.width,
			'height': setting.height,
			'opacity': '.50',
			'filter': 'progid:DXImageTransform.Microsoft.Alpha(opacity=50)',
			'color': sketch.settings.styles.item['font-color'],
			'font-family': sketch.settings.styles.item['font-family'],
			'font-size': sketch.settings.styles.item['font-size'],
			'font-style': sketch.settings.styles.item['font-style'],
			'font-weight': sketch.settings.styles.item['font-weight'],
			'line-height': 1.2
		});

		textArea.focus();

		var div = $('<div class="text-preview"></div>');

		div.css({
			'position': 'absolute',
			'overflow': 'hidden',
			'top': setting.y + 200,
			'left': setting.x,
			'width': 'auto',
			'min-width': setting.width - 60,
			'min-height': setting.height,
			'height': 'auto',
			'color': sketch.settings.styles.item['font-color'],
			'font-family': sketch.settings.styles.item['font-family'],
			'font-size': sketch.settings.styles.item['font-size'],
			'font-style': sketch.settings.styles.item['font-style'],
			'font-weight': sketch.settings.styles.item['font-weight'],
			'line-height': 1.2,
			'border': 'solid 1px red',
			'display': 'none'
		});

		sketch.wrapper.append(div);

		var start = sketch.settings.styles.item['font-size'];

		textArea.keyup(function (e) {

			var keyCode = e.which;
			var value = $(this).val().split('\n').join('<br />');

			div.html(value);

			var divWidth = div.width();
			var divHeight = div.height();

			$(this).width(divWidth + 60);

			$(this).height(divHeight);

			if (keyCode === 13) {

				$(this).height(divHeight + start + 6);
			}
		});

		return textArea;
	}

	/**
	 * [텍스트 element 를 추가한다]
	 * @param  {[object]} sketch [그림판 객체]
	 * @param  {[object]} setting  [setting]
	 * @return {[element]}        [text element]
	 */
	function appendTextElement (sketch, setting) {

		var item = sketch.paper.text();

		item.attr({
			'text': setting.value,
			'text-anchor': 'start',
			'x': setting.x,
			'y': setting.y
		});

		item.glow({
			width: 60,
			fill: 'red',
			offsetx: 1,
			offsety: 1,
			color: 'green'
		});

		var getBBox = item.getBBox();

		item.customAttributes = {
			'value': setting.value,
			'x': setting.x,
			'y': setting.y,
			'x2': setting.x + setting.width,
			'y2': setting.y + setting.height,
			'width': setting.width,
			'height': setting.height
		};

		setItemFontStyles(item, sketch.settings.styles.item);

		setTextElementTemp(sketch, item);

		return item;
	}

	/**
	 * [text element 의 속성을 재설정한다]
	 * @param  {[object]} sketch [그림판 객체]
	 * @param {[element]} item   [text]
	 */
	function setTextElementTemp (sketch, item) {

		var customAttributes = item.customAttributes;
		var value = customAttributes.value;

		item.attr({
			'x': customAttributes.x,
			'y': customAttributes.y
		});

		var newText = "";

		for (var i = 0; i < value.length; i++) {

			if (value[i] === '\n') {

				newText += '　' + '\n';

			} else {

				newText += value[i];
			}
		}

		var tempText = "";

		for (var i = 0; i < newText.length; i++) {

			item.attr({
				"text": tempText + newText[i],
				'text-anchor': 'start'
			});

			if (item.getBBox().width > customAttributes.width) {

				tempText += "\n" + newText[i];

			} else {

				tempText += newText[i];
			}
		}

		alignTop(sketch, item);
	}

	/**
	 * [text element 의 align 을 TOP 으로 설정한다]
	 * @param  {[element]} text [text element]
	 */
	function alignTop (sketch, text) {

		var selectedItem = sketch.items.selectedItem;
		var customAttributes = text.customAttributes;
		var getBBox = text.getBBox();
		var y = customAttributes.y;
		var height = getBBox.height;

		text.attr({
			'y': y + height / 2
		});
	}

	/**
	 * [그려진 아이템에 핸들러를 붙여준다]
	 * @param  {[object]} sketch [그림판 객체]
	 * @param {[object]} itemObject   [itemObject]
	 */
	function addHandler (sketch, item, shape) {

		var styles = sketch.settings.styles;
		var getBBox = item.getBBox();
		
		if (shape === 'text') {

			getBBox = item.customAttributes;
		}

		var draggable = sketch.paper.path();
		var path = getItemPath('rectangle', getBBox.x + lineError, getBBox.y + lineError, getBBox.x2 + lineError, getBBox.y2 + lineError);

		draggable.attr({
			'path': path
		});

		setItemAreaStyles(draggable, styles.handler.draggable);
		setItemStrokeStyles(draggable, styles.handler.draggable);

		var resizable = null;

		if (sketch.settings.resizable.indexOf(shape) > -1) {

			resizable = sketch.paper.set();

			var axis = [
				{'x': getBBox.x, 'y': getBBox.y, 'direction': 'nw'},
				{'x': getBBox.x2, 'y': getBBox.y, 'direction': 'ne'},
				{'x': getBBox.x, 'y': getBBox.y2, 'direction': 'sw'},
				{'x': getBBox.x2, 'y': getBBox.y2, 'direction': 'se'}
			];

			for (var i = 0; i < axis.length; i++) {

				var circle = sketch.paper.circle();

				circle.attr({
					'cx': axis[i].x,
					'cy': axis[i].y,
					'r': styles.handler.resizable['size']
				});

				circle.customAttributes = {};
				circle.customAttributes.direction = axis[i].direction;

				resizable.push(circle);
			}

			setItemAreaStyles(resizable, styles.handler.resizable);
			setItemStrokeStyles(resizable, styles.handler.resizable);
		}

		var handler = {};

		handler.draggable = draggable;
		handler.resizable = resizable;
		handler.item = item;
		handler.shape = shape;

		handler.draggable.click(function (e) {

			deselect(sketch);

			sketch.event.trigger('selectedItem', [handler]);
		});

		handler.draggable.dblclick(function (e) {

			var selectedItem = sketch.items.selectedItem;

			if (selectedItem.shape === 'text') {

				var getBBox = selectedItem.item.getBBox();
				var customAttributes = selectedItem.item.customAttributes;

				deselect(sketch);

				var setting = {
					'value': customAttributes.value,
					'x': customAttributes.x,
					'y': customAttributes.y,
					'width': customAttributes.width,
					'height': customAttributes.height - 4
				};

				var textArea = appendTextArea(sketch, setting);

				textArea.focusout(function (e) {

					var _this = $(this);
					var value = _this.val();

					var setting = {
						'value': value,
						'x': customAttributes.x,
						'y': customAttributes.y,
						'width': _this.prop('scrollWidth'),
						'height': _this.prop('scrollHeight')
					};

					_this.remove();

					$('.text-preview').remove();

					var item = appendTextElement(sketch, setting);
					var itemObject = addHandler(sketch, item, 'text');

					sketch.event.trigger('drewItem', [itemObject]);
					sketch.event.trigger('selectedItem', [itemObject]);
				});

				selectedItem.draggable.remove();
				selectedItem.item.remove();
			}
		});

		return handler;
	}

	/**
	 * [아이템을 그려준다]
	 * @param  {[object]} sketch [그림판 객체]
	 * @param  {[string]} shape  [shape]
	 */
	function drawItem (sketch, shape) {

		if (shape === 'line') {

			drawLine(sketch);

		} else if (shape === 'pencil') {

			drawPencil(sketch);

		} else if (shape === 'rectangle') {

			drawRectangle(sketch);

		} else if (shape === 'circle') {

			drawCircle(sketch);

		} else if (shape === 'text') {

			drawText(sketch);
		}
	}

	/**
	 * [아이템에 drag 이벤트를 부여한다]
	 * @param  {[object]} sketch [그림판 객체]
	 */
	function addDraggableEvent (sketch) {

		var selectedItem = sketch.items.selectedItem;

		if (!selectedItem) {

			return;
		}

		selectedItem.draggable.mousemove(function (e) {

			sketch.wrapper.css('cursor', 'all-scroll');
		});

		selectedItem.draggable.mouseout(function (e) {

			sketch.wrapper.css('cursor', 'default');
		});

		selectedItem.draggable.mousedown(function (e) {

			var position = getMousePosition(e);
			var startX = position.x;
			var startY = position.y;

			sketch.wrapper.on('mousemove', function (e) {

				var position = getMousePosition(e);

				var moveX = position.x - startX;
				var moveY = position.y - startY;

				startX = position.x;
				startY = position.y;

				moveItem(sketch, moveX, moveY);
			});

			selectedItem.draggable.mouseup(function (e) {

				if (selectedItem.shape === 'text') {

					var customAttributes = selectedItem.item.customAttributes;
					var getBBox = this.getBBox();

					selectedItem.item.customAttributes = {
						'value': customAttributes.value,
						'x': getBBox.x,
						'y': getBBox.y,
						'x2': getBBox.x2,
						'y2': getBBox.y2,
						'width': getBBox.width,
						'height': getBBox.height
					};
				}

				sketch.wrapper.off('mousemove');
				selectedItem.draggable.unmouseup();
			});
		});
	}

	/**
	 * [아이템을 x, y 만큼 이동시킨다]
	 * @param  {[object]} sketch [그림판 객체]
	 * @param  {[number]} x      [x]
	 * @param  {[number]} y      [y]
	 */
	function moveItem (sketch, x, y) {

		var selectedItem = sketch.items.selectedItem;

		if (selectedItem) {

			var transform = selectedItem.draggable.attr().transform[0];
			var getBBox = selectedItem.draggable.getBBox();

			var transX = 0;
			var transY = 0;

			if (transform) {

				transX = transform[1];
				transY = transform[2];
			}

			var moveX = transX + (x);
			var moveY = transY + (y);

			selectedItem.draggable.attr({
				'transform': 't' + moveX + ',' + moveY
			});

			selectedItem.item.attr({
				'transform': 't' + moveX + ',' + moveY
			});

			if (selectedItem.resizable) {

				selectedItem.resizable.attr({
					'transform': 't' + moveX + ',' + moveY
				});
			}
		}
	}

	/**
	 * [아이템에 resize 이벤트를 부여한다]
	 * @param  {[object]} sketch [그림판 객체]
	 */
	function addResizableEvent (sketch) {

		var selectedItem = sketch.items.selectedItem;
		var resizable = selectedItem.resizable;
		var draggable = selectedItem.draggable;
		var item = selectedItem.item;
		var shape = selectedItem.shape;

		if (!selectedItem) {

			return;
		}

		if (!resizable) {

			return;
		}

		resizable.mousemove(function (e) {

			var direction = this.customAttributes.direction;

			if (direction === 'nw' || direction === 'se') {

				sketch.wrapper.css('cursor', 'nwse-resize');

			} else {

				sketch.wrapper.css('cursor', 'nesw-resize');
			}
		});

		resizable.mouseout(function (e) {

			sketch.wrapper.css('cursor', 'default')
		});

		resizable.unmousedown().mousedown(function (e) {

			var resizeHandler = this;
			var transform = draggable.attr().transform[0];
			var transX = 0;
			var transY = 0;

			if (transform) {

				transX = transform[1];
				transY = transform[2];
			}

			var x = resizable[0].attr('cx');
			var y = resizable[0].attr('cy');
			var x2 = resizable[3].attr('cx');
			var y2 = resizable[3].attr('cy');

			sketch.wrapper.on('mousemove', function (e) {

				var position = getMousePosition(e);
				var direction = resizeHandler.customAttributes.direction;

				if (direction === 'nw') {

					x = position.x - transX;
					y = position.y - transY;

				} else if (direction === 'ne') {

					x2 = position.x - transX;
					y = position.y - transY;

				} else if (direction === 'se') {

					x2 = position.x - transX;
					y2 = position.y - transY;

				} else if (direction === 'sw') {

					x = position.x - transX;
					y2 = position.y - transY;
				}

				var axis = {
					'nw': [x, y],
					'ne': [x2, y],
					'se': [x2, y2],
					'sw': [x, y2]
				};

				for (var i = 0; i < resizable.items.length; i++) {

					var direction = resizable.items[i].customAttributes.direction;

					resizable.items[i].attr({
						'cx': axis[direction][0],
						'cy': axis[direction][1]
					});
				}

				var dragablePath = getItemPath('rectangle', x, y, x2, y2);

				draggable.attr({
					'path': dragablePath
				});

				if (selectedItem.shape === 'text') {

					var customAttributes = selectedItem.item.customAttributes;

					selectedItem.item.customAttributes = {
						'value': customAttributes.value,
						'x': x,
						'y': y,
						'x2': x2,
						'y2': y2 ,
						'width': x2 - x,
						'height': y2 - y
					};

					setTextElementTemp(sketch, selectedItem.item);

				} else {

					var itemPath = getItemPath(shape, x, y, x2, y2);

					item.attr({
						path: itemPath
					});
				}
			});

			sketch.wrapper.on('mouseup', function (e) {

				sketch.wrapper.off('mousemove');
				resizable.unmouseup();
			});
		});
	}

	/**
	 * [아이템 모양 별로 path 를 구한다]
	 * @param  {[string]} shape [모양]
	 * @param  {[number]} x     [x]
	 * @param  {[number]} y     [y]
	 * @param  {[number]} x2    [x2]
	 * @param  {[number]} y2    [y2]
	 * @return {[string]}       [path]
	 */
	function getItemPath (shape, x, y, x2, y2) {

		var path = null;

		x = Math.floor(x) - lineError;
		y = Math.floor(y) - lineError;
		x2 = Math.floor(x2) - lineError;
		y2 = Math.floor(y2) - lineError;

		if (shape === 'rectangle') {

			path = 'M' + x + ',' + y + 'L' + x2 + ',' + y + 'L' + x2 + ',' + y2 + 'L' + x + ',' + y2 + ',' + 'z';

		} else if (shape === 'line') {

			path = 'M' + x + ',' + y + ',' + x2 + ',' + y2 + 'z';

		} else if (shape === 'circle') {

			var width = (x2 - x) / 2;
			var height = (y2 - y) / 2;

			var path =	'M' + x + ',' + (y + height) + 
						'a' + width + ',' + height + ',' + 0 + ',' + 1 + ',' + 0 + ',' + (width * 2) + ',' + 0 +
						'a' + width + ',' + height + ',' + 0 + ',' + 1 + ',' + 0 + ',' + (-width * 2) + ',' + 0 +
						'z';
		}

		return path;
	}

	/**
	 * [item 의 면 스타일을 변경한다]
	 * @param {[element]} item   [item]
	 * @param {[object]} styles [스타일]
	 */
	function setItemAreaStyles (item, styles) {

		item.attr({
			'fill': styles['fill'],
			'fill-opacity' : styles['fill-opacity']
		});
	}

	/**
	 * [item 의 선 스타일을 변경한다]
	 * @param {[element]} item   [item]
	 * @param {[object]} styles [스타일]
	 */
	function setItemStrokeStyles (item, styles) {

		item.attr({
			'stroke': styles['stroke'],
			'stroke-width': styles['stroke-width'],
			'stroke-opacity': styles['stroke-opacity'],
			'stroke-dasharray': styles['stroke-dasharray']
		});
	}

	/**
	 * [item 의 폰트를 변경한다]
	 * @param {[element]} item   [item]
	 * @param {[object]} styles [스타일]
	 */
	function setItemFontStyles (item, styles) {

		item.attr({
			'font-size': styles['font-size'],
			'font-weight': styles['font-weight'],
			'font-family': styles['font-family'],
			'font-style': styles['font-style'],
			'fill': styles['font-color'],
			'stroke': styles['font-edge-color'],
			'stroke-width': styles['font-edge-width']
		});
	}

	/**
	 * [deselect]
	 * @param  {[object]} sketch [그림판 객체]
	 */
	function deselect (sketch) {

		var selectedItem = sketch.items.selectedItem;

		if (!selectedItem) {

			return;
		}

		sketch.wrapper.off('mousedown');
		sketch.wrapper.off('mousemove');
		sketch.wrapper.off('mouseup');

		selectedItem.draggable.unmousedown();
		selectedItem.draggable.unmousemove();
		selectedItem.draggable.unmouseup();

		if (selectedItem.resizable) {

			selectedItem.resizable.unmousedown();
			selectedItem.resizable.unmousemove();
			selectedItem.resizable.unmouseup();	
		}

		selectedItem.draggable.attr({
			'fill-opacity': 0,
			'stroke-opacity': 0,
		});

		if (selectedItem.resizable) {

			selectedItem.resizable.attr({
				'fill-opacity': 0,
				'stroke-opacity': 0,
			});
		}

		sketch.items.selectedItem = null;
	}

	/**
	 * [이미지를 로드한다]
	 * @param  {[object]} sketch [그림판 객체]
	 * @return {[string]}        [이미지 url]
	 */
	function loadImage (sketch, url) {

		var img = new Image();

		img.src = url;

		img.onload = function () {

			sketch.settings.url = this.src;
			sketch.settings.width = this.width;
			sketch.settings.height = this.height;

			sketch.event.trigger('loadedImage');
		}
	}

	/**
	 * [그림판에 이벤트를 붙여준다]
	 * @param  {[object]} sketch [그림판 객체]
	 */
	function bindEvents (sketch) {

		/**
		 * [이미지 로드가 완료되었을때 발생하는 이벤트]
		 */
		sketch.event.on('loadedImage', function (e) {

		});

		/**
		 * [아이템이 선택되었을때 발생하는 이벤트]
		 * @param  {[type]} itemObject  [아이템 정보]
		 */
		sketch.event.on('selectedItem', function (e, itemObject) {

			deselect(sketch);

			sketch.items.selectedItem = itemObject;

			sketch.items.selectedItem.draggable.attr({
				'fill-opacity': sketch.settings.styles.handler.draggable['fill-opacity'],
				'stroke-opacity': sketch.settings.styles.handler.draggable['stroke-opacity'],
			});

			if (sketch.items.selectedItem.resizable) {

				sketch.items.selectedItem.resizable.attr({
					'fill-opacity': sketch.settings.styles.handler.resizable['fill-opacity'],
					'stroke-opacity': sketch.settings.styles.handler.resizable['stroke-opacity'],
				});
			}

			addDraggableEvent(sketch);
			addResizableEvent(sketch);
		});

		/**
		 * [아이템 그리기가 완료되었을때 발생하는 이벤트]
		 * @param  {[type]} itemObject  [아이템 정보]
		 */
		sketch.event.on('drewItem', function (e, itemObject) {

			sketch.items.renderedItem.push(itemObject);

			sketch.removeItemEvent();
		});
	}

	/**
	 * [키보드 이벤트를 붙여준다]
	 * @param  {[object]} sketch [그림판 객체]
	 */
	function bindKeyEvent (sketch) {

		$(window).keydown(function (e) {

			var keyCode = e.which;

			/**
			 * [delete] - 삭제
			 */
			if (keyCode === 46) {

				sketch.removeItem();
			}

			/**
			 * [esc] - 선택 취소
			 */
			if (keyCode === 27) {

				sketch.deselect();

				var textarea = sketch.wrapper.find('textarea');

				if (textarea[0]) {

					textarea.focusout();
				}
			}

			/**
			 * [left] - 좌로 이동 (10px)
			 * [ctrl + left] - 좌로 이동 (1px)
			 */
			if (keyCode === 37) {

				if (e.ctrlKey) {

					moveItem(sketch, -1, 0);

				} else {

					moveItem(sketch, -10, 0);
				}
			}

			/**
			 * [up] - 위로 이동 (10px)
			 * [ctrl + up] - 위로 이동 (1px)
			 */
			if (keyCode === 38) {

				if (e.ctrlKey) {

					moveItem(sketch, 0, -1);

				} else {

					moveItem(sketch, 0, -10);
				}
			}

			/**
			 * [right] - 우로 이동 (10px)
			 * [ctrl + right] - 우로 이동 (1px)
			 */
			if (keyCode === 39) {

				if (e.ctrlKey) {

					moveItem(sketch, 1, 0);

				} else {

					moveItem(sketch, 10, 0);
				}
			}

			/**
			 * [down] -	아래로 이동 (10px)
			 * [ctrl + down] - 아래로 이동 (1px)
			 */
			if (keyCode === 40) {

				if (e.ctrlKey) {

					moveItem(sketch, 0, 1);

				} else {

					moveItem(sketch, 0, 10);
				}
			}
		});
	}

	/**
	 * [그림판에 API 를 붙여준다]
	 * @param  {[object]} sketch [그림판 객체]
	 */
	function addApis (sketch) {

		/**
		 * [그림판 내부 이벤트 (sketch.event) 를 연결한다]
		 * @param  {[string]}   eventName [이벤트 명]
		 * @param  {Function} callback  [콜백]
		 */
		sketch.on = function (eventName, callback) {

			sketch.event.on(eventName, callback);
		};

		/**
		 * [아이템을 그린다]
		 * @type {[string]} 아이템 모양
		 */
		sketch.drawItem = function (shape) {

			deselect(sketch);

			sketch.removeItemEvent();

			drawItem(sketch, shape);
		};

		/**
		 * [아이템을 제거한다]
		 */
		sketch.removeItem = function () {

			if (!sketch.items.selectedItem) {

				return;
			}

			sketch.items.selectedItem.item.remove();
			sketch.items.selectedItem.draggable.remove();

			if (sketch.items.selectedItem.resizable) {

				sketch.items.selectedItem.resizable.remove();
			}

			sketch.items.selectedItem = null;
		};

		/**
		 * [deselect]
		 */
		sketch.deselect = function () {

			deselect(sketch);
		}

		/**
		 * [스타일을 초기화한다]
		 * @type {[object]} 트리맵 스타일
		 */
		sketch.setStyles = function (styles) {

			sketch.settings.styles = $.extend(true, sketch.settings.styles, styles);
		};

		/**
		 * [선택된 아이템의 스타일을 변경한다]
		 * @param {[object]} styles [스타일]
		 */
		sketch.setItemStyle = function (styles) {

			if (!sketch.items.selectedItem) {

				return;
			}

			sketch.items.selectedItem.item.attr(styles);
		}

		/**
		 * [아이템의 mousedown 이벤트를 제거한다]
		 */
		sketch.removeItemEvent = function () {

			sketch.wrapper.off('mousedown');
			sketch.wrapper.off('mousemove');
			sketch.wrapper.off('mouseup');
		};
	}

	/**
	 * [그림판을 렌더링 하기 위한 전반적인 부분을 세팅한다]
	 * @param  {[object]} sketch [그림판 객체]
	 * @param  {[element]} wrapper [wrapper]
	 * @param  {[string]} url [이미지 url]
	 */
	function setup (sketch, wrapper, url) {

		sketch.wrapper = wrapper;

		sketch.wrapper.css({
			'position' : "relative"
		});

		sketch.wrapper.on('dragstart', function (e) {

			e.preventDefault();
		});

		sketch.wrapper.on('selectstart', function (e) {

			e.preventDefault();
		});

		sketch.settings = cloneSettingModel();

		sketch.settings.styles = extendStyles();

		sketch.items = cloneItemModel();

		loadImage(sketch, url);

		/**
		 * [이미지 로드가 완료되었을때 발생하는 이벤트]
		 */
		sketch.event.on('loadedImage', function (e) {

			sketch.items.svg = appendSvg(sketch);

			sketch.paper = sketch.items.svg;

			sketch.items.image = appendImageElement(sketch);
		});

		addApis(sketch);
	}

	/**
	 * [그림판을 초기화한다]
	 * @param  {[element]} wrapper [wrapper]
	 * @param  {[string]} url     [이미지 URL]
	 * @return {[object]}         [sketch 객체]
	 */
	self.init = function (wrapper, url) {

		var sketch = {};

		sketch.event = $({});

		bindEvents(sketch);

		setup(sketch, wrapper, url);

		bindKeyEvent(sketch);

		return sketch;
	};

	/**
	 * [플러그인 추가]
	 * @param {[object]}         [sketch 객체]
	 */
	self.plugin = function (sketch) {

		var plugin = {};

		return plugin;
	};

	if (!window.yisub) {

		window.yisub = {};
	}

	if (!window.yisub.sketch) {

		window.yisub.sketch = self;
	}
})();