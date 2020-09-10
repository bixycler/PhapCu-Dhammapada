toc = PhapCu_CreatZy;
poetries = { "id": "e",
	"books": [PhapCu_TamMinh, PhapCu_MinhDuc, PhapCu_ThienNhut, PhapCu_MinhChau],
	"book": PhapCu_TamMinh,
	"group": PoetryBooks,
	"select": PoetryBook,
	"class": "poetry",
	"colw": "minmax(max-content, 500px)"
};
proses = { "id": "o",
	"books": [PhapCu_ThienSieu],
	"book": PhapCu_ThienSieu,
	"group": ProseBooks,
	"select": ProseBook,
	"class": "explanation",
	"colw": "minmax(30%,500px)"
};
illustrations = { "id": "i",
	"books": [Dhammapada_Wickramanayaka],
	"book": Dhammapada_Wickramanayaka,
	"group": IllustrationBooks,
	"select": IllustrationBook,
	"class": "illustration",
	"colw": "max-content"
};
collections = [poetries, illustrations, proses]; //in the order of priority
//set back-refs for books
for(coll of collections){ for(let i in coll.books){ 
	coll.books[i].collection = coll; coll.books[i].id = coll.id+i; }} 
dualBooks = [PhapCu_TamMinh, PhapCu_MinhChau];
function getBook(bid){
    let book = null;
    for(let coll of collections){ if(bid[0]==coll.id){
            book = coll.books[bid.slice(1)]; break;
    }}
    return book;    
}

seeking = false; // ::= auto-scrolling

// detect & handle mobile screen
console.log('Screen size detected: '+screen.width+' x '+screen.height);
console.log('Window size detected: '+window.innerWidth+' x '+window.innerHeight);
//alert('Screen size: '+screen.width+' x '+screen.height+'\nWindow size: '+window.innerWidth+' x '+window.innerHeight);
onMobile = (screen.width < window.innerWidth || screen.height < window.innerHeight);
console.log('Device type detected: '+(onMobile?'mobile':'desktop'));
// then squeeze the viewport of mobile browser to the device' actual screen size
viewport.content = 'width='+screen.width+', initial-scale=1';
/* ^--- 1. we only care about width, not height
		2. viewport will auto-expand to fit the content, 
			thus we must only set the min value to "pull" it back, not to be over-expanded.
            i.e. window.innerWidth := max(viewport.width_input, contentWidth)
		3. the initial-scale(:=screen.width/viewport.width_output) will be set to 
			screen.width/contentWidth when we have complete content.
		3.1. the current value of that scale is provided by the visualViewport.scale (still a draft)
        3.2. as a viewport, mobile's "window" connects the 2 viewporting concepts in the 2 worlds:
            window.innerWidth ~= desktop's window [viewport]
            window.outerWidth := screen.width = mobile's viewport
            viewport.width(actual output) := window.outerWidth/viewport.scale
            window.innerWidth := max(viewport.width_input, contentWidth)
            in MDN Docs language, [https://developer.mozilla.org/en-US/docs/Glossary/viewport]
                window.innerWidth = "layout viewport"
                viewport.width_output = "visual viewport"
        * Note: the convention above is of Chrome, while in "A tale of two viewports — part two"
            [https://www.quirksmode.org/mobile/viewports2.html]
            Peter-Paul Koch suggested a different approach:
                "layout viewport" = document.documentElement.clientWidth (contentWidth)
                "visual viewport" = window.innerWidth
                "viewport scale"  = screen.width/window.innerWidth
*/
windowWidth = window.innerWidth;
contentWidth = $(ContentDiv).width();
contentHeight = $(ContentDiv).height();

// set up HeaderDiv
$.each(toc.chapters, function(i, chapter) {
    $('<option>').attr('value',i).text(chapter.title).appendTo(ChapterSel);
});
numchapters = Object.keys(toc.chapters).length;
numverses = toc.chapters[numchapters].to_verse;
VerseSlide.max = numverses; VerseId.max = numverses;
window.onscroll = function(event) {
	updateVerseId();
}

