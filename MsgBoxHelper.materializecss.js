
var MsgBoxHelper = {    
    MODAL_INFO: "modal-info",
    MODAL_ERROR: "modal-error",
    MODAL_WARNING: "modal-warning",
    MODAL_QUESTION: "modal-question",
    MAXIMIZE: 5000,

    observer: null,

    __defaultOptions: {
        dialogClassName: "",
        buttonClassName: "",
        title: "",
        onValidate: null,
        beforeShow: null,
        modalHeight: 500
    },

    setOptions(options) {
        Object.assign(this.__defaultOptions, options);
    },

    msgInfo: function (msgText, callback, options) {
        let opt = {dialogClassName: this.MODAL_INFO};
        if (options !== null && options !== undefined)
            Object.assign(opt, options);

        this.customMessage(msgText, ["OK"], callback, opt);
    },

    msgError: function (msgText, callback, options) {
        let opt = {dialogClassName: this.MODAL_ERROR};
        if (options !== null && options !== undefined)
            Object.assign(opt, options);
        this.customMessage(msgText, ["OK"], callback, opt);
    },

    msgWarning: function (msgText, callback, options) {
        let opt = {dialogClassName: this.MODAL_WARNING};
        if (options !== null && options !== undefined)
            Object.assign(opt, options);

        this.customMessage(msgText, ["OK"], callback, opt);
    },

    msgAsk: function (msgText, callback, options) {
        let opt = {dialogClassName: this.MODAL_QUESTION};
        if (options !== null && options !== undefined)
            Object.assign(opt, options);

        this.customMessage(msgText, ["Sim", "Não"], function (button) {
            if (Br1Helper.isFunction(callback))
                callback(button === 0);
        }, opt);
    },

    msgConfirm: function (msgText, callback, options) {
        let opt = {dialogClassName: this.MODAL_QUESTION};
        if (options !== null && options !== undefined)
            Object.assign(opt, options);

        this.customMessage(msgText, ["OK", "Cancelar"], function (button) {
            if (Br1Helper.isFunction(callback))
                callback(button === 0);
        }, opt);
    },

    customMessage: function (msg, buttons, callback, options) 
    {
        let opt = {};
        Object.assign(opt, this.__defaultOptions);  
        Object.assign(opt, options);

        let msgBox = $(".message-box");               
        msgBox.remove();

        let sHtml = `<div class='modal modal-fixed-footer message-box ${opt.dialogClassName}'>
                        <div class='modal-content'></div>
                        <div class='modal-footer'></div>
                    </div>`;
        msgBox = $(sHtml);

        $("body").append(msgBox);

        // msgBox[0].dataset.modalHeight = opt.modalHeight;
        let sTop = "";
        let mHeight = Math.min(opt.modalHeight, window.innerHeight - 100);
        sTop = Math.floor((window.innerHeight - mHeight) / 2) + "px";
        msgBox[0].style.height = mHeight + "px";

        M.Modal.init(msgBox[0], {
            dismissible: false,
            endingTop: sTop,
            onCloseEnd: function () {
                let clickedIndex = parseInt(msgBox.data("clickedIndex"), 10);
                if (Br1Helper.isFunction(callback))
                    callback(clickedIndex);
            }
        });

        let contentBody = "";
        if (opt.title != "")
            contentBody += `<h1 class='modal-header'>${opt.title}</h1>`;
        contentBody += `<div class='modal-content-body'></div>`;
                
        msgBox.find(".modal-content").html(contentBody);
        msgBox.find(".modal-content-body").append(msg);

        var footer = msgBox.find(".modal-footer");
        footer.empty();
        for (var i = 0; i < buttons.length; i++)
            footer.append(
                $("<a>")
                    .attr("href", "#!")
                    .data("button-index", i)
                    .addClass("modal-close waves-effect waves-green btn-flat")
                    .addClass(opt.buttonClassName)
                    .text(buttons[i])
                    .click(function (event) {
                        let clickedIndex = $(event.target).data("button-index");
                        let modalMsgBox = $(event.target).closest(".message-box");

                        if (Br1Helper.isFunction(opt.onValidate))
                            if (!opt.onValidate(clickedIndex, modalMsgBox[0]))
                            {
                                event.preventDefault();
                                return false;
                            }

                        modalMsgBox.data("clickedIndex", clickedIndex);
                    })
            );        

        let instance = M.Modal.getInstance(msgBox[0]);

        if (Br1Helper.isFunction(opt.beforeShow))
           opt.beforeShow(msgBox[0]);

        MsgBoxHelper.centralizar(msgBox[0]);   
        //MsgBoxHelper.observeElement(msgBox[0]);

        msgBox[0].querySelector(".modal-content-body").style.minHeight = (mHeight - 147) + "px";

        instance.open();
    },

    observeElement: function(element) {
        if (MsgBoxHelper.observer == null)
            MsgBoxHelper.observer = new ResizeObserver(MsgBoxHelper.centralizar);
        MsgBoxHelper.observer.observe(element);
    },

    unobserveElement: function(element) {
        if (MsgBoxHelper.observer !== null)
            MsgBoxHelper.observer.unobserve(element);
    },

    centralizar: function(mb) 
    {
        let modalHeight = mb.dataset.modalHeight;

        if (modalHeight > (screen.availHeight - 100))
        {
            mb.style.top = "50px";
            mb.style.bottom = "50px";
            mb.style.height = "";
        }
        else
        {
            let top = Math.floor((screen.availHeight - modalHeight) / 2);
            mb.style.top = top + "px";                
            mb.style.height = modalHeight + "px";
        }        
    }
};