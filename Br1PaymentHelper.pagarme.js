var Br1PaymentHelper = {

    init: function(apiUrl, apiKey)
    {
        this.apiUrl = apiUrl;
        this.apiKey = apiKey;
    },

    
    getPaymentToken: function (dadosCartao, callback) {
        let aValidade = Br1CreditCardHelper.formatExpiration(dadosCartao.validade).split('/');

        var data = {
            type: "card",
            card: {
                number: Br1Helper.stripNonDigits(dadosCartao.numero),
                holder_name: dadosCartao.nomeTitular,
                exp_month: aValidade[0],
                exp_year: aValidade[1],
                cvv: dadosCartao.cvv
            }
        };

        let token = btoa(JSON.stringify(data.card));
        callback(token);
        /*

        fetch(this.apiUrl + "/tokens", {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Basic ' + btoa(this.apiKey)
            },
            body: JSON.stringify(data)
        })
        .then(response => response.json())
        .then(data => callback(data.id))
        .catch(Br1PaymentHelper.handleError);
        */
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
