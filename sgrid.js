var fui_filter_popup, 
	fui_FAVORITY_POPUP;
$.fn.fuiGrid = function (data) {
		var default_option = {
				width : null,
				height : "auto", // "none", null
				json : null, // {list : , allListCnt : }
				url : null,
				data : {},
				option : {
					use : true, 
					columnHide : true, 
					excel : true || {use:true, type:"ALL", title:""},
					unit : {
						use : true, select : true, 
						basic:getCookie("fletaUnit"),
						type : ["TB","GB","MB"], 
						func : decFmt
					},
					filter : {use : false, index : null },
					search : false,
					total : false,
					favorite : true,
					lang : true,
					callback : {},
					objects : [],
					etcOption : []
				},
				odd : true,
				sort : true,
				paging : {use : false , totalSize : 1},
				tally : {
					sub : {use : false, text : "Subtotal", index : 0, colspan : 1},
					total : {use : false, text : "Total", index : 0, colspan : 1 ,
						type : null, data : null, column : null
					}
				},
				footer : [],
				column : [],
				total : [],
				subGrid : null
			};
		var	$gridArea = this,
			setting = {},
			jsonObj = data.json; 
		
		setting = $.extend(true,{}, default_option, data);
		if((is_array(jsonObj) && jsonObj.length === 0)){
			jsonObj = 0;
		}
		
		fui.grid.option = setting;

		var fGrid = object( fui.grid(this, setting));
		fGrid.init();
		
		return ({
			init : function(){
				fui.loading($gridArea);
				var fui_obj = this;
				setting.data.listCnt = getCookie("fletaListSize");	
				setting.data.paging = setting.paging.use;

				if(typeof jsonObj === "undefined" || typeof jsonObj !== "object" && jsonObj != 0){
					
					$.ajaxSettings.traditional = true;  
					$.ajax({
						type : "post",
						url : setting.url,
						data : setting.data,
						dataType : "json",
						success : function(data){
							if(data === "UNUSUAL"){
								alert("Unusual request.");
								location.href = uri+"/login";
							}else{
								fui_obj.gridAppend(data);
							}
						},
						error : function(error){
							fui_obj.gridAppend(null);
						}
					});
				}else{
					// list cnt apply
					let data = {},
						jList;
					
					if(jsonObj.list){
						jList = jsonObj.list;
						allCnt = jsonObj.allListCnt;
					}else{
						jList = jsonObj;
						allCnt = jsonObj.length;
					}
					data.list = null;
					if(jList != 0){
						data.list = jList.slice(0, setting.data.listCnt);
					}
					data.allListCnt = allCnt;
					
					fui_obj.gridAppend(data);
				}
				
				return fGrid;
			},
			gridAppend : function(jsonObj){
				let gridContainer = document.createElement("div");
				let	gid = $gridArea.attr("id"),
					jsonData;
				
				gridContainer.setAttribute("class", "fleta_grid");
				
				if(jsonObj == null || jsonObj == "null"){
					fui.loadingRemove($gridArea);
					gridContainer.append(fGrid.gridErrorBody());
					$gridArea.append(gridContainer); 
					
					return false;
				}			
				
				if(!$gridArea.children().is("form")){
					$gridArea.append( this.madeForm(gid) ); // grid Form made
				}
				
				// grid option menu
				gridContainer.append(fGrid.gridMenu());
				
				// table append
				if(jsonObj.list){
					jsonData = jsonObj.list;
				}else{
					jsonData = jsonObj;
				}
				gridContainer.append(fGrid.gridHead(jsonData));
				
				if(jsonData != 0){
					gridContainer.append(fGrid.gridBody(jsonData));					
				}else{
					gridContainer.append(fGrid.gridNoBody());
				}
				
				if(setting.paging.use || setting.footer.length > 0 ){
					gridContainer.append(fGrid.gridFooter(jsonObj.allListCnt));
				}
				
				if($gridArea.children().is(".fleta_grid")){
					$gridArea.get(0).replaceChild(gridContainer, $gridArea.children(".fleta_grid").get(0));
				}else{
					/*
					 * final grid made
					 */ 
					$gridArea.append(gridContainer); 
				}
				
				// 모든 그리드가 만들어진 후에  
				if(setting.tally.sub.use){
					fGrid.sum.tally('td.subtotal');			
				}
				if(setting.tally.total.use){
					if(setting.tally.total.type === "json"){
					}else if(setting.tally.total.type === "table"){
					}else{
						fGrid.sum.tally('td.total');						
					}
				}
				if(setting.sort){
					fGrid.activSort.apply($gridArea);					
				}
				
				fGrid.gridEvent();
				fGrid.gridColumnHide("first");	
				
				fGrid.margeRows();
				
				gridHeight.apply(gridContainer);
				
				fui.loadingRemove($gridArea);
				
				return fGrid;
			},
			madeForm : function(id){
				let frm = document.createElement("form");
				frm.setAttribute("id",id+"_frm");
				var setData = setting.data; //decodeURIComponent(setting.data)
				if(typeof setData == "string"){
					var arr = setData.split("&");
					var objData = {};
					for(var i in arr){
						var adata = arr[i];
						var key = adata.split("=")[0];
						var val = adata.split("=")[1];
						objData[key] = val;
					}
					setData = objData;
				}
				var inputArr = ['histMonth', 'filter', 'paging', 'pageNo', 'listCnt', 'searchWord', 'orderCol', 'unit', 'columns'];

				for(var n in setData){
					if(inputArr.indexOf(n) < 0){
						inputArr.push(n);
					}
				}
				for(var i=0; i<inputArr.length; i++){
					var val = "";
					if(setData != null && typeof setData[inputArr[i]] != 'undefined'){
						val = setData[inputArr[i]];
					};
					if(inputArr[i] == "listCnt"){
						val = getCookie("fletaListSize");
					}
					if(inputArr[i] == "paging"){
						val = setting.paging.use;
					}
					frm.insertAdjacentHTML('beforeend', '<input type="hidden" name="'+inputArr[i]+'" value="'+val+'" />');
				}

				return frm;
			}
			
		}).init();
};
var T=Number('1e'+1);	
var fui = {	
		grid : function(div, data){
			let gridDiv = div, 	// grid container
				gridObj, 		//	fGrid
				gridDefOpt = data, 
				column = gridDefOpt.column,
				tally = gridDefOpt.tally,
				COL_SIZE = column.length,
				gridPage = 1, 
				gridListSize, 
				filter = [];
			return {
				init : function(){
					gridObj = this;
				},
				result : null,
				// ajax로 데이터 가져오기 
				madeAjaxGrid : function(p){
					var tb_div = gridDiv.find(".fui_grid_body")[0],
						frm = gridDiv.children("form"),
						lodingArea = gridDiv.children(".fleta_grid");
					let listCnt = frm.get(0).listCnt.value;
					
					if(typeof p === "undefined"){
						gridPage = 1;
						frm.get(0).pageNo.value = 1;
					}
					
					if(gridDefOpt.json == null){
						let postData = frm.serialize()
						fui.loading(lodingArea);
						$.ajax({
							type : "post",
							url : gridDefOpt.url,
							data : postData,
							dataType : "json",
							success : function(data){
								// table append
								if(data === "UNUSUAL"){
									alert("Unusual request.");
									location.href = uri+"/login";
								}
								if(data.allListCnt >= 0){
									gridDefOpt.paging.totalSize = data.allListCnt;
								}
								gridObj.htmlTbody(data, tb_div);
							},
							error : function(e){
								gridObj.htmlTbody(null, tb_div);
							}
						});
						
					}else{
						let jObj = gridDefOpt.json;
						let jData, jList, allCnt, pList;
						if(jObj.list){
							jList = jObj.list;
							allCnt = jObj.allListCnt;
						}else{
							jList = jObj;
							allCnt = jObj.length;
						}
						let srtnum = listCnt * (p - 1);
						let endnum = listCnt * p;
						
						if(allCnt > listCnt){
							pList = jList.slice(srtnum, endnum);
						}else{
							pList = jList;
						}
						jData = {
							list : pList,
							allListCnt : allCnt
						}
						
 						gridDefOpt.paging.totalSize = allCnt;
 						gridObj.htmlTbody(jData, tb_div);
						
					}
					fui.loadingRemove(lodingArea);
				},
				excelDown : function(){
					// gridDiv, setting
					fui.util.excelDown(gridDiv, gridDefOpt);
				},
				gridPrint : function (){
					fui.util.gridPrint(gridDiv, gridDefOpt);
				},
				gridFilter : function (){
					fui.util.gridFilter.apply(gridObj, [gridDiv, gridDefOpt]);
				},
				// ajax로 데이터 가져올때
				htmlTbody : function(json, oldGridBody){
					var newGridBody,
						gridContainer = gridDiv.children(".fleta_grid").get(0),
						jsonData;
					
					if(json == null){
						newGridBody = this.gridErrorBody();
					}else if(typeof json === "undefined" || json.length === 0){
						newGridBody = this.gridNoBody();
					}else{
						if(json.list){
							jsonData = json.list;
						}else{
							jsonData = json;
						}
						newGridBody = this.gridBody(jsonData);
					};
					gridContainer.replaceChild(newGridBody, oldGridBody);
					
					if(gridDefOpt.paging.use){
						var div = gridDiv.children(".fleta_grid").children(".fui_grid_footer"),
							paging = div.children(".paging").get(0),
							newPaging = gridObj.paging();
						div.get(0).replaceChild(newPaging, paging);
					}
					gridObj.gridEvent();
					gridObj.gridColumnHide("");	
					if(gridDefOpt.tally.sub.use){
						gridObj.sum.tally('td.subtotal');			
					}
					if(gridDefOpt.tally.total.use){
						if(gridDefOpt.tally.total.type === "json"){
							gridDefOpt.tally.total.data = json.total;
						}else if(gridDefOpt.tally.total.type === "table"){
							
						}else{
							gridObj.sum.tally('td.total');						
						}
					}
					gridObj.margeRows();
					gridHeight.apply(gridContainer);
					gridCellWidth.apply(gridContainer);
				},
				gridMenu : function(){
 					let gridOptions = document.createElement("div");
					let	gridOptRight = document.createElement("div");
					
					gridOptions.setAttribute("class","grid_options");
					gridOptRight.setAttribute("class","grid_opt_right");
					
					/*
					 * Grid Opttions
					 */
					if(gridDefOpt.option.use){
					
	 					// Option Objects
						if(gridDefOpt.option.objects.length > 0){
							var objects = gridDefOpt.option.objects;
							for(let obj of objects){
								let objNm = obj.attr("name");
								if(objNm){
									var objInp = $("<input type='hidden' name='"+objNm+"' value='"+obj.val()+"' />").appendTo(gridDiv.children("form"));
									obj.on("change", function(){
										objInp.val($(this).val());
										gridObj.madeAjaxGrid();
									}).css("margin-left",5);
								}
								gridOptions.append(obj.get(0));
							}
						}
						
						// Export
						var expBtn = $("<button id='exportBtn' class='white_l selectBtn'>Export</button>");
						var expSel = $("<select>").attr("name","exportBtn").addClass("hide");
						expSel.append("<option value='gridPrint'>Print</option>");
						expSel.append("<option value='excelDown'>Excel</option>");
						gridOptions.append(expBtn.get(0), expSel.get(0));
						expBtn.gridSelectmenu(gridDiv, gridDefOpt);
						
						// show/hide columns 
						if(gridDefOpt.option.columnHide){
							let columnBtn = document.createElement("button");
							columnBtn.setAttribute("id","grid_column_btn");
							columnBtn.setAttribute("class","white_l");
							columnBtn.innerText = "Column";
							columnBtn.addEventListener("click", function(){
								gridObj.gridColumnOption.apply($(this));
							});
							gridOptions.append(columnBtn); 
						}
	
						// favorite
						if(gridDefOpt.option.favorite){
							var optBtnFavo = $("<p>").attr("title","Favorite");
							var favoOpt = $("<span>",({id:"grid_excel_btn", "class":"grid_option_btn favorite"})).on("click", function(){
								var filter = gridDiv.children("form").children("[name=filter]").val();
								var opt = {
										type : "L",
										url : uri+'/popup/layer/user/favorite',
										data : {
												mid : gridDefOpt.data.menuId,
												fid :  gridDefOpt.data.fid,
												filter : filter
										},
										width : 370
								}
								fui_FAVORITY_POPUP = fui.popup(opt);
							});
							optBtnFavo.append(favoOpt);
							gridOptions.append(optBtnFavo);
						}
						
						/* 
						 * option etcOption
						 */
						if(gridDefOpt.option.etcOption.length > 0){
							(function(){
								var optBtnEtc = $("<p>").attr("title","Etc Option");
								var etcOpt = $("<span>",({"id":"grid_etc_btn", "class":"grid_option_btn etcOptBtn"})).on("click", function(){
									var el = $(this).parent(),
										top = el.get(0).offsetTop, 
										left = el.get(0).offsetLeft, 
										height = el.height(),
										bottom = top + height;	
									gridDiv.find(".etcOption").show().css({"left":left, "top":bottom});                                                     
								//	optBtnEtc.addClass("click");
								});
								
								optBtnEtc.append(etcOpt);
								gridOptions.append(optBtnEtc);
								
								gridOptions.append(gridObj.gridEtcOption.apply(optBtnEtc, [gridDefOpt.option.etcOption])); 
							})();
							
						}
						// search
						if(gridDefOpt.option.search){
							gridOptRight.append(gridObj.madeSearch());					
						}
						// unit selectbox 
						if(gridDefOpt.option.unit.use && gridDefOpt.option.unit.select){
							gridOptRight.append(gridObj.gridUnit());			
						}
						
						// option area append
						gridOptions.append(gridOptRight);
						
					}else{
						gridOptions.style.height = "0px"
					}
					
					return gridOptions;
				}, 
				gridHead : function(json){
					let hd_div = document.createElement('div'), 
						hd_tbl = document.createElement('table'),
						colgrp = document.createElement('colgroup'),
						hd_thead = document.createElement('thead'),
						hd_tr = document.createElement('tr'), 
						hd_sub_tr = document.createElement('tr'),
						hd_sub_sub_tr = document.createElement('tr'),
						thClass;
					hd_div.setAttribute("class", "fui_grid_head");
					
					for(var i=0, len=column.length; i<len; i+=1){	
						
						/* 일반 컬럼, 
						 * 최상위 컬럼 
						 * */
						if(!column[i].unused && column[i].caption){
							let col = document.createElement('col');
							let th = document.createElement('th');
							let field = column[i].field;
							let captions = column[i].caption,
								caption, captionDiv;
							
							if(column[i].clas){
								thClass = column[i].clas;
							}else{
								thClass = captions;
							}
							th.setAttribute("class", thClass);
							
							captionDiv = document.createElement('div');
							//element object
							if(typeof captions === "object"){
								if(captions.type = "checkbox"){
									captions.addEventListener("click", function(){
										var ta = gridDiv.children(".fleta_grid").children('.fui_grid_body').children("table");
										if(captions.checked){
											ta.find("input:checkbox").prop("checked",true);
										}else{
											ta.find("input:checkbox").prop("checked",false);
										}
									});
								}else if($(captions).is("select")){
									var $obj = $(captions),
										objNm = $obj.attr("name");
									if(objNm){
										var objInp = $("<input>",({"type":"hidden","name":objNm,"value":obj.val()})).appendTo(gridDiv.children("form"));
										$obj.on("change", function(){
											objInp.val($(this).val());
											gridObj.madeAjaxGrid();
										});
									}
								}
								captionDiv.append(captions);
							}else{
								caption = gridObj.madeLanguage.langCaption(captions);
								captionDiv.innerHTML = caption;
							}
							
							
							th.append(captionDiv);
							
							/* 서브 컬럼이 존재 할때 
							 * 상위 컬럼의 colspan 설정때문에 필요. 
							 * */
							if(!column[i].unused && column[i].sub){
								var sub_len;
								
								// 특별한 스트링으로 넘어왔을때 (switch).
								if(typeof column[i].sub === "string"){
									try {
										var key = column[i].sub;
										var obj;
										
										if(is_array(json)){
											obj = json[0][key];
										}else{
											obj = json[key];
										}
										sub_len = obj.length;
									} catch (e) {
										// TODO: handle exception
										console.log(e);
									}
								}else{
									// 서브컬럼이 object(array)로 넘어왔을때
									sub_len = column[i].sub.length;
									
									// 서브의 서브가 있을때
									var sub_sub_len = 0,
										sub_sub = column[i].sub;
									
									for(var s=0; s<sub_len; s++){
										if(sub_sub[s].sub){
											sub_sub_len += sub_sub[s].sub.length - 1;
										}
										if(sub_sub[s].unused){
											sub_sub_len -= 1;
										}
									}
									sub_len += sub_sub_len;
								}
								 
								th.attr({"colspan":sub_len});
								
							}else{
								th.setAttribute("rowspan","3");
								th.setAttribute("col",i)
								th.append(captionDiv);
								
								if(column[i].name){
									gridObj.madeSort(captionDiv, column[i].name);
								}
								if(captions){ // 언어 json에 공백값이면 사용하지 않음.
									col.style.width = column[i].size + "px";
									col.setAttribute("class", thClass);
									colgrp.append(col);
								}
							}		
							if(captions){ // 언어 json에 공백값이면 사용하지 않음.
								hd_tr.append(th);
							}
							
							if(i == 0 ){
								th.style.borderLeft = "none";
							}
							if(i == COL_SIZE){
								th.style.borderRight = "none";
							}
						}
						
						/* 서브 컬럼이 존재 할때 */
						if(!column[i].unused && column[i].sub){
							var  sub_column = column[i].sub
								,sub_len;
							
							// 특별한 스트링으로 넘어왔을때 (switch).
							if(typeof column[i].sub === "string"){
								try {
									var key = column[i].sub;
									var obj;
									if(is_array(json)){
										obj = json[0][key];
									}else{
										obj = json[key];
									}
									sub_len = obj.length;
								} catch (e) {
									console.log(e);
								}
								
								for(var j=0; j<sub_len; j+=1){	
									if(obj[j]){
										var sub_td = $('<th>'),
											sub_col = $('<col>'),
											sub_caption = obj[j],
											captionTxt;
										
										if(typeof sub_caption === "object"){
											sub_caption = Object.keys(sub_caption)[0];
										}
										
										captionTxt = $('<div>').html(sub_caption);
										sub_td.append(captionTxt); //.attr("title",sub_caption.replace("<br/>", " "));
										
										if(column[i].clas){
											thClass = column[i].clas+"_"+j;
										}
										sub_col.addClass(thClass);
										sub_td.addClass(thClass);
										
										hd_sub_tr.append(sub_td);
										colgrp.width(column[i].size).append(sub_col);
									}
									
								}
							// 일반적인 서브 컬럼
							}else{
								sub_column = column[i].sub;
								sub_len = sub_column.length;
															
								for(var j=0; j<sub_len; j+=1){	
									if(!sub_column[j].unused && sub_column[j].caption){
										var sub_td = $('<th>'),
											sub_col = $('<col>'),
											sub_field = sub_column[j].field;	
										
										var subCaptions = sub_column[j].caption,
											sub_caption = subCaptions.split("[")[0],
											sub_class;

										sub_caption = gridObj.madeLanguage.langCaption(subCaptions);
																				
										if(column[i].clas){
											thClass = column[i].clas;
										}
										sub_class = thClass + "-" + j;
										sub_td.addClass(sub_class);
										sub_col.width(sub_column[j].size).addClass(sub_class);
										//	jquery element object
										if(typeof sub_caption === "object"){
	
										}else{	
											var captionTxt = $('<div>').html(sub_caption);
											sub_td.append(captionTxt); //.attr("title",sub_caption.replace("<br/>", " ").replace("<em>","").replace("</em>",""));
											
											if(sub_column[j].name){
												gridObj.madeSort(captionTxt, sub_column[j].name);
											}
										}
										
										// 서브의 서브가 있을때
										var ssub_len;
										if(sub_column[j].sub){
											var ssub_colum = sub_column[j].sub;
											ssub_len = ssub_colum.length;
											sub_td.attr({"colspan":ssub_len});
											
											for(var s=0; s<ssub_len; s+=1){
												var ssub_td = $('<th>'),
													ssub_col = $('<col>').addClass(sub_class);
												var ssubCaptions = ssub_colum[s].caption,
													ssub_caption = ssubCaptions.split("[")[0];
	
												ssub_caption = gridObj.madeLanguage.langCaption(ssubCaptions);
												
												var scaptionTxt = $('<div>').html(ssub_caption);
												ssub_td.append(scaptionTxt); //.attr("title",ssub_caption.replace("<br/>", " ").replace("<em>","").replace("</em>",""));
												
												if(ssub_colum[s].name){
													gridObj.madeSort(scaptionTxt, ssub_colum[s].name);
												}
												hd_sub_sub_tr.append(ssub_td);
												
												if(s > 0){
													colgrp.append(ssub_col);
												}
											}
										}else{
											sub_td.attr({"rowspan":"2"});
										}
	
										if(gridDefOpt.height === "none" || gridDefOpt.height == 0){
											if( i+j == len-1){
												sub_td.addClass("last");
											}
										}
										
										if(sub_caption){ // 언어 json에 공백값이면 사용하지 않음.
											hd_sub_tr.append(sub_td);
											colgrp.append(sub_col);											
										}
									}
									
								}
								/* sub for */
								
							}
							
						}
						/* sub column end */
					}		
					if(gridDefOpt.height === "auto" || gridDefOpt.height === "dash" || gridDefOpt.height > 0){
						let lastCol = document.createElement("col");
						let lastTh = document.createElement("th");
						
						lastCol.setAttribute("class", "last");
						lastCol.style.width = "18px";
						
						lastTh.setAttribute("class", "last");
						lastTh.setAttribute("rowspan", "3");
						
						hd_tr.append(lastTh);
						colgrp.append(lastCol);
					}
					
					hd_thead.append(hd_tr, hd_sub_tr, hd_sub_sub_tr);
					hd_tbl.append(colgrp, hd_thead);
					hd_div.append(hd_tbl);
					return hd_div;
				},
				gridNoBody : function(){	
					let bd_div = document.createElement("div");
					bd_div.setAttribute("class","fui_grid_body no_data");
					bd_div.innerText = "No Data";
					return bd_div;
				},
				gridErrorBody : function(){	
					let bd_div = document.createElement("div");
					let err_div = document.createElement("div");
					bd_div.setAttribute("class","fui_grid_body error_data");
					err_div.innerText = "Error!";
					bd_div.append(err_div);
					return bd_div;
				},
				gridBody : function(json){	
					let frm = gridDiv.children("form").get(0);
					let bd_div = document.createElement("div"),
						bd_tbl = document.createElement('table'),
						colgrp = document.createElement('colgroup'),
						bd_tbody = document.createElement('tbody');
					
					let	unit = frm.unit.value,
						pageNo = frm.pageNo.value,
						listCnt = getCookie("fletaListSize") || frm.listCnt.value,
						clas, subNum = 0, ssubNum = 0;
					
					bd_div.setAttribute("class","fui_grid_body");
					gridObj = this; // fGrid 참조
						
					var colClas;
					for(var i=0; i<COL_SIZE; i+=1){
						
						if(typeof column[i].sub === "object"){
							var sub_column = column[i].sub,
								sub_len = sub_column.length,
								sub_class, ssub_class;
							
							for(var j=0; j<sub_len; j+=1){	
								var sub_caption = gridObj.madeLanguage.langCaption(sub_column[j].caption);
								if(!sub_column[j].unused && sub_caption){
									var sub_col =  document.createElement('col');	
									sub_class = column[i].clas + "-" + j;
									if(column[i].clas){
										sub_col.style.width =  sub_column[j].size + "px";
										sub_col.setAttribute("class", sub_class);
									}else{
										console.log("sub column no class value.");
									}
									
								}
							}
						}else{
							// normal 
							var useCaption = gridObj.madeLanguage.langCaption(column[i].caption);
							if(!column[i].unused && useCaption){
								var col = document.createElement('col');
								colClas = column[i].clas || column[i].caption;
								col.style.width =  column[i].size + "px";
								col.setAttribute("class", colClas);
								colgrp.append(col);
							}
						}						
					}
					// cols set end
					
					if(gridDefOpt.height === "auto" || gridDefOpt.height > 0){
						var col = document.createElement('col');
						col.style.width = "0px";
						col.setAttribute("class", "last");
						colgrp.append(col);
					}
					
					json = specialCharConvJson(json);
					//data loop
					for(let idx=0; idx<json.length; idx++){
						var $this = json[idx];
						var bd_tr = document.createElement('tr');
						var fieldClass;
						
						for(var i=0, u=0, w=0; i<COL_SIZE; i+=1){
							var titleStr;
							let bd_td = document.createElement('td'), 
								spn = document.createElement('span'),
								val = null, convVal, columnUse = false,
								field = column[i].field,
								subColumn, ssubColumn;
							
							spn.style.display = "block";
							
							// 컬럼 사용 체크
							// caption 키가 있을경우.
							if(column[i].caption){   
								if(gridObj.madeLanguage.langCaption(column[i].caption)){ 
									// lang 값이 있을 경우 사용.
									columnUse = true;
								}else{ 
									// lang 값이 없을 경우 사용 안함.
									columnUse = false;
								}
							}else{ 
								// caption 키가 없을 경우 서브 필드로서 무조건 사용.
								columnUse = true;
							}
							
							// value 가져오기
							if(column[i].unused || !columnUse){
								u += 1; // 사용안하는 컬럼의 개수.
							}else if(!column[i].unused && columnUse){
								/* 
								 * cell에 class달기 
								 */
								// 사용 안하는 컬럼의 개수를 빼고 계산
								fieldClass = $(colgrp).children().eq(w-u).attr("class");
								bd_td.append(spn);
								bd_td.setAttribute("class", fieldClass);								
								if(i == 0 ){
									bd_td.style.borderLeft = "none";
								}
								// 사용 하는 컬럼과 비교하여 필드 생성.
								// 이 안에 반복문이 있어선 안됨
								/*for(let node of colgrp.childNodes){
									console.log(node);
									if($(this).attr('class') === fieldClass){
										columnUse = true;
									}
								};*/
								columnUse = true;
								if(field){ // 일반적인
									var parseReg  = /(?:[\-|\+|\*|\/])/g,
										parseStr  = /(?:[^\-|\+|\*|\/]+)/g;
									// field가 배열일 경우
									if(is_array(field)){	
										val = [];
										for(let f of field){
											if(typeof f === "object"){ // 배열안에 element 객체일 경우.
												var ele = f.cloneNode(true);
												var eleVal = specialCharConv($this[ele.value]);
												ele.value = eleVal;
												val.push(ele);
											}else{
												// 일반 적인 텍스트일 경우..
												if(f.indexOf("[") > -1){
													var fnm = f.split("[")[0];
													var fid = f.split("[")[1].replace("]","");
													
													val = $this[fnm].split(",")[fid];
												}
											}
										}
									}else if(parseReg.test(field)){
										var opt = field.match(parseReg),
											fields = field.match(parseStr);
										val = Number($this[fields[0].trim()]);
										for(var g=1; g<fields.length; g++){
											var sign = opt[g-1];
											var val2 = $this[fields[g].trim()];
											val = eval(Number(val)+sign+Number(val2));
										}
									//	val = eval(Number(val1)+sign+Number(val2));
									}else{
										val = $this[column[i].field];	
										if(typeof val === 'string'){
											val = specialCharConv(val);
											val = val.trim();
										}
										titleStr = val;
									}
								}else{ // 특수한경우
									// 서브컬럼이 String or Object 으로 넘어왔을때, 서브의 스트링값으로 json에서 찾는다.
									if(typeof column[i].sub === "string"){
										var key = column[i].sub;
										var obj;
										if(is_array(json)){
											obj = json[0][key];
										}else{
											obj = json[key];
										}
										sub_len = obj.length || 1;
										
										for(var j=0; j<sub_len; j+=1){
											if(j>0){
												w += 1;
											}
											var valStr = obj[j];
											/*
											*/
											if(valStr){
												var objVal = $this[valStr], objKey,
													objSpn = $("<span>"),
													objTd = $('<td>').append(objSpn);
												
												
												if(typeof valStr === "object"){
													objKey = Object.keys(valStr)[0];
													objVal = valStr[objKey];
												}	
												
												if(column[i].link && j==0){
													var func = column[i].link.func,
														args = column[i].link.args;	
													inherit(childLinked, gridLinked);
													var cspn = new childLinked();	
													cspn.json = $this;
													objSpn = cspn.linked(objSpn, objVal, func, args);
												}
												
												objSpn.html(objVal)
												objTd.addClass(column[i].clas);
												bd_tr.append(objTd);
											}else{
												var objSpn = $("<span>").html(""),
													objTd = $('<td>').append(objSpn);
												
												objTd.addClass(column[i].clas);
												bd_tr.append(objTd);
											}
										}
										
										val = true;
										
									}else{
										if(Number(pageNo) < 1 ){
											pageNo = 1;
										}
										val = idx + 1 + (listCnt * (pageNo-1)); // number
									}
								}
								
								/*
								 *  컬럼에 func가 있을경우.
								 */
								if(column[i].func){
									var fnm = column[i].func.name, 
										args = column[i].func.args, 
										rtun = column[i].func.rtun,
										fag = [];
									if(args){
										if(typeof args === "object"){
											for(var a=0; a<args.length; a=a+1){
												var colVal;
												if(!$this.hasOwnProperty(args[a])){
													if(a==0){
														colVal = "";														
													}else{
														colVal = args[a];	
													}
												}else{
													colVal = $this[args[a]];
												}
												fag.push(colVal);
											}
										}else{
											var colVal;
											if(typeof $this[args] === "undefined"){
												colVal = "";
											}else{
												colVal = $this[args];
											}
											fag.push(colVal);
										}
										
									}
									if(rtun || typeof rtun == "undefined"){
										val = eval(fnm).apply(bd_td, fag);
									}else{
										eval(fnm).apply(null, fag);
									}
								}
								
								/*
								 *  컬럼에 링크가 있을경우.
								 */
								if(column[i].link){
									var func, args, terms, 
										booLink = true;
									func = column[i].link.func || column[i].link;
									if(column[i].link.args)	{
										args = column[i].link.args;	
									}
									// 링크를 거는데 조건이 있을경우.
									if(column[i].link.terms){
										terms = column[i].link.terms;
										for(var t=0; t<terms.length; t=t+1){
											if(eval(terms[t])){
												booLink = true;
											}else{
												booLink = false;
											}
										}
									}else{
										// 0이면 링크 없음
										if(val === 0 || val === "0" || !val || val === "NOT INS."){
											booLink = false;
										}									
									}
									if(booLink){
										inherit(childLinked, gridLinked);
										var cspn = new childLinked();
										cspn.json = $this;
										spn = cspn.linked(spn, val, func, args);				
									}
								} // link end 
								
								//background
								if(typeof column[i].bgcolor != "undefined"){
									var bgcolor = column[i].bgcolor;
									bd_td.style.backgroundColor = bgcolor;
									
								}
								// align
								if(typeof column[i].align != "undefined"){
									var aign = column[i].align;
									bd_td.style.textAlign = aign;
									spn.style.display = "inline-block";
									if(aign === "left"){
										spn.style.marginLeft = "4px";
									}else if(aign === "right"){
										spn.style.marginRight = "4px";
									}
								}
							
								// unit gridDefOpt
								if(gridDefOpt.option.unit.use){
									var unitVal;
									
									if(typeof column[i].unit != "undefined"){
										unitVal =  column[i].unit;
									}else{
										if(unit === ""){
											unitVal = gridDefOpt.option.unit.basic || gridDefOpt.option.unit.type[0];
										}else{
											unitVal = unit;
										}
									}	
									
									if(unitVal != ""){
										var func = gridDefOpt.option.unit.func;
										if(typeof val === "object"){
											bd_td.style.textAlign = "right";
											$(val).children().each(function(){
												var tispn = $(this);
												var uv = tispn.text();
												uv = func.apply(null,[uv, unitVal]);
												tispn.text(uv);
											//	tispn.attr({"title" : uv+unitVal});
											});									
										}else{
											
											convVal = func.apply(null,[val, unitVal]);
											if(unitVal === "TB" || unitVal === "GB" || unitVal === "MB"){
												bd_td.style.textAlign = "right";
												spn.style.display = "inline-block";
												spn.style.marginRight = "4px";
												titleStr = convVal + unitVal;
												val = convVal;
											}else if(unitVal === "bar"){
												bd_td.setAttribute("class", "sum avg");
												
												var color = barColor(convVal),
													perWidth = 0;
												
												if(convVal > 100 ){
													perWidth = 100;
												}else{
													perWidth = convVal;
												}
												if(convVal >= 60){
													spn.style.color = "#fff";
												}
												
												spn.style.display = 'block';
												spn.style.width = perWidth+'%';
												spn.style.background = color;
												
												val = Math.round(convVal);
												titleStr = val + "%";
											}else if(unitVal === "%"){
												val = Math.round(convVal);
												if(val >= 90){
													spn.style.color = "#db600e";
													spn.style.fontWeight = "bold";
												}
												val += "%";
												titleStr = val;
												bd_td.setAttribute("class", "avg");
											}else if(unitVal === "date" || unitVal === ","){
												titleStr = val;
												val = convVal;
											}else {
												gridObj.addClass.sum(bd_td);	
												titleStr = val + unitVal;
											}
											
											
										}
									}
									
								}// unit setting end
								
								if(is_array(val)){
									for(let v of val){
										spn.append(v);
									}
								}else if(typeof val === "undefined"){
								
								}else{
									spn.append(val);
								}
								bd_td.setAttribute("title", titleStr);

								if(field || typeof column[i].sub !== "string"){
									bd_tr.append(bd_td);
								}
							}// columnUse true
							
							w += 1;
						} // for end
						
						let lastTd = document.createElement("td");
						lastTd.setAttribute("class", "last");
						bd_tr.append(lastTd);
						
						bd_tbody.append(bd_tr);
						
					};
					//json for end
					
					if(tally.total.use){
						if(tally.total.type === "json"){
							gridObj.sum.madeTotal(bd_tbody);																	
						}else if(tally.total.type === "table"){
							
						}else{
							gridObj.sum.allTotal(bd_tbody);
						}
					}
					if(tally.sub.use){		
						gridObj.sum.subTotal(bd_tbody);	
					}
	
					bd_tbl.append(colgrp,bd_tbody);
					bd_div.append(bd_tbl);
					
					return bd_div;
				},
				gridFooter : function(allListCnt) {
					var gridFooter = $('<div>').addClass("fui_grid_footer");
					// paging
					if(gridDefOpt.paging.use){
						gridDefOpt.paging.totalSize = allListCnt;
						gridFooter.append(gridObj.paging());
						gridFooter.append(gridObj.madeListCntBox());
					}
					// etc Objects - button
					if(gridDefOpt.footer.length > 0){
						var footerObj = gridDefOpt.footer;
						var buttonArea = $('<div>',({"id":"buttonArea"}));
						$(footerObj).each(function(i){
							var obj = $(this);
							buttonArea.append(obj);
						});
						gridFooter.append(buttonArea);
					}
					return gridFooter.get(0);
				},
				madeLanguage : {
					langCaption : function(data){
						var langJson = fui.lang.json;
						var key, caption, elm;
						if(typeof data != "object"){
							if(data){
								key = data.split(":")[0];
								elm = data.split(":")[1];
							}
							
							if(langJson != null && typeof langJson[key] != "undefined"){
								caption = langJson[key];
								if(elm){
									if(elm === "br"){
										caption = caption.replaceAll("<br/>", " ");
									}else if(elm.indexOf("<em>") > -1){
										caption += " "+elm;
									}
								}else if(typeof caption === "object"){
									caption = data;
								}
							}else{
								caption = key;
							}
						}else{
							caption = data;
						}
						return caption;
					}
				},
				madeSearch : function() {
					let frm = gridDiv.children("form").get(0);
					let searchBox = document.createElement("div");
					let input = document.createElement("input");
					let label = document.createElement("span");
					
					searchBox.setAttribute("class", "gridOptUnits search");
					input.setAttribute("id", gridDiv.attr("id")+"_search");
					input.setAttribute("type", "text");
					input.setAttribute("class", "fui_form");
					
					input.addEventListener("keydown", function(event){
						if (event.keyCode == 13 || event.which == 13) {
							var val = $(this).val();
							if(!checkString(val)){
								alert("사용할 수 없는 문자가 포함되어 있습니다.");
							}else{
								searchSubmit(val); 
							}
							return false;
						  }
						event.stopPropagation();
					});
					label.addEventListener("click",function(){
						if(!checkString(input.val())){
							alert("사용할 수 없는 문자가 포함되어 있습니다.");
						}else{
							frm.searchWord.value = input.value;
							searchSubmit(input.val());
						}
					});
					
					function searchSubmit(val){
						var searchArr = [];
						if(val){
							for(var i=0, len=column.length; i<len; i+=1){
								var cols = column[i];
								if(cols.name && !cols.unit){
									var cnm = cols.name;
									searchArr.push("lower("+cnm + ")~lower('"+val+"')");
								}
							}
						}
						frm.searchWord.value = searchArr;
						frm.pageNo.value = 1;
						gridObj.madeAjaxGrid();
						if(gridDefOpt.subGrid != null && gridDefOpt.subGrid.search){
							eval(gridDefOpt.subGrid.search).apply(null, [val]);
						}
					}
					
					searchBox.append(input, label);
					return searchBox;
				},
				gridUnit : function() {
					gridDefOpt.option.unit.basic = getCookie("fletaUnit") || gridDefOpt.option.unit.type[0];
					var unitbox = $("<div>").addClass("gridOptUnits");
					var select = $("<select>",({"class":"fui_form gridUnit"})).on("change", function(){
						var frm = gridDiv.children("form"),
							unitVal =  this.value;
						document.cookie = "fletaUnit="+unitVal+";path="+uriPath[0];
						gridDefOpt.option.unit.basic = unitVal;
						frm.get(0).unit.value = unitVal;
						gridObj.madeAjaxGrid();
						if(gridDefOpt.subGrid && gridDefOpt.subGrid.unit){
							eval(gridDefOpt.subGrid.unit).apply(null, [unitVal]);
						}
						
					}).css("margin-left",5);
					for(var i = 0, len = gridDefOpt.option.unit.type.length; i < len; i += 1){
						var opt = $("<option>").val(gridDefOpt.option.unit.type[i]).text(gridDefOpt.option.unit.type[i]);
						if(gridDefOpt.option.unit.type[i] === gridDefOpt.option.unit.basic){
							opt.attr("selected", "selected");
						}
						select.append(opt);
					}
					unitbox.html([select]);
					return unitbox;
				},
				madeListCntBox : function() {
					var frm = gridDiv.children("form"),
						cnt = 20,
						fls = getCookie("fletaListSize");
					var listCntBox = $("<select>",({"class":"fui_form"}))
						.on("change", function(){
							let val = $(this).val();
							frm.get(0).pageNo.value = 1;
							frm.get(0).listCnt.value = val;
							gridPage = 1;
							gridListSize = val;
							gridObj.madeAjaxGrid(1);
							document.cookie = "fletaListSize="+gridListSize+";path="+uriPath[0];
						});
					frm.get(0).listCnt.value = getCookie("fletaListSize") || cnt;
					for(var i = 1; i <= 5; i += 1){
						var opt = $("<option>").val(cnt*i).text(cnt*i);
						if(fls == cnt*i){
							opt.attr("selected","selected");
						}
						listCntBox.append(opt);
					}					
					return listCntBox;
				},
				// checkbox for column hidden  
				gridHiddenColumn : null,
				gridColumnHide : function(type){
					if(gridDefOpt.option.use && gridDefOpt.option.columnHide){
						var setData = gridDefOpt.data,
							mid = setData.menuId,
							gnm = setData.menuNm;
						
						$.ajax({
							async : false,
							url : uri+'/user/getColumnHide.do',
							type : "POST",
							data : {
								"mid" : mid,
								"gnm" : gnm
							},
							dataType : "json",
							success : function(data){
								if(data){
									if(data.columns){
										var colm = (data.columns).split(',');
										for(var i=0; i<colm.length; i++) {
											var clas = colm[i];
											var parseReg  = /\-/; 
											
											if(parseReg.test(clas)){
												if(type === "first"){
													var prntCls = clas.split("-")[0],
														prntEl = $("th."+prntCls),
														prntCol = Number(prntEl.attr("colspan"));
													prntEl.attr("colspan", prntCol-1);
												}
												$('.'+clas).hide();
											}else{
												$('[class*='+clas+']').hide();
											}
										}									
										gridObj.gridHiddenColumn = data.columns;
									}
								}
								
							},
							error : function(){
								alert("get column hide error");
								fui.loadingRemove($gridArea);
							}
						});
					}
				},
				gridColumnOption : function(){
					var btnEl = $(this),
						mid = gridDefOpt.data.menuId,
						gnm = gridDefOpt.data.menuNm,
						frm = gridDiv.children("form").get(0);
					return ({
						init : function(){
							if($(".columnOption").length > 0){
								$(".columnOption").show();
							}else{
								var optDiv = $("<div>").addClass("se_select se_avaliable columnOption");
								var offset = btnEl.offset(),
								top = offset.top, 
								left = offset.left, 
								width = btnEl.get(0).offsetWidth,
								height = btnEl.get(0).offsetHeight,
								bottom = top + height;	
								
								var divBox = this.selectCheckMade();
								
								optDiv.append(divBox);				
								optDiv.css("min-width",width+"px");
								
								if(btnEl.hasClass("right")){
									left = left - (divBox.width() - width);
								}
								optDiv.css({"left" : left, "top" : bottom});		
								
								$('body').append(optDiv);
							}
								
						},
						selectCheckMade : function(){
							var selBox = $("<div>").addClass("selBox columnOpt");
							
							for(var i=0, len=column.length; i<len; i+=1){
								if(!column[i].unused && column[i].caption){
									var opt = $("<div>").addClass("optBox").css("padding-right","10px");
									var checkVal,
										caption = column[i].caption;

									if(typeof caption == "object"){
										caption = column[i].clas;
									}
									
									if(column[i].clas){
										checkVal = column[i].clas;
									}else{
										checkVal = caption;
									}
									
									
									caption = gridObj.madeLanguage.langCaption(caption);
									if(caption && typeof caption != "undefined"){
										caption = caption.replaceAll("<br/>", " ");
									}
									
									var cchk = $("<div>").addClass("fui_check").css({"height":"22px","margin-right":"10px"}),
										cb = $("<input>", {"type":"checkbox", "value":checkVal}).addClass("columnCheckbox"),
										lb = $("<label>",{"for":"", "class":"transparency_check"});
									
									var hiddenCol = gridObj.gridHiddenColumn;
									if(hiddenCol){
										var colArr = hiddenCol.split(',');
										if(colArr.indexOf(checkVal) > -1){
											opt.addClass("selected");
										}else{
											cb.prop("checked",true).attr("checked",true);
										}
									}else{
										cb.prop("checked",true).attr("checked",true);
									}
									
									cchk.append([cb, lb]);
									
									opt.on("click", function(e){
										var optRow = $(this);
										optRow.toggleClass("selected");
										var chkbox = optRow.find(".columnCheckbox");
										var clss = chkbox.val();
										var container = btnEl.parents('.fleta_grid')[0];
										
										if(chkbox.prop("checked")){
											$(container).find('[class*='+clss+']:not(li)').hide();
											chkbox.prop("checked",false).attr("checked",false);
										}else{
											$(container).find('[class*='+clss+']:not(li)').show();
											chkbox.prop("checked",true).attr("checked",true);
										}
										
										gridHeight.apply(container);
										
										var columnStr = '';
										
										$(".columnOpt").find(".columnCheckbox:not(:checked)").each(function(i){
											if(i > 0){
												columnStr += ",";
											}
											columnStr += $(this).val();
										});
										
										if(mid){
											$.ajax({
												url : uri+'/user/setColumnHide.do',
												type : "POST",
												data : {
													"mid" : mid,
													"gnm" : gnm,
													"columns" : columnStr
												},
												dataType : "json",
												success : function(data){
													console.log("success");
												},
												error : function(){
													alert("column hide error");
													fui.loadingRemove($gridArea);
												}
											});
										}
									
									});
									
									if(caption){ // 언어 json에 공백값이면 사용하지 않음.
										opt.append([cchk, caption]);
										selBox.append(opt);							
									}
									
								}
							}
							
							return selBox;
							
						}
					}).init();
				},
				gridEtcOption : function(objects){
					var frm = gridDiv.children("form").get(0);
					var container,
						area = $("<div>").addClass("etcOption"),
						ul = $("<ul>");
						
					objects.forEach(function(val,i){
						var	title = val.title,
							obj = val.object,
							id = val.id;
						var li =  $("<li>"),
							span = $("<span>"),
							div = $("<div>",({"class":"fui_check"})),
							label = $("<label>",({"for":id, "class":"white_check"}));
						div.append([obj, label])
						
						span.text(title);
						li.append([span, div]);
						ul.append(li);
					});
					area.append(ul);
					return area;
				},
				madeSort : function(caption, nm){
					let span = document.createElement("span");
					span.setAttribute("id", nm);
					span.setAttribute("class", "sort asc hide");
					
					caption.parentElement.append(span);
				},
				activSort : function(){
					var sort = $(this).find(".sort");
					var frm = gridDiv.children("form");
					var typ = " asc";
					var shift = false;
					
					try {
						var sortVal = gridDefOpt.data.orderCol;
						sort.each(function(i){
							var that = $(this);
							var sort_id = that.attr("id");
							var idx = sortVal.toLowerCase().indexOf(sort_id.toLowerCase());
							if(idx > -1){
								that.removeClass("hide");
								var desc = sortVal.substr(idx+sort_id.length+1,4);
								if(desc.toUpperCase() === "DESC"){
									that.removeClass("asc");
									that.addClass("desc");
								}
							}
						});
					} catch (e) {
						// TODO: handle exception
					}
					
					$('body').on("keydown", function(event){ 
						if(event.keyCode === 16){
							shift = true;
							$('body').on("selectstart",function(){
								return false;
							});
						}
					}).on("keyup",function(){
						shift = false;
						$('body').on("dragstart",function(){
							return true;
						});
					});
					
					// sort click
					sort.prev().click(function(){					
						var order = "";
						var $sort = $(this).next(".sort");
						var orderCol;
						if($sort.is(".asc")){
							$sort.removeClass("asc").addClass("desc");
							typ = " desc";
						}else{
							$sort.removeClass("desc").addClass("asc");
							typ = " asc";
						}
						
						
						var orderCol = $sort.attr("id") + typ;

						if(shift){
							document.onselectstart = function(){
								return false;
							};
							$sort.show();
							$sort.removeClass("hide");
							var orderVal = frm.get(0).orderCol.value.toLowerCase();
							var dupl = false;
							var orderArr = orderVal.split(",");
							for(var i=0; i<orderArr.length; i=i+1){
								if(orderArr[i].split(" ")[0] === $sort.attr("id").toLowerCase()){
									orderArr.splice(i,1,orderCol);
									dupl = true;
								}	
							}
							if(!dupl){
								orderArr.push(orderCol);
							}	
							
							for(var i=0; i<orderArr.length; i=i+1){
								if(i !== 0){
									order += ",";
								}
								order += orderArr[i]; 
							}
						}else{
							$(".sort").hide();
							order = orderCol;	
							$sort.show();
							$sort.removeClass("hide");
						}
						  
						// sort된 data 가져와 다시 그리기 
						frm.get(0).orderCol.value = order;
						gridObj.madeAjaxGrid();
						
					}).css("cursor","pointer");
					
				},
				
				addClass : {
						sum : function (td) {				
							// 집계를 위한 클래스를 적용한다.
							var idx = tally.sub.index > 0 ? tally.sub.index : tally.total.index;
							if(idx < $(td).index()){ //그 인덱스 보다 크면 집계에 포함.
								$(td).addClass("sum");
							}
						},
						avg : function (td, val) {				
							var per = parseInt(val)/100
							$(td).addClass("sum avg")
								.children('span').css({
									'display':'block',
									'width':'100%'
								});
							if(per > 0){
								$(td).css("background", "rgba(237, 155, 47, "+per+")");
								if(per > 0.60){
								//	$(td).css("color", "#fff");
								}
							}
						}
				},
				match_idx : function (type) {
					var idx;
					for(var i=0; i<COL_SIZE; i+=1){
						if(column[i][type]){
							idx = i;					//옵션이 적용되는 컬럼의 인덱스
						}
					}
					return idx;
				},
				margeRows : function () {
					var tbod = gridDiv.find('tbody').get(0),
						rIdx = 0, 
						fstV, curV, 
						fstTd, curTd,
						rowspanInfo = [];
					try {
						for(var i=0; i<COL_SIZE; i+=1){
							var rowspnCnt = 0, rowspanCntArr = [], rowspanIdx = 0, rspSum = 0;
							fstV;
							if(column[i]["rowspan"]){
								
								for(var r=0, len=tbod.rows.length; r<len; r+=1){
									var rowFirstColspan = 0, colspanCnt = 0;
									var rowspanTd = $(tbod.rows[r].cells[i]);
									
									if(fstV != "" && !fstV){
										fstTd = rowspanTd;
										fstV = fstTd.children('span').text().trim();
									}
									curTd = rowspanTd;
									curV = curTd.children('span').text().trim();

									if(fstV === curV){
										rowspnCnt += 1;
										
										if(i>0){
											if(rowspanInfo[i-1][rowspanIdx] < rowspnCnt + rspSum){
												rowspanCntArr.push(rowspnCnt-1);
												rowspnCnt = 1;
												fstTd = curTd; 
												rowspanIdx ++;
												rspSum = 0;
											}
										}
										
										if(rowspnCnt > 1){
											fstTd.get(0).rowSpan = rowspnCnt;
											curTd.addClass("rowspan").hide();
										}
										
										if(r==len-1){
											rowspanCntArr.push(rowspnCnt);
										}
									}else{
										rowspanCntArr.push(rowspnCnt);
										rspSum += rowspnCnt;
										if(i>0 && rowspanInfo[i-1][rowspanIdx] <= rspSum){
											rowspanIdx ++;
											rspSum = 0;
										}
										
										fstV = curV;
										rowspnCnt = 1;
										fstTd = curTd; 
									}
									
								if(gridDefOpt.option.callback.rowspan){
									gridDefOpt.option.callback.rowspan(curV, curTd);
								}
				
									
								} // row loof
								rowspanInfo.push(rowspanCntArr);	
							}
						} // column loof
					} catch (e) {
						console.log(e);
					}
					
				},
				sum : {
					//소계 
					subTotal : function (tbod) {
						var tbod = tbod[0],
							preV = [], curV = [], 
							fChk = false, bfr_chk = true;
							memo = [],
							totIdx = tally.sub.index,
							spanCnt = tally.sub.colspan;
						
						for(var r=0, tlen=tbod.rows.length ; r<tlen; r+=1){
							var preTr;
							var $tr = $('<tr>');
	
							for(var c=0; c<COL_SIZE; c+=1){
								
								if(c === totIdx-1){ //subTotal이 적용된 셀의 index 
									curV[c] = tbod.rows[r].cells[c].innerHTML;
									if(preV[c] === curV[c]){
										fChk = true;
									}else{
										preV[c] = curV[c];
										if(r>0){
											fChk = false;
										}
									}
									if(!fChk || !bfr_chk){
										preTr = tbod.rows[r-1];
										$tr = $(preTr).clone();
										$tr.addClass("subTotalRow");
										$tr.children("td:eq("+totIdx+")").attr("colspan",spanCnt).html($('<span>').text(tally.sub.text).attr("title",tally.sub.text)).removeClass();
										for(var k=0; k<spanCnt-1; k++){
											$tr.children("td:eq("+(totIdx+k)+")").next().css("display","none");
										}
										$tr.children("td:gt("+(totIdx+spanCnt -1 )+")").removeClass("sum").addClass("subtotal");
										memo.push([preTr, $tr]);
									}	
								}else if(c < totIdx){
									curV[c] = tbod.rows[r].cells[c].innerHTML;
									if(preV[c] !== curV[c]){
										preV[c] = curV[c];
										bfr_chk = false;
									}else{
										bfr_chk = true;
									}
								}
								
							}
						}
						
						for(var i=0; i<memo.length; i+=1){
							var preTr = memo[i][0];
							if(preTr && !$(preTr.firstChild).hasClass("firstTr")){
								$(preTr).after(memo[i][1]);								
							}
						}	
					},
					//총계 
					allTotal : function (tbod) {
						var fieldClass,
							$tr = $('<tr>').addClass("totalRow"),
							idx = tally.total.index + tally.total.colspan;
						
						for(var i=0; i<COL_SIZE; i+=1){
							// cell에 class달기
							if(column[i].caption){
								fieldClass = column[i].field;
							}
							$(".columnCheckbox:not(:checked)").each(function(){
								if(fieldClass.indexOf($(this).val()) > -1){
									fieldClass += " hidden";
								}
							});
							var ttd = $("<td>").addClass(fieldClass + " total");
							if(i==0){
								ttd.css("border-left","none");
							}
							$tr.append(ttd);
						}
						$tr.children("td:eq(0)").attr("colspan",idx).html($('<span>').text(tally.total.text)).removeClass();
						for(var i=1; i<idx; i+=1){
							$tr.children("td:eq("+i+")").remove();
						}
						
						if(gridDefOpt.height === "auto" || gridDefOpt.height > 0){
							$tr.append($("<td>").css("border-right","none"));
						}
						$tr.children("td").last().css("border-right","none");
						$(tbod).append($tr);				
					},
					tally : function (selector) {
						gridDiv.find(selector).each(function () {
							var td = $(this),
								total = 0, 
								n = 0, // 숫자가 아닌 값들의 합은 count로 계산하기 위해 필요. 
								unit = "",
								column = td.siblings(selector).andSelf().index(this);
							
							
							if(selector.indexOf("subtotal") > -1){
								column += (tally.sub.index) + (tally.sub.colspan == 0 ? 1 : tally.sub.colspan);
							}else{
								column += tally.total.colspan;
							}
							
							var parse_number = /^-?\d+(?:\.\d*)?(?:e[+\-]?\d+)?$/i,
								parse_space = /^\s?$/i,
								parse_unit = /(\%|TB|GB|MB|EA|\,)$/;
							td.parents().prevUntil(':has(' + selector + ')', "tr").each(function () {
								// 합계 계산하기
								var sumTd = $('td:eq('+(column)+')', this);
								if(sumTd.length > 0 ){
									var sumTit = sumTd.attr("title");
									var val = sumTd.children("span").html();
									
									if(parse_unit.test(sumTit)){
										unit = sumTit.match(parse_unit)[0];
									}
									if(typeof val != "undefined"){
										val = uncomma(val);
										if(parse_number.test(val) && unit != ""){
											total = Math.round((total + parseFloat(val))*T)/T || 0 ;
										}else if(typeof Number(val) == "number"){
											total += Number(val);
										}else if(parse_space.test(val) ){
											total += "";
										}else{
											total += 1;
										}	
										
										//평균 계산에 필요.
										if($('td:eq(' + column + ')', this).hasClass("avg")){
											n += 1 ;
										}
									}
								}
							});
						
							if(n === 0){
								n=1;
							}
							if(unit != ""){
								td.css({"text-align":"right","padding-right":"4px"});
							}
							
							if(unit == "%"){
								td.css({"text-align":"center","padding-right":"0"});
								td.html(decFmt(total/n)+unit).attr("title",decFmt(total/n) + unit);	
							}else if(unit == "EA"){
								td.css({"text-align":"center","padding-right":"0"});
								td.html(decFmt(total/n)).attr("title",decFmt(total/n) + unit);	
							}else if(unit == "," || unit == "cnt"){
								td.css({"text-align":"center","padding-right":"0"});
								td.html(decFmt(total/n)).attr("title",decFmt(total/n));	
							}else if(unit == ""){
								if(typeof Number(total) == "number"){
									td.html(decFmt(total)).attr("title",decFmt(total));	
								}
							}else{
								td.html(decFmt(total/n)).attr("title",decFmt(total/n) + unit);								
							}
							
						});
					},
					madeTotal : function(tbod){
						var frm = gridDiv.children("form"),
							unit = frm.get(0).unit.value,
							fieldClass,
							$tr = $('<tr>').addClass("totalRow"),
							idx = (tally.sub.index > 0 ? tally.sub.index : tally.total.index) + 1 ;
						var totalColumn = tally.total.column,
							totalJson = tally.total.data,
							tot_col_len = totalColumn.length;
						
						for(var i=0; i<tot_col_len; i+=1){
							var $td = $('<td>').addClass("total"), 
								$sp = $('<span>'),
								val = null,
								field = totalColumn[i].field;
							
							if(i == 0 ){
								$td.css("border-left","none");
							}
							
							if(totalColumn[i].colspan){
								$td.attr("colspan", totalColumn[i].colspan);
							}
							// value 가져오기
							if(field){
								var parseReg  = /(?:\/[-|\+|\*|\/])/; 
								if(parseReg.test(field)){
									var str = field.match(parseReg)[0];
									var sign = str.replace("/","");
									var fields = field.split(str);
									var val1 = totalJson[fields[0].trim()];
									var val2 = totalJson[fields[1].trim()];
									val = eval(Number(val1)+sign+Number(val2));
								}else{
									if(!(totalJson == null || typeof totalJson == "undefined")){
										val = totalJson[totalColumn[i].field];																	
									}
								}
							}else{
								val = tally.total.text;
							}

							if(totalColumn[i].link && Number(val) !== 0){
								var func, args, terms, booLink = true;
								var totalLink = totalColumn[i].link;
								func = totalLink.func || totalLink;
								if(totalLink.args)	{
									args = totalColumn[i].link.args;	
								}
								// 링크를 거는데 조건이 있을경우.
								if(totalLink.terms){
									terms = totalLink.terms;
									for(var t=0; t<terms.length; t=t+1){
										if(eval(terms[t])){
											booLink = true;
										}else{
											booLink = false;
										}
									}
								}
								if(booLink){
									$sp.addClass("linked");
									$sp.get(0).onclick = function(func,args){
										return function (e) {
											var val = [];
											if(typeof args === "object"){
												for(var a=0; a<args.length; a=a+1){
													var colVal;
													if(totalJson[args[a]]){
														colVal = totalJson[args[a]];
													}else{
														colVal = args[a]
													}
													val.push(colVal);
												}
											}else{
												val.push(args);
											}
											eval(func).apply(null, val);										
										};
									}(func,args);									
								}
							}
							
							//background
							if(typeof totalColumn[i].bgcolor != "undefined"){
								var bgcolor = totalColumn[i].bgcolor;
								$td.css({"background-color":bgcolor});
								
							}
							// align
							if(typeof totalColumn[i].align != "undefined"){
								var aign = totalColumn[i].align;
								$td.css({"text-align":aign});
								if(aign === "left"){
									$sp.css({"display":"inline-block", "margin-left" : "4px"});
								}else if(aign === "right"){
									$sp.css({"display":"inline-block", "margin-right" : "4px"});
								}
							}
							
							// unit setting
							if(gridDefOpt.option.unit.use){
								var unitVal;
								if(typeof totalColumn[i].unit !== "undefined"){
									unitVal =  totalColumn[i].unit;
								}else{
									if(unit === ""){
										unitVal = gridDefOpt.option.unit.basic || gridDefOpt.option.unit.type[0];
									}else{
										unitVal = unit;
									}
								}									
								var func = gridDefOpt.option.unit.func; 
								val = func.apply(null,[val, unitVal]);
								if(unitVal === "TB" || unitVal === "GB" || unitVal === "MB"){
									$td.css({"text-align":"right"});
									$sp.css({"display":"inline-block", "margin-right" : "4px"});
									
								}	
								$td.attr({"title" : val + unitVal, "alt" : unitVal});
								if(unitVal === "%"){
									val += "%";
								}
							}							
							$sp.html(val);							
							// cell에 class달기
							if(column[i].caption){
								if(column[i].clas){
									fieldClass = column[i].clas;
								}else{
									fieldClass = field;
								}
							}	
							
							$td.append($sp).addClass(fieldClass);															
							$tr.append($td);						
						}
						
						$($tr.get(0).lastChild).addClass("last");
					//	$tr.children("td:eq(0)").html($('<span>').text(tally.total.text));

						$(tbod).append($tr);
					}
				},
				gridEvent : function() {
					// mouse event
					var container,
						mouseDown = false;
					var downPosX = 0;
					var thWidth, mvWidth;
					var now_target;
					var thWidthC = [];
					
					$(".fui_grid_head>table>thead>tr>th:not([colspan])").dblclick(function(){
						var clas = $(this).attr("class");
						var thWidth = $(this).width(), 
							tdWidth, maxWidth;
						container = $(this).parents('.fleta_grid')[0];
						
						tdWidth = $(container).find("."+clas).map(function(i, e){
							return $(e).children('span:last').width();
						}).get();
						maxWidth = Math.max.apply( this, tdWidth ) + 15;
						if(maxWidth > thWidth){
							$(container).find("."+clas).width(maxWidth);
						}
					});
								
					$(".fui_grid_head>table>thead>tr>th").on("mousedown", function(e){
						var curTh = $(this);
						if(!$(e.target).is('th')){
							// 컬럼명에 select 등 object의 이벤트를 위해 주석.
						//	return false;
						}
						container = curTh.parents('.fleta_grid')[0];
						
						now_target = this;
						
						if(cell_left(now_target, e)){ 
							now_target = this.parentNode.childNodes[now_target.cellIndex-1];
						}else if(cell_right(now_target, e)){
							now_target = this.parentNode.childNodes[now_target.cellIndex];
						}else if(!cell_right(now_target, e)){
							return true;
						}		
						
						mouseDown = true;
						downPosX = e.pageX;
						thWidth = $(now_target).width();
						document.onselectstart = function(){
							return false;
						};	
					}).on("mouseenter mousemove", function(e){
						var curTh = $(this);
						/*var idx = curTh.parent().index() || curTh.attr("colspan");
						if(idx > 0){
							return false;
						}*/
						var leftChk = cell_left(this, e);
						var rightChk = cell_right(this, e);
						if(leftChk || rightChk){
							curTh.css("cursor","e-resize");
						}else{
							curTh.css("cursor","default");
						}			
					});
					
					$(".fleta_grid").on("mouseup mouseleave", function(e){
						mouseDown = false;
						downPosX = 0;			
						
					}).on("mousemove", function(e){
						if(mouseDown){
							var distX = e.pageX - downPosX;
							var distW = thWidth + distX;
							var clas = $(now_target).attr("class");
							if(distW < 1){
								distW = 1;
							}
							if(distW > 5){
								
								$(container).children(".fui_grid_head").find("col[class="+clas+"]").css("width", distW+"px");
								$(container).children(".fui_grid_body").find("col[class="+clas+"]").css("width", distW+"px");
							}
							
						}else{
							document.onselectstart = function(){
								return true;
							};	
						}
					});		
					
					var cell_left = function (obj, e){
						if(!$(obj).hasClass('last')){
							if(e.offsetX < 5 && obj.cellIndex > 0){
								return true;
							}else{
								return false;
							}
						}
					};
					var cell_right = function (obj, e){
						var last = obj.parentNode.childNodes.length;
						if(!$(obj).next().hasClass('last')){
							if(e.offsetX > $(obj).width()-5 && obj.cellIndex < last-1 ){
								return true;
							}else{
								return false;
							}
							
						}
					};
				},
				paging : function(){
					var frm = gridDiv.children("form");
					var cnt = getCookie("fletaListSize") && frm.get(0).listCnt.value;
					var opts = {
							totalSize : gridDefOpt.paging.totalSize,
					        pageNo : gridPage,
					        listSize : cnt,  // 글 목록 갯수
					        pageSize : 10  //페이지 갯수
					};
					return ({
				            init : function() {
				                var totalPage = Math.ceil(opts.totalSize/opts.listSize),
				                	totalPageList = Math.ceil(totalPage/opts.pageSize),
				                	pageList = Math.ceil(opts.pageNo/opts.pageSize);
				                
				                if (pageList < 1){
				                	pageList = 1;
				                }
				                if (pageList > totalPageList){
				                	pageList = totalPageList;
				                }
				                var startPageList = (pageList - 1) * opts.pageSize + 1;
				               
				                var endPageList = startPageList + opts.pageSize - 1;

				                if (startPageList < 1){
				                	startPageList = 1;
				                }
				                if (endPageList > totalPage){
				                	endPageList = totalPage;
				                }
				                if (endPageList < 1){
				                	endPageList = 1;
				                }
				                
				                let div = document.createElement("div");
				                	ul = document.createElement("ul");
				                	
				                	div.setAttribute("class", "paging");

				                ul.append(this.getNumberLink(1, 'FIRST', 'firstPage'));
				                if((startPageList - 1) > 0){
				                	ul.append(this.getNumberLink((startPageList - 1), 'PREV', 'prevPage'));
				                }
				                
				                for (var i = startPageList; i <= endPageList; i++) {

				                	ul.append(this.getNumberLink(i, null, ((opts.pageNo == i)? 'selected': '')));
				                    if (i < endPageList) {
				                    	// separate action
				                    }
				                }
				                if((endPageList + 1) < totalPage){
				                	ul.append(this.getNumberLink((endPageList + 1),'NEXT', 'nextPage'));
				                }
				                ul.append(this.getNumberLink(totalPage, 'LAST', 'lastPage'));
				                div.append(ul);
				                
				                return div;
				            },
				            getNumberLink : function(pageNo, text, className) {
				            	let li = document.createElement("li"), 
				            		span = document.createElement("span");
				            	li.setAttribute("class", className);
				            	span.setAttribute("title", text || pageNo);
				            	
				            	let str = pageNo;
				            	if(text != null && text != ''){
				            		str = text;
				            	}
			                	span.innerText = str;
			                	span.addEventListener("click", function(){
			                		var frm = gridDiv.children("form");
									frm.get(0).pageNo.value = pageNo;
									frm.get(0).listCnt.value = cnt;
									gridPage = pageNo;
			                		gridObj.madeAjaxGrid(gridPage);		
			                	});
				                li.append(span);
				                return li;
				            }
			        	}).init();
				}
			};
		},
		langConverter : function(data){
			var langJson = fui.lang.json;
			
			var key, caption, elm;
			if(data){
				key = data.split(":")[0];
				elm = data.split(":")[1];
			}
			if(typeof langJson[key] != "undefined"){
				caption = langJson[key];
				if(elm){
					if(elm === "br"){
						caption = caption.replaceAll("<br/>", " ");
					}else if(elm.indexOf("<em>") > -1){
						caption += " "+elm;
					}
				}else if(typeof caption === "object"){
					caption = data;
				}
			}else{
				caption = key;
			}
				
			return caption;
			
		},
		loading : function (area) {
			let layerPop = document.createElement("div");
			let loading =document.createElement("div");
			
			layerPop.setAttribute("class","loadArea");
			layerPop.style.position = "absolute";
			layerPop.style.zIndex = '99';
			
			loading.setAttribute("class","loading");
			
			layerPop.append(loading);
			
			var loadingW = loading.offsetWidth,
				loadingH = loading.offsetHeight;
			var grdHig = area.offsetHeight,
				grdTop = 0;
			
			area.prepend(layerPop);
			$(area).children(".fui_grid_body").css("filter","blur(1px)");
			
			try {
				if((grdHig-loadingH)/2 <= 0){
					grdTop = area.offsetTop;
				}
			} catch (e) {
				return false;
			}
			var loadingL = (area.width()-loadingW)/2,
				loadingT = grdTop + (grdHig-loadingH)/2;
			
			layerPop.style.marginLeft = loadingL + "px";
			layerPop.style.marginTop = loadingT + "px";

			return this;
		},
		loadingRemove : function (area){
			area.children(".loadArea").remove();
		},
		// popup
		popup : function(option){
			var default_option = {
					type : "", //"L" or "W" or "A"
					url : "", 
					data : null,
					time : null,
					posX : null,
					posY : null,
					width : 700,
					height : 600,
				};
			var opt = $.extend(true,{}, default_option, option);
			
			var popup;
			var w = window.innerWidth || document.documentElement.clientWidth || document.body.clientWidth;
			var h = window.innerHeight || document.documentElement.clientHeight || document.body.clientHeight;		
			return ({
				init : function(opt){
					var type = opt.type;
					var types = {
							W : this.windowPop,
							L : this.layerPop,
							A : this.alertPop,
							H : this.helpPop,
							B : this.bubblePop,
							E : this.editPop
						},
						func = types[type];
					if(func){
						func.call(this, opt);
					}else{
						this.loading(opt);
					}
					
					popup = this;
					return popup;
				},
				windowPop : function(opt){
					var post = opt.post;
					if(post){
						var frm = $("<form>"),
							url = opt.url,
							data = opt.data,
							now = new Date(),
							winPop = "win_pop_"+now.getTime(),
							pop = window.open("",winPop,"width="+opt.width+", height="+opt.height+",scrollbars=yes, location=no, resizable=yes, toolbar=no");
						
						frm.attr("action", url);
						frm.attr("method", "post");
						for(nm in data){
							if(data.hasOwnProperty(nm)){
								frm.append('<input type="hidden" name="'+nm+'" value="'+data[nm]+'" />');
							}
						}
						$('body').append(frm);
						
						frm.get(0).target  = winPop;
						frm.submit();
						frm.remove();
					}else{
						var url = opt.url, 
							uri = "",
							data = opt.data;
						
						for(i in data){
							if(data.hasOwnProperty(i)){
								if(url.indexOf("?") < 0){
									url += "?";
								}else{
									uri += "&";
								}
								uri += i + "="+ encodeURIComponent(data[i]);		
							}
						}	
						url = url + uri;
						// get
						if(opt.full){
							window.open(url,"_blank","width="+screen.width+", height="+screen.height+",top=0, left=0, fullscreen=yes");
						}else{
							window.open(url,"_blank","width="+opt.width+", height="+opt.height+",scrollbars=no, location=no, directories=no, resize=no, toolbar=no, menubar=0");
						}
						
					}
					
					
				},
				layerPop : function(opt){
					this.closePopup();
					this.modal().loading();
					var pop = $('<div>').attr("id","pop");
					$.ajaxSettings.traditional = true;  
					$.ajax({
						async : true,
						url : opt.url,
						data : opt.data,
						dataType : "html",
						cache : false,
						success : function(data){
							pop.html(data);	
							var minH = opt.minHeight || 0;
							$("#loading").remove();
							$('#layerPop').append(pop);
							
							var popW = opt.width || pop.outerWidth(true),
								popH = pop.outerHeight(true);
							
							if(popH < minH){
								popH = minH;
							}
							
							if(popH > h - 150){ // 
								popH = h-150;
							}
							pop.css({"height":popH});
							$("#popupContent").css({"height":popH-80,"overflow-y":"auto"});
							
							var popL = (popW)/2,
								popT = (popH)/2;
							
							pop.css({
								width : opt.width,
								"margin-left" : -popL,
								"margin-top" : -popT,
								position : "fixed",
								left : "50%",
								top : "50%"
							});
							
							$("#pop").on("click","#layerPopupClose",function(){
								popup.closePopup();
							});
							$("#pop").draggable({"cancel":"#popupContent"});
						},
						error : function(){
							alert("데이터 통신에 실패하였습니다.");
							popup.closePopup();
						}
					});			
				},
				alertPop : function(opt){
					var pop = $('<div>').attr("id","altPop");
					if($("#altPop").length === 0){
						pop.html(opt.data);	
						
						var popW = opt.width || pop.outerWidth(true),
						popH = pop.outerHeight(true);
						
						var popL = (w-popW)/2,
						popT = (h-popH)/2 - 100;
						
						pop.css({
							width : opt.width,
							left : popL,
							top : popT
						});
						
						$('body').append(pop);
						var popColoe = setInterval(function(){
							pop.remove();
						}, opt.time);						
					}
							
				},
				helpPop : function(opt){
					var pop = $('<div>').attr("id","helpPop").css("height","auto");
					if($("#helpPop").length === 0){
						pop.html(opt.data);	
						
						pop.appendTo($('body'));
						var target = opt.target,
							pos = target.offset(), 
							popT, popL;
						
						if(opt.posi == null){
							popT = pos.top + target.outerHeight(true);
							popL = pos.left + 3;
						}else{
							popT = opt.posi.y;
							popL = opt.posi.x;
						}
						
						pop.css({
							width : opt.width - 16,
							left : popL,
							top : popT
						});
						
					}
							
				},
				bubblePop : function(opt){
					/*
					 * sample option
					 	{
							type : "B",
							data : setStr,
							posX : e.clientX || e.pageX,
							posY : e.clientY || e.pageY,
							time : 1.5
						};
					 */
					var pop = $('<div>').attr("id","bblPop");
					if($("#bblPop").length === 0){
						pop.html(opt.data);	
						
						var popW = pop.width() || pop.outerWidth(true);
						
						pop.css({
							left : opt.posX + 10,
							top : opt.posY + 10
						});
						
						$('body').append(pop);
						var popColoe = setInterval(function(){
							pop.remove();
						}, (opt.time * 1000));			
					}
							
				},
				editPop : function(opt){
					this.closePopup();
					var layerPop = $("<div>").attr("id","layerPop");
					var pop = $('<div>').attr("id","pop").addClass("editPop");
					$.ajaxSettings.traditional = true;  
					$.ajax({
						async : true,
						url : opt.url,
						data : opt.data,
						dataType : "html",
						cache : false,
						success : function(data){
							pop.html(data);	
							layerPop.append(pop);
							
							var minH = opt.minHeight || 0;
							
							var popW = opt.width || pop.outerWidth(true),
								popH = pop.outerHeight(true);
							
							if(popH < minH){
								popH = minH;
							}
							
							if(popH > h - 150){ // 
								popH = h-150;
							}
							$("#popupContent").css({"height":popH-70,"overflow-y":"auto"});
							
							pop.css({
								left : opt.posX + 10,
								top : opt.posY + 10
							});
							
							$('body').append(layerPop);
							$("#pop").on("click","#layerPopupClose",function(){
								popup.closePopup();
							});
						},
						error : function(){
							alert("데이터 통신에 실패하였습니다.");
							popup.closePopup();
						}
					});			
				},
				modal : function (use) {
					var layerPop = $("<div>").attr("id","layerPop");
					var modal = $("<div>").attr("id","modal");
					if(typeof use === "undefined" || (typeof use === "boolean" && use == true)){
						layerPop.html(modal);
					}
					$("#wrap").addClass("blur"); 
					$('body').append(layerPop);
					return this;
				},
				loading : function () {
					var loading = $("<div>").attr("id","loading");
					$('#layerPop').append(loading);						

					var loadingW = loading.outerWidth(true),
						loadingH = loading.outerHeight(true);
					
					var loadingL = (w-loadingW)/2,
						loadingT = (h-loadingH)/2.5;
					
					loading.css({
						left:loadingL,
						top:loadingT
					});
					return this;
				},
				closePopup : function(){
					$('#layerPop').remove();
					$("#wrap").removeClass("blur"); 
				},
				closeHelp : function(){
					$('#helpPop').remove();
					$("#wrap").removeClass("blur"); 
				}
			}).init(opt);
		},
		// fui.calendar
		calendar : function(e){
			e.preventDefault();
			var default_option = {
					type : "normal", // or data or reserve
					date : null,
					fn : null
				};
			var calOpt = $.extend(true,{}, default_option, e.data);
			if(typeof e.data === "function"){
				calOpt.fn = e.data;
			}
			
			var dateArr;
			if(calOpt.type.toUpperCase() == "DATA"){	// 데이터가 있으면
				if(calOpt.date){
					dateArr = calOpt.date.split(",");
				}
			}else{										// type NOMAL	
				
			}
			var inputEl = $(this), 
				inputVal = inputEl.val().trim();
			var calDiv = $("<div>").addClass("fleta_calendar"),
				monthContainer = $("<ul>").addClass("monthContainer");
			var now = new Date(),
				monthDay = [31,28,31,30,31,30,31,31,30,31,30,31],
				weekDay = [fui.langConverter('sun'),
				           fui.langConverter('mon'),
				           fui.langConverter('tue'),
				           fui.langConverter('wed'),
				           fui.langConverter('thu'),
				           fui.langConverter('fri'),
				           fui.langConverter('sat')],
				currentMonth = now.getMonth(),
				currentYear = now.getFullYear(),
				year = now.getFullYear(),
				month = now.getMonth(), 
				today = now.getDate(),
				speed = 300,
				calWidth;
			
			// 선택한 날짜가 있을경우 첫 달력은 선택한날의 달.
			if(inputVal !== ""){
				var selectedDate = inputVal.split("-");
				year = Number(selectedDate[0]);
				month = Number(selectedDate[1])-1;
				now.setYear(year);
				now.setMonth(month);
			}

			return ({
				init : function(){
					// 달력 위치 잡고 그리기
					if(inputEl.next(".fleta_calendar").length === 0){
						var offset = inputEl.offset();
						var top = offset.top, 
							left = offset.left, 
							height = inputEl.get(0).offsetHeight,
							bottom = top + height;				
						var curtMonthDiv = this.madeCalendar();			
						monthContainer.append(curtMonthDiv);
						calDiv.append(monthContainer);				
						
					//	inputEl.after(calDiv).attr("readonly","readonly");
						$('body').append(calDiv);
						calWidth = curtMonthDiv.width();
						
					//	left = left - calWidth + inputEl.outerWidth();
						
						calDiv.css({"left" : left, "top" : bottom});		
						
						
						this.calendarEvent();
					}				
				},
				madeCalendar : function(move){
					var calendar = this;
					var curtMonthDiv = $("<li>").addClass("curtMonthDiv");
					var curtDateDiv = $("<div>").addClass("calendarHeader");;
					
					move = typeof move === "undefined" ? 0 : move;
					now.setMonth(month + move);										
				
					var day = now.getDate(),
						week = now.getDay(),
						startDay = now,
						startWeek, endDay;
					// 이동한 달로 새로 셋팅	
					year = now.getFullYear();
					month = now.getMonth();
					endDay = monthDay[month];

					startDay.setDate(1);
					startWeek = startDay.getDay(); 
					
					if ((month==1)&&                      		// 월이 2월(1)이며,
						    (((year %4==0)&&(year %100 !=0))    // 4와 100으로 나눠 나머지가 없거나 
						    		|| (year % 400 ==0 ))) {	// 400으로 나눠 나머지가 없으면
						endDay = 29;  // 윤달
					}
					
					var prevSpn = $('<span>').addClass("calendarPrevMove").html("◀"), 
						nextSpn = $('<span>').addClass("calendarNextMove").html("▶"), 
						curtSpn = $('<span>').addClass("calendarMonthTxt");
					/*
					 * 2019-01-10
					 * year/month sel box made .
					 */
					var yearSelbox = $("<select>").addClass("fui_form"),
						monthSelbox = $("<select>").addClass("fui_form").css("margin-left","5px");
					// year sel box
					for(var y=-1; y<9; y++){
						var optYear = currentYear - y;
						yearSelbox.append($("<option>").val(optYear).text(optYear));
						yearSelbox.val(year);
					}
					yearSelbox.on("change",function(){
						var selYear = $(this).val();
						calendar.calendarMove((selYear - year)*12);
					});
					// month sel box
					for(var m=0; m<12; m++){
						var optMonth = m+1;
						if(m < 9){
							optMonth = "0"+optMonth;
						}
						monthSelbox.append($("<option>").val(m).text(optMonth));
						monthSelbox.val(month);
					}
					monthSelbox.on("change",function(){
						var selMonth = $(this).val();
						calendar.calendarMove((selMonth - month));
					});
					
					curtSpn.html([yearSelbox,monthSelbox]);
					curtDateDiv.append([prevSpn, curtSpn, nextSpn]);
					curtMonthDiv.append(curtDateDiv);
					
					var calT = $('<table>'),
						thead = $('<thead>'),
						tbody = $('<tbody>'),
						colTr =  $('<tr>');
					// thead
					for(var i=0; i<7; i+=1){
						var th = $('<th>').attr('scope','col').html(weekDay[i]);
						colTr.append(th);
					}							
					thead.append(colTr);	
					// tbody	
					var cntNum = 0;
					
					// 한달에 몇주인지 구함
					var monthWeekDay = 35;
					if(startWeek+endDay > 35){
						monthWeekDay = 42;
					}
 					
					for(var i=0; i<monthWeekDay; i+=1){
						var tr,
							td = $('<td>'),
							tdv = $('<div>');
						
						if(startWeek <= i && i < endDay+startWeek){	// 현재달의 첫번째 요일부터 마지막날까지 
							var d = i-startWeek + 1;
							tdv.addClass("currentMonth").text(d);
							/*
							td.text(d);
							if(!(d > today && currentMonth <= month && currentYear <= year)){
								td.addClass("currentMonth").text(d);
							}
							*/
							if(d === today && currentMonth === month && currentYear === year){
								tdv.addClass("today");
							}
							// date가 있는 날이면 
							var clickDay = datePattern(year,month+1,d);
							if(clickDay === inputVal.replaceAll("-","")){
								tdv.addClass("selectDate");
							}
							for(j in dateArr){
								if(clickDay === dateArr[j]){
									tdv.addClass("isData");
									break;
								}
								cntNum += 1;
							}
						}else if(i < startWeek){ 	// 지난달의 날짜
							var prvEndDay = monthDay[(month === 0 ? 12 : month) - 1];
							tdv.text(prvEndDay - startWeek + i + 1);
							tdv.addClass("prevMonth");
						}else if(i >= endDay+startWeek) { 		// 다음달의 날짜
							tdv.text(i - (endDay+startWeek) + 1);
							tdv.addClass("nextMonth");
						}

						if(i%7 === 0){
							tr = $('<tr>');
							tbody.append(tr);
						}
						
						td.append(tdv);
						tr.append(td);
					}
					calT.append([thead,tbody]);	
					curtMonthDiv.append(calT);
					
					return curtMonthDiv;
				},
				calendarMove : function(num){
					var calendar = this;
					var curtMonthDiv = calendar.madeCalendar(num);
					if(num < 0){ // before
						monthContainer.prepend(curtMonthDiv);
						$(".monthContainer").css({"left":"-"+calWidth+"px"});				
						$(".monthContainer").animate({
							left : "+="+calWidth
						},speed,function(){
							$(".monthContainer > li").last().remove();					
						});
					}else{ // after
						monthContainer.append(curtMonthDiv);
						$(".monthContainer").animate({
							left : "-="+calWidth
						},speed,function(){
							$(".monthContainer > li").first().remove();
							$(".monthContainer").css({"left":0});
						});										
					}
				},
				calendarEvent : function(){
					var calendar = this;
					calDiv.on("click", ".calendarPrevMove", function(){
						calendar.calendarMove(-1);
					}).on("click", ".calendarNextMove", function(){
						calendar.calendarMove(1);
					}).on("click", "div.currentMonth", function(){
						var clickDay = datePattern(year,month+1,$(this).text()),
							valDay = datePattern(year,month+1,$(this).text(), "-");
						
						if(calOpt.type.toUpperCase() == "DATA"){
							if($(this).hasClass("isData")){
								$(".selectDate").removeClass("selectDate");
								$(this).addClass("selectDate");
								inputEl.val(valDay);
								
								if(calOpt.fn){
									calOpt.fn.call(null, valDay);
								}
							}
						}else{
							$(".selectDate").removeClass("selectDate");
							$(this).addClass("selectDate");
							inputEl.val(valDay);
							
							if(calOpt.fn){
								calOpt.fn.call(null, valDay);
							}
						}
												
						calDiv.remove();
					}).on("mouseenter", "div.currentMonth", function(){
						$(this).addClass("calHover");
					}).on("mouseleave", "div.currentMonth", function(){
						$(this).removeClass("calHover");
					});
					
				}
			}).init();
		},
		// select menu
		selectmenu : function(e){
			var btnEl = $(this),
				selectData = e.data,
				selectVal = selectData["val"],
				optDiv = $("<div>").addClass("se_select");
			return ({
				init : function(){
					// 위치 잡고 그리기
					if(btnEl.next(".selectmenu").length === 0){
						var offset = btnEl.offset();
						var selEl = btnEl.next("select");
						if(selEl.children().length == 0){
							return false;
						}
						btnEl.addClass("on");
						var top = offset.top, 
							left = offset.left, 
							width = btnEl.get(0).offsetWidth,
							height = btnEl.get(0).offsetHeight,
							bottom = top + height;	
						
						// contents made
						var divBox = this.selectMade(selEl);
						optDiv.append(divBox);				
						optDiv.css("min-width",width+"px");
						$('body').append(optDiv);
						
						if(btnEl.hasClass("right")){
							left = left - (divBox.width() - width);
						}
						
						optDiv.css({"left" : left, "top" : bottom});		
						
					}	
					
					return false;
				},
				selectMade : function(el){
					var selectTxt = btnEl.text();
					var selBox = $("<div>").addClass("selBox");
					el.children().each(function(i){
						var optEl = $(this),
							optTxt = optEl.text(),
							valStr = optEl.val() || optEl.attr("label"),
							valArr  = valStr.split("::"), 
							funcNm, args, 
							opt;
							
						funcNm = valArr[0];
						if(valArr.length > 1){
							args = valArr[1];
						}else{
							args = optTxt;
						}
						
						if(optEl.is("optgroup")){
							opt = $("<div>").addClass("optGrp").text(optTxt);
						}else{
							opt = $("<div>").addClass("optBox").text(optTxt);
						}
						
						if(selectTxt == optTxt){
							opt.hide();
						}else{
							opt.on("click",function(){
								try {
									if(Object.keys(selectData).length > 1){
										// grid내 상황
										var obj = selectData.obj,
											data = selectData.data;
										fui.util[funcNm](obj, data);
									}else{
										// 일반적인 상황
										if(!(typeof selectVal === "boolean" || selectVal === true)){
											btnEl.text(optTxt);
											$(".optBox").show();
											$(this).hide();
										}
										window[funcNm].apply(btnEl,[args]);
									}
								} catch (e) {
									console.log(e);
									alert("Select Menu 설정이 잘못되었습니다.");
								}
								$(".selectBtn").removeClass("on");
								$(".se_select").remove();
							});
						}
						selBox.append(opt);
					});
					return selBox;
				}
			}).init();
		}
};


