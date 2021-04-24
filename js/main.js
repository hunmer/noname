var editor;
var _code;
var _cache = false;
var offcanvasList = [];
$(function() {
	var option = {
        theme: "ace/theme/monokai",
        mode: "ace/mode/javascript",
        wrap: true,
        readOnly: true,
    	highlightActiveLine: true,
		highlightSelectedWord: true,
        autoScrollEditorIntoView: true
    };
	_code = ace.edit("code", option);

	option.theme = 'ace/theme/tomorrow_night';
	option.readOnly = false;
    editor = ace.edit("editor", option);
    editor.on("change", (e) => {
    	g_config.editor = editor.getValue();
    	local_saveJson('config', g_config);
    });

    loadData();
    $('body').on('click', '[data-action]', function(event) {
    	doAction($(this).attr('data-action'), $(this))
    });

    switchNoteTimer();
   $("[data-bs-toggle]").tooltip();

   $('#model_search')[0].addEventListener('shown.bs.modal', function (event) {
		applySearchInput();
	});
});

function switchNoteTimer(b_enable){
	if(b_enable == undefined){
		b_enable = g_config.switchNoteTimer;
	}else{
		g_config.switchNoteTimer = b_enable;
		local_saveJson('config', g_config);
	}
	$('#switch-NoteTimer').prop('checked', b_enable);
	if(g_cache.timer){
		clearInterval(g_cache.timer);
		g_cache.timer = 0;
	}
	if(b_enable){
		g_cache.timer = setInterval(() => {
	    	var text;
	    	text = _code.getSelectedText();
			$('#note-key').val(text);
	    	if(text != g_cache.selected.code){
	    		g_cache.selected.code = text;
	    		getTip(text);
	    	}
	    	text = editor.getSelectedText();
	    	if(text != g_cache.selected.editor){
	    		g_cache.selected.editor = text;
	    		getTip(text);
	    	}
	    }, 250);
	}
}

function applySearchInput(){
	var v;
	var id;
	var checked;
	for(let d of $('#model_search .input-group')){
		checked = $(d).find('input[type=checkbox]');
		id = checked.val();
		v = g_config.search[id] != undefined ? g_config.search[id] : {
			checked: false,
			val: ''
		}
		checked.prop('checked', v.checked);
		$(d).find('input[type=text]').val(v.val);
	}
}