// set up ContentDiv
numStaticContents = ContentDiv.children.length;
for(coll of collections){ 
	$.each(coll.books, function(i, book) { console.log(book);
		$('<option>').attr('value',coll.id+i)
		.text('© '+book.year+' '+book.author).appendTo(coll.group);
	});
	let gr = coll.group.cloneNode(true); gr.id += '1';
	DualBook1.append(gr);
	gr = coll.group.cloneNode(true); gr.id += '2';
	DualBook2.append(gr);
}
onTipping = false;
if(onMobile){  //keep both the Body and the content fit
    console.log('* New window size: '+window.innerWidth+' x '+window.innerHeight);
    window.onorientationchange = function(){
        console.log('* Screen rotated: '+screen.width+' x '+screen.height);
        //alert('Screen rotated: '+screen.width+' x '+screen.height);
        console.log('* New window size: '+window.innerWidth+' x '+window.innerHeight+' (wrong aspect ratio!)');
		onTipping = true; //process this orientation tipping in the next window.onresize
    }
}
window.onresize = function(){
	let delta = window.innerWidth - windowWidth;
	console.log('  Window resized ('+delta+'): '+window.innerWidth+' x '+window.innerHeight+
		(onTipping?' (wrong width!)':''));
	if(Math.abs(delta) < 1 && !onTipping){ return;}else{ windowWidth = window.innerWidth; }
	if(onMobile){ 
		let scale = screen.width/window.innerWidth; 
		console.log('    full-screen scale: '+(Math.round(scale*1000)/10)+'%');
		console.log('    current viewport: '+(Math.round(visualViewport.scale*1000)/10)+
			'% x ('+Math.round(visualViewport.width)+','+Math.round(visualViewport.height)+')');
		if(onTipping){
			$(Body).width(screen.width);
		}
	} 
	updateColumns(onTipping? screen.width: window.innerWidth); onTipping = false;
	scrollToVerse(true);
}
new ResizeObserver(function(entries){
    //console.log('* ContentDiv resized: '+entries[0].devicePixelContentBoxSize[0].blockSize); //Chrome only!
	let dx = entries[0].contentRect.width - contentWidth;
	let dy = entries[0].contentRect.height - contentHeight;
    console.log('  ContentDiv resized ('+dx+'): '+entries[0].contentRect.width+' x '+entries[0].contentRect.height);
	if(Math.abs(dx) > 1){ contentWidth += dx; 
		if(onMobile){ 
			$(Body).width(contentWidth); //make the Body following the content
			let scale = screen.width/contentWidth; //and so the viewport (scale reset to full-screen)
			viewport.content = 'width='+contentWidth+', initial-scale='+scale;
			console.log('    set viewport: '+viewport.content);
		}
	} 
    if(Math.abs(dy) > 1){ contentHeight += dy; scrollToVerse();} //keep the current verse visisble
}).observe(ContentDiv);
MenuButton.onmouseover = function(){ MenuList.classList.remove('hidden'); }
Menu.onmouseleave = function(){ MenuList.classList.add('hidden'); }

// handle book change events
$('select.book').change(function loadBook(){
	let bid = this.value; console.log('-> book '+bid);
	let book = getBook(bid);
	if(!book){ console.log('! Error: book id "'+bid+'" not found.'); return;}
    let dest = book.collection, src = null;
    book.collection.book = book;
	if(this != dest.select){
		for(src of collections){ if(src.select == this){ break;}}
		moveColumn(src, dest, bid); 
	}
	updateGridTemplate();	
	loadChapter(ChapterSel.value);
});

// handle dual book change events
$('select.book-dual').change(function loadBookDual(){
	let bid = this.value; console.log('-> book '+bid);
	let book = getBook(bid);
	if(!book){ console.log('! Error: book id "'+bid+'" not found.'); return;}
	if(inView(['DualView'])){
		dualBooks[Number(this.id[this.id.length - 1]) - 1] = book;
		loadChapter(ChapterSel.value);
	}else if(inView(['PrefacesView'])){
		AppendixDiv.innerHTML = '';
		$('<p>'+book.preface.replace(/\n/g,'<br/>\n')+'</p>').appendTo(AppendixDiv);
        updateURL();
	}
});