(function(){
	var throttle = function (type, name, obj){
		obj = obj || window;
		var running = false;
		var func = function() {
			if(running){return;}
			running = true;
			requestAnimationFrame(function(){
				obj.dispatchEvent(new CustomEvent(name));
				running = false;
			});
		};
		obj.addEventListener(type, func);
	};
	throttle("resize", "optimizedResize");
	
	fui.layout = {};	
	fui.layout.init = function(type){
		var mouseDown = false
			,downPosX = 0
			,hideLeftWidth = 25
			,barLeft , leftWidth
			,barWidth = 0
			,now_target
			,cloneBar
			,headerH = $("#header").outerHeight()
			,footerH = $("#footer").outerHeight()
			,margin = headerH + footerH
			,h = $(window).height()-margin;
		fui.layout.contentHeight = h;
		var leftMenu = $('#left:not(.adminLeft)');
		var dragBar = $("<div>").addClass("vDragBar");
		dragBar.css({"left":leftMenu.outerWidth()});
		leftMenu.after(dragBar);
		
		$("#right_area").css({"margin-left":$("#left").outerWidth()+barWidth});
		
		var openTime = null, closeTime=null;
		$("#container").on("mouseenter", ".hideLeft" , function(e){
			clearTimeout(closeTime);
			openTime = setTimeout(function(){
				$("#left").addClass("open");					
				$("#treeMenu").show("drop");
				$("#left").animate({
					width : 150
				},300,function(){
				});
			}, 500);
			
		});
		
		$("#container").on("mouseleave", ".hideLeft" , function(){
			clearTimeout(openTime);
			closeTime = setTimeout(function(){
				$("#treeMenu").hide();
				$("#left").removeClass("open");					
				$("#left").animate({
					width : 25
				},200,function(){
				});
			}, 500);
		});
	
		$(".vDragBar").on("mousedown", function(e){
			cloneBar = $(this).clone();
			$(this).parent().append(cloneBar);
			mouseDown = true;
			downPosX = e.pageX;
			/*$('body').on("selectstart", function(event){ return false; })
				.on("dragstart", function(event){ return false; });*/
			$('body').on("selectstart",false)
			.on("dragstart",false);
			
		});
		
		$(document).on("mousemove", function(e){
			if(mouseDown){
				barLeft = e.pageX;
				cloneBar.css({"left": barLeft+"px", "top" : 0,
					"background" : "#5297ff",
					"opacity" : "0.2"
				});		
			}
		}).on("mouseup",function(e){
			if(mouseDown){
				mouseDown = false;
				cloneBar.remove();	
				if(barLeft < hideLeftWidth ){
					barLeft = hideLeftWidth;
				}else if(barLeft > 500){
					barLeft = 500;
				}
				$("#left").css("width", barLeft+"px");
				leftWidth = $("#left").outerWidth();
				$(".vDragBar").css("left", leftWidth);
				
				$("#right_area").css("margin-left", leftWidth + barWidth);
				
				if(leftWidth > hideLeftWidth){
					fui.layout.tree.openLeft();
				}else{
					fui.layout.tree.closeLeft();
				}
			}

		});
		
		$("#navi .oneDepth").on("mouseenter",function(){
			var submenu = $(this).children(".twoDepth");
			var top = this.offsetTop, 
				left = this.offsetLeft, 
				height = this.offsetHeight,
				bottom = top + height;
			submenu.show().css({"left":left, "top":bottom});;
		}).on("mouseleave", function(){
			var submenu = $(this).children(".twoDepth");
			submenu.hide();
		});
		
		if(type != "popup"){
			fui.layout.tree(hideLeftWidth);
			fui.form.search();
		}
		
	};
	
	fui.layout.tree = function(hideLeftWidth){
		var leftMenu = $('#left:not(.adminLeft)');
		var barWidth = 0;
		var leftWidth;
		fui.layout.tree.leftWidth = leftWidth;

		$("#hideBtn").click(function(){
			if($('#left').is(".hideLeft")){
				fui.layout.tree.openWidth();
				document.cookie = "leftMenu=open;path="+uriPath[0];
			}else{
				fui.layout.tree.closeWidth();
				document.cookie = "leftMenu=close;path="+uriPath[0];
			}	
		});
		
		fui.layout.tree.openWidth = function(){
			leftMenu.css({width : leftWidth});	
			$("#right_area").css("margin-left",leftWidth+barWidth);	
			$(".vDragBar").css("left", leftWidth);
			fui.layout.tree.openLeft();
		}
		
		fui.layout.tree.closeWidth = function(){
			leftWidth = leftMenu.outerWidth();
			leftMenu.css({width : hideLeftWidth});
			$("#right_area").css("margin-left",$("#left").outerWidth()+barWidth);	
			$(".vDragBar").css("left",$("#left").outerWidth());
			fui.layout.tree.closeLeft();
		}

		fui.layout.tree.openLeft = function(){				
			$("#treeMenu").show("drop");
			$("#leftIcon").hide();
			$("#hideBtn").addClass("open").removeClass("close");
			$('#left').removeClass("hideLeft");
			seElementSizeCheck();
		}; 
		fui.layout.tree.closeLeft = function(){
			leftMenu.children("#treeMenu").hide();
			$("#hideBtn").addClass("close").removeClass("open");
			leftMenu.addClass("hideLeft");
			seElementSizeCheck();
		};
		var flag = getCookie("leftMenu");
		
		if(flag == "open"){
    		fui.layout.tree.openWidth();
		}else{
			fui.layout.tree.closeWidth();
		}
	};
	
	fui.form = {};
	fui.form.search = function(){
		var searchBox = $("<div class='search'></div>");
		var label = $("<span>");
		$(".fui_search").wrap(searchBox);
		$(".fui_search").after(label);
		
	};
	
	fui.lang = {};
	fui.lang.json = null;
	fui.lang.get = (function(){
		var json, default_lang, site_lang, lang_flag = true,
			default_json, site_json,
		 	lang = getCookie("fletaLang").replaceAll('"',''),
		 	site = getCookie("LangSite");
		
	 	if(!lang || lang.indexOf("ko") > -1){
	 		lang = "ko"; 
	 	}
	 	if(!site){
	 		site = "fleta"; 
	 	}
	 	default_lang = "fleta_"+lang+".json";		
	 	site_lang = site+"_"+lang+".json";	
	 	
	 	var getLangFunc = function(lang, merge){
	 		var json;
	 		
 			$.ajax({
	 			async: false,
	 			url : uri +"resources/js/lang_json/"+lang,
	 			contentType: "application/x-www-form-urlencoded; charset=UTF-8", 
	 			datatype : "json",
	 			success : function(data){
	 				json = data;
	 				if(merge){
	 					merge(json);
	 				}
	 			},
	 			error : function(e){
 					$.getJSON(uri +"resources/js/lang_json/"+lang,  function(data){
 						json = data;
 					}).error(function() {
 						console.log("Default Lang used.");
 					});
					
	 				if(fui.lang.json == null){
	 					alert("Language Error");
	 				}
 				}
 			});
				
	 		return json;
	 	}
	 	var langMerge = function(json){
	 		$.each(json,function(k,v){
	 			fui.lang.json[k] = v;
	 		});
	 	}
	 	fui.lang.json = getLangFunc(default_lang);
	 	site_json = getLangFunc(site_lang, langMerge);
	 	
	 	
	}());
	
})();