function doAction(type, dom){
    	switch (type) {
    		case 'fullDesc':
    			let code = _code.getValue();
    			if(code == '') return;
    			var res = code;
    			for(var n in g_noteList[g_config.noteName]){
    				if(code.indexOf(n) != -1 && code.indexOf(n+'</span>') == -1){
    					res = res.replace(n, '<span data-bs-toggle="tooltip" class="badge bg-'+getArrayRandom(["primary", "secondary", "success", "warning", "info"])+'" data-bs-placement="top" title="'+g_noteList[g_config.noteName][n].desc+'">'+n+'</span>')
    				}
    			}
    			for(var n in g_user.note){
    				if(code.indexOf(n) != -1 && code.indexOf(n+'</span>') == -1){
    					res = res.replace(n, '<span data-bs-toggle="tooltip" class="badge bg-'+getArrayRandom(["primary", "secondary", "success", "warning", "info"])+'" data-bs-placement="top" title="'+g_user.note[n].desc+'">'+n+'</span>')
    				}
    			}

    			$('#fullDesc').html(res);

    			// 移除被套中的标记
    			for(let d of $('#fullDesc span[data-bs-toggle="tooltip"]')){
    				if(d.childElementCount){
    					$(d).html(d.innerText);
    				}
    			}

    			$('#model_fullDesc .modal-title').html($('#skill .list-group-item.active').html());
    			$('#model_fullDesc').modal('show');
   				$("[data-bs-toggle]").tooltip();

    			break;

    		case 'hero':
    			loadHero(dom.attr('data-pack'), dom.attr('data-value'));
    			break;

    		// case 'menu':
    		// 	$('#offcanvasRight').Offcanvas.show();
    		// 	break;

    		case 'code':
    			loadSkill(g_config.pack, dom.attr('data-value'));
    			break;

    		case 'resetSearch':
    			g_config.search = {};
    			local_saveJson('config', g_config);
    			applySearchInput();
    			break;

    		case 'openSeach':
    			$('.offcanvas').offcanvas('hide');
    			$('#model_search').modal('show');
    			break;

    		case 'format':
    			editor.setValue(doJsBeautify(editor.getValue()), 1);
    			break;

    		case 'copy':
    			editor.selectAll()
				document.execCommand("copy");
				editor.clearSelection();
				break;

    		case 'undo':
    			editor.undo();
    			break;

    		case 'jump':
    			var v;
    			var heros = [];
    			let pack = dom.attr('data-pack');
    			let value = dom.attr('data-value');
    			if(dom.attr('data-type') == '技能'){
    				for(var p in g_data.hero){
	    				for(var i in g_data.hero[p].hero){
	    					v = g_data.hero[p].hero[i];
	    					if(v.attr[3].indexOf(value) != -1){
	    						heros.push(i);
	    					}
	    				}
	    			}
    			}
    			// 一个技能可能被多个武将使用
    			if(false && heros.length > 1){

    				// TODO 
    				$('.modal').modal('hide');
    				var modal = $('#model_custom');
					modal.find('.modal-title', '选择武将');
					var h = '<select class="form-select" size="3" aria-label="size 3 select example">';
					for(var i of heros){
						h += '<option onclick="loadHero('+pack+', '+i+')">'+i+'</option>'
					}
					modal.find('.modal-body').html(h+'</select>').modal('show');
    			}else{
    				g_cache.choosedSkill = value;
    				if(heros.length){
    					value = heros[0];
    				}
    				loadHero(pack, value);
    			}
    			break;

    		case 'redo':
    			editor.redo();
    			break;

    		case 'search':
    			var v;
    			var checked;
    			var option = {};
    			for(let d of $('#model_search .input-group')){
    				checked = $(d).find('input[type=checkbox]');
					option[checked.val()] = {
    					checked: checked.prop('checked'),
    					val: $(d).find('input[type=text]').val()
    				}
    			}
    			g_config.search = option;
    			local_saveJson('config', g_config);

    			var r = [];
    			for(let p in g_data.hero){
    				if(option.hero.checked && option.hero.val != ''){
	    				for(var search of option.hero.val.split('||')){
	    					if(search == '') continue;
	    					for(var i in g_data.hero[p].hero){
		    					v = g_data.hero[p].hero[i];
		    					if(i.indexOf(search) != -1){
		    						r.push({
		    							pack: p,
		    							type: '角色',
		    							key: i,
		    							name: v.name,
		    							search: search,
		    							value: 'ID : ' + i,
		    						})
		    					}else
		    					if(v.name.indexOf(search) != -1){
		    						r.push({
		    							pack: p,
		    							type: '角色',
		    							key: i,
		    							name: v.name,
		    							search: search,
		    							value: '名称 : ' + i,
		    						});
		    					}
		    				}
	    				}
    				}

    				for(var i in g_data.hero[p].skill){
    					v = g_data.hero[p].skill[i];
    					if(option.skill.checked && option.skill.val != ''){
    						for(var search of option.skill.val.split('||')){
		    					if(search == '') continue;
		    					if(i.indexOf(search) != -1){
		    						r.push({
		    							pack: p,
		    							type: '技能',
		    							key: i,
		    							name: v.name,
		    							search: search,
		    							value: 'ID : ' + i,
		    						})
		    					}else
		    					if(v.name.indexOf(search) != -1){
		    						r.push({
		    							pack: p,
		    							type: '技能',
		    							key: i,
		    							name: v.name,
		    							search: search,
		    							value: '名称 : ' + v.name,
		    						})
		    					}
		    				}
	    				}
    					if(option.desc.checked && option.desc.val != ''){
    						for(var search of option.desc.val.split('||')){
		    					if(search == '') continue;
		    					if(v.info.indexOf(search) != -1){
		    						r.push({
		    							pack: p,
		    							type: '技能',
		    							key: i,
		    							name: v.name,
		    							search: search,
		    							value: v.info,
		    						})
		    					}
		    				}
	    				}
    					if(option.code.checked && option.code.val != ''){
	    					for(var search of option.code.val.split('||')){
		    					if(search == '') continue;
		    					if(v.script.indexOf(search) != -1){
		    						r.push({
		    							pack: p,
		    							type: '技能',
		    							key: i,
		    							name: v.name,
		    							search: search,
		    							value: '详情点击',
		    						})
		    					}
		    				}
	    				}
    				}
    			}

    			var h = `<input oninput="onSearchInputChange1(this)" type="text" class="form-control" placeholder="过滤">`;
    			for(var v of r){
    				h += `  <a data-action="jump" data-pack="`+v.pack+`" data-value="`+v.key+`" data-type="`+v.type+`" href="javascript: void(0)" class="list-group-item list-group-item-action mt-2" aria-current="true" title="`+v.value+`">
    <div class="d-flex w-100 justify-content-between">
      <h5 class="mb-1">`+v.name+`</h5>
      <small>`+v.type+`</small>
    </div>
    <p class="mb-1">`+v.value.replace(v.search, '<span class="text-danger">'+v.search+'</span>')+`</p>
  </a>`
    			}
    			$('#search_result').html(h);
    			break;

    		case 'favorite':
    			toggleButton(dom, $('[data-action="unfavorite"]'))
    			setFavorite( g_config.pack, g_config.type, g_config.value, true);
    			break;

    		case 'unfavorite':
    			toggleButton(dom, $('[data-action="favorite"]'))
    			setFavorite( g_config.pack, g_config.type, g_config.value, false);
    			break;

    		case 'save': // TODO
    			if(g_config.note != ''){
    				g_user.note[g_config.note] = {
	    				desc: $('#note-desc').val(),
	    				text: $('#note-text').val(),
	    				tag: $('#note-tag').val(),
	    			}
					local_saveJson('user', g_user);
					$('[data-action="default"]').removeClass('disabled').removeClass('btn-outline-secondary').addClass('btn-outline-info');
    			}
    			break;

    		case 'default':
    			dom.addClass('disabled').addClass('btn-outline-secondary').removeClass('btn-outline-info');
    			delete g_user.note[g_config.note];
				local_saveJson('user', g_user);
				getTip(g_config.note);
    			break;

    		default:
    			// statements_def
    			break;
    	}
}

