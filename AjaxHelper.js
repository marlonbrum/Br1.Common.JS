var AjaxHelper = {
    rootUrl: "",

    get: function (url, params, successCallback, errorCallback) {
        $.getJSON(this.getUrl(url), params,
            function (returnObj) {
                AjaxHelper._ajaxReturn(returnObj, successCallback, errorCallback);
            })
            .fail(function (jqXHR, textStatus, errorThrown) {
                AjaxHelper._ajaxFail(jqXHR, textStatus, errorThrown, errorCallback);
            });
    },

    post: function (url, params, successCallback, errorCallback) {
        $.post(this.getUrl(url), params,
            function (returnObj) {
                AjaxHelper._ajaxReturn(returnObj, successCallback, errorCallback);
            })
            .fail(function (jqXHR, textStatus, errorThrown) {
                AjaxHelper._ajaxFail(jqXHR, textStatus, errorThrown, errorCallback);
            });
    },

    postWithFiles: function (url, formData, successCallback, errorCallback) {
        $.ajax({
            url: this.getUrl(url),
            data: formData,
            type: 'POST',
            contentType: false, // NEEDED, DON'T OMIT THIS (requires jQuery 1.6+)
            processData: false, // NEEDED, DON'T OMIT THIS
            success: function (returnObj) {
                AjaxHelper._ajaxReturn(returnObj, successCallback, errorCallback);
            }
        })
            .fail(function (jqXHR, textStatus, errorThrown) {
                AjaxHelper._ajaxFail(jqXHR, textStatus, errorThrown, errorCallback);
            });
    },

    setRootUrl: function (url) {
        this.rootUrl = url;
        if (!url.endsWith("/"))
            this.rootUrl += "/";
    },

    getUrl: function (url) {
        if (url.startsWith("/"))
            return this.rootUrl + url.substring(1);
        else
            return this.rootUrl + url;
    },

    _handleErrorMessage: function (errorMessage, errorCallback) {
        let showErrorMessage = true;
        if (Br1Helper.isFunction(errorCallback))
            showErrorMessage = errorCallback(errorMessage);

        if (showErrorMessage)
            MsgBoxHelper.msgInfo(errorMessage);
    },

    _ajaxFail: function (jqXHR, textStatus, errorThrown, errorCallback)
    {
        var errorMessage;
        if (!Br1Helper.isNullOrEmpty(jqXHR.responseJSON) && !Br1Helper.isNullOrEmpty(jqXHR.responseJSON.ErrorMessage))
            errorMessage = jqXHR.responseJSON.ErrorMessage;
        else
            errorMessage = "Erro ao efetuar a solicitação ao servidor";
        AjaxHelper._handleErrorMessage(errorMessage, errorCallback);
    },

    _ajaxReturn: function (returnObj, successCallback, errorCallback) {
        if (returnObj.ErrorMessage === null || returnObj.ErrorMessage === undefined) {
            if (Br1Helper.isFunction(successCallback))
                successCallback(returnObj);
        }
        else
            AjaxHelper._handleErrorMessage(returnObj.ErrorMessage, errorCallback);
    }
};