fui.layout.tab = function(){
	$(".title_tab:not('.sub')").click(function(){
		var tab = $(this);
		tab.addClass("on");
		tab.prevAll(".title_tab:not('.sub')").removeClass("on rt").addClass("lf");
		tab.nextAll(".title_tab:not('.sub')").removeClass("on lf").addClass("rt");
	});
}

fui.util = {
		excelDown : function(gridDiv, setting){
			try {
				var tb_div = gridDiv.find(".fui_grid_body")[0],
					frm = gridDiv.children("form"),
					jsonObj, jsonData;
				if(!frm.children("input[name=unit]").val()){
					frm.children("input[name=unit]").val(getCookie("fletaUnit") || setting.option.unit.type[0]); 
				}
				frm.children("input[name=listCnt]").val(9999);
				frm.attr("action", setting.url.replace("ajax_","excel_").replace("grid_","excel_"));
				frm.submit();									
			} catch (e) {
				console.log(e);
				alert("준비중입니다.");
			}
		},
		gridPrint : function(gridDiv, setting){
			var gridHtml = gridDiv.children(".fleta_grid").children(".fui_grid_head").html() +
						gridDiv.children(".fleta_grid").children(".fui_grid_body").html();
			var totalHtml = "";
			if($("#total_grid").css("display") == "block"){
				totalHtml = $("#total_grid").find(".fui_grid_head").html() +
							$("#total_grid").find(".fui_grid_body").html();
			}
			
			if($("form[name=printForm]").length > 0){
				$("input[name=printZone]").val(gridHtml);
				$("input[name=totalZone]").val(totalHtml);
			}else{
				var frm = $("<form>",({"name" : "printForm"}));								
				var printVal = $("<input>", ({"name":"printZone"})).val(gridHtml);
				var totalVal = $("<input>", ({"name":"totalZone"})).val(totalHtml);
				frm.append([printVal,totalVal]);
				$('body').append(frm);
			}
			window.open(uriPath[0]+"jsp/print/grid_print.jsp","print_popup","width=1024, height=700");	
		},
		gridFilter : function (gridDiv, setting){
			var filter = gridDiv.children("form").children("[name=filter]").val();
			var opt = {
				type : "L",
				url : uri+'/popup/layer/user/filter',
				data : {
					data : this.getFilterData(), 
					filter : filter,
					mid : setting.data.menuId, 
					fid : setting.data.fid, 
					krNm : setting.data.menuNm
				},
				width : 530
			}
			fui_filter_popup = fui.popup(opt);
		}
};

