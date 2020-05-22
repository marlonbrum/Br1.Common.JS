var MsgBoxHelper = {
    msgInfo: function (msgText, callback)
    {
        MsgBoxHelper.customMessage(msgText, ["OK"], callback);
    },

    msgAsk: function (msgText, callback)
    {
        MsgBoxHelper.customMessage(msgText, ["Sim", "Não"], function (button) {
            if (Br1Helper.isFunction(callback))
                callback(button === 0);
        });
    },

    msgConfirm: function (msgText, callback)
    {   
        MsgBoxHelper.customMessage(msgText, ["OK", "Cancelar"], function (button) {
            if (Br1Helper.isFunction(callback))
                callback(button === 0);
        });
    },

    customMessage: function (content, buttons, callback)
    {
        let msgBox = jQuery(".message-box");
        if (msgBox.length == 0)
        {            
            msgBox = jQuery("<div>"); 
            msgBox.addClass("message-box");
            jQuery(document.body).append(msgBox);
        }

        msgBox.empty();
        let divContent = jQuery("<div class='message-content'>");
        msgBox.append(divContent);

        if (typeof content === "string")
            divContent.text(content);
        else
            divContent.append(content); // TODO: Aqui estou passando um objeto puro, verificar se precisa ser Jquery
    
        let buttonBar = jQuery("<div class='buttons'>");
        msgBox.append(buttonBar);

        for (let i=0; i < buttons.length; i++)
        {
            let btn = jQuery("<button class='botao'>");
            buttonBar.append(btn);
            btn.text(buttons[i]);
            btn.data("idx", i);
            btn.click(function(event) {
                let idx = event.target.dataset.idx;
                event.target.closest(".message-box").dataset.button_idx = idx;

                jQuery.modal.close();     
            });
        }
       
        msgBox.modal({ 
            showClose: false,
            escapeClose: false,  
            clickClose: false   
        });

        msgBox.unbind(jQuery.modal.AFTER_CLOSE);

        msgBox.bind(jQuery.modal.AFTER_CLOSE, function(event, modal) {
            let idx = modal.elm[0].dataset.button_idx;
            setTimeout(function() {
                if(callback != null)
                    callback(idx);
            }, 100);
        });     
    }
};