function toggleButton(btn1, btn2){
	btn1.addClass('hide');
    btn2.removeClass('hide');
}

function isFavorite(pack, type, value){
	return g_config.favorite !== undefined && g_config.favorite[pack] !== undefined ? g_config.favorite[pack][type].indexOf(value) != -1 : false;
}


function setFavorite(pack, type, value, b_favorite = true){
	if(g_config.favorite == undefined){
		g_config.favorite = {}
	}
	if(g_config.favorite[pack] == undefined){
		g_config.favorite[pack] = {
			hero: [],
			card: []
		}
	}
	var b_changed = false;
	let i_index = g_config.favorite[pack][type].indexOf(value);
	if(b_favorite){
		if(i_index == -1){
			g_config.favorite[pack][type].push(value);
			b_changed = true;
		}
	}else{
		if(i_index != -1){
			g_config.favorite[pack][type].splice(i_index, 1);
			b_changed = true;
		}
	}
	if(b_changed){
		local_saveJson('config', g_config);
	}
}


function getArrayRandom(arr){
	return arr[Math.floor((Math.random()*arr.length))];
}

function getTip(text){
	var v = {
		desc: '',
		text: '',
		tag: ''
	};
	var h = '';
	if(text != ''){
		if(g_user.note[text] != undefined){
			v = g_user.note[text];
			$('[data-action="default"]').removeClass('disabled').removeClass('btn-outline-secondary').addClass('btn-outline-info');
		}else
		if(g_noteList[g_config.noteName][text] != undefined){
			v = g_noteList[g_config.noteName][text];
		}
		$('#note-desc').val(v.desc);
		$('#note-text').val(v.text);
		$('#note-tag').val(v.tag);
		g_config.note = text;

		var arr = [];
		for(var n in g_noteList[g_config.noteName]){
			if(n.indexOf(text) != -1 && n != text){
				arr.push(n);
				//arr.push(g_noteList[g_config.noteName][n]);
			}
		}
		for(var n in g_user.note){
			if(n.indexOf(text) != -1 && n != text){
				arr.push(n);
				//arr.push(g_user.note[n]);
			}
		}
		for(var n of arr){
			h += `<a href="javascript: _code.find('`+n+`');getTip('`+n+`')" class="list-group-item list-group-item-action" aria-current="true">`+n+`</a>`;
		}
	}
	$('#note_more').html(h).css('display', h == '' ? 'none' : 'unset');
}

