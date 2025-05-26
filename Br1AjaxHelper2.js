var Br1AjaxHelper2 = {
    rootUrl: "",
//    onLocalError: null,
    unloading: false,
    handleReturnedErros: true,

    init: function(rootUrl) {
        this.setRootUrl(rootUrl);
        window.addEventListener("beforeunload", this.onBeforeUnload);
    },

    onBeforeUnload: function() {        
        Br1AjaxHelper2.unloading = true;
    },

    log: function(msg) {        
        console.log(`%c [AJAX2] ${msg}`, 'color: blue');
    },

    get: async function (url, params) {
        Br1AjaxHelper2.log(`GET ('${url}', ${JSON.stringify(params)})`);

        return fetch(Br1AjaxHelper2.getUrl(url, params))
                    .then(response => response.json())
                    .then(Br1AjaxHelper2._handleReturnObject)                    
    },

    post: async function (url, params) {
        Br1AjaxHelper2.log(`POST ('${url}', ${JSON.stringify(params)})`);

        return fetch(Br1AjaxHelper2.getUrl(url), {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(params)
        })
        .then(response => response.json())
        .then(Br1AjaxHelper2._handleReturnObject)       
    },

    postWithFiles: async function (url, formData) {
        Br1AjaxHelper2.log(`POST Files ('${url}', ${JSON.stringify(formData)})`);

        return fetch(Br1AjaxHelper2.getUrl(url), {
            method: 'POST',
            body: formData
        })
        .then(response => response.json())
        .then(Br1AjaxHelper2._handleReturnObject)        
    },

    setRootUrl: function (url) {
        Br1AjaxHelper2.rootUrl = url;
        if (!url.endsWith("/"))
            Br1AjaxHelper2.rootUrl += "/";
    },

    getUrl: function (url, queryParams) {
        let fullUrl = "";
        if (url.startsWith("http:") || url.startsWith("https:"))
            fullUrl = url;
        else if (url.startsWith("/"))
            fullUrl = Br1AjaxHelper2.rootUrl + url.substring(1);
        else
            fullUrl = Br1AjaxHelper2.rootUrl + url;

        if (queryParams) {
            const queryString = new URLSearchParams(queryParams).toString();
            fullUrl += "?" + queryString;
        }

        return fullUrl;
    },   

    
    _handleReturnObject: function (returnObj) {
        if (returnObj.ErrorMessage === null || returnObj.ErrorMessage === undefined || this.handleReturnedErros === false) 
        {
            Br1AjaxHelper2.log(`success`);            
            console.log(returnObj);
            return returnObj;        
        }
        Br1AjaxHelper2.log(`error: ${returnObj.ErrorMessage}`);
        throw new Error(returnObj.ErrorMessage);        
    }
};