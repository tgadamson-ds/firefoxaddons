// TODO:
// if back history is available, use that (as an option in the settings)
// if forward history is available, use that (as an option in the settings)

// Listen for messages from the background script
browser.runtime.onMessage.addListener(onMessage);

function onMessage(message) {
	switch(message.action){
		case "setScrollTop":
			let max = (message.data.maxValue * 0.20) + 150;

			//console.log("scrollTop is " + message.data.scrollTop + " and domain is " + message.data.domain);
			//console.log("calculated max is " + max + " and absolute max is " + message.data.maxValue);

			if(message.data.domain == getDomain(window.location.href) && message.data.scrollTop < max){
				//console.log("what are we doing?");
				document.documentElement.scrollTop = message.data.scrollTop;
			}
			break;
		default:
			break;
	}
}

function sendMessage(action, data){
	browser.runtime.sendMessage({"action": action, "data": data});
}

function next(){
	generic("next");
}

function prev(){
	generic("prev");
}

window.addEventListener("keyup", function (event) {
	keyutils.parseKeyboardShortcut("n", event, next, true);
	keyutils.parseKeyboardShortcut("p", event, prev, true);
	keyutils.parseKeyboardShortcut("b", event, prev, true);
	keyutils.parseKeyboardShortcut("o", event, genericOpen, true);
}, true);

/// Neat URL code
function getDomain(url) {
	if(url == undefined || url == null) return null;

    let hostname = url.replace("www.", ""); // leave www out of this discussion. I don't consider this a subdomain
    //find & remove protocol (http, ftp, etc.) and get hostname

    if (url.indexOf("://") > -1) {
        hostname = hostname.split('/')[2];
    }
    else {
        hostname = hostname.split('/')[0];
    }

    //find & remove port number
    hostname = hostname.split(':')[0];
    //find & remove "?"
    hostname = hostname.split('?')[0];

    return hostname;
}

function parseLink(link) {
    let baseUrl = location.href.substring(0,location.href.lastIndexOf('/'));
    if (link.indexOf('/') != -1) {
        link = link.substring(link.lastIndexOf('/'));
    } else {
        link = "/"+ link;
    }
    let fullUrl = baseUrl + link;
    return fullUrl
}

function replacelocation(tag, website){
	/*
	if(tag.href.indexOf("#") == tag.href.length - 1){
		tag.click();
		return;
	}*/
	replacelocationbyurl(tag.href, website);
}

function replacelocationbyurl(value, website){
	//console.log(value + " - " + website);
	let maxValue = document.documentElement.scrollHeight - document.documentElement.clientHeight;
	sendMessage("changeUrl", {url: value, scrollTop: document.documentElement.scrollTop, domain: getDomain(value), maxValue: maxValue});
}