$.fn.fuiDatePiker = function (data, callback) {
	var callback = callback;
	if(typeof data == "undefined" || data == null){
		data = "";
	}
	if(typeof callback == "undefined"){
		callback = data;
	}
	var piker = $(this);
	var val = piker.val();
	var now = new Date(),
		year = now.getFullYear(),
		month = now.getMonth(),
		day = now.getDate();
	if(!val){
		piker.val(datePattern(year,month+1,day, "-"));
	}
	
	if(typeof data == "function"){
		piker.on("click", callback, fui.calendar);
	}else if(typeof data == "number"){
		now.setDate(now.getDate()+data);
		piker.val(datePattern(now.getFullYear(),now.getMonth()+1,now.getDate(), "-"));
		piker.on("click", callback, fui.calendar);
	}else if(data != ""){
		if(data.indexOf("-") > 0){
			piker.val(data);
			piker.on("click", callback, fui.calendar);
		}else{
		//	piker.on("click",  {type : "data", date : data, fn : callback}, fui.calendar);
			piker.on("click",  {type : data, fn : callback}, fui.calendar);
		}
	}else{
		piker.on("click", callback, fui.calendar);
	}
//	$(".fleta_date").on("click", {date : "20140918,20140917,20140915,20140910,20140903,20140815", fn : calClick}, Fleta.calendar);
	
}