// handle URL history
window.onpopstate = function(event) {
    let st = window.location.href;
    if(event.state){ st = event.state.hash;}
    console.log('==> pop history: '+st);
    loadPage(window.location.href);
}
// parse current URL and load the corresponding content
loadPage(window.location.href);
function loadPage(url){
    console.log('======================\n'+url);
    hash = new URL(url).hash; if(!hash){ hash='#ColumnsView/e0-o0-i0/1/1';}
    autoNavigating = true; //don't add URL to history
    hash = hash.slice(1).split('/');
    if(hash[0]=='ColumnsView'||hash[0]=='DualView'){
        VerseId.value = hash[3];
        ChapterSel.value = hash[2];
        let books = hash[1].split('-');
        if(hash[0]=='ColumnsView'){
            PoetryBook.value = books[0]; 
            poetries.book = poetries.books[books[0].slice(1)]
            ProseBook.value = books[1];
            proses.book = proses.books[books[1].slice(1)]
            IllustrationBook.value = books[2];
            illustrations.book = illustrations.books[books[2].slice(1)]
        }else{
            DualBook1.value = books[0];
            dualBooks[0] = getBook(books[0]);
            DualBook2.value = books[1];
            dualBooks[1] = getBook(books[1]);
        }
    }else if(hash[0]=='PrefacesView'){
            DualBook2.value = hash[1];
    }
    setView(hash[0]);
    autoNavigating = false;
};

function moveColumn(src, dest, bid){
	console.log('* Move column: '+src.class+' ==> '+dest.class);
	src.select.classList.add('unchosen'); dest.select.classList.remove('unchosen');
	dest.select.append(dest.group); //its own group is always on top!
	while(src.select.children.length){ dest.select.append(src.select.children[0]); }
	dest.select.value = bid;
}

function updateColumns(width){
    /* => (((index+poem)450 + image)800 + prose)1200 */
    let colnum = (width > 1000)? 3: (width > 600)? 2: 1;
	console.log('  update column ('+colnum+') to width = '+width);
	
	// update DualView menu item and switch to ColumnsView if needed
	if(colnum < 2){
		DualView.disabled = true;
		DualView.title = 'Không đủ rộng để xem 2 cột';
		if(onMobile){ DualView.innerHTML = '';
			$(DualView).append('So sánh 2 bản song song<br/>(Xoay ngang màn hình để xem)');
		}
		if(inView(['DualView'])){ setView('ColumnsView');}
	}else{
		DualView.disabled = false;
		DualView.title = '';
		if(onMobile){
			$(DualView).text('So sánh 2 bản song song');
		}
	}
	if(!inView(['ColumnsView'])){ return false;}
	
	// Add/remove columns by moving option groups in <select>s around
	let coll = null;
	for(coll of collections){ 
		colnum -= !coll.select.classList.contains('unchosen'); }
    if(!colnum){ return false;
    }else if(colnum > 0){ for(coll of collections){
		if(coll.select.classList.contains('unchosen')){
			console.log('* Add column: '+coll.class);
			coll.select.classList.remove('unchosen');
			coll.select.append(coll.group); //get its own group back
			coll.select.value = coll.id+'0';
			if(--colnum == 0){ break; }
		}
	}}else{ for(let i = collections.length-1; i>=0; i--){
		if(!collections[i].select.classList.contains('unchosen')){ let j = i-1;
			for(; j>=0; j--){
				if(!collections[j].select.classList.contains('unchosen')){ break;}}
			moveColumn(collections[i], collections[j], collections[j].select.value);
			if(++colnum == 0){ break; }
		}
	}}
	
	updateGridTemplate();	
    loadChapter(ChapterSel.value);
    return true;
}