function generic(mode){
	let location = window.location.href;
	let lastIndex = location.lastIndexOf("=");
	let pageNumber = location.substring(lastIndex+1);
	let stringlength = 1;
	let foundMatch = lastIndex > -1; // was foundMatch = false
	let prefix = "";
	let extension = "";

	let ahrefs = document.getElementsByTagName("a");
	let i = 0;

	// phoronix.com, http://punbb.informer.com, FluxBB
	// http://www.phoronix.com/forums/forum/phoronix/latest-phoronix-articles/823939-the-best-most-efficient-graphics-cards-for-1080p-linux-gamers/page2
	let linkTags = window.document.getElementsByTagName("link");
	for(i = 0; i < linkTags.length; i++){
		if(linkTags[i].getAttribute("rel") == mode){
			this.replacelocation(linkTags[i], "<link rel");
			return;
		}
	}
	
	// reddit.com, phpBB, xkcd home page
	let atags = document.getElementsByTagName("a");
	for(i = 0; i < atags.length; i++){
		if(atags[i].hasAttribute("rel")){
			if(atags[i].getAttribute("rel").indexOf(mode) > -1){
				this.replacelocation(atags[i], "<a rel");
				return;
			}
		 }
	}

	// MyBB
	if(mode == "next"){
		let value = document.getElementsByClassName("pagination_next")[0];
		if(value != undefined){
			this.replacelocation(document.getElementsByClassName("pagination_next")[0], "mybb (pagination_next)");
			return;
		}
	}
	
	if(location.indexOf("techradar.com") > -1){
		if (mode == "next" && location.lastIndexOf("/") < location.length - 3){ // there is no page filled in, add it
			this.replacelocationbyurl(window.location.href + "/2", "techradar.com");
			return;
		}

		if(location.lastIndexOf("/") > -1 && location.lastIndexOf("/") > location.length - 3){
			// increment or decrement
			lastIndex = location.lastIndexOf("/");
			pageNumber = location.substring(lastIndex+1);
				
			if(mode == "next"){
				window.location.href = window.location.href.substring(0, lastIndex) + "/" + (parseInt(pageNumber) + 1)
			}else{
				if(parseInt(pageNumber) == 2){
					window.location.href = window.location.href.substring(0, lastIndex) // there is a page filled in, remove it
				}else{
					window.location.href = window.location.href.substring(0, lastIndex) + "/" + (parseInt(pageNumber) - 1)
				}
			}
			return;
		}
	}
	
	// webwereld.nl, computerworld.nl etc.
	let paginatorNext = window.document.getElementsByClassName("paginator-next")[0];
	let paginatorPrevious = window.document.getElementsByClassName("paginator-previous")[0];
	
	if(mode == "next"){
		if(paginatorNext != undefined){
			this.replacelocation(paginatorNext, "webwereld next");
		}
	}else{
		if(paginatorPrevious != undefined){
			this.replacelocation(paginatorPrevious, "webwereld previous");
		}
	}
	
	// jenkov.com
	let nextPageJenkovCom = window.document.getElementsByClassName("nextArticleInCategory")[0];
	if(nextPageJenkovCom != null){
		if(mode == "next"){
			this.replacelocation(nextPageJenkovCom.parentElement, "jenkov.com");
			return;
		}else{
			window.history.back();
			return;
		}
	}
	
	// waarmaarraar.nl (prev/next article)
	if(location.indexOf("waarmaarraar.nl") > -1){
		let container = document.getElementsByClassName("span7")[0];
		let ahrefs = container.getElementsByTagName("a");
		let newahrefs = [];
		
		for(counter = 0; counter < ahrefs.length; counter++){
			let hrefattribute = ahrefs[counter].href;
			if(hrefattribute == null){
				continue;
			}
			if(hrefattribute.indexOf("/pages/re") > -1){
				newahrefs.push(ahrefs[counter]);
			}
		}

		if(newahrefs.length == 2){
			if(mode == "next" ){
				this.replacelocation(newahrefs[1], "waarmaarraar.nl next");
			}else{
				this.replacelocation(newahrefs[0], "waarmaarraar.nl prev");
			}
			return;
		}
		if(newahrefs.length == 1){
			// there is no previous/next page?
			this.replacelocation(newahrefs[0], "waarmaarraar.nl next/prev");
			return;
		}
	}

	for(let href of ahrefs){
		// Phoronix may use this as well
		if(mode == "next"){
			a(href, "next");
			a(href, "volgende");
			if(href.getAttribute("rel") == "next"){
				this.replacelocation(href, "relnext");
			}
		}
		if(mode == "prev"){
			a(href, "previous");
			a(href, "vorige");
			if(href.getAttribute("rel") == "prev"){
				this.replacelocation(href, "relprev");
			}
		}
	}

	try{
		if(mode == "next"){
			let nextLinks = document.getElementsByClassName("mw-nextlink");
			if(nextLinks != null) nextLinks[0].click();
		}

		if(mode == "prev"){
			let prevLinks = document.getElementsByClassName("mw-prevlink");
			if(prevLinks != null) prevLinks[0].click();
		}
	}catch(e){
		//
	}
	
	if(location.indexOf("moneygram-live.com") > -1){
		for(let index = 1; index < 10; index++){
			if(moneyGramPhoto(index, mode)) return;
		}
	}
	
	// https://moneygram-live.com/wp-content/uploads/2017/12/2326.jpg
	if(!foundMatch){
		lastIndex = location.lastIndexOf(".");
		if(lastIndex >= (location.length - 5)){
			// Dealing with an extension, let's take the substring and assign the rest to extension (taking into account the slash)
			let temp = location.substring(0, lastIndex);
			extension = location.substring(lastIndex);

			// Copy-paste from below
			if(!foundMatch){
				lastIndex = temp.lastIndexOf("page-");
				if(lastIndex != -1){
					prefix     = temp.substring(0, lastIndex + 5);
					pageNumber = temp.substring(lastIndex + 5);
					foundMatch = true;
				}
			}

			// /page1
			// https://www.febelfin.be/sites/default/files/pocket/files/assets/basic-html/page34.html
			if(!foundMatch){
				lastIndex = temp.lastIndexOf("/page");
				if(lastIndex != -1){
					prefix     = temp.substring(0, lastIndex + 5)
					pageNumber = temp.substring(lastIndex + 5);
					foundMatch = true;
				}
			}

			// WordPress, i.e. https://frostwire.wordpress.com/page/2/
			if(!foundMatch){
				lastIndex = temp.lastIndexOf("/page/");
				if(lastIndex != -1){
					prefix     = temp.substring(0, lastIndex + 6);
					pageNumber = temp.substring(lastIndex + 6);
					foundMatch = true;
				}
			}
			
			// generic with extension
			if(!foundMatch){
				lastIndex = temp.lastIndexOf("/");
				if(lastIndex != -1){
					prefix     = temp.substring(0, lastIndex + 1);
					pageNumber = temp.substring(lastIndex + 1);
					foundMatch = true;
				}
			}
		}
	}
	
	if(!foundMatch){
		extension = "";
	}
	
	//page-1
	if(!foundMatch){
		lastIndex = location.lastIndexOf("page-");
		if(lastIndex != -1){
			prefix     = location.substring(0, lastIndex + 5);
			pageNumber = location.substring(lastIndex + 5);
			foundMatch = true;
		}
	}

	// /page1
	if(!foundMatch){
		lastIndex = location.lastIndexOf("/page");
		if(lastIndex != -1){
			prefix     = location.substring(0, lastIndex + 5)
			pageNumber = location.substring(lastIndex + 5);
			foundMatch = true;
		}
	}

	// WordPress, i.e. https://frostwire.wordpress.com/page/2/
	if(!foundMatch){
		lastIndex = location.lastIndexOf("/page/");
		if(lastIndex != -1){
			prefix     = location.substring(0, lastIndex + 6);
			pageNumber = location.substring(lastIndex + 6);
			foundMatch = true;
		}
	}
	
	// https://site.org/user/5989765/
	if(!foundMatch){
		lastIndex = location.lastIndexOf("/");
		lastIndex = location.lastIndexOf("/", lastIndex - 1);

		if(lastIndex != -1){
			prefix     = location.substring(0, lastIndex + 1);
			pageNumber = location.substring(lastIndex + 1);
			foundMatch = true;
		}
	}

	// Test URL: http://mspaintadventures.com/?s=6&p=009999 => going over the limit, strip a zero if there is one present!
	let startI = 0;
	let endsWithNine = pageNumber.lastIndexOf("9") == pageNumber.length - 1;
	if(endsWithNine && mode == "next"){
		startI = 1;
	}

	// Declarations for bug 20
	let leadingZeros = "";
	let pageNumberLength = pageNumber.length;
	
	if (isNumber(parseInt(pageNumber) + 1)){
		let pagenum = parseInt(pageNumber);

		if(mode == "next") pagenum += 1;
		if(mode == "prev") pagenum -= 1;
		if(pagenum < 0) return;

		// Fix bug 20
		// Test URL: http://mspaintadventures.com/?s=6&p=001904
		// Test URL: http://mspaintadventures.com/?s=6&p=009999
		// Prevent 09 on Phoronix / Test URL: https://www.phoronix.com/scan.php?page=article&item=epyc-7601-linux&num=10
		if(pageNumber.indexOf("0") == 0){
			if(pageNumberLength != (pagenum + "").length){
				let endsWithZero = pageNumber.lastIndexOf("0") == pageNumber.length - 1;
				if(endsWithZero && mode == "prev"){
					leadingZeros = "0";
				}
				
				for (let i = startI; i < pageNumber.length; i++) {
					if(pageNumber[i] != "0") break;
					leadingZeros += "0";
				}
			}
		}

		// reworked this for bug 21
		let addendum = "";
		if(pageNumber.indexOf("/") > -1){
			addendum = pageNumber.substring(pageNumber.indexOf("/"));
		}

		// not sure if we need this.
		if(isNumber(addendum)){
			addendum = "";
		}
		addendum += extension;
		
		if(prefix == "") prefix = location.substring(0,lastIndex + stringlength);
		
		this.replacelocationbyurl(prefix + leadingZeros + pagenum + addendum, "generic");
	}
}

