var Br1CreditCardHelper = {

    acceptedFormats: [
        /^4[0-9]{12}(?:[0-9]{3})?$/,
        /^5[1-5][0-9]{14}$|^2(?:2(?:2[1-9]|[3-9][0-9])|[3-6][0-9][0-9]|7(?:[01][0-9]|20))[0-9]{12}$/,
        /^3[47][0-9]{13}$/,
        /^65[4-9][0-9]{13}|64[4-9][0-9]{13}|6011[0-9]{12}|(622(?:12[6-9]|1[3-9][0-9]|[2-8][0-9][0-9]|9[01][0-9]|92[0-5])[0-9]{10})$/,
        /^3(?:0[0-5]|[68][0-9])[0-9]{11}$/,
        /^(?:2131|1800|35[0-9]{3})[0-9]{11}$/
    ],

    /**
     * Prefixo utilizado por cada bandeira de cartão. Para a comparação funcionar, esse array deve estar 
     * ordenado do prefixo com mais dígitos para o com menos 
     */
    brandPrefix: [
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

    /**
     * Identifica a bandeira do cartão de crédito com base no número do cartão.
     * @param {string} cardNumber Número do cartão de crédito
     * @returns {string} Nome da bandeira do cartão
     */
    identityBrand: function (cardNumber) {
        let sCardNumber = Br1Helper.stripNonDigits(cardNumber);

        for (let i = 0; i < Br1CreditCardHelper.brandPrefix.length; i++)
            if (sCardNumber.startsWith(Br1CreditCardHelper.brandPrefix[i][0]))
                return Br1CreditCardHelper.brandPrefix[i][1];
        return "";
    },

    /**
     * Formata o número do cartão de crédito de acordo com a bandeira
     * @param {string} cardNumber Número do cartão
     * @returns {string} Número do cartão formatado
     */
    formatCardNumber: function (cardNumber) {
        let brand = Br1CreditCardHelper.identityBrand(cardNumber);
        let formato = "";

        switch (brand) {
            case "amex":
                formato = "9999 999999 99999";
                break;
            default:
                formato = "9999 9999 9999 9999";
                break;
        }

        return Br1Helper.formatarNumero(cardNumber, formato);
    },

    /**
     * Verifica se a data de expiração é válida (Formatos aceitos: m/aa, mm/aa, m/aaaa, mm/aaaa)
     * @param {string} expiration Mês e ano de validade do cartão
     * @return {boolean} Indica se a data informada é válida ou não
     */
    validateExpiration: function (expiration) {
        return !Br1Helper.isNullOrWhiteSpace(expiration) && expiration.match(Br1Helper.RegularExpressions.MesAno);
    },

    /**
     * Formata a data de validade informada
     * @param {string} expiration Mês e ano de validade
     * @returns {string} Mês e ano de validade formatados no formato mm/aaaa
     */
    formatExpiration: function (expiration) {
        let parts = expiration.split('/');

        let iMes = parseInt(parts[0], 10);
        let iAno = parseInt(parts[1], 10);

        if (iAno < 100)
            iAno += 2000;

        return iMes.toString().padStart(2, "00") + "/" + iAno.toString();
    },

    validateNumber: function (value) 
    {
        // remove all non digit characters
        value = value.replace(/\D/g, '');
        let sum = 0;
        let shouldDouble = false;
        // loop through values starting at the rightmost side
        for (let i = value.length - 1; i >= 0; i--) {
          let digit = parseInt(value.charAt(i));
      
          if (shouldDouble) {
            if ((digit *= 2) > 9) digit -= 9;
          }
      
          sum += digit;
          shouldDouble = !shouldDouble;
        }
        
        let valid = (sum % 10) == 0;
        let accepted = false;
        
        // loop through the keys (visa, mastercard, amex, etc.)
        this.acceptedFormats.forEach(regex => {
            if (regex.test(value)) 
                accepted = true;
        });
        
        return valid && accepted;
    
    },

    validateCVV: function(creditCard, cvv) 
    {
        creditCard = Br1Helper.stripNonDigits(creditCard);
        cvv = Br1Helper.stripNonDigits(cvv);

        brand = Br1CreditCardHelper.identityBrand(creditCard);
        if (brand == "amex")
            return cvv.length == 4;
        else
            return cvv.length == 3;
      }
};