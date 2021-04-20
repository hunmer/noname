var editor;
var _code;

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
    editor.setValue(g_config.editor);
    editor.on("change", (e) => {
    	g_config.editor = editor.getValue();
    	local_saveJson('config', g_config);
    });

    loadData();
    $('body').on('click', '[data-action]', function(event) {
    	let type = $(this).attr('data-action');
    	switch (type) {
    		case 'fullDesc':
    			let code = _code.getValue();
    			if(code == '') return;
    			var res = code;
    			for(let n in g_data.note.list){
    				if(code.indexOf(n) != -1 && code.indexOf(n+'</span>') == -1){
    					res = res.replace(n, '<span  data-bs-toggle="tooltip" class="badge bg-'+getArrayRandom(["primary", "secondary", "success", "warning", "info"])+'" data-bs-placement="top" title="'+g_data.note.list[n].desc+'">'+n+'</span>')
    				}
    			}
    			$('#fullDesc').html(res);
    			$('#model_fullDesc .modal-title').html($('#skill .list-group-item.active').html());
    			$('#model_fullDesc').modal('show');
   				$("[data-bs-toggle]").tooltip();
    			break;

    		case 'hero':
    			loadHero($(this).attr('data-pack'), $(this).attr('data-value'));
    			break;

    		case 'code':
    			loadSkill(g_config.pack, $(this).attr('data-value'));
    			break;

    		default:
    			// statements_def
    			break;
    	}
    });

     setInterval(() => {
    	var text;
    	text = _code.getSelectedText();
    	if(text != g_cache.selected.code){
    		g_cache.selected.code = text;
    		getTip(text);
    	}
    	text = _code.getSelectedText();
    	if(text != g_cache.selected.editor){
    		g_cache.selected.editor = text;
    		getTip(text);
    	}
    }, 500);

   $("[data-bs-toggle]").tooltip();
});


function getArrayRandom(arr){
	return arr[Math.floor((Math.random()*arr.length))];
}

function getTip(text){
	if(g_data.note.list[text] != undefined){
		let v = g_data.note.list[text];
		$('#note-desc').val(v.desc);
		$('#note-text').val(v.text);
		$('#note-tag').val(v.tag);
	}
}

function loadData(){
	if(g_data.hero.length){
		initHero();
	}else{
		$.getJSON('./res/hero.json', function(json, textStatus) {
			g_data.hero = json;
			local_saveJson('data', g_data);
			initHero();
		});
	}
	if(g_data.note == undefined || !g_data.note.length){
		$.getJSON('./res/note.json', function(json, textStatus) {
			g_data.note = json;
			local_saveJson('data', g_data);
		});
	}
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
		$('audio').attr('src', getRes('audio/skill', skill))[0].play();
		_code.setValue('skill: '+JSON.stringify(g_data.hero[pack].skill[skill].script, null, 2), 1);
	}
}
function loadHero(pack, hero){
	if( g_data.hero[pack] != undefined && g_data.hero[pack].hero[hero] != undefined){

		var obj = {
			pack: pack,
			hero: hero,
		}
		let v = g_data.hero[pack].hero[hero];
		$(".breadcrumb").html(`
			    <li class="breadcrumb-item"><a href="javascript: showUI('ui_list')">Home</a></li>
			    <li class="breadcrumb-item"><a href="javascript: showUI('ui_list')">`+g_data.hero[pack].name+`</a></li>
			    <li class="breadcrumb-item active" aria-current="page">`+v.name+`</li>
			  </ol>
		`);

		$('#cover img').attr('src', getRes('image/character', hero));

		var h1 = '';
		var h2 = '';
		for(let skill of v.attr[3]){
			s = 'skill-'+skill;
			h1 += `<a data-action="code" data-value="`+skill+`" class="list-group-item list-group-item-action" id="`+s+`-list" data-bs-toggle="list" href="#`+s+`" role="tab" aria-controls="home">`+g_data.hero[pack].skill[skill].name+`</a>`;
			h2 += `<div class="tab-pane" id="`+s+`" role="tabpanel" aria-labelledby="`+s+`-list">`+g_data.hero[pack].skill[skill].info+`</div>`;
		}
		$('#list-tab').html(h1);
		$('#nav-tabContent').html(h2);

		showUI('ui_hero');
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
	return 'https://raw.githubusercontent.com/libccy/noname/master/'+type+'/'+name+file+'.'+(isAudio ? 'mp3' : 'jpg');
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
					<img class="round" src="`+getRes('image/character', name)+`"></img>
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
	// g_config.pack = "sp";
	// loadHero("sp", "huaxin");
}