function isNumber(n){
	return !isNaN(n);
}

function a(tag, term){
	let text = tag.textContent.toLowerCase().replace(" ", "").replace("«", "").replace("»", "");
	if(text.indexOf(term) == 0){
		this.replacelocation(tag, "a " + " " + term);
	}
}

function genericOpen(){
	let i = 0;
	let location= window.location.href;

	// waarmaarraar.nl
	if(location.indexOf("waarmaarraar.nl") > -1){
		// Read more
		let nextPageWMR = window.document.getElementsByClassName("readmore")[0];
		if(nextPageWMR != null){
			let alink = nextPageWMR.getElementsByTagName("a")[0];
			if(mode == "next"){
				window.location.href = alink.href;
				return;
			}
		}
		// Bronsite
		let alinks = document.getElementsByTagName("a");
		for(i = 0; i < alinks.length; i++){
			// ©
			let onclick = "";
			try{
				onclick = alinks[i].getAttribute("onclick");
			}catch(e){
				continue;
			}
			if(onclick == null){
				continue;
			}
			
			if(onclick.indexOf("/bronsite/") > -1){
				window.location.href = alinks[i].href;
				return;
			}
		}
	}
	
	if(location.indexOf("reddit.com") > -1){
		// reddit interstitial page
		let interstitial = document.getElementsByClassName("interstitial")[0];
		if(interstitial != undefined){
			let buttons = document.getElementsByTagName("button");
			for(let button of buttons){
				if(button.getAttribute("value") == "yes"){
					button.click();
					return;
				}
			}
		}
		
		let titles = document.getElementsByClassName("title");
		for(let title of titles){
			if(title.hasAttribute("href")){
				window.location.href = title.href;
				return;
			}
		}
	}
	
	if(location.indexOf("phoronix.com") > -1){
		let commentsLabels = document.getElementsByClassName("comments-label");
		if(commentsLabels != null)
			window.location.href = "https://www.phoronix.com" + commentsLabels[0].getElementsByTagName("a")[0].href;
	}

	if(location.indexOf("twoo.com") > -1){
		let profielBezoeken = document.getElementById("profielbezoeken");
		if(profielBezoeken != null)
			profielBezoeken.click();
	}
	
	if(location.indexOf("moneygram-live.com") > -1){
		// There is no dash of significance present
		if(document.title.indexOf("Seite nicht gefunden") > -1){
			if(window.location.href.replace("wp-content", "").replace("moneygram-live.com", "").indexOf("-") == -1){
				if(mode == "next"){
					window.location.href = window.location.href.replace(".jpg", "-1.jpg");
					return true;
				}
			}
		}
	}
}

function moneyGramPhoto(index, mode){
	let newPageIndex = index + 1;
	let newPageIndexString = "";
	
	if(mode == "prev"){
		newPageIndex = index - 1;
	}
	
	// Index 0 does not exist
	if(newPageIndex != 0){
		newPageIndexString = "-" + newPageIndex;
	}

	// Does current index exist? If so, increment or decrement it
	if (window.location.href.indexOf("-" + index) > -1){
		window.location.href = window.location.href.replace("-" + index + ".jpg", newPageIndexString + ".jpg");
		return true;
	}
	
	return false;
}