function selectMonth() {
	var selDate = $("<select>",({"class":"fui_form w80"}));
	var curDate = new Date();
	for(var i = 0; i < 3; i += 1){
		var setDate = new Date();
		setDate.setMonth(curDate.getMonth() - i);	
		var histMonth = setDate.getFullYear() + "-" + monthMM(setDate.getMonth()+1);
		var opt = $("<option>").val(histMonth).text(histMonth);
		selDate.append(opt);
	}
	return selDate;
}

function gridCellWidth(){
	let g_childs =  this.childNodes;
	let g_head = g_childs[1],
		g_body = g_childs[2];
	
	$(g_head).find('col').each(function(i){
		let $col = $(this);
		let stl = $col.attr("style"),
			clsNm = $col.attr("class");
		
		if(typeof stl != "undefined" && clsNm != "last"){
			$(g_body).find("col:eq("+i+")").attr("style", stl);
		}
	});
}

function gridHeight(){
	let g_childs =  this.childNodes;
	let g_option = g_childs[0], 
		g_head = g_childs[1],
		g_body = g_childs[2],
		g_head_h = g_head.offsetHeight,
		g_option_h = g_option.offsetHeight;
	let scrollW, g_body_t;
	
	if(g_option_h == 0){
		g_body_t = "30px";
	}else{
		g_body_t = (g_head_h + g_option_h) + "px";
	}
	g_body.style.top = g_body_t;
	//스크롤이 생겼을 경우 마직막 셀의 너비 조절.
	let g_body_tbl = g_body.childNodes[0],
		g_head_tbl = g_head.childNodes[0],
		headW = g_head_tbl.offsetWidth,
		bodyW = g_body_tbl.offsetWidth;
	
	scrollW = headW - bodyW;
	$(g_head).find("col[class=last]").width(scrollW);
}