function loadData(){

	if(!_cache && g_data.hero.length){
		initHero();
	}else{
		$.getJSON('./res/hero.json', function(json, textStatus) {
			g_data.hero = json;
			local_saveJson('data', g_data);
			initHero();
		});
	}
	if(!_cache && g_noteList == undefined || g_noteList.default == undefined){
		$.getJSON('./res/note.json', function(json, textStatus) {
			g_noteList.default = json;
			local_saveJson('noteList', g_noteList);
		});
	}
}

function doJsBeautify(text) {
	if(text != ''){
		 var e = text.replace(/^\s+/, "");
	    if (e){
	  		return js_beautify(e, 2, " ");
	    }
	}
    return text;
}

function showUI(ui){
	for(let d of $('.ui')){
		if(d.id == ui){
			$(d).removeClass('hide');
		}else{
			$(d).addClass('hide');
		}
	}
}
function loadSkill(pack, skill){
	if( g_data.hero[pack] != undefined && g_data.hero[pack].skill[skill] != undefined){
		let script = g_data.hero[pack].skill[skill].script.replaceAll('\n\t', '').replaceAll('\t', '').replaceAll('\\"', '"');
		$('body').scrollTop(0);

		let audioName = getTextbyStartAndEnd('audio: "', '');
		console.log(audioName);
		if(!isNaN(parseInt(audioName))){
			skill = audioName;
		} 
		$('audio').attr('src', getRes('audio/skill', skill))[0].play();
		_code.setValue(doJsBeautify('skill = '+script, 1), -1);
    	
    	//editor.setValue(g_config.editor);
	}
}
function loadHero(pack, hero){
	if( g_data.hero[pack] != undefined && g_data.hero[pack].hero[hero] != undefined){

		g_config.pack = pack;
		g_config.type = 'hero';
		g_config.value = hero;

		let b_isFavorited = isFavorite( pack, 'hero', hero);
		let btn1 = $('[data-action="favorite"]');
		let btn2 = $('[data-action="unfavorite"]');
		if(b_isFavorited){
			toggleButton(btn1, btn2);
		}else{
			toggleButton(btn2, btn1);
		}

		let v = g_data.hero[pack].hero[hero];
		$(".breadcrumb").html(`
			    <li class="breadcrumb-item"><a href="javascript: showUI('ui_list')">Home</a></li>
			    <li class="breadcrumb-item"><a href="javascript: showUI('ui_list')">`+g_data.hero[pack].name+`</a></li>
			    <li class="breadcrumb-item active" aria-current="page">`+v.name+`</li>
			  </ol>
		`);


		$('#cover img').attr('src', './res/loading.gif').attr('data-src', getRes('image/character', hero)).lazyload();

		var h1 = '';
		var h2 = '';
		for(let skill of v.attr[3]){
			s = 'skill-'+skill;
			h1 += `<a data-action="code" data-value="`+skill+`" class="list-group-item list-group-item-action" id="`+s+`-list" data-bs-toggle="list" href="#`+s+`" role="tab" aria-controls="home">`+g_data.hero[pack].skill[skill].name+`</a>`;
			h2 += `<div class="tab-pane" id="`+s+`" role="tabpanel" aria-labelledby="`+s+`-list">`+g_data.hero[pack].skill[skill].info+`</div>`;
		}
		$('#list-tab').html(h1);
		$('#nav-tabContent').html(h2);
		$('.modal.show').modal('hide');
		showUI('ui_hero');

		if(g_cache.choosedSkill != undefined){
			$('[data-action="code"][data-value="'+g_cache.choosedSkill+'"]')[0].click();
			g_cache.choosedSkill = undefined;
		}else
		if(v.attr[3].length){
			$('[data-action="code"]')[0].click()
		}

	}
}

