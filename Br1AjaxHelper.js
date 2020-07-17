var Br1AjaxHelper = {
    rootUrl: "",

    get: function (url, params, successCallback, errorCallback) {
        console.log(`ajax get ('${url}', ${JSON.stringify(params)})`);
        jQuery.getJSON(Br1AjaxHelper.getUrl(url), params,
            function (returnObj) {
                Br1AjaxHelper._ajaxReturn(returnObj, successCallback, errorCallback);
            })
            .fail(function (jqXHR, textStatus, errorThrown) {
                Br1AjaxHelper._ajaxFail(jqXHR, textStatus, errorThrown, errorCallback);
            });
    },

    post: function (url, params, successCallback, errorCallback) {
        console.log(`ajax post ('${url}', ${JSON.stringify(params)})`);
        
        jQuery.post(Br1AjaxHelper.getUrl(url), params,
            function (returnObj) {
                Br1AjaxHelper._ajaxReturn(returnObj, successCallback, errorCallback);
            })
            .fail(function (jqXHR, textStatus, errorThrown) {
                Br1AjaxHelper._ajaxFail(jqXHR, textStatus, errorThrown, errorCallback);
            });
    },

    postWithFiles: function (url, formData, successCallback, errorCallback) {
        jQuery.ajax({
            url: Br1AjaxHelper.getUrl(url),
            data: formData,
            type: 'POST',
            contentType: false, // NEEDED, DON'T OMIT THIS (requires jQuery 1.6+)
            processData: false, // NEEDED, DON'T OMIT THIS
            success: function (returnObj) {
                Br1AjaxHelper._ajaxReturn(returnObj, successCallback, errorCallback);
            }
        })
            .fail(function (jqXHR, textStatus, errorThrown) {
                Br1AjaxHelper._ajaxFail(jqXHR, textStatus, errorThrown, errorCallback);
            });
    },

    setRootUrl: function (url) {
        Br1AjaxHelper.rootUrl = url;
        if (!url.endsWith("/"))
            Br1AjaxHelper.rootUrl += "/";
    },

    getUrl: function (url) {
        if (url.startsWith("/"))
            return Br1AjaxHelper.rootUrl + url.substring(1);
        else
            return Br1AjaxHelper.rootUrl + url;
    },

    _handleErrorMessage: function (errorMessage, errorCallback) {
        let showErrorMessage = true;
        if (Br1Helper.isFunction(errorCallback))
        {
            showErrorMessage = errorCallback(errorMessage);
            if (showErrorMessage === undefined)
                showErrorMessage = true;
        }
        if (showErrorMessage)
            MsgBoxHelper.msgInfo(errorMessage);
    },

    _ajaxFail: function (jqXHR, textStatus, errorThrown, errorCallback)
    {
        let errorMessage;
        if (!Br1Helper.isNullOrEmpty(jqXHR.responseJSON) && !Br1Helper.isNullOrEmpty(jqXHR.responseJSON.ErrorMessage))
            errorMessage = jqXHR.responseJSON.ErrorMessage;
        else
            errorMessage = "Erro ao efetuar a solicitação ao servidor";
        console.error('ajax fail:' + errorMessage);
        Br1AjaxHelper._handleErrorMessage(errorMessage, errorCallback);
    },

    _ajaxReturn: function (returnObj, successCallback, errorCallback) {
        if (returnObj.ErrorMessage === null || returnObj.ErrorMessage === undefined) {
            console.log("ajax ok");
            if (Br1Helper.isFunction(successCallback))
                successCallback(returnObj);
        }
        else
        {
            console.error("ajax error: " + returnObj.ErrorMessage);
            Br1AjaxHelper._handleErrorMessage(returnObj.ErrorMessage, errorCallback);
        }
    }
};