$(document).on("mousedown", eventCapturing);


function eventCapturing(e){
	$(".fleta_calendar, .se_select, .editPop").each(function(){
		if($(this).css('display') === "block"){
			var inpArea = e.target,
				opnChk = false;
			var tis = $(this),
				pos = tis.offset(),
				p_l = parseInt(pos.left),
				p_r = p_l + parseInt(tis.width()),
				p_t = parseInt(pos.top),
				p_b = p_t + parseInt(tis.height());
			if($(inpArea).attr("id") != undefined && $(inpArea).attr("id") === tis.prev().attr("id")){
				opnChk = true;
			}
			if( !((e.pageX > p_l && e.pageX < p_r) && (e.pageY > p_t && e.pageY < p_b)) || opnChk ){
				if(tis.hasClass("se_avaliable")){
					tis.hide();
				}else{
					tis.remove();
				}
				$(".selectBtn").removeClass("on");
			} 		
		}
	});
	$(".etcOption").each(function(){
		if($(this).css('display') === "block"){
			var pos = $(this).offset(),
				p_l = parseInt(pos.left),
				p_r = p_l + parseInt($(this).width()),
				p_t = parseInt(pos.top),
				p_b = p_t + parseInt($(this).height());
			if( !((e.pageX > p_l && e.pageX < p_r) && (e.pageY > p_t && e.pageY < p_b)) ){
				$(this).hide();
			//	$("#grid_column_btn").parent().removeClass("click");
			} 
		}
	});
}