function getRes(type, name){
	let isAudio = type.indexOf('audio') != -1;
	var file = '';
	if(isAudio){
		g_cache.skillAduio = !g_cache.skillAduio;
		file = g_cache.skillAduio ? 1 : 2
	}
	//return 'https://gitee.com/neysummer2000/noname/raw/master/'+type+'/'+name+file+'.'+(isAudio ? 'mp3' : 'jpg');
	return (location.host == '127.0.0.1' ? 'http://127.0.0.1/Windows_Yuri_Fix/noname/resources/app/' : 'https://raw.githubusercontent.com/libccy/noname/master/')+type+'/'+name+file+'.'+(isAudio ? 'mp3' : 'jpg');

}

function loadPack(pack, _sl = ''){
	g_config.pack = pack;
	var obj = {
		card: '',
		sl: [],
		sl_html: '',
	};
	var v;
	if(pack != '' && g_data.hero[pack] != undefined){
		for(let name in g_data.hero[pack].hero){
			v = g_data.hero[pack].hero[name];
			if(_sl != '' && v[1] != _sl) continue; 
			obj.card += `
				<div data-pack="`+pack+`" data-action="hero" data-value="`+name+`" class="col-3 mb-2" style="position: relative;">
					<img class="round lazyload" src="./res/loading.gif" data-src="`+getRes('image/character', name)+`"></img>
				</div>
			`;

			if(_sl == '' && obj.sl.indexOf(v[1]) == -1){
				obj.sl.push(v[1]);
				obj.sl_html += `
				<div class="form-check form-check-inline">
				  <input class="form-check-input" type="radio" id="selecter_`+v[1]+`" value="`+v[1]+`">
				  <label class="form-check-label" for="selecter_`+v[1]+`">`+getSL(v[1])+`</label>
				</div>
				`;
			}
		}
		/*
		<div class="row">
						<span class="sl col">`+getSL(v[1])+`</span>
						<span class="name col">`+name+`</span>
						
					</div>
	<div class="col">
							<span>`+v[2]+`</span>
						</div>
		*/
	}
	$('#list-show').html(obj.card);
	if(_sl == ''){
		$('#selecter').html(`<div class="form-check form-check-inline">
			  <input class="form-check-input" type="radio" name="inlineRadioOptions" id="selecter_all" value="">
			  <label class="form-check-label" for="selecter_all">全</label>
			</div>` + obj.sl_html);
	}
	$('.lazyload').lazyload({effect: "fadeIn"});
}

function selectSL(){
	loadPack(g_config.pack, $('#selecter input:checked').val());

}

function getSL(sl){
	switch (sl) {
		case 'wei':
			return '魏';

		case 'shu':
			return '蜀';

		case 'wu':
			return '吴';

		case 'qun':
			return '群';

		case 'key':
			return '键';

		case 'western':
			return '西方';

		default:
			return sl;
	}
}

function initHero(){
	var h = '<option selected>选择卡组</option>';
	for(let pack in g_data.hero){
		h += '<option value="'+pack+'">'+g_data.hero[pack].name+'</option>';
	}
	$('#pack_selecter select').html(h)
	.on('change', function(event) {
		loadPack($(this).val());
	});
	//setTimeout(() => {
		$('#loading').hide();
		showUI('ui_list');
		g_config.pack = "sp";
		loadHero("sp", "huaxin");

		doAction('openSeach');
	//}, 0);
	
}

function onSearchInputChange(dom){
	$(dom).parent().find('input[type=checkbox]').prop('checked', dom.value ? true : false);
}


function onSearchInputChange1(dom){
	for(let d of $('#search_result .list-group-item')){
		if(d.outerText.indexOf(dom.value) != -1){
			$(d).show();
		}else{
			$(d).hide();
		}
	}
}