function updateGridTemplate(view){
	let colw = '50px';
	if(!view || view == 'ColumnsView'){
		for(coll of [poetries,proses,illustrations]){ //in the order of display, not of priority 
			if($(coll.select).css('display')=='block'){ colw += ' '+coll.colw; }}
	}else if(view == 'DualView'){ colw += ' minmax(320px, 500px) minmax(320px, 500px)'; 
	}else { colw += ' minmax(80%, 1000px)'; }
	$(ContentDiv).css('grid-template-columns', colw);
	console.log('* grid-template-columns = '+colw);
}

function loadChapter(cid){ cid = Number(cid);
    console.log('-> chapter '+cid);
    let chap = toc.chapters[cid];
	
	//calculate the list of books
	let books = null;
	if(inView(['DualView'])){ books = dualBooks;
	}else{ books = [];
        for(let coll of [poetries,proses,illustrations]){ //in the order of display, not of priority  
			if(!coll.select.classList.contains('unchosen')){
				books.push(coll.book);
	}}}

    //set new content
    while(ContentDiv.children.length > numStaticContents){ ContentDiv.children[numStaticContents].remove(); } 
    for(let vid=chap.from_verse; vid<=chap.to_verse; vid++){
        $('<div class="index" id="v'+vid+'" vid="'+vid+'">').text(vid).appendTo(ContentDiv);
        for(book of books){
			if(book.collection == illustrations){
				 $('<img class="'+illustrations.class+'">')
					.attr('src', book.imgdir+'/iDhp'+('00'+vid).slice(-3)+'.jpg')
					.attr('title','kệ số '+vid).attr('vid',vid)
                    .appendTo(ContentDiv);
			}else{
				res = processVerse(book,vid);
				if(res.num){
					let cell = $('<p class="'+book.collection.class+'">'+res.txt+'</p>')
					if(res.num > 1){
						let p = cell; cell = $('<div class="'+book.collection.class+'">');
						p.appendTo(cell); cell.attr('vn',res.num);
					}
					cell.css('grid-row-start','span '+res.num).attr('vid',vid)
                        .appendTo(ContentDiv);
				}
			}
        }
    }

    // set new footer
    FooterDiv.innerHTML = ''; 
    if(cid > 1) { $('<input type="button" class="chapter">')
        .attr('value',toc.chapters[cid-1].title+' ◁')
        .attr('onclick','ChapterSel.value='+(cid-1)+'; $(ChapterSel).trigger("change");').appendTo(FooterDiv); }
    $('<input type="button" class="chapter">').attr('value','△')
        .attr('onclick','scrollToTop();').appendTo(FooterDiv);
    if(cid < numchapters) { $('<input type="button" class="chapter">')
        .attr('value','▷ '+toc.chapters[cid+1].title)
        .attr('onclick','ChapterSel.value='+(cid+1)+'; $(ChapterSel).trigger("change");').appendTo(FooterDiv); }
    if(VerseId.value < chap.from_verse || VerseId.value > chap.to_verse){
        VerseId.value = chap.from_verse; $(VerseId).trigger("change");
    }else{ updateURL();}

    // context menu for each content
    for(let i=numStaticContents; i<ContentDiv.children.length; i++){
        ContentDiv.children[i].onmouseover = contentHover;
        ContentDiv.children[i].oncontextmenu = contentContextMenu;
    }
}

