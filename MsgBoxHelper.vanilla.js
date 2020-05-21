var MsgBoxHelper = {
    msgInfo: function (msgText, callback)
    {
        customMessage(msgText, ["OK"], callback);
    },

    msgAsk: function (msgText, callback)
    {
        customMessage(msgText, ["Sim", "Não"], function (button) {
            if (isFunction(callback))
                callback(button === 0);
        });
    },

    msgConfirm: function (msgText, callback)
    {   
        customMessage(msgText, ["OK", "Cancelar"], function (button) {
            if (isFunction(callback))
                callback(button === 0);
        });
    },

    customMessage: function (content, buttons, callback)
    {
        let msgBox = document.querySelector(".message-box");
        if (msgBox == null)
        {            
            msgBox = document.createElement("div"); 
            msgBox.classList.add("message-box");
            document.body.appendChild(msgBox);
        }

        Br1DomHelper.clearChilds(msgBox);

        
        let divContent = Br1DomHelper.append(msgBox, "div", "message-content");

        if (typeof content === "string")
            divContent.innerText = content;
        else
        {
            Br1DomHelper.clearChilds();
            divContent.appendChild(content);
        }
        
        let buttonBar = Br1DomHelper.append(msgBox, "div", "buttons");
        for (let i=0; i < buttons.length; i++)
        {
            let btn = Br1DomHelper.append(buttonBar, "button", "botao", buttons[i]);            
            btn.dataset.idx = i;
            btn.addEventListener("click", function(event) {
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