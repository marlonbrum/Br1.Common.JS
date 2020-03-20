var Br1Helper =
{
    // Prefixo utilizado por cada bandeira de cartão. Para a comparação funcionar, esse array deve estar 
    // ordenado do prefixo com mais dígitos para o com menos 
    prefixoBandeiraCartao: [
        ['636368', 'elo'],
        ['438935', 'elo'],
        ['504175', 'elo'],
        ['451416', 'elo'],
        ['509048', 'elo'],
        ['509067', 'elo'],
        ['509049', 'elo'],
        ['509069', 'elo'],
        ['509050', 'elo'],
        ['509074', 'elo'],
        ['509068', 'elo'],
        ['509040', 'elo'],
        ['509045', 'elo'],
        ['509051', 'elo'],
        ['509046', 'elo'],
        ['509066', 'elo'],
        ['509047', 'elo'],
        ['509042', 'elo'],
        ['509052', 'elo'],
        ['509043', 'elo'],
        ['509064', 'elo'],
        ['509040', 'elo'],
        ['36297', 'elo'],
        ['4011 ', 'elo'],
        ['5067', 'elo'],
        ['4576', 'elo'],
        ['6011', 'discover'],
        ['301', 'diners'],
        ['305', 'diners'],
        ['622', 'discover'],
        ['36', 'diners'],
        ['38', 'diners'],
        ['34', 'amex'],
        ['37', 'amex'],
        ['64', 'discover'],
        ['65', 'discover'],
        ['50', 'aura'],
        ['35', 'jcb'],
        ['38', 'hipercard'],
        ['60', 'hipercard'],
        ['4', 'visa'],
        ['5', 'mastercard']
    ],

    hasValue: function (obj) {
        return obj !== null && typeof obj !== 'undefined';
    },

    isFunction: function (fn) {
        return this.hasValue(fn);
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
    
    addOverlayMsg: function (ctl, message = "Aguarde ...") {
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
     * Executa uma pesquisa na Input informada conforme o usu�rio digita. Para evitar muitas 
     * pesquisas subsequentes, a pesquisa s� � executada quando h� um intervalo entre as letras
     * digitadas
     * @param {int} delayMS Intervalo em Millisegundos entre uma digita��o e outra para que a pesquisa seja acionada 
     * @param {int} minLength N�mero m�nimo de caracteres que deve ser digitado para que a pesquisa seja acionada
     * @param {HTMLObjectElement} inputCtl Input Text onde o texto pesquisado ser� digitado.
     * @param {function} onSearch M�todo que ser� chamado quando a pesquisa for executada
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
                        if (searchQueue === null) {
                            searchQueue = new Array();
                            searchTextBox.searchQueue = searchQueue;
                        }
                        searchQueue.push({ value: searchValue, onSearch: onSearch });
                    }
                    else {
                        console.log("[Search] Execute search: " + searchValue);
                        searchTextBox.searchActive = true;
                        Br1Helper.addOverlayMsg(jQuery(searchTextBox).next(), "Pesquisando ...");
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
            Br1Helper.clearOverlay(jQuery(inputCtl).next());
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
        var masks = ['(00) 0000-0000#', '(00) 0 0000-0000'];
        return (telefone.length > 10) ? masks[1] : masks[0];
    },

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

            if (tel.length == 0)
                element.value = "(11)";
            else {
                // Adiciona o DD se não tiver sido informado
                if (tel.length === 8 || tel.length === 9)
                    tel = sDddPadrao + tel;
                element.value = tel;
            }

            // Identifica a máscara (Celular ou Tel.Fixo)
            let mascara = Br1Helper.getPhoneMask(tel);            

            jQuery(element).mask(mascara, optTelefone);
            jQuery(element).attr("maxlenght", 20); 
        });        
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
        cepInput.blur(function (event) {
            let cep = event.target.value.trim().replace("-", "");
            if (cep.length == 8) {
                let url = "https://viacep.com.br/ws/" + cep + "/json/";
                jQuery.getJSON(url, null, function (retorno) {
                    if (!retorno.erro)
                    {
                        Br1Helper.changeValue(document.querySelector(".logradouro input"), retorno.logradouro);
                        Br1Helper.changeValue(document.querySelector(".bairro input"), retorno.bairro);
                        Br1Helper.changeValue(document.querySelector(".cidade input"), retorno.localidade);
                        Br1Helper.changeValue(document.querySelector(".uf select"), retorno.uf);
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

    formatarDinheiro: function(valor) {
        return valor.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
	},

    validarCNPJ: function (cnpj) {
        function validarCNPJ(cnpj) {
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
        }
    },

    validarData: function (data) {
        return data.match(new RegExp("^([1-9]|0[1-9]|[12][0-9]|3[01])/([1-9]|0[1-9]|1[012])/[12][0-9]{3}jQuery"));
    },

    applyRequiredAttribute: function (event) {
        jQuery("[data-val-required]:not([required])").attr("required", "");
    },

    combinePath: function (path1, path2) {
        return (path1 + "\\" + path2).replace("\\\\\\", "\\").replace("\\\\", "\\");
    },
    
    strToDate: function (str, useDefaultYear) {
        if (Br1Helper.isNullOrWhiteSpace(str))
            return null;
        else {
            let parts = str.split('/');
            let dia = parseInt(parts[0], 10);
            let mes = parseInt(parts[1], 10);

            if (dia < 1 || dia > 31 || mes < 1 || mes > 12)
                return null;

            let ano = 0;
            if (parts.length < 3) {
                if (useDefaultYear == true)
                    ano = (new Date()).getFullYear();
                else
                    return null;
            }
            else
                ano = parseInt(parts[2], 10);

            if (ano <= 50)
                ano += 2000;
            else if (ano < 100)
                ano += 1900;

            return new Date(ano, mes - 1, dia);
        }
    },

    isDigit: function(char)
    {
        return char >= '0' && char <= '9';
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

    insertAfter: function(node, referenceNode) {
        referenceNode.parentNode.insertBefore(node, referenceNode.nextSibling);
    },

    /**
     * Identifica a bandeira do cartão de crédito com base no número do cartão.
     * @param {string} numero Número do cartão de crédito
     * @returns {string} Nome da bandeira do cartão
     */
    identificarBandeiraCartao: function(numero)
    {
        for (let i = 0; i < Br1Helper.prefixoBandeiraCartao.length; i++)
            if (numero.startsWith(Br1Helper.prefixoBandeiraCartao[i][0]))
                return Br1Helper.prefixoBandeiraCartao[i][1];
        return "";
    }
};



/*************************************************************************************
 *    Polyfills para métodos de String
 *     (Um polyfill é um método que é adicionado ao tipo caso não exista, para suprir uma 
 *     incompatibilidade de browser. Se o browser já dá suporte ao método nativamente, usa-se
 *     o método do browser, caso contrário, usa-se esses.)
 *************************************************************************************/

if (!String.prototype.endsWith)
    String.prototype.endsWith = function (searchStr, Position) {
        // This works much better than >= because
        // it compensates for NaN:
        if (!(Position < this.length))
            Position = this.length;
        else
            Position |= 0; // round position
        return this.substr(Position - searchStr.length,
            searchStr.length) === searchStr;
    };

if (!String.prototype.startsWith) {
    String.prototype.startsWith = function (searchString, position) {
        position = position || 0;
        return this.indexOf(searchString, position) === position;
    };
}

if (!String.prototype.padStart) {
    String.prototype.padStart = function padStart(targetLength, padString) {
        targetLength = targetLength >> 0; //truncate if number, or convert non-number to 0;
        padString = String(typeof padString !== 'undefined' ? padString : ' ');
        if (this.length >= targetLength) {
            return String(this);
        } else {
            targetLength = targetLength - this.length;
            if (targetLength > padString.length) {
                padString += padString.repeat(targetLength / padString.length); //append to original to ensure we are longer than needed
            }
            return padString.slice(0, targetLength) + String(this);
        }
    };
}

// https://github.com/uxitten/polyfill/blob/master/string.polyfill.js
// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String/padEnd
if (!String.prototype.padEnd) {
    String.prototype.padEnd = function padEnd(targetLength, padString) {
        targetLength = targetLength >> 0; //floor if number or convert non-number to 0;
        padString = String((typeof padString !== 'undefined' ? padString : ' '));
        if (this.length > targetLength) {
            return String(this);
        }
        else {
            targetLength = targetLength - this.length;
            if (targetLength > padString.length) {
                padString += padString.repeat(targetLength / padString.length); //append to original to ensure we are longer than needed
            }
            return String(this) + padString.slice(0, targetLength);
        }
    };
}