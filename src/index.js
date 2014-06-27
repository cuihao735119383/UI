/**
 * @author bh-lay
 * 
 * @github https://github.com/bh-lay/UI
 * @modified require('Date')
 * 
 **/

(function(global,doc,UI_factory,utils_factory){
	
	//初始化工具类
	var utils = utils_factory();
	
	//初始化UI模块
	var UI = UI_factory(global,doc,utils);
	
	//提供window.UI的接口
	global.UI = global.UI || UI;
	global.UI._utils = utils;
	
	//提供CommonJS规范的接口
	global.define && define(function(){
		return UI;
	});
})(window,document,function(window,document,utils){
	/**
	 * base template
	 */
	var allCnt_tpl = require('template/base.html');
	var dragMask_tpl = require('template/dragMask.html');
	var pop_tpl = require('template/pop.html');
	var miniChat_tpl = require('template/miniChat.html');
	var confirm_tpl = require('template/confirm.html');
	var ask_tpl = require('template/ask.html');
	var confirmBar_tpl = require('template/confirmBar.html');
	var plane_tpl = require('template/plane.html');
	var prompt_tpl = require('template/prompt.html');
	var cover_tpl = require('template/cover.html');
	var select_tpl = require('template/select.html');
	
	var popCSS = require('style.css','UI');
	
	var isIE67 = false;
	if(navigator.appName == "Microsoft Internet Explorer"){
		var version = navigator.appVersion.split(";")[1].replace(/[ ]/g,"");
		if(version == "MSIE6.0" || version == "MSIE7.0"){
			isIE67 = true; 
		}
	}
	
	/**
	 * 定义私有变量
	 * 
	 **/ 
	var private_allCnt = utils.createDom(allCnt_tpl)[0],
		private_maskDom = utils.findByClassName(private_allCnt,'UI_mask')[0],
		private_mainDom = utils.findByClassName(private_allCnt,'UI_main_cnt')[0],
		private_fixedScreenTopDom = utils.findByClassName(private_allCnt,'UI_fixedScreenTop_cnt')[0],
		private_fixedScreenBottomDom = utils.findByClassName(private_allCnt,'UI_fixedScreenBottom_cnt')[0],
		private_cssDom = utils.createDom('<style type="text/css" data-module="UI_plug" ></style>')[0],
		private_window = window,
		private_winW,
		private_winH,
		private_doc = document,
		private_docH,
		private_scrollTop,
		private_isSupportTouch = "ontouchend" in document ? true : false,
		private_maskCount = 0;

	var private_CONFIG = {
		'gap' : {
			'top' : 0,
			'left' : 0,
			'bottom' : 0,
			'right' : 0
		},
		'zIndex' : 499
	};
	
	
	
	function refreshSize(){
		//重新计算窗口尺寸
		private_winW = document.body.scrollWidth;
		private_scrollTop = document.body.scrollTop;
		private_winH = window.innerHeight;
		private_docH = document.body.scrollHeight;
		
		//向css环境写入动态css
		private_cssDom.innerHTML = [
			'.UI_cover{height:' + private_winH + 'px;}',
			'.UI_ask{top:' + (private_winH/2) + 'px;}',
			'.UI_mask{height:' + private_winH + 'px;}'
		].join('');
	}
	
	function build_UI_DOM(){
		document.head.appendChild(utils.createDom(popCSS)[0]);
		document.head.appendChild(private_cssDom);
		document.body.appendChild(private_allCnt);
		//释放掉无用的内存
		popCSS = null;
		allCnt = null;
		
		//更新窗口尺寸
		refreshSize();
		setTimeout(refreshSize,500);
		var rebuild_fn = null;
		/**
		 *	fix Prompt Mask position & size 
		 */ 
		if(isIE67){
			utils.css(private_fixedScreenTopDom,{'top' : private_scrollTop});
			utils.css(private_fixedScreenBottomDom,{'top' : private_scrollTop + private_winH});
			
			rebuild_fn = function(){
				refreshSize();
				utils.css(private_fixedScreenTopDom,{'top' : private_scrollTop});
				utils.css(private_fixedScreenBottomDom,{'top' : private_scrollTop + private_winH});
				utils.css(private_maskDom,{'top' : private_scrollTop});
			};
		}else{
			utils.css(private_fixedScreenTopDom,{
				'position' : 'fixed',
				'top' : 0
			});
			utils.css(private_fixedScreenBottomDom,{
				'position' : 'fixed',
				'bottom' : 0
			});
			rebuild_fn = refreshSize;
		}
		//监听浏览器缩放、滚屏事件
		utils.bind(private_window,'resize',rebuild_fn);
		utils.bind(private_window,'scroll',rebuild_fn);
	}
	
	utils.ready(function(){
		build_UI_DOM();
	});
	
	
	
	//通用拖动方法
	function drag(handle_dom,dom,param){
		var param = param || {};
		var moving = param['move'] || null;
		var start = param['start'] || null;
		var end = param['end'] || null;
		var dragMask = utils.createDom(dragMask_tpl)[0];

		var dx, dy,l_start,t_start,w_start,h_start;
		utils.bind(handle_dom,'mousedown',function(e){
			if(e.button == 0){
				down(e);
			}
		});
		function down(e){
			//更新窗口尺寸
			refreshSize();
//			e.preventDefault();
//			e.stopPropagation();
			dx = e.pageX;
			dy = e.pageY;
			l_start = parseInt(utils.getStyle(dom,'left'));
			t_start = parseInt(utils.getStyle(dom,'top'));
			w_start = parseInt(utils.outerWidth(dom));
			h_start = parseInt(utils.outerHeight(dom));
			
			utils.bind(document,'mousemove',move);
			utils.bind(document,'mouseup',up);
			
			utils.css(dragMask,{
				'width' : private_winW,
				'height' : private_winH,
				'cursor' : utils.getStyle(handle_dom,'cursor')
			});
			private_fixedScreenTopDom.appendChild(dragMask);
			start&&start();
		}
		function move(e){
			e.preventDefault();
			e.stopPropagation();
		//	window.getSelection?window.getSelection().removeAllRanges():document.selection.empty();
			moving&&moving(e.pageX-dx,e.pageY-dy,l_start,t_start,w_start,h_start);
		}
		function up(e) {
			dragMask.remove();
			utils.unbind(document,'mousemove',move);
			utils.unbind(document,'mouseup',up);
			end&&end();
		}
	}
	//通用限制位置区域的方法
	function fix_position(top,left,width,height){
		var gap = private_CONFIG.gap;
		if(top<private_scrollTop + gap.top){
			//Beyond the screen(top)
			top = private_scrollTop  + gap.top;
		}else if(top + height - private_scrollTop > private_winH - gap.bottom) {
			//Beyond the screen(bottom)
			if(height > private_winH - gap.top - gap.bottom){
				//Is higher than the screen
				top = private_scrollTop + gap.top;
			}else{
				//Is shorter than the screen
				top = private_scrollTop + private_winH - height - gap.bottom;
			}
		}
		if(left < gap.left){
			left =  gap.left;
		}else if(left + width > private_winW - gap.right){
			left = private_winW - width - gap.right;
		}
		return {
			'top' : top,
			'left' : left
		}
	}
	//计算自适应页面位置的方法
	function adaption(width,height){
		var top = (private_winH - height)/2 + private_scrollTop;
		var left = (private_winW - width)/2;
		var newPosition = fix_position(top,left,width,height);

		var gap = private_CONFIG.gap;
		var clientTop = (private_winH - height)/2;
		if(clientTop<gap.top){
			clientTop = gap.top;
		}
		return {
			'top' : newPosition.top,
			'left' : newPosition.left,
			'clientTop' : clientTop,
			'clientLeft' : newPosition.left
		}
	}
	
	//增加确认方法
	function add_confirm(dom,param,close){
		var callback = null;
		var cancel = null;
		var btns = ['\u786E\u8BA4','\u53D6\u6D88'];
		if(typeof(param) == "function"){
			callback = param;
		}else if(typeof(param) == "object"){
			if(param['btns']){
				btns[0] = param['btns'][0];
				btns[1] = param['btns'][1];
			}
			if(typeof(param['callback']) == "function"){
				callback = param['callback'];
			}
			if(typeof(param['cancel']) == "function"){
				cancel = param['cancel'];
			}
		}
		var this_html = confirmBar_tpl.replace(/{(\w+)}/g,function(){
			var key = arguments[1];
			if(key == 'confirm'){
				return btns[0]
			}else if(key == 'cancel'){
				return btns[1]
			}
		});
		dom.appendChild(utils.createDom(this_html)[0]);
		
		//点击确认按钮
		var ok_dom = utils.findByClassName(dom,'UI_pop_confirm_ok')[0];
		utils.bind(ok_dom,'click',function(){
			if(callback){
				//根据执行结果判断是否要关闭弹框
				var result = callback();
				if(result != false){
					close();
				}
			}else{
				close();
			}
		});
		//点击取消按钮
		var cancel_dom = utils.findByClassName(dom,'UI_pop_confirm_cancel')[0];
		utils.bind(cancel_dom,'click',function(){
			if(cancel){
				//根据执行结果判断是否要关闭弹框
				var result = cancel();
				if(result != false){
					close();
				}
			}else{
				close();
			}
		});
	}
	
	/**
	 * 显示蒙层 
	 */
	function showMask(){
		private_maskCount++
		if(private_maskCount==1){
			utils.fadeIn(private_maskDom,100);
		}
	}
	/**
	 * 可定制关闭方法
	 *  
	 */
	function CLOSEMETHOD(effect_define,time_define){
		var default_effect = effect_define || null;
		var default_time = time_define;
		
		return function(effect,time){
			effect = effect || default_effect;
			time = parseInt(time || default_time) || 80;
			
			//处理关闭回调、蒙层
			this.closeFn && this.closeFn();
			if(this._mask){
				private_maskCount--
				if(private_maskCount==0){
					utils.fadeOut(private_maskDom,80);
				}
			}
			
			var DOM = this.dom;
			if(!effect){
				DOM.remove();
			}else{
				if(effect == 'fade'){
					utils.fadeOut(DOM,time,function(){
						DOM.remove();
					});
				}else if(effect == 'slide'){
					utils.slideUp(DOM,time,function(){
						DOM.remove();
					});
				}else if(effect == 'zoomOut'){
					var width = parseInt(utils.getStyle(DOM,'width'));
					var height = parseInt(utils.getStyle(DOM,'height'));
					var marginLeft = parseInt(utils.getStyle(DOM,'marginLeft'));
					var marginTop = parseInt(utils.getStyle(DOM,'marginTop'));
					utils.animation(DOM,{
						'width' : width/2,
						'height' : height/2,
						'overflow' : 'hidden',
						'marginLeft' : (marginLeft + width/4),
						'marginTop' : (marginTop + height/4),
						'opacity' : 0
					},time,function(){
						DOM.remove();
					});
				}
			}
		}
	}
	
	/**
	 * 弹框
	 * pop 
	 */
	function POP(param){
		var param = param || {};
		var this_pop = this;
		
		this.dom = utils.createDom(pop_tpl)[0];
		this.cntDom = utils.findByClassName(this.dom,'UI_pop_cnt')[0];
		this.closeFn = param['closeFn'] || null;
		this._mask = param['mask'] || false;

		var this_html = param['html'] || '';
		var this_width = param['width'] || Math.min(600,private_winW-20);
		var this_height = param['height'] ? parseInt(param['height']) : null;

		//预定高度时
		if(this_height){
			utils.css(this.cntDom,{
				'height' : this_height - 41
			});
		}

		//当有确认参数时
		if(param['confirm']){
			add_confirm(this.dom,param['confirm'],function(){
				this_pop.close();
			});
		}
		//处理title参数
		var caption_dom = utils.findByClassName(this.dom,'UI_pop_cpt')[0];
		if(!param['title']){
			caption_dom.remove();
		}else{
			var title = param['title'] || '\u8BF7\u8F93\u5165\u6807\u9898';
			
			caption_dom.innerHTML = title;
			//can drag is pop
			UI.drag(caption_dom,this.dom,{
				'move' : function(dx,dy,l_start,t_start,w_start,h_start){
					var top = dy + t_start;
					var left = dx + l_start;
					var newSize = fix_position(top,left,w_start,h_start);
					utils.css(this_pop.dom,{
						'left' : newSize.left,
						'top' : newSize.top
					});
				}
			});
		}


		//insert html
		this.cntDom.innerHTML = this_html;
		private_mainDom.appendChild(this.dom);
		
		//fix position get size
		var fixSize = adaption(this_width,(this_height?this_height:utils.outerHeight(this.dom)));
		var top = (param['top'] == +param['top']) ? param['top'] : fixSize.top;
		var left = (param['left'] == +param['left']) ? param['left'] : fixSize.left;
		
		// create pop
		utils.css(this.dom,{
			'width' : this_width,
			'left' : left,
			'top' : top - 100,
			'opacity' : 0
		});
		utils.animation(this.dom,{
			'top' : top,
			'opacity' : 1
		},100,'Sine.easeOut');
		
		var close_dom = utils.findByClassName(this.dom,'UI_pop_close')[0];
		utils.bind(close_dom,'click',function(){
			this_pop.close();
		})
		
		if(this._mask){
			showMask();
		}
		
	}
	//使用close方法
	POP.prototype['close'] = CLOSEMETHOD('zoomOut',150);
	POP.prototype['adapt'] = function(){
		var width = utils.outerWidth(this.dom);
		var height = utils.outerHeight(this.dom);
		
		var fixSize = adaption(width,height);
		utils.animation(this.dom,{
			'top' : fixSize.top,
			'left' : fixSize.left
		}, 100);
	};

	/**
	 * CONFIRM 
	 */
	function CONFIRM(param){
		var param = param || {};
		var this_pop = this;

		var this_text = param['text'] || '\u8BF7\u8F93\u5165\u786E\u8BA4\u4FE1\u606F！';
		var callback = param['callback'] || null;
		var this_html = confirm_tpl.replace(/{text}/,this_text);
		this._mask = true;
		this.dom = utils.createDom(this_html)[0];
		this.closeFn = param['closeFn'] || null;
		
		//显示蒙层
		showMask();
		add_confirm(this.dom,param,function(){
			this_pop.close();
		});
		var newPosition = adaption(300,160);
		// create pop
		utils.css(this.dom,{
			'width' : 300,
			'left' : newPosition.clientLeft,
			'top' : newPosition.clientTop - 100
		});
		utils.animation(this.dom,{
			'opacity' : 1,
			'top' : newPosition.clientTop
		},100,'Back.easeOut');
		private_fixedScreenTopDom.appendChild(this.dom);

	}
	CONFIRM.prototype['close'] = CLOSEMETHOD('fade');


	/**
	 * ASK 
	 */
	function ASK(text,callback){
		var this_pop = this;

		var this_text = text || '\u8BF7\u8F93\u5165\u786E\u8BA4\u4FE1\u606F！';
		var this_html = ask_tpl.replace(/{text}/,this_text);

		this.dom = utils.createDom(this_html)[0];
		this.inputDom = utils.findByClassName(this_pop.dom,'UI_ask_key')[0];
		this.closeFn =  null;
		this.callback = callback || null;

		var this_html = confirmBar_tpl.replace(/{(\w+)}/g,function(a,key){
			if(key == 'confirm'){
				return '确定';
			}else if(key == 'cancel'){
				return '取消';
			}
		});
		this.dom.appendChild(utils.createDom(this_html)[0]);
		
		//确定
		var ok_dom = utils.findByClassName(this.dom,'UI_pop_confirm_ok')[0];
		utils.bind(ok_dom,'click',function(){
			var value = this_pop.inputDom.value;
			if(this_pop.callback){
				//根据执行结果判断是否要关闭弹框
				var result = this_pop.callback(value);
				if(result != false){
					this_pop.close();
				}
			}else{
				this_pop.close();
			}
		});
		
		//取消
		var cancel_dom = utils.findByClassName(this.dom,'UI_pop_confirm_cancel')[0];
		utils.bind(cancel_dom,'click',function(){
			this_pop.close();
		});

		var newPosition = adaption(300,160);
		// create pop
		utils.css(this.dom,{
			'width' : 300,
			'opacity' : 0,
			'left' : newPosition.clientLeft,
			'marginTop' : -200
		});
		utils.animation(this.dom,{
			'opacity' : 1,
			'marginTop' : -100
		},100,'Back.easeOut');

		private_fixedScreenTopDom.appendChild(this.dom);
	}
	ASK.prototype['close'] = CLOSEMETHOD('fade');
	ASK.prototype['setValue'] = function(text){
		var text = text ? text.toString() : '';
		this.inputDom.value = text;
	};


	/**
	 * prompt
	 * 
	 **/
	function prompt(txt,time){
		var this_prompt = this;
		var txt = txt || '\u8BF7\u8F93\u5165\u5185\u5BB9';
		this.dom = utils.createDom(prompt_tpl)[0];

		this.tips(txt,time);
		
		var newPosition = adaption(260,100);
		// create pop
		
		utils.css(this.dom,{
			'top' : 0,
			'opacity' : 0
		});
		utils.animation(this.dom,{
			'top' : newPosition.clientTop,
			'opacity' : 1
		},140,'Back.easeOut');
		//console.log(private_winH,12);
		private_fixedScreenTopDom.appendChild(this.dom);
	}
	prompt.prototype['close'] = CLOSEMETHOD('zoomOut',150);
	prompt.prototype['tips'] = function(txt,time){
		var this_prompt = this;
		if(txt){
			utils.findByClassName(this.dom,'UI_cnt')[0].innerHTML = txt;
		}
		if(time == 0){
			return
		}
		setTimeout(function(){
			this_prompt.close(time);
		},(time || 1500));
	};

	/**
	 *	PLANE 
	 */
	//the active plane
	private_activePlane = null;
	/**
	 * 简单的事件委托模型 
	 */
	function checkClick(event) {
		var target = event.target;
		while (!utils.hasClass(target,'UI_plane')) {
			target = target.parentNode;
			if(!target){
		//		console.log('not target')
				//close the active plane
				private_activePlane&&private_activePlane.close();
				break
			}
		}
	//	console.log('target',target)
	}
	
	if(private_isSupportTouch){
		//移动端使用touch
		var doc = private_doc;
		doc.addEventListener('touchstart',checkClick);
		doc.addEventListener('MSPointerDown',checkClick);
		doc.addEventListener('pointerdown',checkClick);
	}else{
		//PC鼠标事件
		utils.bind(document,'mousedown',checkClick);
	}
	
	
	function PLANE(param){
		//如果有已展开的PLANE，干掉他
		private_activePlane&&private_activePlane.close();
		private_activePlane = this;

		var param = param || {};
		var this_plane = this;		

		var this_html = param['html'] || '';
		this.closeFn = param['closeFn'] || null;

		this.dom = utils.createDom(plane_tpl)[0];

		//insert html
		this.dom.innerHTML = this_html;
		
		utils.css(this.dom,{
			'width' : param['width'] || 240,
			'height' :param['height'] || null,
			'top' : param['top'] || 300,
			'left' : param['left'] || 800
		});
		private_mainDom.appendChild(this.dom);
	}
	PLANE.prototype['close'] = CLOSEMETHOD();

	/**
	 *	miniChat 
	 */

	function miniChat(param){
		var param = param || {};
		var this_chat = this;

		var text = param['text'] || '\u8BF7\u8F93\u5165\u6807\u9898';
		var this_tpl = miniChat_tpl.replace('{text}',text);
		
		this.dom = utils.createDom(this_tpl)[0];
		this.closeFn = param['closeFn'] || null;
		
		//视觉上的弹框（仅为dom的一部分）
		var visual_box = utils.findByClassName(this.dom,'UI_miniChat')[0];
		//当有确认参数时
		add_confirm(visual_box,param,function(){
			this_chat.close('slide');
		});
		

		var fixSize = adaption(220,110);
		
		var top = typeof(param['top']) == 'number' ? param['top'] : fixSize.top;
		var left = typeof(param['left']) == 'number' ? param['left'] : fixSize.left;

		// create pop
		utils.css(this.dom,{
			'left' : left,
			'top' : top
		});
		
		private_mainDom.appendChild(this.dom);
		var height = utils.outerHeight(visual_box);
		
		utils.animation(this.dom,{
			'height' : height
		}, 100);
		
	}
	miniChat.prototype['close'] = CLOSEMETHOD();



	/***
	 * 全屏弹框
	 * COVER 
	 */
	function COVER(param){
		var param = param || {};
		var this_cover = this;
		this.dom = utils.createDom(cover_tpl)[0];
		this.cntDom = utils.findByClassName(this.dom,'UI_coverCnt')[0];
		this.closeDom = utils.findByClassName(this.dom,'UI_coverClose')[0];
		this.closeFn = param['closeFn'] || null;

		var this_html = param['html'] || '';
		//insert html
		this.cntDom.innerHTML = this_html;
		
		utils.bind(this.closeDom,'click',function(){
			this_cover.close();
		});

		utils.hide(this.closeDom);
		// create pop
		utils.css(this.cntDom,{
			'left' : private_winW*2/3,
			'opacity' : 0
		});
		utils.animation(this.cntDom,{
			'left' : 0,
			'opacity' : 1
		}, 80,function(){
			utils.fadeIn(this_cover.closeDom,100);
		});
		
		private_fixedScreenTopDom.appendChild(this.dom);
	}
	//使用close方法
	COVER.prototype['close'] = function(){
		var dom_all = this.dom;
		
		utils.fadeOut(this.closeDom,80);
		utils.animation(this.cntDom,{
			'left' : private_winW/2,
			'opacity' : 0
		},120, function(){
			dom_all.remove();
		});
	};

	/**
	 * 选择功能
	 */
	function SELECT(list,param){
		var this_sel = this;
		
		var list = list || [];
		var param = param || {};
		
		var caption_html = '';
		if(param.title){
			caption_html += '<div class="UI_selectCpt">';
			if(param.title){
				caption_html += '<h3>' + param.title + '</h3>';
			}
			if(param.intro){
				caption_html += '<p>' + param.intro + '</p>';
			}
			caption_html += '</div>';
		}
		
		var fns = [];
		var list_html = '';
		for(var i=0,total=list.length;i<total;i++){
			list_html += '<a class="UI_select_btn" href="javascript:void(0)">' + list[i][0] + '</a>';
			fns.push(list[i][1]);
		}
		var this_html = select_tpl.replace(/\{(\w+)\}/g,function(a,b){
			if(b == 'list'){
				return list_html;
			}else if(b == 'caption'){
				return caption_html;
			}
		});
		
		this.dom = utils.createDom(this_html)[0];
		this._mask = true;
		
		
		//显示蒙层
		showMask();
		
		utils.css(this.dom,{
			'bottom' : -100,
			'opacity' : 0
		});
		
		private_fixedScreenBottomDom.appendChild(this.dom);
		
		utils.animation(this.dom, {
			'bottom' : 0,
			'opacity' : 1
		}, 300, 'Bounce.easeOut');
		var btns = utils.findByClassName(this.dom,'UI_select_btn');
		for(var i=0,total=btns.length;i<total;i++){
			(function(index){
				utils.bind(btns[index],'click',function(){
					fns[index] && fns[index]();
					this_sel.close();
				});
			})(i);
		}
	}
	SELECT.prototype['close'] = CLOSEMETHOD('slide',200);
	/**
	 *  抛出对外接口
	 */
	return {
		'pop' : function(){
			return new POP(arguments[0]);
		},
		'config' : {
			'gap' : function(name,value){
				if(name && name.match(/(top|right|bottom|left)/)){
					if(parseInt(value)){
						private_CONFIG.gap[name] = value;
					}
				}
			},
			'zIndex' : function(num){
				var num = parseInt(num);
				if(num > 0){
					private_CONFIG.zIndex = num;
					utils.css(private_allCnt,{
						'zIndex':num
					});
					utils.css(private_fixedScreenBottomDom,{
						'zIndex':num
					});
					utils.css(private_fixedScreenTopDom,{
						'zIndex':num
					});
				}
			}
		},
		'miniChat' : function(){
			return new miniChat(arguments[0]);
		},
		'confirm' : function(){
			return new CONFIRM(arguments[0]);
		},
		'ask' : function(text,callback){
			return new ASK(text,callback);
		},
		'prompt' : function(txt,time){
			return new prompt(txt,time);
		},
		'plane' : function(){
			return new PLANE(arguments[0]);
		},
		'cover' : function(){
			return new COVER(arguments[0]);
		},
		'select' : function(){
			return new SELECT(arguments[0],arguments[1]);
		},
		'drag' : drag
	};
},require('utils.js'));