function gridLinked(json){
	this.json = json || null;
}
gridLinked.prototype.linked = function(ele, val, func, args){
	var $this = this.json;
	ele.setAttribute("class","linked");
	ele.onclick = function(func,args){
		return function (e) {
			var val = [];
			if(typeof args === "object"){
				for(var a=0; a<args.length; a=a+1){
					var colVal;
					if(typeof $this[args[a]] != "undefined"){
						colVal = $this[args[a]];
					}else if(typeof args[a] == "function"){
						colVal = args[a]();
					}else{
						colVal = args[a]
					}
					val.push(colVal);
				}
			}else{
				val.push(args);
			}
			eval(func).apply(null, val);										
		};
	}(func,args);
	
	return ele;
}

function childLinked(json){}

function inherit(C, P){
	var F = function() {};
	F.prototype = P.prototype;
	C.prototype = new F();
	C.uber = P.prototype;
	C.prototype.constructor = C;
}

$.fn.selectmenu = function (data) {
	var select = $(this);
	select.on("click", {"val":data}, fui.selectmenu);
}
$.fn.gridOptSelectmenu = function (sid) {
	$(".fleta_grid_cont").on("click", "#etcAction", {"val":false}, fui.selectmenu);
}
$.fn.gridSelectmenu = function (obj, data) {
	var select = $(this);
	select.on("click", {"obj":obj, "data":data}, fui.selectmenu);
}
$.fn.dynamicInput = function (callback) {
	var el = $(this),
		inp = el.children("input"),
		inpNm = inp.attr("name"),
		spn = el.children("span"),
		evnt;
	var oldVal, newVal;
	spn.on("click", function(e){
		evnt = e;
		oldVal = spn.text();
		inp.show().focus();
		spn.hide();
	});
	inp.on("keydown", function(event){
		if (event.keyCode == 13 || event.which == 13) {
			inp.hide();
		}
	}).on("focusout", function(e){
		newVal = inp.val();
		inp.hide();
		spn.show();
		
		if(oldVal != newVal){
			spn.text(newVal);
			callback.apply(evnt, [newVal, inpNm]);
		}
	});
	
}

window.addEventListener("optimizedResize", function(){
	// console.log("optimizedResize optimizedResize");
});

function seElementSizeCheck(){}
