﻿var Br1AjaxHelper = {
    rootUrl: "",

    onLocalError: null,

    get: function (url, params, successCallback, errorCallback) {
        console.log(`ajax get ('${url}', ${JSON.stringify(params)})`);
        jQuery.getJSON(Br1AjaxHelper.getUrl(url), params,
            function (returnObj) {
                Br1AjaxHelper._ajaxReturn(returnObj, successCallback, errorCallback);
            })
            .fail(function (jqXHR, textStatus, errorThrown) {
                Br1AjaxHelper._ajaxFail(jqXHR, textStatus, errorThrown,
                    errorCallback, url, params);
            });
    },

    post: function (url, params, successCallback, errorCallback) {
        console.log(`ajax post ('${url}', ${JSON.stringify(params)})`);
        
        jQuery.post(Br1AjaxHelper.getUrl(url), params,
            function (returnObj) {
                Br1AjaxHelper._ajaxReturn(returnObj, successCallback, errorCallback);
            })
            .fail(function (jqXHR, textStatus, errorThrown) {
                Br1AjaxHelper._ajaxFail(jqXHR, textStatus, errorThrown, errorCallback,
                    url, params);
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
                Br1AjaxHelper._ajaxFail(jqXHR, textStatus, errorThrown, errorCallback,
                    url, formData);
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

    _ajaxFail: function (jqXHR, textStatus, errorThrown, errorCallback, url, params)
    {       
        let errorMessage;
        
        if (!Br1Helper.isNullOrEmpty(jqXHR.responseJSON) && 
            !Br1Helper.isNullOrEmpty(jqXHR.responseJSON.ErrorMessage))
            // Se veio a propriedade errorMessage em JSON, entendo que o 
            // erro foi tratado no servidor
            errorMessage = jqXHR.responseJSON.ErrorMessage;
        else {
            if (Br1AjaxHelper.onLocalError != null)
            {                
                let mensagem;

                if (Br1Helper.isNullOrEmpty(errorThrown))
                    mensagem = "Erro ao efetuar um request ajax";
                else if (Br1Helper.isString(errorThrown))
                    mensagem = errorThrown;
                else if (!Br1Helper.isNullOrEmpty(errorThrown.message))
                    mensagem = errorThrown.message;
                else
                    mensagem = errorThrown;
                
                let sRespText = "";
                if (!Br1Helper.isNullOrEmpty(jqXHR.responseText))
                    sRespText = jqXHR.responseText.maxSize(1000);
                
                let info = "HTTP Code = " + jqXHR.status + "\n"
                            + "Response Text = " + sRespText + "\n"
                            + "textStatus = " + textStatus + "\n";
                
                let sParametros = "";
                if (params != null)
                {
                    for(let par in params)
                        sParametros += par + "=" + params[par] + ", ";
                    sParametros = sParametros.removeEnd(",", true);
                }

                let sStack = "";
                if (Br1Helper.isNullOrEmpty(errorThrown) 
                    || Br1Helper.isNullOrEmpty(errorThrown.stack))
                    sStack = Error().stack;                    
                else
                    sStack = errorThrown.stack;

                Br1AjaxHelper.onLocalError(mensagem, sStack, url, sParametros, info);
            }        

            errorMessage = "Erro ao efetuar a solicitação ao servidor";
        }
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