currentVid = 0; currentVnum = 0;
function contentHover(event){ 
    currentVid = Number($(this).attr('vid')); 
    currentVnum = Number($(this).attr('vn'));
    // for multi-verse div, re-compute currentVid using relative mouse pos
    let p = (event.pageY-this.offsetTop) / this.scrollHeight * 0.98 + 0.01;
    let vn = currentVnum; if(!vn){ vn = 1;}
    //console.log('DEBUG: vid='+currentVid+' vn='+vn+' p='+p+' (pageY='+event.pageY+', top='+this.offsetTop+', height='+this.scrollHeight+')');
    currentVid = Math.round(currentVid + vn*p - 0.5);
    let v = $('#v'+currentVid)[0];
    // then show the context menu right under currentVid index
    $(ContextMenu).css('top',v.offsetTop+v.clientHeight 
        - parseFloat($(v).css('padding-bottom')));
    $(ContextMenu).css('left',v.offsetLeft + $(v).width()/2);
    ContextMenu.classList.remove('hidden'); 
}
function contentContextMenu(){
    console.log(this);
    return false;
}
ContentDiv.onmouseleave = function(){ ContextMenu.classList.add('hidden');}
ContextMenuButton.onmouseover = function(){ 
    ContextMenuList.classList.remove('hidden'); 
    let hash = window.location.hash.replace(/\/[0-9]*$/,'/'+currentVid);
    window.location.replace(hash); 
}
ContextMenu.onmouseleave = function(){ 
    ContextMenu.classList.add('hidden'); 
    ContextMenuList.classList.add('hidden'); 
}
CopyLinkVerse.onclick = function(){
    navigator.clipboard.writeText(window.location.href).then(function(){
        alert('Địa chỉ của trang "'+document.title+'"\n['+window.location.href
            +']\nđã được chép vào bộ nhớ tạm. Bạn có thể dán (Ctrl-V) nó vào nơi bạn muốn.');
    }, function(err){ alert('Lỗi không thể ghi vào bộ nhớ tạm:\n'+err+'\nĐịa chỉ của bài kệ '+curentVid+' là\n'+window.location.href);});
};
ShareFB.onclick = function(){
    window.open("https://www.facebook.com/sharer/sharer.php?u=" 
        + encodeURIComponent(window.location.href), 
        "pop", "width=600, height=400");
}
Bookmark.onclick = function(){
    alert('to be implemented...');
}

function processVerse(book,vid){
    let res = {"txt":'', "num":0};
    let txt = book.verses[vid];
    if(isFinite(Number(txt))){ return res; }
    res.num = 1; txt = txt.replace(/\n/g,'<br/>\n');
    res.txt = txt.replace(/(\([0-9]*\))/g, function(p1){
        return '<span class="note_indicator" '+
            'title="'+book.notes[p1.slice(1,-1)]+
            '" onclick="alert(\''+p1+'\\n\''+'+this.title);">'+p1+'</span>'});
    while(++vid <= Object.keys(book.verses).length
    && isFinite(Number(book.verses[vid]))){ res.num++; }
    return res;
}

function scrollToTop(){
    document.body.scrollTop = 0; // For Safari
    document.documentElement.scrollTop = 0; // For Chrome, Firefox, IE and Opera
}

function loadVerse(vid){
    console.log('-> verse '+vid);
    let cid = Number(ChapterSel.value);
    let chap = toc.chapters[cid];
    let step = (vid < chap.from_verse)?-1: (vid > chap.to_verse)?1: 0;
    if(step){
        while((vid < chap.from_verse || vid > chap.to_verse)
            && cid >= 1 && cid <= numchapters){
            cid += step; chap = toc.chapters[cid];
            //console.log('  -> chap '+cid);
        }
        if(cid >= 1 && cid <= numchapters){
            ChapterSel.value = cid; $(ChapterSel).trigger('change');
        }
    }else{ updateURL();}
    scrollToVerse();
}

async function scrollToVerse(jump){
	if(!inView(['ColumnsView','DualView'])){ return; }
    seeking = true;
    let vid = VerseId.value;
    let verse = document.querySelector('#v'+vid);
    //console.log('  scrolling '+vid+' ...> '+verse.offsetTop);
    verse.scrollIntoView({behavior: jump?'auto':'smooth', block: 'center'});
    // wait for the scrolling to finish
    while(toViewport(verse)){ await new Promise(r => setTimeout(r, 100)); }
    //console.log('  scrolling '+vid+' finished. ');
    seeking = false;
}

function updateVerseId(){ //to reflect the one present in current viewport
	if(!inView(['ColumnsView','DualView'])){ return; }
    if(seeking){ return;} // don't mess with auto-scrolling!
    let vid = Number(VerseId.value);
    let verse = document.querySelector('#v'+vid);
    let step = toViewport(verse);
    for(;step; vid += step){
        verse = document.querySelector('#v'+vid);
        if(!toViewport(verse)){ break;}
    }
    VerseId.value = VerseSlide.value = vid;
}

