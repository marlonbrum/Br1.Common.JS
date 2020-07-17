var Br1Autosave = {

    ST_NONE: "none",
    ST_OPEN: "open",
    ST_CLOSED: "closed",

    // Evento onClear
    onClear: null,

    initForm: function (form) {
        if (Br1Helper.isNullOrWhiteSpace(form.id)) 
            throw new Error("O formulario deve ter um ID para usar o Autosave");

        this.bindControls(form);

        if (this.getStatus(form) === this.ST_OPEN)
            this.setStatus(form, this.ST_CLOSED);

    },

    bindControls: function (parent, d) {
        let controls = this.getControlList(parent);

        for (let i = 0; i < controls.length; i++) {
            controls[i].addEventListener("change", Br1Autosave.control_change);
        }
    },

    getStatus: function (form) {
        let status = localStorage[this.getKeyPrefix(form) + ".status"];
        if (Br1Helper.isNullOrWhiteSpace(status))
            return Br1Autosave.ST_NONE;
        else
            return status;
    },

    setStatus: function (form, value) {
        localStorage[this.getKeyPrefix(form) + ".status"] = value;
    },
    
    getControlList: function (parent) {
        let controlList = Array.from(parent.querySelectorAll("input, select, textarea"));
        /*
        let chks = parent.querySelectorAll("input[type=checkbox]");
        for (let i = 0; i < chks.length; i++) {
            let lst = chks[i].closest(".checkbox-list");
            if (lst === null)
                controlList.push(chks[i]);
            else {
                if (!lst.adicionada) {
                    controlList.push(chks[i]);
                    lst.adicionada = true;
                }
            }
        }*/

        return controlList;
    },

    getKeyPrefix: function (form) {
        let sFormID;
        if (typeof form === "string" || form instanceof String)
            sFormID = form;
        else
            sFormID = form.id;
        return "as_" + sFormID + "_";
    },

    setItem: function (form, name, valor) {
        localStorage.setItem(this.getKeyPrefix(form) + name, valor);
    },

    getItem: function (form, name) {
        return localStorage.getItem(this.getKeyPrefix(form) + name);
    },

    loadAutosave: function (form) {
        if (this.getStatus(form) !== this.ST_NONE) {
            let controls = this.getControlList(form);
            for (let i = 0; i < controls.length; i++) {
                let valor = localStorage[this.getControlKey(controls[i])];
                if (!Br1Helper.isNullOrWhiteSpace(valor))
                    this.loadControl(controls[i], valor);
            }

            this.setStatus(form, this.ST_OPEN);
        }
    },

    getControlKey: function (ctl) {
        let sKey = this.getKeyPrefix(ctl.form);

        if (!Br1Helper.isNullOrWhiteSpace(ctl.name))
            return sKey + ctl.name;
        else if (!Br1Helper.isNullOrWhiteSpace(ctl.id))
            return sKey + ctl.id;
        else
            return "";
    },

    clear: function (form) {
        this.setStatus(form, this.ST_NONE);

        for (let i = localStorage.length - 1; i >= 0; i--) {
            let key = localStorage.key(i);
            if (key.startsWith(this.getKeyPrefix(form)))
                localStorage.removeItem(key);
        }

        if (Br1Helper.isFunction(this.onClear))
            this.onClear(form);
    },

    loadControl: function (control, value) {
        if (control.type === "checkbox") {
            if (control.closest(".checkbox-list") === null)
                control.checked = value === "true";
            else 
                control.checked = value.indexOf("[" + control.value + "]") > -1;
        }
        else if (control.type === "radio") {
            if (control.value === value)
                control.checked = true;
        }
        else
            control.value = value;  
    },

    saveControl: function (control) {
        let key = "";
        let value = null;

        if (control.type === "checkbox") {
            let lst = control.closest(".checkbox-list");
            if (lst === null)
                value = control.checked ? "true" : "false";
            else {
                let chks = lst.querySelectorAll("input[type=checkbox]");
                value = "";
                for (let i = 0; i < chks.length; i++)
                    if (chks[i].checked && !Br1Helper.isNullOrEmpty(chks[i].value))
                        value += "[" + chks[i].value + "]";
            }
        }
        else if (control.type === "radio") {
            if (control.checked)
                value = control.value;
        }
        else
            value = control.value;


        if (value !== null) {
            key = Br1Autosave.getControlKey(control);
            if (!Br1Helper.isNullOrWhiteSpace(key)) {
                if (Br1Autosave.getStatus(control.form) === Br1Autosave.ST_CLOSED)
                    Br1Autosave.clear(control.form);

                localStorage.setItem(key, value);
                Br1Autosave.setStatus(control.form, Br1Autosave.ST_OPEN);
            }
        }
    },

    control_change: function (event) {
        Br1Autosave.saveControl(event.target);
    }
};