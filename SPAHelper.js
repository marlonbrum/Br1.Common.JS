var SPAHelper = {
    // Evento onShowPage => function(pageID)
    onShowPage: null,

    init: function () {
        $("a.show-page").click(this.lnkShowPage_click);

        // Aplica o atributo required
        Br1Helper.applyRequiredAttribute();

        $("input.validate").on("input", this.validatedInput_input);

        // Preciso capturar o click dos botões que fecham o modal para que eles não limpem o estado de navegação.
        $(".modal-close").click(this.modalClose_click);

        // Coloca a informação da página inicial no histórico do browser.
        let initialPage = "#" + $(".page.active").attr("id");
        console.log("replaceState (" + initialPage + ")");
        history.replaceState({ page: initialPage }, null, location.href);

        $(".last-page").click(this.lastPage_click);

        window.addEventListener("popstate", this.windowPopstate);
    },

    windowPopstate: function (event) {
        if (event.state !== null && !Br1Helper.isNullOrWhiteSpace(event.state.page))
            SPAHelper.showPage(event.state.page, false);
    },

    getActivePage: function () {
        return document.querySelector(".page.active");
    },

    showPage: function (pageSelector, addToHistory) {
        if (addToHistory === undefined)
            addToHistory = true;

        $(".page.active").removeClass("active");
        let page = $(pageSelector);
        let display = page.data("display-mode");

        $(pageSelector).addClass("active");

        if (addToHistory) 
            history.pushState({ page: pageSelector }, null, location.href);

        if (Br1Helper.isFunction(this.onShowPage))
            this.onShowPage(page.attr("id"));
    },

    setErrorMsg: function(ctl, msg)
    {
        let jCtl = $(ctl);
        if (jCtl.is("input[type='checkbox']"))
            jCtl = jCtl.parent();

        if (jCtl.parent(".input-group").length > 0)
            jCtl = jCtl.parent();

        let labelMsg = jCtl.next(".error-message");
        if (labelMsg.length == 0)
            jCtl.after($("<span>").addClass("error-message").text(msg));
        else
            labelMsg.text(msg);
    },

    clearPageErrors: function(page) {
        page.find(".error-message").remove();
    },

    clearErrorMsg: function(ctl) {
        let jCtl = $(ctl);
        if (jCtl.is("input[type='checkbox']"))
            jCtl = jCtl.parent();

        jCtl.next(".error-message").remove();
    },

    getFieldDescription: function (field) {
        let fld = $(field);

        if (fld.data("description") !== "")
            return fld.data("description");
        else {
            let desc = fld.closest("input-field").find("label").text().trim();
            if (desc.endsWith(':'))
                return desc.substr(0, desc.length - 1);
            else
                return desc;
        }
    },

    setCustomError: function (field, errorMessage) {
        field.setCustomValidity(errorMessage);
        this.updateErrorMsg(field);
    },

    updateErrorMsg: function (field) {
        // Chama a função de validação do HTML5
        if (!field.checkValidity())
            this.setErrorMsg(field, field.validationMessage);
        else
            this.clearErrorMsg(field);
    },    

    validatePage: function (page) {
        if (page instanceof jQuery)
            page = page[0];

        let pageIsValid = true;

        let fields = page.querySelectorAll(".validate");
        for (let i = 0; i < fields.length; i++) {

            // Chama a função de validação do HTML5
            if ($(fields[i]).is(":visible") && !fields[i].checkValidity())
                pageIsValid = false;
            this.updateErrorMsg(fields[i]);
        }        

        let validateFunction = page.getAttribute("data-validate-function");
        if (!Br1Helper.isNullOrEmpty(validateFunction)) 
            if (Br1Helper.isFunction(window[validateFunction]))
                if (!window[validateFunction]())
                    pageIsValid = false;
       
        return pageIsValid;
    },

    
    removeSharp: function (text) {
        if (text.startsWith("#"))
            return text;
        else
            return text.substr(1);
    },
    
    lnkShowPage_click: function (event) {

        event.preventDefault();
        let lnk = $(event.target).closest("a");
        let currentPage = lnk.closest(".page");
        
        let validate = lnk.data("validate") == undefined || lnk.data("validate") == true;
        let pageIsValid = true;
        if (validate)
            pageIsValid = SPAHelper.validatePage(currentPage);
                    
/*
        let validateFunction = lnk.data("validate");
        
        if (Br1Helper.isFunction(validateFunction)) {
            pageIsValid = window[validateFunction]();
        }*/

        if (pageIsValid) 
            SPAHelper.showPage(lnk.attr("href"));
        return false;
    },

    validatedInput_input: function (event) {
        SPAHelper.updateErrorMsg(event.target);
    },

    modalClose_click: function (event) {
        let modal = $(event.target).closest(".modal");
        var modalInstance = M.Modal.getInstance(modal[0]);
        modalInstance.close();

        event.preventDefault();
        return false;
    },

    lastPage_click: function (event) {
        history.go(-1);

        return false;
    }


};