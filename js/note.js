var g_note = local_readJson('note', {
    data: {}, // 最后一次打开的单条数据
});

$(function() {
	$('i.fa-arrows-alt').attr('class', 'bi bi-arrows-fullscreen');
	loadData();
	// setTimeout(() => {
		$('#loading').hide();
		$('#content').show();
		showUI('ui_note');
	// }, 1000);
	$('body').on('click', '[data-action]', function(event) {
    	doAction($(this).attr('data-action'), $(this))
    });
    doAction('reset');
});

function loadData(){
	if(g_noteList == undefined || g_noteList.default == undefined){
		$.getJSON('./res/note.json', function(json, textStatus) {
			g_noteList.default = json;
			local_saveJson('noteList', g_noteList);
			loadNotes();
		});
	}else{
		loadNotes();
	}
}


function operateFormatter(value, row, index) {
return [
  '<a class="like" href="javascript:void(0)" title="Like">',
  `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" class="bi bi-pencil-square" viewBox="0 0 16 16">
  <path d="M15.502 1.94a.5.5 0 0 1 0 .706L14.459 3.69l-2-2L13.502.646a.5.5 0 0 1 .707 0l1.293 1.293zm-1.75 2.456-2-2L4.939 9.21a.5.5 0 0 0-.121.196l-.805 2.414a.25.25 0 0 0 .316.316l2.414-.805a.5.5 0 0 0 .196-.12l6.813-6.814z"/>
  <path fill-rule="evenodd" d="M1 13.5A1.5 1.5 0 0 0 2.5 15h11a1.5 1.5 0 0 0 1.5-1.5v-6a.5.5 0 0 0-1 0v6a.5.5 0 0 1-.5.5h-11a.5.5 0 0 1-.5-.5v-11a.5.5 0 0 1 .5-.5H9a.5.5 0 0 0 0-1H2.5A1.5 1.5 0 0 0 1 2.5v11z"/>
</svg>`,
  '</a>  ',
  '<a class="remove" href="javascript:void(0)" title="Remove">',
  `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" class="bi bi-trash2" viewBox="0 0 16 16">
  <path d="M14 3a.702.702 0 0 1-.037.225l-1.684 10.104A2 2 0 0 1 10.305 15H5.694a2 2 0 0 1-1.973-1.671L2.037 3.225A.703.703 0 0 1 2 3c0-1.105 2.686-2 6-2s6 .895 6 2zM3.215 4.207l1.493 8.957a1 1 0 0 0 .986.836h4.612a1 1 0 0 0 .986-.836l1.493-8.957C11.69 4.689 9.954 5 8 5c-1.954 0-3.69-.311-4.785-.793z"/>
</svg>`,
  '</a>'
].join('')
}

window.operateEvents = {
'click .like': function (e, value, row, index) {
  loadNote(row);
},
'click .remove': function (e, value, row, index) {
	if(!g_cache.timer_deleteConfirm){
			g_cache.timer_deleteConfirm = setTimeout(() => {
				delete g_cache.timer_deleteConfirm;
			}, 2000);
			setTip('#tip_edit', 'alert-warning', '确定删除吗？(再次点击或等待2秒)');
			return;
		}
		if(g_note.data && g_note.data.id == row.id){
			delete g_note.data;
				local_saveJson('note', g_note);
			loadNote({
		id: '',
		tag: '',
		desc: '',
		text: ''
	});
		}
  $('#_table').bootstrapTable('remove', {
    field: 'id',
    values: [row.id]
  });
  delete g_noteList[g_config.noteName][row.id];
				local_saveJson('noteList', g_noteList);
}
}

function doAction(type, dom){
    	switch (type) {
    		case 'reset':
    			if(g_note.data) loadNote(g_note.data);
    			break;

    			case 'save':
    			let id = $('#note_name').val();
    			if(id == ''){
					setTip('#tip_edit', 'alert-warning', '请输入标题');
    				return;
    			}
    			if(g_note.data && g_note.data.id != id){
    				if(!g_cache.confirmTimer){
    					g_cache.confirmTimer = setTimeout(() => {
    						delete g_cache.confirmTimer;
    					}, 2000);
						setTip('#tip_edit', 'alert-warning', '名称有变动，确定给更改吗? (再次点击保存)');
    					return;
    				}
    				// 删除旧数据
    				delete g_noteList[g_config.noteName][g_note.data.id];
    				// 更新表格ID (此方法可以更改主键ID)
    				$('#_table').bootstrapTable('updateCellByUniqueId', {id: g_note.data.id, field: 'id', value: id}) 
    			}
    			g_note.data = {
    				desc: $('#note_desc').val(),
    				text: $('#note_text').val(),
    				tag: $('#note_tag').val(),
    			}
    			g_noteList[g_config.noteName][id] = g_note.data;
				local_saveJson('noteList', g_noteList);

    			g_note.data.id = id;
				local_saveJson('note', g_note);

				$('#_table').bootstrapTable('updateByUniqueId', {id: id, row: g_note.data})
				setTip('#tip_edit', 'alert-success', '保存成功');
    			break;
    		}
    	}

  function setTip(id, type, text){
  	$(id).attr('class', 'alert alert-dismissible fade show ' + type).show('slow').find('span').html(text);
  	if(g_cache.tipTimer) clearTimeout(g_cache.tipTimer);
  	g_cache.tipTimer = setTimeout(() => {
  		$(id).hide('slow');
  	}, 2000);
  }

function loadNote(data){
	g_note.data = data;
	local_saveJson('note', g_note);
	$('#note_name').val(data.id);
	$('#note_tag').val(data.tag);
	$('#note_desc').val(data.desc);
	$('#note_text').val(data.text);
	if(data.id != ''){
		$('#pills-edit-tab')[0].click();

	}
}

function loadNotes(){
	var data = [];
	for(let [key, value] of Object.entries(g_noteList[g_config.noteName])){
		value.id = key;
		data.push(value);
	}
	$('#_table').bootstrapTable({
		data: data
	});
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