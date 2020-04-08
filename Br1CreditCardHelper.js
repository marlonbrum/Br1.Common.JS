var Br1CreditCardHelper = {

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
        for (let i = 0; i < Br1CreditCardHelper.brandPrefix.length; i++)
            if (cardNumber.startsWith(Br1CreditCardHelper.brandPrefix[i][0]))
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
    }
};