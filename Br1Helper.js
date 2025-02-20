var Br1Helper =
{
    /**
     * Expressões regulares comuns, usadas para validação de campos */
    RegularExpressions: {
        CEP: /^\d{5}-\d{3}$/,
        Telefone: /^\([1-9]{2}\)(\s9)?\s\d{4}-\d{4}$/,
        MesAno: /^([1-9]|0[1-9]|1[0-2])\/(\d{2}|2\d{3})$/
    },

    Masks: {
        Telefone8Digitos: '(00) 0000-0000#',
        Telefone9Digitos: '(00) 0 0000-0000',
        Cpf: '000.000.000-00',
        Cnpj: '00.000.000/0000-00',
        Data: '00/00/0000',        
        Hora: '00:00',
        DataHora: '00/00/0000 00:00',
        CEP: '00000-000'
    },

    hasValue: function (obj) {
        return obj !== null && typeof obj !== 'undefined';
    },

    isFunction: function (fn) {
        return fn !== null && fn instanceof Function;
    },

    isNullOrEmpty: function (str) {
        return str === null || str === undefined || str === "";
    },

    isNullOrWhiteSpace: function(str) {
        return this.isNullOrEmpty(str) || str.trim() === "";
    },

    isNullOrZero: function (valor) {
        return this.isNullOrEmpty(valor) || valor === "0" || valor === 0;
    },

    isString: function(valor) {
        return (typeof valor === "string" || valor instanceof String);
    },

    addSpinAnimation: function () {
        if (document.getElementById("styleKeyframesSpin") == null) {
            var style = document.createElement('style');
            style.id = "styleKeyframesSpin";
            style.type = 'text/css';
            var keyFrames = '@-webkit-keyframes spin { '
                + ' 0% { -webkit-transform: rotate(0deg); } '
                + ' 100% { -webkit-transform: rotate(360deg); } '
                + '} \r\n'
                + '@keyframes spin { '
                + ' 0% { transform: rotate(0deg); } '
                + ' 100% { transform: rotate(360deg); } '
                + '}';
            style.innerHTML = keyFrames;
            document.getElementsByTagName('head')[0].appendChild(style);
        }
    },
    
    addOverlayMsg: function (ctl, message) {
        if (message === undefined) // Para browsers que não suportarem parâmetros padrão
            message = "Aguarde ...";

        var pos = ctl.offset();
        var w = ctl.outerWidth();
        var h = ctl.outerHeight();

        // Adiciona a div de fundo, transparente
        var ol_bg = jQuery("<div>");
        ol_bg.addClass("overlay-background");
        ol_bg.css({
            position: "absolute",
            top: pos.top + "px",
            left: pos.left + "px",
            width: w,
            height: h,
            backgroundColor: "gray",
            opacity: "0.7",
            display: "flex",
            zIndex: "998"
        });
        ctl[0].overlay_bg = ol_bg;
        jQuery("body").append(ol_bg);

        // Adiciona a div para posicionar o conteúdo (preciso dessa para que o conteúdo não fique transparente)
        var ol = jQuery("<div>");
        ol.addClass("overlay-content");
        ol.css({
            position: "absolute",
            top: pos.top + "px",
            left: pos.left + "px",
            width: w + "px",
            height: h + "px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: "999"
        });

        // Cria o elemento 'keyframes', necessário para a animação
        this.addSpinAnimation();

        // Aqui começa a mensagem "Carregando..."
        let msgBg = jQuery("<div>");
        msgBg.addClass("message-bg");
        msgBg.css({
            backgroundColor: "white",
            padding: "10px 20px",
            borderRadius: "40px",
            display: "flex",
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "center"
        });
        ol.append(msgBg);

        let loader = jQuery("<div>");
        loader.css({
            'border': '5px solid lightgray',
            'border-radius': '50%',
            'border-top': '5px solid #3498db',
            'width': '20px',
            'height': '20px',
            '-webkit-animation': 'spin 1.5s linear infinite', /* Safari */
            'animation': 'spin 1.5s linear infinite',
            'margin-right': '5px'
        });

        msgBg.append(loader);
        msgBg.append(jQuery("<span>").text(message));
        ctl[0].overlay_ct = ol;
        jQuery("body").append(ol);
    },

    clearOverlay: function (ctl) {
        if (ctl[0].overlay_bg !== null && ctl[0].overlay_bg !== undefined)
            ctl[0].overlay_bg.remove();

        if (ctl[0].overlay_ct !== null && ctl[0].overlay_ct !== undefined)
            ctl[0].overlay_ct.remove();
    },

    /**
     * Executa uma pesquisa na Input informada conforme o usuário digita. Para evitar muitas 
     * pesquisas subsequentes, a pesquisa só é executada quando há um intervalo entre as letras
     * digitadas
     * @param {int} delayMS Intervalo em Millisegundos entre uma digitação e outra para que a pesquisa seja acionada 
     * @param {int} minLength Número mínimo de caracteres que deve ser digitado para que a pesquisa seja acionada
     * @param {HTMLObjectElement} inputCtl Input Text onde o texto pesquisado será digitado.
     * @param {function} onSearch Método que será chamado quando a pesquisa for executada
     */
    delayedSearch: function (delayMS, minLength, inputCtl, onSearch)
    {
        inputCtl.on("input", function (event) {
            var searchTextBox = event.target;

            console.log("[Search] OnInput");
            var timeoutRef = searchTextBox.timeoutRef;
            if (timeoutRef !== null)
                clearTimeout(timeoutRef);

            searchTextBox.timeoutRef = setTimeout(function () {
                console.log("[Search] Timeout Ellapsed");
                searchTextBox.timeoutRef = null;
                var searchValue = searchTextBox.value;
                console.log("[Search] searchValue = " + searchValue);
                if (searchValue.length >= minLength) {
                    if (searchTextBox.searchActive) {
                        console.log("[Search] add to search queue");
                        var searchQueue = searchTextBox.searchQueue;
                        if (Br1Helper.isNullOrEmpty(searchQueue)) {
                            searchQueue = new Array();
                            searchTextBox.searchQueue = searchQueue;
                        }
                        searchQueue.push({ value: searchValue, onSearch: onSearch });
                    }
                    else {
                        console.log("[Search] Execute search: " + searchValue);
                        searchTextBox.searchActive = true;
                        let overlayCtl = jQuery(searchTextBox).next();
                        if (overlayCtl != null && overlayCtl.length > 0)
                            Br1Helper.addOverlayMsg(overlayCtl, "Pesquisando ...");
                        onSearch(searchTextBox, searchValue);
                    }
                }
            }, delayMS);
        });
    },
    
    endSearch: function (inputCtl) {
        console.log("[Search] end search");
        inputCtl.searchActive = false;

        var searchQueue = inputCtl.searchQueue;
        var next = null;
        if (searchQueue !== null && searchQueue !== undefined)
            next = searchQueue.pop();

        if (next !== null) {
            console.log("[Search] Execute next search in queue: " + next.value);
            next.onSearch(inputCtl, next.value);
        }
        else
        {
            let overlayCtl = jQuery(inputCtl).next();
            if (overlayCtl != null && overlayCtl.length > 0)
                Br1Helper.clearOverlay(overlayCtl);
        }
    },

    /**
     * Verifica a existencia no objeto dos campos informados no array, e retorna o nome 
     * do primeiro campo que existir no array.
     * @param {any} obj Objeto cujas propriedades serão buscadas
     * @param {Array} fields array de string com o nome das propriedades
     * @return {string} Nome do primeiro campo encontrado no objeto
     */
    getFirstField: function (obj, fields) {
        for (let i = 0; i < fields.length; i++) {
            if (obj.hasOwnProperty(fields[i]))
                return fields[i];
            else if (obj.hasOwnProperty(fields[i].toUpperCase()))
                return fields[i].toUpper();
            else if (obj.hasOwnProperty(fields[i].toLowerCase()))
                return fields[i].toLower();
        }        
    },

    /**
     * Preenche uma dropdown com os itens informados
     * @param {HTMLObjectElement} select Controle SELECT que dever� ser preenchido
     * @param {Array} items Array de objetos com os itens que devem ser preenchidos na combo
     * @param {any} selectedValue Valor do item que deve ser marcado como selecionado (Opcional)
     * @param {string} valueField Nome do campo no array referente ao valor do Item (Opcional, padr�o = 'Codigo')
     * @param {String} textField Nome do campo no array referente ao texto do Item (Opcional, padr�o = 'Nome')
     * @param {String} emptyItem se especificado coloca o texto passado no começo da lista
     */
    fillSelect: function(select, items, selectedValue, valueField, textField, emptyItem)
    {
        valueField = !Br1Helper.isNullOrWhiteSpace(valueField) ? valueField : this.getFirstField(items[0], ["Codigo", "Value"]);
        textField = !Br1Helper.isNullOrWhiteSpace(textField) ? textField : this.getFirstField(items[0], ["Nome", "Text", "Descricao"]);

        select.empty();

        if (emptyItem !== undefined) {
            select.append("<option value=''>" + emptyItem + "</option>");
        }


        for (let i = 0; i < items.length; i++) {
            let opt = jQuery("<option>")
                .attr("value", items[i][valueField])
                .text(items[i][textField]);

            if (items[i][valueField] === selectedValue)
                opt.attr("selected", "selected");

            select.append(opt);
        }
    },

    getPhoneMask: function (telefone) {
        return (telefone.length > 10) ? this.Masks.Telefone9Digitos : this.Masks.Telefone8Digitos;
    },

    /**
     * Aplica a máscara de telefone ao input informado (Usa jQuery)
     * 
     * @param {HTMLElement} input Objeto JQuery com o input na qual a máscara deve ser aplicada
     * @param {string} DDD que será utilizado se não foi digitado pelo usuário
     */
    maskPhone: function (input, dddPadrao) {
        var optTelefone = {
            onKeyPress: function (telefone, e, field, options) {
                let msk = Br1Helper.getPhoneMask(Br1Helper.stripNonDigits(telefone));
                jQuery(field).mask(msk, options);
            }
        };
        let sDddPadrao = dddPadrao;
        if (dddPadrao === undefined)
            sDddPadrao = "00";

        input.each(function (index, element) {
            let tel = Br1Helper.stripNonDigits(element.value);

            if (tel.length === 0) {
                if (!Br1Helper.isNullOrEmpty(dddPadrao))
                    element.value = "(11)";
            }
            else {
                // Adiciona o DD se não tiver sido informado
                if (!Br1Helper.isNullOrEmpty(dddPadrao) && (tel.length === 8 || tel.length === 9))
                    tel = sDddPadrao + tel;
                element.value = tel;
            }

            // Identifica a máscara (Celular ou Tel.Fixo)
            let mascara = Br1Helper.getPhoneMask(tel);            

            jQuery(element).mask(mascara, optTelefone);
            jQuery(element).attr("maxlenght", 20); 
        });        
    },

    maskDate: function (input) {
        input.mask(this.Masks.Data);
    },

    maskTime: function (input) {
        input.mask(this.Masks.Hora);
    },

    changeValue: function (input, valor) {
        if (valor === undefined)
            return;

        input.value = valor;
        if ("createEvent" in document) {
            var evt = document.createEvent("HTMLEvents");
            evt.initEvent("change", false, true);
            input.dispatchEvent(evt);
        }
        else
            input.fireEvent("onchange");
    },
    
    
    pesquisaCEP: function (cepInput, parentContainer) {
        cepInput.addEventListener("blur", event => {
            let cep = event.target.value.trim().replace("-", "");
            if (cep.length == 8) {
                let url = "https://viacep.com.br/ws/" + cep + "/json/";
                jQuery.getJSON(url, null, function (retorno) {
                    if (!retorno.erro)
                    {
                        Br1Helper.changeValue(parentContainer.querySelector(".logradouro input"), retorno.logradouro);
                        Br1Helper.changeValue(parentContainer.querySelector(".bairro input"), retorno.bairro);
                        Br1Helper.changeValue(parentContainer.querySelector(".cidade input"), retorno.localidade);
                        Br1Helper.changeValue(parentContainer.querySelector(".uf select"), retorno.uf);
                    }
                });
            }
        });
    },

    /**
     * Remove da string qualquer caracter que não for um dígito de 0 a 9
     * @param {string} valor string a ser tratada
     * @returns {string} String com apenas os dígitos
     */
    stripNonDigits: function (valor) {
        return valor.replace(/\D/g, "");
    },
    
    /**
     * Verifica se o CPF informado é valido. 
     * @param {string} cpf CPF a ser validado, pode ser informado com ou sem os traços e pontos
     * @returns {bool} Booleano indicando se o CPF é valido ou não
     */
    validarCPF: function (cpf) {
        cpf = Br1Helper.stripNonDigits(cpf);

        var numeros, digitos, soma, i, resultado, digitos_iguais;
        digitos_iguais = 1;
        if (cpf.length < 11)
            return false;
        for (i = 0; i < cpf.length - 1; i++)
            if (cpf.charAt(i) != cpf.charAt(i + 1)) {
                digitos_iguais = 0;
                break;
            }
        if (!digitos_iguais) {
            numeros = cpf.substring(0, 9);
            digitos = cpf.substring(9);
            soma = 0;
            for (i = 10; i > 1; i--)
                soma += numeros.charAt(10 - i) * i;
            resultado = soma % 11 < 2 ? 0 : 11 - soma % 11;
            if (resultado != digitos.charAt(0))
                return false;
            numeros = cpf.substring(0, 10);
            soma = 0;
            for (i = 11; i > 1; i--)
                soma += numeros.charAt(11 - i) * i;
            resultado = soma % 11 < 2 ? 0 : 11 - soma % 11;
            if (resultado != digitos.charAt(1))
                return false;
            return true;
        }
        else
            return false;
    },

    validarEmail: function (email) {
        var re = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
        return re.test(String(email).toLowerCase());
    },

    formatarDinheiroDigitado: function(valorDigitado) 
    {
        valorF = Br1Helper.strToFloat(valorDigitado);
        if (isNaN(valorF))
            return "";
        else
            return valorF.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    },

    formatarDinheiro: function(valor) {
        return Br1Helper.formatarFloat(valor, 2);
	},

    formatarFloat: function(valor, casasDecimais) {
        if (valor === null)
            return "";
            
        if (typeof valor == "string")
            valor = parseFloat(valor);
            
        return valor.toLocaleString("pt-BR", { 
            minimumFractionDigits: casasDecimais, 
            maximumFractionDigits: casasDecimais
        });
	},

    validarCNPJ: function (cnpj) {
        cnpj = cnpj.replace(/[^\d]+/g, '');

        if (cnpj == '') return false;

        if (cnpj.length != 14)
            return false;

        // Elimina CNPJs invalidos conhecidos
        if (cnpj == "00000000000000" ||
            cnpj == "11111111111111" ||
            cnpj == "22222222222222" ||
            cnpj == "33333333333333" ||
            cnpj == "44444444444444" ||
            cnpj == "55555555555555" ||
            cnpj == "66666666666666" ||
            cnpj == "77777777777777" ||
            cnpj == "88888888888888" ||
            cnpj == "99999999999999")
            return false;

        // Valida DVs
        tamanho = cnpj.length - 2
        numeros = cnpj.substring(0, tamanho);
        digitos = cnpj.substring(tamanho);
        soma = 0;
        pos = tamanho - 7;
        for (i = tamanho; i >= 1; i--) {
            soma += numeros.charAt(tamanho - i) * pos--;
            if (pos < 2)
                pos = 9;
        }
        resultado = soma % 11 < 2 ? 0 : 11 - soma % 11;
        if (resultado != digitos.charAt(0))
            return false;

        tamanho = tamanho + 1;
        numeros = cnpj.substring(0, tamanho);
        soma = 0;
        pos = tamanho - 7;
        for (i = tamanho; i >= 1; i--) {
            soma += numeros.charAt(tamanho - i) * pos--;
            if (pos < 2)
                pos = 9;
        }
        resultado = soma % 11 < 2 ? 0 : 11 - soma % 11;
        if (resultado != digitos.charAt(1))
            return false;

        return true;
    
    },

    validarData: function (data) {
        return data.match(new RegExp("^([1-9]|0[1-9]|[12][0-9]|3[01])/([1-9]|0[1-9]|1[012])/[12][0-9]{3}"));
    },

    applyRequiredAttribute: function (event) {
        jQuery("[data-val-required]:not([required])").attr("required", "");
    },

    combinePath: function (path1, path2) {
        return (path1 + "\\" + path2).replace("\\\\\\", "\\").replace("\\\\", "\\");
    },

    dateToStr: function (dt) {
        if (Br1Helper.isNullOrEmpty(dt))
            return "";
        else
            return dt.getDate().toString().padStart(2, "0") + "/" 
                    + (dt.getMonth() + 1).toString().padStart(2, "0") + "/" 
                    + dt.getFullYear().toString();
    },

    
    strToDate: function (str, useDefaultYear) {
        if (Br1Helper.isNullOrWhiteSpace(str))
            return null;
        else 
        {
            let formats = [
                /(?<ano>\d{4})\-(?<mes>\d{2})\-(?<dia>\d{2})T(?<hora>\d{2})\:(?<minuto>\d{2})\:(?<segundo>\d{2}).\d{3}Z/,
                /(?<ano>\d{4})\-(?<mes>\d{2})\-(?<dia>\d{2}) (?<hora>\d{2})\:(?<minuto>\d{2})\:(?<segundo>\d{2})/,
                /(?<ano>\d{4})\-(?<mes>\d{2})\-(?<dia>\d{2}) (?<hora>\d{2})\:(?<minuto>\d{2})/,
                /(?<ano>\d{4})\-(?<mes>\d{2})\-(?<dia>\d{2})/,                
                /(?<dia>\d{2})\\(?<mes>\d{2})\\(?<ano>\d{4}) (?<hora>\d{2})\:(?<minuto>\d{2})/,
                /(?<dia>\d{2})\\(?<mes>\d{2})\\(?<ano>\d{4})/,
                /(?<dia>\d{2})\/(?<mes>\d{2})\/(?<ano>\d{4}) (?<hora>\d{2})\:(?<minuto>\d{2})/,
                /(?<dia>\d{2})\/(?<mes>\d{2})\/(?<ano>\d{4})/
            ];
            
            for (let i = 0; i < formats.length; i++) 
            {
                let matches = str.match(formats[i]);
                if (matches !== null)
                    return new Date(matches.groups.ano, matches.groups.mes - 1, matches.groups.dia, 
                            matches.groups.hora ?? 0, matches.groups.minuto ?? 0, matches.groups.segundo ?? 0);
            }

        }
        
    },

    strToFloat: function(str) {
        return parseFloat(str.replace(/[^\d,]/g, "").replace(",", "."));
    },

    dateToStrInput: function(date) {
        if (Br1Helper.isNullOrEmpty(date))
            return "";
        else
            return date.toISOString().substr(0, 10);
    },

    dateTimeToStr: function(date) {
        if (date === null)
            return "";
        else
            return date.getDate().padStart(2, "0") + "/" 
                    + (date.getMonth() + 1).padStart(2, "0") 
                    + "/" + date.getFullYear()
                    + " " + date.getHours().padStart(2, "0")
                    + ":" + date.getMinutes().padStart(2, "0");
    },

    isDigit: function(char)
    {
        return char >= '0' && char <= '9';
    },

    formatarTamanhoBytes: function(tamanho) {
        if (tamanho < 1024)
            return Br1Helper.formatarFloat(tamanho, 0) + " B";
        else {
            tamanho = tamanho / 1024.0;
            if (tamanho < 1024)
                return Br1Helper.formatarFloat(tamanho, 1) + " KB";
            else
            {
                tamanho = tamanho / 1024.0;
                if (tamanho < 1024)
                    return Br1Helper.formatarFloat(tamanho, 1) + " MB";
                else
                    return Br1Helper.formatarFloat(tamanho / 1024.0, 1) + " GB";
            }
        }
        return tamanho;
    },

    formatarNumero : function(entrada, mascara)
    {
        var str = Br1Helper.stripNonDigits(entrada);

        var result = "";
        var iMask = 0;
        for (var i = 0; i < str.length; i++) {
            while (iMask < mascara.length && !Br1Helper.isDigit(mascara[iMask]))
                result += mascara[iMask++];

            if (iMask >= mascara.length)
                return result;
            else
                result += str[i];
            iMask++;
        }

        return result;
    },
    // 12345678901234567890
    // 24471406 ()
    formatarTelefone: function (entrada, dddPadrao) {
        let tel = Br1Helper.stripNonDigits(entrada);
        if (tel.length === 8 || tel.length === 9)
            tel = dddPadrao + tel;

        let mascara = (tel.length > 10) ? '(00) 0 0000-0000' : '(00) 0000-0000';

        return this.formatarNumero(tel, mascara);
    },

    /**
     * Formata o número informado como moeda
     * @param {number} numero Número que deve ser formatado
     * @param {bool} usarCifrao 
     * @returns 
     */
    formatarMoeda: function (numero, usarCifrao) {
        return (usarCifrao ? "R$ " : "") + numero.toLocaleString("pt-BR", { minimumFractionDigits: 2 });
    },

    insertAfter: function(node, referenceNode) {
        referenceNode.parentNode.insertBefore(node, referenceNode.nextSibling);
    },
    
    /**
     * Carrega os arquivos passados no array, se já não estiverem carregados.
     * Os arquivos passados pode ser scripts .js ou arquivos .css
     */
    loadFiles: function(filesToLoad, callback) {
        if (filesToLoad.length == 0)
        {
            if (Br1Helper.isFunction(callback))
                callback();
        }
        else{
            let file = filesToLoad.pop();
            let extIndex = file.lastIndexOf('.');
            let ext = file.substr(file.lastIndexOf('.')).toUpperCase();

            let element = document.getElementById(file);
            if (element == null)
            {
                if(ext === ".JS")
                {
                    var script = document.createElement('script');
                    script.id = file;
                    script.onload = function () {
                        Br1Helper.loadFiles(filesToLoad, callback);
                    };
                    script.src = file;
                    document.head.appendChild(script); 
                }
                else if (ext === ".CSS")
                {
                    var link  = document.createElement('link');
                    link.id   = file;
                    link.rel  = 'stylesheet';
                    link.type = 'text/css';
                    link.href = file;
                    link.media = 'all';
                    document.head.appendChild(link);

                    Br1Helper.loadFiles(filesToLoad, callback);
                }
            }
            else
                Br1Helper.loadFiles(filesToLoad, callback);
        }
    },
   
    addUrlParameter: function(url, parameter, value)
    {
        let posHash = url.indexOf('#');
        if (posHash > 0)
            url = url.substring(0, posHash - 1);
            
        return url + (url.indexOf('?') > 0 ? '&':'?') 
            + parameter + '=' + encodeURIComponent(value);
    },

    /**
     * Aplica a máscara ao texto informado. Antes de aplicar a máscara, a função irá 
     * remover do texto de origem todos os caracteres que não sejam digitos. 
     * 
     * Ex: 
     * applyMask('12345678901', '999.999.999-99') => '123.456.789-01'
     * applyMask('123*456*789*01', '999.999.999-99') => '123.456.789-01'
     * 
     * @param {string} value Valor a ser formatado
     * @param {string} mask Máscara a ser aplicada, use '9' ou '0' para indicar os dígitos
     * @returns Retorna o valor formatado
     */
    applyMask: function(value, mask)
    {
        let v = Br1Helper.stripNonDigits(value);
        
        let iValor = 0;
        let iMask = 0;
        
        let resultado = "";
        while (iValor < v.length && iMask < mask.length)
        {
            if (mask[iMask] == "0" || mask[iMask] == "9")
                resultado += v[iValor++];                
            else if (iMask < mask.length)
                resultado += mask[iMask];
            iMask++;
        }

        return resultado;
    },

    formatarCPF: function(valor)
    {
        return Br1Helper.applyMask(valor, Br1Helper.Masks.Cpf);
    },

    formatarCNPJ: function(valor)
    {
        return Br1Helper.applyMask(valor, Br1Helper.Masks.Cnpj);
    },

    /**
     * Verifica se o valor passado é um CPF ou CNPJ. 
     * Essa função decide isso contando a quantidade de dígitos numéricos 
     * presentes. 
     */
    identificarDocumento: function(valor)
    {
        valor = Br1Helper.stripNonDigits(valor);
        if (valor.length == 11)
            return "cpf";
        else if (valor.length == 14)
            return "cnpj";
        else
            return null;
    },

    /**
     * Formata o documento passado como CPF ou CNPJ, de acordo com a 
     * quantidade de dígitos
     * @param {string} documento Documento a ser formatado , com ou sem '.' e '-'
     */ 
    formatarDocumento: function(documento)
    {
        switch(Br1Helper.identificarDocumento(documento))
        {
            case "cpf": 
               return Br1Helper.formatarCPF(documento);
            case "cnpj":
                return Br1Helper.formatarCNPJ(documento);
            default:
                return documento;
        }
    },

    /**
     * Informa se o documento passado como parâmetro é um CPF ou CNPJ válido.
     * @param {string} documento Documento a ser validado , com ou sem '.' e '-'
     */ 
    validarDocumento: function(documento)
    {
        switch(Br1Helper.identificarDocumento(documento))
        {
            case "cpf": 
               return Br1Helper.validarCPF(documento);
            case "cnpj":
                return Br1Helper.validarCNPJ(documento);
            default:
                return false;
        }
    },

    arredondar: function(valor, casasDecimais)
    {
        let fator = Math.pow(10, casasDecimais);
        return Math.round(valor * fator) / fator;
    },

    /**
     * Substitui os campos presentes na string, separados pelos delimitadores
     * usando o valor retornado pela função passada
     * @param {string} texto Texto a ser tratado
     * @param {CallableFunction} funcaoValor Função que será chamada a cada campo encontrado para obter o valor.
     * @param {string} delimitadorInicio Delimitador inicial de campo. Valor Padrão: [
     * @param {string} delimitadorFim Delimitador final de campo. Valor Padrão: ]
     * 
     */
    replaceFields: function(texto, funcaoValor, delimitadorInicio = '[', delimitadorFim = ']')
    {
        let textoAlterado = "";
        let iPosInicio = 0;
        let iPosFim = 0;

        while ((iPosInicio = texto.indexOf(delimitadorInicio, iPosInicio + 1)) >= 0)
        {
            textoAlterado += texto.substr(iPosFim, iPosInicio - iPosFim);
            iPosFim = texto.indexOf(delimitadorFim, iPosInicio);
            let campo = texto.substr(iPosInicio + 1, iPosFim - iPosInicio - 1);
            let valor = funcaoValor(campo);
            textoAlterado += valor;
        }

        textoAlterado += texto.substr(iPosFim);
        return textoAlterado;
    }

};