function toViewport(verse){
    return (verse.offsetTop+verse.offsetHeight < window.pageYOffset)? 1:
        (verse.offsetTop > window.pageYOffset+window.innerHeight)? -1: 0;
}

function inView(suspects){
	for(button of [ColumnsView,DualView,PrefacesView,IntroView,HelpView]){
		if(button.parentNode.classList.contains('chosen')){ 
			if(!suspects){ return button.id; }
			let found = false;
			for(view of suspects){ if(button.id == view){ found = true; break;}}
			if(found){ return button.id; }else{ return false;}
		}
	}
}

async function setView(view){ MenuList.classList.add('hidden');
	for(let button of [ColumnsView,DualView,PrefacesView,IntroView,HelpView]){ 
		if(button.id == view){ button.parentNode.classList.add('chosen');
		}else{ button.parentNode.classList.remove('chosen');}
	}
	
	// the book selectors
	for(let coll of collections){ 
		if(view == 'ColumnsView'){ coll.select.classList.remove('hidden'); 
		}else{ coll.select.classList.add('hidden');}
	}
	if(view == 'DualView'){
		DualBook1.classList.remove('hidden');
		DualBook2.classList.remove('hidden');
		DualBook1.value = dualBooks[0].id; DualBook2.value = dualBooks[1].id;
	}else{
		DualBook1.classList.add('hidden');
		if(view != 'PrefacesView'){ DualBook2.classList.add('hidden');
		}else{ DualBook2.classList.remove('hidden');}
	}
	
	// the content
	if(view == 'PrefacesView'){ 
		PrefaceHeader.classList.remove('hidden'); $(DualBook2).trigger('change');
	}else{ PrefaceHeader.classList.add('hidden');}
	updateGridTemplate(view);
	if(view == 'ColumnsView' || view == 'DualView'){
		HeaderDiv.classList.remove('hidden'); FooterDiv.classList.remove('hidden');
		AppendixDiv.classList.add('hidden');
        if(!updateColumns(onMobile? screen.width: window.innerWidth)){ 
            loadChapter(ChapterSel.value);}
	}else{
		HeaderDiv.classList.add('hidden'); FooterDiv.classList.add('hidden');
		AppendixDiv.classList.remove('hidden');
		while(ContentDiv.children.length > numStaticContents){ ContentDiv.children[numStaticContents].remove(); } 
		if(view == 'IntroView'){ $('<h3>Giới thiệu</h3>').appendTo(ContentDiv);
            updateURL();
		}else if(view == 'HelpView'){ $('<h3>Hướng dẫn sử dụng</h3>').appendTo(ContentDiv);
            updateURL();
        }
	}
}

function updateURL(){
    //construct address hash(path) & (sub)title
    let view = inView();
    let hash = '#'+view, title = 'Kinh Pháp Cú';
    if(view=='ColumnsView'||view=='DualView'||view=='PrefacesView'){
        // books
        if(view=='ColumnsView'){
            hash += '/'+poetries.book.id+'-'+proses.book.id+'-'+illustrations.book.id;
        }else if(view=='DualView'){
            hash += '/'+dualBooks[0].id+'-'+dualBooks[1].id;
        }else{ hash += '/'+DualBook2.value; title += ' | Lời dịch giả '+
            DualBook2.options[DualBook2.selectedIndex].text; }

        // chapter & verse
        if(view!='PrefacesView'){
            hash += '/'+ChapterSel.value+'/'+VerseId.value;
            title += ' | '+toc.chapters[ChapterSel.value].title+' #'+VerseId.value;
        }
    }else{
        title += ' | '+$('#'+view)[0].innerText;
    }

    //update the history (URL & title)
    if(!autoNavigating){ window.history.pushState({"hash": hash},'',hash);
    }else{ window.history.replaceState({"hash": hash},'',hash);}
    //window.location.replace(hash);
    document.title = title;
    console.log('  title = '+title);
    console.log('  hash = '+hash);
}
