var $gn = null;

var Br1GerenciaNetHelper = {

    _dummyMode: false,

    init: function(identificadorConta, sandbox)
    {
        var s = document.createElement('script');
        s.type = 'text/javascript';
        var v = parseInt(Math.random() * 1000000);
        var baseUrl = "";
        if (sandbox === true)
            baseUrl = 'https://sandbox.gerencianet.com.br/v1/cdn/';
        else
            baseUrl = 'https://api.gerencianet.com.br/v1/cdn/';

        s.src = baseUrl + identificadorConta + '/' + v;
        s.async = false;
        s.id = identificadorConta;
        if (!document.getElementById(identificadorConta)) {
            document.getElementsByTagName('head')[0].appendChild(s);
        }
        $gn = { validForm: true, processed: false, done: {}, ready: function (fn) { $gn.done = fn; } };

        $gn.ready(function (checkout) {
            console.log("gn.ready");
        });
    },

    /**
     * Habilita ou desabilita o Dummy mode. Se o dummy mode estiver ativado, não será feita nenhuma requisição 
     * à gerenciaNet, apenas retornado um valor de teste
     * @param {boolean} value true para ativar o dummy mode
     */
    setDummyMode: function (value) {
        Br1GerenciaNetHelper._dummyMode = value;  
    },
    
    /**
     * Obtêm o token de pagamento da GerenciaNet, a partir dos dados do cartão. 
     * Esse token será usado na api do GerenciaNet para efetuar o pagamento
     * @param {string} cardNumber Número do cartão , com ou sem espaços 
     * @param {string} cvv Código de verificação
     * @param {string} expiration Validade do cartão, no formato dd/aaaa
     * @param {function} callback Função de retorno que será chamada quando o gerenciaNet responder 
     */
    getPaymentToken: function (cardNumber, cvv, expiration, callback) {
        let aVenc = Br1CreditCardHelper.formatExpiration(expiration).split('/');

        let sCardNumber = Br1Helper.stripNonDigits(cardNumber);
        let parametros = {
            brand: Br1CreditCardHelper.identityBrand(sCardNumber), // bandeira do cartão
            number: sCardNumber, // número do cartão
            cvv: cvv, // código de segurança
            expiration_month: aVenc[0], // mês de vencimento
            expiration_year: aVenc[1], // ano de vencimento
            sandbox: sandbox
        };
        console.log("$gn.checkout.getPaymentToken(" + JSON.stringify(parametros) + ")");

        if (this._dummyMode) 
            callback(null, {
                data: { payment_token: "dummyToken" }
            });
        else
            $gn.checkout.getPaymentToken(parametros, callback);  
    },

    handleError: function (errorInfo) {
        if (errorInfo === null || Br1Helper.isNullOrEmpty(errorInfo.error))
            return { hasError: false };
        else {
            console.error("Erro no gerenciaNet.");
            console.error(errorInfo);

            let propertyFull = null;
            let propertyName = null;
            let errorMessage = "";
            if (typeof errorInfo.error_description === "string")
                errorMessage = errorInfo.error_description;
            else {
                propertyFull = errorInfo.error_description.property;
                propertyName = propertyFull.substr(propertyFull.lastIndexOf("/") + 1);
                errorMessage = errorInfo.error_description.message;
            }

            return {
                hasError: true,
                errorType: errorInfo.error,
                propertyFull: propertyFull,
                propertyName: propertyName,
                errorMessage: errorMessage
            };
        }
    }
};
