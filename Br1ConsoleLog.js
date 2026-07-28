/*************************************************************************************
 *  Br1ConsoleLog
 *
 *  Captura o console do navegador (console.log/info/warn/error/debug/trace/dir), as
 *  exceções não tratadas (window "error"), as promises rejeitadas sem catch
 *  ("unhandledrejection") e as falhas de carregamento de recursos, guarda tudo em um
 *  buffer em memória com os dados sensíveis já removidos (PCI/PII) e envia para um
 *  endpoint do servidor.
 *
 *  Serve para diagnosticar problemas que só acontecem na máquina do usuário final,
 *  quando não é possível reproduzir o erro nem pedir para o cliente abrir o devtools.
 *
 *  IMPORTANTE: só o patch do console NÃO é suficiente. A linha "Uncaught ReferenceError"
 *  é escrita pelo próprio navegador, não por uma chamada de console. Por isso os dois
 *  mecanismos (patch do console + listeners de erro) alimentam o mesmo buffer.
 *
 *  --------------------------------------------------------------------------------
 *  USO MÍNIMO (o projeto só precisa implementar o endpoint)
 *  --------------------------------------------------------------------------------
 *
 *      <script src=".../Br1ConsoleLog.js"></script>
 *      <script>Br1ConsoleLog.init("/ajax/gravar-log-console.php", { app: "meu-projeto" });</script>
 *
 *  Deve ser o PRIMEIRO script da página. Não depende de jQuery nem de nenhum outro
 *  arquivo do Br1.Common.JS — a captura começa assim que o arquivo é interpretado,
 *  antes mesmo do init(), para não perder erros que aconteçam durante o carregamento.
 *
 *  --------------------------------------------------------------------------------
 *  CONTRATO COM O SERVIDOR (o que o endpoint recebe e o que precisa responder)
 *  --------------------------------------------------------------------------------
 *
 *  POST {endpoint}, Content-Type: application/json (ou text/plain, via sendBeacon)
 *
 *  {
 *    "schemaVersion": 1,
 *    "traceId":   "0f4b9c1e2c8a4a379a017b6f2d3e5a11",  // correlação (uma por página)
 *    "shortCode": "0F4B9C",                            // código curto, ditado ao suporte
 *    "seq":       1,                                   // 1, 2, 3... por envio
 *    "token":     "eyJ...",                            // opaco; presente só se o host passou um
 *    "reason":    "exception",                         // exception|rejection|error|manual|unload|api
 *    "sentAt":    "2026-07-28T13:45:12.412Z",
 *    "app":       "meu-projeto",
 *    "contexto":  "pagamento-cobranca-cartao",
 *    "page":      { "url": "...", "referrer": "...", "title": "..." },
 *    "client":    { "userAgent": "...", "language": "pt-BR", "viewport": "1280x720", ... },
 *    "context":   { ...dados que o host adicionou via setContext/addContext... },
 *    "counters":  { "captured": 431, "dropped": 231, "truncated": 12, "flushes": 0, "failures": 0 },
 *    "payloadTruncated": false,
 *    "entries":   [ ...ver abaixo... ]
 *  }
 *
 *  Cada entrada de "entries":
 *
 *    i           int     Sequencial global da captura. Buracos significam entradas
 *                        agrupadas por repetição (veja "n") ou descartadas por limite
 *                        de buffer — confira "counters.dropped".
 *    ms          int     Milissegundos desde o install(). ORDENE POR ESTE CAMPO — é
 *                        monotônico e imune a acerto de relógio no cliente.
 *    t           string  Data/hora ISO do cliente (pode estar errada; só informativa).
 *    level       string  log|info|warn|error|debug|trace|dir|mark|exception|rejection|resource
 *    src         string  console|window.onerror|unhandledrejection|resource|manual|helper
 *    msg         string  Texto já redigido e truncado. Nunca nulo.
 *    args        array   (opcional) Argumentos estruturados, quando havia objetos.
 *    stack       string  (opcional) Pilha, para exception/rejection.
 *    location    object  (opcional) { file, line, col }.
 *    crossOrigin bool    (opcional) true = script de outra origem; o navegador omitiu
 *                        a mensagem e a pilha (veja crossorigin="anonymous").
 *    n           int     Quantas vezes a entrada se repetiu (entradas iguais e
 *                        consecutivas são agrupadas).
 *    tLast       string  (opcional) Data/hora da última repetição.
 *
 *  O servidor DEVE responder SEMPRE com HTTP 200 e um JSON:
 *
 *    { "success": true,  "aceitos": 42, "descartadas": 0, "parar": false }
 *    { "success": false, "parar": true, "motivo": "limite|tamanho|token|taxa|desligado|erro" }
 *
 *  Por que sempre 200: um status de erro faz o fetch do cliente rejeitar, o que dispara
 *  o "unhandledrejection", que gera nova entrada, que dispara novo envio, que falha de
 *  novo — laço infinito. Recusas devem vir como 200 + success:false.
 *
 *  "parar": true faz o helper encerrar a captura e o envio pelo resto da vida da página.
 *  É o que torna qualquer limite do servidor realmente auto-limitante.
 *
 *  Uma mesma página gera vários envios: mesmo traceId, seq crescente, faixas de "i"
 *  disjuntas. O servidor deve ACRESCENTAR, agrupando por traceId e ordenando por
 *  (seq, ms). O sendBeacon do unload pode, raramente, duplicar um envio: descarte
 *  duplicatas por (traceId, seq).
 *
 *  --------------------------------------------------------------------------------
 *  PRIVACIDADE
 *  --------------------------------------------------------------------------------
 *
 *  O helper captura APENAS saída de console e erros. Nunca teclas digitadas, nunca o
 *  .value de campos de formulário, nunca cookies, nunca localStorage. Números de cartão
 *  e códigos de segurança são removidos no momento da captura — o dado sensível nunca
 *  chega a existir dentro do buffer.
 *
 *************************************************************************************/

var Br1ConsoleLog = {

    VERSAO: "1.000",
    SCHEMA_VERSION: 1,

    /** Acima disto o fetch com keepalive falha (cota de 64 KB do navegador) */
    LIMITE_KEEPALIVE: 60000,

    /** Substitui o valor de campos sensíveis */
    MASK: "[REDACTED]",

    /** Prefixo usado ao mascarar um número de cartão, seguido dos 4 últimos dígitos */
    MASK_PAN: "****",

    /** Sequência de 13 a 19 dígitos, aceitando espaço ou hífen como separador */
    PAN_PATTERN: /\d(?:[ -]?\d){12,18}/g,

    /**
     * Localiza pares chave/valor em um texto já serializado. Cobre "cvv":"123",
     * cvv: 123, cvv=123 e &cvv=123. A decisão de mascarar é tomada no replacer,
     * testando o nome da chave — assim padrões adicionados pelo host podem ter
     * qualquer formato sem quebrar os índices dos grupos.
     */
    TEXT_PAIR_PATTERN: /(["']?)([A-Za-z_][A-Za-z0-9_\-]*)\1(\s*[:=]\s*)("(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*'|[^,;&}\)\]\s]*)/g,

    /** Chaves sempre sensíveis, qualquer que seja o valor */
    sensitiveKeyPatterns: [
        /cvv|cvc|cav|cvn|security[_\- ]?code|codigo[_\- ]?(de[_\- ])?seguranca/i,
        /card[_\- ]?number|cardnumber|numero[_\- ]?(do[_\- ])?cartao|^pan$/i,
        /senha|password|passwd|pwd|secret|segredo/i,
        /token|authorization|bearer|api[_\- ]?key|access[_\- ]?key|client[_\- ]?secret|jwt/i,
        /card[_\- ]?hash|payment[_\- ]?token/i
    ],

    /**
     * Chaves ambíguas: "number" tanto pode ser telefone ou número de pedido quanto o
     * número do cartão. Só são redigidas se o valor parecer um cartão OU se o objeto
     * que as contém tiver outras chaves típicas de cartão.
     */
    SOFT_KEY_PATTERN: /^(number|numero|num|codigo|code)$/i,

    /** Indícios de que o objeto é um payload de cartão */
    CARD_HINT_PATTERN: /cvv|cvc|expiration|validade|vencimento|brand|bandeira|holder|titular|card/i,

    /** Funções extras de redação fornecidas pelo host: function(texto) => texto */
    redactors: [],

    // ---------------------------------------------------------------------------
    // Estado
    // ---------------------------------------------------------------------------

    /** true = o buffer aceita novas entradas */
    capturing: false,

    /** true = o envio ao servidor está liberado (só depois do init) */
    sending: false,

    /** true = install() já rodou */
    installed: false,

    /** true = init() já rodou */
    started: false,

    /** true = a página está sendo descarregada */
    unloading: false,

    /** Entradas capturadas e ainda em memória */
    buffer: [],

    counters: null,
    options: null,

    // ---------------------------------------------------------------------------
    // Pontos de extensão (atribuídos pelo host, seguindo o padrão onLocalError)
    // ---------------------------------------------------------------------------

    /** function(entry) => entry | false — última chance de alterar ou descartar */
    onCapture: null,

    /** function(payload) => payload | false — antes de enviar */
    onBeforeSend: null,

    /** function(ok, resultado, payload) — depois de enviar */
    onAfterSend: null,

    /** function(mensagem, erro) — falhas internas do próprio helper */
    onError: null,

    /** function(texto, codigo, motivo) => bool — substitui o aviso visual padrão */
    onFeedback: null,

    // ---------------------------------------------------------------------------
    // Configuração
    // ---------------------------------------------------------------------------

    __defaultOptions: {
        endpoint: "",                    // URL que recebe os lotes (obrigatório para enviar)
        token: null,                     // String opaca do host, repassada em cada envio
        traceId: null,                   // Força um ID de correlação (senão é gerado aqui)
        app: "",                         // Identificação do projeto
        contexto: "",                    // Página/área que originou a captura
        credentials: "same-origin",      // Modo de credenciais do fetch

        captureConsole: true,
        consoleMethods: ["log", "info", "warn", "error", "debug", "trace", "dir"],
        captureErrors: true,
        captureRejections: true,
        captureResourceErrors: true,

        autoFlushLevels: ["exception", "rejection", "error"],
        autoFlushDelay: 400,             // Agrupa uma rajada de erros em um único envio
        maxAutoFlushes: 3,               // Disjuntor: envios automáticos por página
        minFlushInterval: 5000,          // Intervalo mínimo entre envios automáticos
        flushOnUnload: true,
        clearOnFlush: true,

        bufferSize: 200,
        maxEntryLength: 2048,
        maxPayloadLength: 262144,        // 256 KB
        maxEntriesPerSecond: 200,
        dedupWindow: 1000,

        maxDepth: 4,
        maxArrayItems: 30,
        maxKeys: 50,

        redactPan: true,
        redactLongDigitRuns: false,      // true = mascara 13-19 dígitos mesmo sem passar no Luhn

        enableShortcut: true,
        shortcut: { key: "D", ctrl: true, alt: true, shift: true },
        showFeedback: true,
        feedbackText: "Diagnóstico enviado. Código: {codigo}",
        feedbackErrorText: "Não foi possível enviar o diagnóstico.",
        feedbackDuration: 8000,

        persistTraceId: false,           // true = mantém o mesmo ID entre páginas (sessionStorage)
        traceIdKey: "br1ConsoleLog.traceId",

        includeClientInfo: true,
        context: {},
        ignorePattern: null,             // RegExp; entradas que casarem não entram no buffer
        debug: false                     // Loga a atividade do próprio helper
    },

    // ---------------------------------------------------------------------------
    // Ciclo de vida
    // ---------------------------------------------------------------------------

    /**
     * Fase 1: instala a captura. Substitui os métodos do console e registra os
     * listeners de erro, mas NÃO envia nada. É chamada automaticamente no fim deste
     * arquivo para que erros ocorridos antes do init() também sejam capturados.
     * Idempotente.
     */
    install: function () {
        if (Br1ConsoleLog.installed)
            return;

        Br1ConsoleLog.options = Br1ConsoleLog.__clone(Br1ConsoleLog.__defaultOptions);
        Br1ConsoleLog.counters = { captured: 0, dropped: 0, truncated: 0, flushes: 0, failures: 0 };

        Br1ConsoleLog.__installedAt = Br1ConsoleLog.__now();
        Br1ConsoleLog.__traceId = Br1ConsoleLog.__loadTraceId();
        Br1ConsoleLog.__seq = 0;
        Br1ConsoleLog.__lastSentI = 0;
        Br1ConsoleLog.__autoFlushes = 0;
        Br1ConsoleLog.__lastFlushAt = 0;
        Br1ConsoleLog.__failuresInARow = 0;
        Br1ConsoleLog.__rateStart = 0;
        Br1ConsoleLog.__rateCount = 0;
        Br1ConsoleLog.__inside = false;
        Br1ConsoleLog.__sendingNow = false;
        Br1ConsoleLog.__flushTimer = null;

        Br1ConsoleLog.installed = true;
        Br1ConsoleLog.capturing = true;

        Br1ConsoleLog.patchConsole();

        if (typeof window !== "undefined" && window.addEventListener) {
            // capture = true é obrigatório: falhas de carregamento de recurso não sobem
            // na árvore, então um listener na fase de bubbling nunca as veria.
            window.addEventListener("error", Br1ConsoleLog.onWindowError, true);
            window.addEventListener("unhandledrejection", Br1ConsoleLog.onUnhandledRejection);
            window.addEventListener("pagehide", Br1ConsoleLog.onPageHide);
            window.addEventListener("beforeunload", Br1ConsoleLog.onPageHide);
            window.addEventListener("keydown", Br1ConsoleLog.onKeyDown, true);
        }

        if (typeof document !== "undefined" && document.addEventListener)
            document.addEventListener("visibilitychange", Br1ConsoleLog.onVisibilityChange);
    },

    /**
     * Fase 2: configura e libera o envio. Se algum erro já tiver sido capturado antes
     * desta chamada, ele é enviado imediatamente.
     * @param {string|Object} endpointOrOptions URL do endpoint ou objeto de opções
     * @param {Object} options Opções adicionais, quando o primeiro parâmetro é a URL
     */
    init: function (endpointOrOptions, options) {
        if (!Br1ConsoleLog.installed)
            Br1ConsoleLog.install();

        let cfg = {};

        if (typeof endpointOrOptions === "string")
            cfg.endpoint = endpointOrOptions;
        else if (endpointOrOptions != null && typeof endpointOrOptions === "object")
            cfg = endpointOrOptions;

        if (options != null && typeof options === "object")
            for (let chave in options)
                if (Object.prototype.hasOwnProperty.call(options, chave))
                    cfg[chave] = options[chave];

        Br1ConsoleLog.setOptions(cfg);

        if (!Br1ConsoleLog.isNullOrEmpty(Br1ConsoleLog.options.traceId))
            Br1ConsoleLog.__traceId = String(Br1ConsoleLog.options.traceId);

        // Não deixa o helper registrar as próprias requisições: qualquer entrada que
        // mencione o endpoint é ignorada. Generaliza o guard de Br1Globals.gravarLogErro.
        if (Br1ConsoleLog.options.ignorePattern == null
            && !Br1ConsoleLog.isNullOrEmpty(Br1ConsoleLog.options.endpoint))
            Br1ConsoleLog.options.ignorePattern = Br1ConsoleLog.__patternForEndpoint(
                Br1ConsoleLog.options.endpoint);

        if (Br1ConsoleLog.started) {
            Br1ConsoleLog.__internalLog("init() chamado novamente; apenas as opções foram atualizadas");
            return;
        }

        Br1ConsoleLog.started = true;
        Br1ConsoleLog.sending = true;

        Br1ConsoleLog.__internalLog("iniciado, traceId=" + Br1ConsoleLog.__traceId);

        // Se algo já explodiu antes do init, manda agora.
        for (let i = 0; i < Br1ConsoleLog.buffer.length; i++)
            if (Br1ConsoleLog.__isErrorLevel(Br1ConsoleLog.buffer[i].level)) {
                Br1ConsoleLog.scheduleAutoFlush("exception");
                break;
            }
    },

    /**
     * Mescla opções sobre as atuais.
     * @param {Object} options Opções a serem alteradas
     */
    setOptions: function (options) {
        if (options == null)
            return;

        for (let chave in options)
            if (Object.prototype.hasOwnProperty.call(options, chave))
                Br1ConsoleLog.options[chave] = options[chave];
    },

    /** Reativa a captura e o envio. */
    enable: function () {
        Br1ConsoleLog.capturing = true;
        Br1ConsoleLog.sending = Br1ConsoleLog.started;
    },

    /**
     * Interrompe a captura e o envio. Não restaura o console — outro código pode ter
     * substituído os métodos depois de nós, e desfazer nossa camada quebraria a cadeia.
     */
    disable: function () {
        Br1ConsoleLog.capturing = false;
        Br1ConsoleLog.sending = false;
        Br1ConsoleLog.__cancelAutoFlush();
    },

    /**
     * @returns {boolean} Verdadeiro se a captura está ativa
     */
    isEnabled: function () {
        return Br1ConsoleLog.capturing === true;
    },

    /**
     * Desfaz a instalação: restaura os métodos do console que ainda são nossos e
     * remove os listeners. Útil em SPAs e em testes.
     */
    uninstall: function () {
        if (!Br1ConsoleLog.installed)
            return;

        let metodos = Br1ConsoleLog.options.consoleMethods;
        for (let i = 0; i < metodos.length; i++) {
            let atual = console[metodos[i]];
            if (atual != null && atual.__br1Patched === true)
                console[metodos[i]] = atual.__br1Original;
            else if (atual != null)
                Br1ConsoleLog.__internalLog("console." + metodos[i]
                    + " foi substituído por outro código; não será restaurado");
        }

        if (typeof window !== "undefined" && window.removeEventListener) {
            window.removeEventListener("error", Br1ConsoleLog.onWindowError, true);
            window.removeEventListener("unhandledrejection", Br1ConsoleLog.onUnhandledRejection);
            window.removeEventListener("pagehide", Br1ConsoleLog.onPageHide);
            window.removeEventListener("beforeunload", Br1ConsoleLog.onPageHide);
            window.removeEventListener("keydown", Br1ConsoleLog.onKeyDown, true);
        }

        if (typeof document !== "undefined" && document.removeEventListener)
            document.removeEventListener("visibilitychange", Br1ConsoleLog.onVisibilityChange);

        Br1ConsoleLog.installed = false;
        Br1ConsoleLog.capturing = false;
        Br1ConsoleLog.sending = false;
    },

    // ---------------------------------------------------------------------------
    // Utilitários próprios (o helper não depende de Br1Helper)
    // ---------------------------------------------------------------------------

    /**
     * Verifica se um valor é nulo, indefinido ou string vazia.
     * @param {*} valor Valor a ser testado
     * @returns {boolean} Verdadeiro se estiver vazio
     */
    isNullOrEmpty: function (valor) {
        return valor === null || valor === undefined || valor === "";
    },

    /**
     * Cópia rasa de um objeto.
     * @param {Object} obj Objeto a ser copiado
     * @returns {Object} Nova instância com as mesmas propriedades
     */
    __clone: function (obj) {
        let copia = {};
        for (let chave in obj)
            if (Object.prototype.hasOwnProperty.call(obj, chave))
                copia[chave] = obj[chave];
        return copia;
    },

    /**
     * Relógio monotônico, imune a acerto de hora no cliente.
     * @returns {number} Milissegundos
     */
    __now: function () {
        if (typeof performance !== "undefined" && typeof performance.now === "function")
            return performance.now();
        return new Date().getTime();
    },

    /**
     * Monta a expressão que identifica entradas referentes ao próprio endpoint, para
     * que uma falha de envio não gere novas entradas e, com elas, um laço de envios.
     * @param {string} endpoint URL do endpoint
     * @returns {RegExp} Expressão que casa com o nome do arquivo do endpoint
     */
    __patternForEndpoint: function (endpoint) {
        let semQuery = String(endpoint).split("?")[0];
        let partes = semQuery.split("/");
        let arquivo = partes[partes.length - 1];

        if (Br1ConsoleLog.isNullOrEmpty(arquivo))
            return null;

        return new RegExp(arquivo.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
    },

    /**
     * @param {string} level Nível da entrada
     * @returns {boolean} Verdadeiro se o nível representa um erro
     */
    __isErrorLevel: function (level) {
        return level === "error" || level === "exception" || level === "rejection";
    },

    // ---------------------------------------------------------------------------
    // Correlação
    // ---------------------------------------------------------------------------

    /**
     * Gera um identificador aleatório de 32 caracteres hexadecimais.
     * @returns {string} Identificador
     */
    __newId: function () {
        try {
            if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function")
                return crypto.randomUUID().replace(/-/g, "");

            if (typeof crypto !== "undefined" && typeof crypto.getRandomValues === "function") {
                let bytes = new Uint8Array(16);
                crypto.getRandomValues(bytes);
                let hex = "";
                for (let i = 0; i < bytes.length; i++)
                    hex += ("0" + bytes[i].toString(16)).slice(-2);
                return hex;
            }
        }
        catch (e) { /* segue para o plano B */ }

        return (new Date().getTime().toString(16)
            + Math.random().toString(16).substring(2)
            + Math.random().toString(16).substring(2)).substring(0, 32);
    },

    /**
     * Obtém o ID de correlação, recuperando-o do sessionStorage quando a opção
     * persistTraceId estiver ativa.
     * @returns {string} ID de correlação
     */
    __loadTraceId: function () {
        if (Br1ConsoleLog.options.persistTraceId === true) {
            try {
                let salvo = sessionStorage.getItem(Br1ConsoleLog.options.traceIdKey);
                if (!Br1ConsoleLog.isNullOrEmpty(salvo))
                    return salvo;

                let novo = Br1ConsoleLog.__newId();
                sessionStorage.setItem(Br1ConsoleLog.options.traceIdKey, novo);
                return novo;
            }
            catch (e) {
                // Safari em navegação privada, cookies bloqueados etc.
                Br1ConsoleLog.__internalLog("sessionStorage indisponível; traceId só em memória", e);
            }
        }

        return Br1ConsoleLog.__newId();
    },

    /**
     * @returns {string} ID de correlação desta página
     */
    getTraceId: function () {
        return Br1ConsoleLog.__traceId;
    },

    /**
     * Código curto derivado do ID de correlação. É o que o usuário informa ao suporte:
     * fica disponível imediatamente, é estável durante toda a sessão e não depende da
     * resposta do servidor.
     * @returns {string} Código de 6 caracteres
     */
    getShortCode: function () {
        return String(Br1ConsoleLog.__traceId).replace(/[^0-9a-fA-F]/g, "")
            .substring(0, 6).toUpperCase();
    },

    /** Gera um novo ID de correlação (ex: após concluir uma compra). */
    newTrace: function () {
        Br1ConsoleLog.__traceId = Br1ConsoleLog.__newId();
        Br1ConsoleLog.__seq = 0;
        Br1ConsoleLog.__lastSentI = 0;

        if (Br1ConsoleLog.options.persistTraceId === true) {
            try { sessionStorage.setItem(Br1ConsoleLog.options.traceIdKey, Br1ConsoleLog.__traceId); }
            catch (e) { /* ignora */ }
        }
    },

    // ---------------------------------------------------------------------------
    // Redação de dados sensíveis
    // ---------------------------------------------------------------------------

    /**
     * Verifica se uma sequência de dígitos passa no algoritmo de Luhn. Serve para não
     * mascarar números que não são cartão (CPF, número de pedido, telefone).
     * Diferente de Br1CreditCardHelper.validateNumber, aqui NÃO se verifica a bandeira:
     * cartões de teste e BINs incomuns também devem ser mascarados.
     * @param {string} digitos Sequência contendo apenas dígitos
     * @returns {boolean} Verdadeiro se o dígito verificador estiver correto
     */
    isLuhnValid: function (digitos) {
        if (digitos == null || digitos.length < 13 || digitos.length > 19)
            return false;

        let soma = 0;
        let dobrar = false;

        for (let i = digitos.length - 1; i >= 0; i--) {
            let digito = digitos.charCodeAt(i) - 48;
            if (digito < 0 || digito > 9)
                return false;

            if (dobrar) {
                digito *= 2;
                if (digito > 9)
                    digito -= 9;
            }

            soma += digito;
            dobrar = !dobrar;
        }

        return (soma % 10) === 0;
    },

    /**
     * Verifica se um valor tem a cara de um número de cartão.
     * @param {*} valor Valor a ser testado
     * @returns {boolean} Verdadeiro se parecer um cartão
     */
    __looksLikePan: function (valor) {
        if (valor === null || valor === undefined)
            return false;

        let tipo = typeof valor;
        if (tipo !== "string" && tipo !== "number")
            return false;

        let digitos = String(valor).replace(/[^0-9]/g, "");
        if (digitos.length < 12 || digitos.length > 19)
            return false;

        return Br1ConsoleLog.options.redactLongDigitRuns === true
            || Br1ConsoleLog.isLuhnValid(digitos);
    },

    /**
     * Verifica se o objeto que contém a chave tem outras chaves típicas de cartão.
     * @param {Object} parent Objeto que contém a chave em análise
     * @returns {boolean} Verdadeiro se houver indícios de payload de cartão
     */
    __hasCardSiblings: function (parent) {
        if (parent == null || typeof parent !== "object")
            return false;

        let chaves;
        try { chaves = Object.keys(parent); }
        catch (e) { return false; }

        for (let i = 0; i < chaves.length; i++)
            if (Br1ConsoleLog.CARD_HINT_PATTERN.test(chaves[i]))
                return true;

        return false;
    },

    /**
     * Verifica se o nome de uma chave é sempre sensível.
     * @param {string} chave Nome da chave
     * @returns {boolean} Verdadeiro se o valor deve ser sempre mascarado
     */
    __isHardSensitiveKey: function (chave) {
        if (Br1ConsoleLog.isNullOrEmpty(chave))
            return false;

        for (let i = 0; i < Br1ConsoleLog.sensitiveKeyPatterns.length; i++) {
            let padrao = Br1ConsoleLog.sensitiveKeyPatterns[i];
            padrao.lastIndex = 0;
            if (padrao.test(chave))
                return true;
        }

        return false;
    },

    /**
     * Decide se o valor de uma chave deve ser redigido, considerando o valor e o objeto
     * que a contém no caso das chaves ambíguas.
     * @param {string} chave Nome da chave
     * @param {*} valor Valor associado
     * @param {Object} parent Objeto que contém a chave
     * @returns {boolean} Verdadeiro se o valor deve ser mascarado
     */
    __isSensitiveKey: function (chave, valor, parent) {
        if (Br1ConsoleLog.__isHardSensitiveKey(chave))
            return true;

        if (Br1ConsoleLog.SOFT_KEY_PATTERN.test(chave))
            return Br1ConsoleLog.__looksLikePan(valor)
                || Br1ConsoleLog.__hasCardSiblings(parent);

        return false;
    },

    /**
     * Adiciona um padrão de chave sensível.
     * @param {RegExp} regex Expressão testada contra o nome das chaves
     */
    addSensitiveKeyPattern: function (regex) {
        Br1ConsoleLog.sensitiveKeyPatterns.push(regex);
    },

    /**
     * Adiciona uma função de redação específica do projeto, aplicada por último.
     * @param {Function} fn function(texto) => texto
     */
    addRedactor: function (fn) {
        Br1ConsoleLog.redactors.push(fn);
    },

    /**
     * Substitui pelo mask o valor de toda chave sensível encontrada em um texto já
     * serializado. É o que protege chamadas como
     * console.log("..." + JSON.stringify(dadosDoCartao)), em que o serializador nunca
     * chega a ver o objeto — só a string.
     * @param {string} texto Texto a ser processado
     * @returns {string} Texto com os valores sensíveis substituídos
     */
    redactByKeyInText: function (texto) {
        Br1ConsoleLog.TEXT_PAIR_PATTERN.lastIndex = 0;

        return texto.replace(Br1ConsoleLog.TEXT_PAIR_PATTERN,
            function (match, aspas, chave, separador, valor) {
                let sensivel = Br1ConsoleLog.__isHardSensitiveKey(chave);

                if (!sensivel && Br1ConsoleLog.SOFT_KEY_PATTERN.test(chave)) {
                    let limpo = valor.replace(/^["']|["']$/g, "");
                    sensivel = Br1ConsoleLog.__looksLikePan(limpo);
                }

                if (!sensivel)
                    return match;

                return aspas + chave + aspas + separador + '"' + Br1ConsoleLog.MASK + '"';
            });
    },

    /**
     * Mascara números de cartão encontrados em um texto, mantendo os 4 últimos dígitos.
     * @param {string} texto Texto a ser processado
     * @returns {string} Texto com os cartões mascarados
     */
    redactPanInText: function (texto) {
        Br1ConsoleLog.PAN_PATTERN.lastIndex = 0;

        return texto.replace(Br1ConsoleLog.PAN_PATTERN, function (match) {
            let digitos = match.replace(/[^0-9]/g, "");

            if (!Br1ConsoleLog.options.redactLongDigitRuns && !Br1ConsoleLog.isLuhnValid(digitos))
                return match;

            return Br1ConsoleLog.MASK_PAN + digitos.substring(digitos.length - 4);
        });
    },

    /**
     * Aplica todo o pipeline de redação em um texto. A ordem importa: primeiro as
     * chaves (descartar o valor inteiro é mais forte do que mascarar), depois os
     * cartões soltos, por último os redatores do host.
     * Em caso de falha o texto inteiro é descartado — é melhor perder o log do que
     * vazar um dado sensível.
     * @param {string} texto Texto a ser processado
     * @returns {string} Texto seguro para armazenar e enviar
     */
    redactText: function (texto) {
        if (texto == null || texto === "")
            return texto;

        try {
            let resultado = String(texto);

            resultado = Br1ConsoleLog.redactByKeyInText(resultado);

            if (Br1ConsoleLog.options.redactPan)
                resultado = Br1ConsoleLog.redactPanInText(resultado);

            for (let i = 0; i < Br1ConsoleLog.redactors.length; i++)
                resultado = Br1ConsoleLog.redactors[i](resultado);

            return resultado;
        }
        catch (e) {
            return "[Br1ConsoleLog: falha ao redigir conteúdo]";
        }
    },

    // ---------------------------------------------------------------------------
    // Serialização segura
    // ---------------------------------------------------------------------------

    /**
     * Converte um valor qualquer em uma estrutura pronta para JSON.stringify, com
     * limite de profundidade e de tamanho, tratando referências circulares, nós do DOM,
     * Errors, Maps, funções e getters que lançam exceção. É também onde acontece a
     * redação por nome de chave.
     * @param {*} valor Valor a ser serializado
     * @param {number} depth Profundidade atual (uso interno)
     * @param {*[]} seen Objetos já visitados no caminho atual (uso interno)
     * @param {string} chave Nome da chave que contém o valor (uso interno)
     * @param {Object} parent Objeto que contém o valor (uso interno)
     * @returns {*} Valor seguro para serializar em JSON
     */
    serialize: function (valor, depth, seen, chave, parent) {
        if (depth === undefined) depth = 0;
        if (seen === undefined) seen = [];

        if (valor === null) return null;
        if (valor === undefined) return "[undefined]";

        let tipo = typeof valor;

        if (tipo === "boolean") return valor;
        if (tipo === "bigint") return valor.toString() + "n";
        if (tipo === "symbol") return valor.toString();
        if (tipo === "function") return "[Function " + (valor.name || "anônima") + "]";

        // A verificação vem antes dos limites de profundidade e de ciclo, para que uma
        // chave sensível seja mascarada mesmo no fundo da estrutura.
        if (Br1ConsoleLog.__isSensitiveKey(chave, valor, parent))
            return Br1ConsoleLog.MASK;

        if (tipo === "number")
            return isFinite(valor) ? valor : String(valor);

        if (tipo === "string")
            return Br1ConsoleLog.redactText(valor);

        if (seen.indexOf(valor) > -1) return "[Circular]";
        if (depth >= Br1ConsoleLog.options.maxDepth)
            return "[" + Br1ConsoleLog.__typeName(valor) + " ...]";

        seen.push(valor);
        let resultado;

        try {
            resultado = Br1ConsoleLog.__serializeObject(valor, depth, seen);
        }
        catch (e) {
            resultado = "[Não serializável: " + Br1ConsoleLog.__typeName(valor) + "]";
        }

        seen.pop();
        return resultado;
    },

    /**
     * Serializa um objeto, tratando os tipos especiais do navegador.
     * @param {Object} valor Objeto a ser serializado
     * @param {number} depth Profundidade atual
     * @param {*[]} seen Objetos já visitados
     * @returns {*} Representação segura do objeto
     */
    __serializeObject: function (valor, depth, seen) {
        let opt = Br1ConsoleLog.options;

        // Error, ou qualquer objeto com message + stack (os erros dos gateways são assim)
        if ((typeof Error !== "undefined" && valor instanceof Error)
            || (typeof valor.message === "string" && typeof valor.stack === "string")) {

            let erro = {
                __type: "Error",
                name: valor.name || "Error",
                message: Br1ConsoleLog.redactText(String(valor.message)),
                stack: Br1ConsoleLog.redactText(String(valor.stack || ""))
            };

            if (valor.cause !== undefined)
                erro.cause = Br1ConsoleLog.serialize(valor.cause, depth + 1, seen, "cause", valor);

            return erro;
        }

        if (valor instanceof Date) return valor.toISOString();
        if (valor instanceof RegExp) return valor.toString();

        if (typeof Window !== "undefined" && valor instanceof Window) return "[Window]";
        if (typeof Node !== "undefined" && valor instanceof Node)
            return Br1ConsoleLog.__describeNode(valor);

        if (typeof Event !== "undefined" && valor instanceof Event)
            return {
                __type: "Event",
                type: valor.type,
                target: Br1ConsoleLog.__describeNode(valor.target)
            };

        if (Array.isArray(valor)) {
            let lista = [];
            let limite = Math.min(valor.length, opt.maxArrayItems);

            for (let i = 0; i < limite; i++)
                lista.push(Br1ConsoleLog.serialize(valor[i], depth + 1, seen, null, valor));

            if (valor.length > limite)
                lista.push("[... +" + (valor.length - limite) + " itens]");

            return lista;
        }

        if (typeof Map !== "undefined" && valor instanceof Map) {
            let mapa = { __type: "Map", size: valor.size, entries: {} };
            let i = 0;

            valor.forEach(function (v, k) {
                if (i++ >= opt.maxKeys) return;
                mapa.entries[String(k)] = Br1ConsoleLog.serialize(v, depth + 1, seen, String(k), null);
            });

            return mapa;
        }

        if (typeof Set !== "undefined" && valor instanceof Set)
            return {
                __type: "Set",
                size: valor.size,
                values: Br1ConsoleLog.serialize(
                    Array.prototype.slice.call(Array.from(valor), 0, opt.maxArrayItems),
                    depth + 1, seen, null, null)
            };

        if (typeof FormData !== "undefined" && valor instanceof FormData) {
            let form = { __type: "FormData" };
            valor.forEach(function (v, k) {
                form[k] = Br1ConsoleLog.serialize(v, depth + 1, seen, k, null);
            });
            return form;
        }

        if (typeof File !== "undefined" && valor instanceof File)
            return { __type: "File", name: valor.name, size: valor.size, mime: valor.type };

        if (typeof Blob !== "undefined" && valor instanceof Blob)
            return { __type: "Blob", size: valor.size, mime: valor.type };

        let obj = {};
        let chaves;

        try { chaves = Object.keys(valor); }
        catch (e) { return "[Objeto sem chaves enumeráveis]"; }

        for (let i = 0; i < chaves.length; i++) {
            if (i >= opt.maxKeys) {
                obj.__truncated = "+" + (chaves.length - i) + " propriedades";
                break;
            }

            let chave = chaves[i];
            let item;

            try { item = valor[chave]; }
            catch (e) {
                // Getters podem lançar (objetos de gateways de pagamento fazem isso)
                obj[chave] = "[Getter lançou exceção: " + e.message + "]";
                continue;
            }

            obj[chave] = Br1ConsoleLog.serialize(item, depth + 1, seen, chave, valor);
        }

        return obj;
    },

    /**
     * Descreve um nó do DOM em uma linha. NUNCA inclui o .value de campos, para não
     * capturar dados digitados pelo usuário.
     * @param {Node} node Nó a ser descrito
     * @returns {string} Descrição do nó
     */
    __describeNode: function (node) {
        if (node == null) return null;
        if (node.nodeType !== 1) return "[Node tipo " + node.nodeType + "]";

        let desc = "<" + String(node.tagName).toLowerCase();

        if (node.id) desc += ' id="' + node.id + '"';
        if (typeof node.className === "string" && node.className !== "")
            desc += ' class="' + node.className + '"';

        if (node.tagName === "INPUT" || node.tagName === "SELECT" || node.tagName === "TEXTAREA")
            desc += ' name="' + (node.name || "") + '" type="' + (node.type || "") + '"';

        return desc + ">";
    },

    /**
     * Nome do tipo de um valor, para as mensagens de truncamento.
     * @param {*} valor Valor a ser identificado
     * @returns {string} Nome do tipo
     */
    __typeName: function (valor) {
        if (Array.isArray(valor)) return "Array";
        if (valor != null && valor.constructor != null && valor.constructor.name)
            return valor.constructor.name;
        return "Object";
    },

    /**
     * Serializa em JSON sem lançar exceção.
     * @param {*} valor Valor a ser convertido
     * @returns {string} JSON, ou uma marcação de falha
     */
    stringify: function (valor) {
        try { return JSON.stringify(valor); }
        catch (e) { return '"[Br1ConsoleLog: falha ao serializar]"'; }
    },

    // ---------------------------------------------------------------------------
    // Captura do console
    // ---------------------------------------------------------------------------

    /**
     * Monta a mensagem de texto a partir dos argumentos de uma chamada de console,
     * tratando os especificadores de formato. O %c é consumido junto com o argumento
     * de estilo correspondente, para que o CSS não polua o rastro.
     * @param {Arguments|Array} args Argumentos originais
     * @returns {Object} { msg: string, extras: Array }
     */
    __formatConsoleMessage: function (args) {
        let lista = Array.prototype.slice.call(args);
        let extras = [];
        let partes = [];
        let indice = 0;

        if (lista.length > 0 && typeof lista[0] === "string" && /%[scdifoOj]/.test(lista[0])) {
            indice = 1;
            let formato = lista[0];

            let texto = formato.replace(/%([scdifoOj%])/g, function (match, tipo) {
                if (tipo === "%")
                    return "%";

                if (tipo === "c") {
                    indice++;          // consome o argumento de estilo e não imprime nada
                    return "";
                }

                if (indice >= lista.length)
                    return match;

                let arg = lista[indice++];

                if (tipo === "d" || tipo === "i")
                    return String(parseInt(arg, 10));
                if (tipo === "f")
                    return String(parseFloat(arg));
                if (tipo === "s")
                    return typeof arg === "string" ? arg : Br1ConsoleLog.stringify(
                        Br1ConsoleLog.serialize(arg));

                let serializado = Br1ConsoleLog.serialize(arg);
                extras.push(serializado);
                return Br1ConsoleLog.stringify(serializado);
            });

            partes.push(texto);
        }

        for (let i = indice; i < lista.length; i++) {
            let arg = lista[i];

            if (arg === null) { partes.push("null"); continue; }
            if (arg === undefined) { partes.push("undefined"); continue; }

            let tipo = typeof arg;

            if (tipo === "string") { partes.push(arg); continue; }
            if (tipo === "number" || tipo === "boolean") { partes.push(String(arg)); continue; }

            let serializado = Br1ConsoleLog.serialize(arg);
            extras.push(serializado);
            partes.push(Br1ConsoleLog.stringify(serializado));
        }

        return { msg: partes.join(" "), extras: extras };
    },

    /**
     * Captura uma chamada de console já ocorrida.
     * @param {string} level Nível (log, warn, error...)
     * @param {Arguments} args Argumentos da chamada
     */
    captureConsoleArgs: function (level, args) {
        let formatado = Br1ConsoleLog.__formatConsoleMessage(args);

        let entrada = {
            level: level,
            src: "console",
            msg: Br1ConsoleLog.redactText(formatado.msg)
        };

        if (formatado.extras.length > 0)
            entrada.args = formatado.extras;

        Br1ConsoleLog.__push(entrada);
    },

    /**
     * Substitui os métodos do console por versões que também gravam no buffer.
     * Idempotente: se o método já estiver substituído por este helper, não faz nada.
     */
    patchConsole: function () {
        if (typeof console === "undefined") return;
        if (!Br1ConsoleLog.options.captureConsole) return;

        let metodos = Br1ConsoleLog.options.consoleMethods;

        for (let i = 0; i < metodos.length; i++) {
            let nome = metodos[i];
            let original = console[nome];

            if (typeof original !== "function") continue;

            // Marcador na própria função substituta: se este arquivo for carregado
            // duas vezes, o objeto do namespace é recriado (perdendo o registro dos
            // originais), mas o marcador continua no console e evita o duplo patch.
            if (original.__br1Patched === true) continue;

            console[nome] = Br1ConsoleLog.__makeConsolePatch(nome, original);
        }
    },

    /**
     * Cria a função que substitui um método do console.
     * @param {string} level Nome do método
     * @param {Function} original Função original
     * @returns {Function} Função substituta
     */
    __makeConsolePatch: function (level, original) {
        let substituta = function () {
            // O comportamento original vem sempre primeiro: se a captura falhar, o log
            // ainda aparece no devtools de quem estiver olhando.
            try { original.apply(console, arguments); }
            catch (e) { /* console pode estar indisponível */ }

            if (Br1ConsoleLog.__inside) return;
            if (!Br1ConsoleLog.capturing) return;

            try {
                Br1ConsoleLog.__inside = true;
                Br1ConsoleLog.captureConsoleArgs(level, arguments);
            }
            catch (e) {
                Br1ConsoleLog.__internalLog("falha ao capturar console." + level, e);
            }
            finally {
                Br1ConsoleLog.__inside = false;
            }

            if (Br1ConsoleLog.options.autoFlushLevels.indexOf(level) > -1)
                Br1ConsoleLog.scheduleAutoFlush(level);
        };

        substituta.__br1Patched = true;
        substituta.__br1Original = original;
        return substituta;
    },

    // ---------------------------------------------------------------------------
    // Listeners de erro
    // ---------------------------------------------------------------------------

    /**
     * Handler do evento "error" da window. Captura exceções não tratadas e também
     * falhas de carregamento de recursos (script, img, link).
     * @param {ErrorEvent|Event} event Evento de erro
     */
    onWindowError: function (event) {
        if (!Br1ConsoleLog.capturing) return;
        if (!Br1ConsoleLog.options.captureErrors) return;
        if (Br1ConsoleLog.__inside) return;

        let motivo = "exception";

        try {
            Br1ConsoleLog.__inside = true;

            let alvo = event.target;
            let ehRecurso = alvo != null && alvo !== window && alvo.nodeType === 1;

            if (ehRecurso) {
                if (!Br1ConsoleLog.options.captureResourceErrors) return;

                motivo = "error";
                Br1ConsoleLog.__push({
                    level: "resource",
                    src: "resource",
                    msg: "Falha ao carregar recurso " + Br1ConsoleLog.__describeNode(alvo)
                        + " url=" + Br1ConsoleLog.redactText(String(alvo.src || alvo.href || ""))
                });
            }
            else {
                let erro = event.error;

                // Script de outra origem: o navegador esconde mensagem, arquivo e pilha
                let outraOrigem = erro == null
                    && (event.message == null || String(event.message).indexOf("Script error") === 0);

                let mensagem = event.message || "Erro não tratado sem mensagem";

                if (outraOrigem)
                    mensagem = "Script error. (exceção em script de outra origem; o navegador "
                        + "omitiu a mensagem e a pilha - veja crossorigin=\"anonymous\")";

                Br1ConsoleLog.__push({
                    level: "exception",
                    src: "window.onerror",
                    msg: Br1ConsoleLog.redactText(mensagem),
                    stack: erro != null && erro.stack != null
                        ? Br1ConsoleLog.redactText(String(erro.stack))
                        : null,
                    location: {
                        file: event.filename || null,
                        line: event.lineno || 0,
                        col: event.colno || 0
                    },
                    crossOrigin: outraOrigem
                });
            }
        }
        catch (e) {
            Br1ConsoleLog.__internalLog("falha em onWindowError", e);
        }
        finally {
            Br1ConsoleLog.__inside = false;
        }

        Br1ConsoleLog.scheduleAutoFlush(motivo);
    },

    /**
     * Handler do evento "unhandledrejection". Captura promises rejeitadas sem catch,
     * que não passam pelo evento "error".
     * @param {PromiseRejectionEvent} event Evento de rejeição
     */
    onUnhandledRejection: function (event) {
        if (!Br1ConsoleLog.capturing) return;
        if (!Br1ConsoleLog.options.captureRejections) return;
        if (Br1ConsoleLog.__inside) return;

        try {
            Br1ConsoleLog.__inside = true;

            let razao = event.reason;
            let mensagem;
            let pilha = null;

            if (razao === null || razao === undefined)
                mensagem = "Promise rejeitada sem motivo informado";
            else if (typeof razao === "string")
                mensagem = razao;
            else if (typeof razao.message === "string") {
                mensagem = (razao.name ? razao.name + ": " : "") + razao.message;
                if (typeof razao.stack === "string")
                    pilha = razao.stack;
            }
            else
                mensagem = Br1ConsoleLog.stringify(Br1ConsoleLog.serialize(razao));

            Br1ConsoleLog.__push({
                level: "rejection",
                src: "unhandledrejection",
                msg: "Promise não tratada: " + Br1ConsoleLog.redactText(mensagem),
                stack: pilha == null ? null : Br1ConsoleLog.redactText(pilha)
            });
        }
        catch (e) {
            Br1ConsoleLog.__internalLog("falha em onUnhandledRejection", e);
        }
        finally {
            Br1ConsoleLog.__inside = false;
        }

        Br1ConsoleLog.scheduleAutoFlush("rejection");
    },

    /**
     * Marca que a página está sendo descarregada e envia por sendBeacon o que restou.
     */
    onPageHide: function () {
        Br1ConsoleLog.unloading = true;
        Br1ConsoleLog.__cancelAutoFlush();

        if (Br1ConsoleLog.options.flushOnUnload)
            Br1ConsoleLog.flushSync("unload");
    },

    /**
     * No iOS o pagehide nem sempre dispara; a mudança de visibilidade é mais confiável.
     */
    onVisibilityChange: function () {
        if (document.visibilityState === "hidden" && Br1ConsoleLog.options.flushOnUnload)
            Br1ConsoleLog.flushSync("unload");
    },

    /**
     * Atalho de teclado que envia o diagnóstico manualmente.
     * @param {KeyboardEvent} event Evento de teclado
     */
    onKeyDown: function (event) {
        if (!Br1ConsoleLog.options.enableShortcut) return;

        let sc = Br1ConsoleLog.options.shortcut;
        if (sc == null) return;

        if (event.ctrlKey !== !!sc.ctrl) return;
        if (event.altKey !== !!sc.alt) return;
        if (event.shiftKey !== !!sc.shift) return;
        if (event.metaKey !== !!sc.meta) return;

        let tecla = event.key == null ? "" : String(event.key);
        if (tecla.toUpperCase() !== String(sc.key).toUpperCase()) return;

        event.preventDefault();
        Br1ConsoleLog.sendDiagnostic();
    },

    // ---------------------------------------------------------------------------
    // Entrada de dados no buffer
    // ---------------------------------------------------------------------------

    /**
     * Controle de vazão: impede que um log dentro de um laço encha o buffer.
     * @returns {boolean} Verdadeiro se a entrada pode ser aceita
     */
    __allowByRate: function () {
        let agora = Br1ConsoleLog.__now();

        if (agora - Br1ConsoleLog.__rateStart > 1000) {
            Br1ConsoleLog.__rateStart = agora;
            Br1ConsoleLog.__rateCount = 0;
        }

        Br1ConsoleLog.__rateCount++;
        return Br1ConsoleLog.__rateCount <= Br1ConsoleLog.options.maxEntriesPerSecond;
    },

    /**
     * Corta um texto no tamanho máximo configurado.
     * @param {string} texto Texto a ser cortado
     * @returns {string} Texto dentro do limite
     */
    __truncate: function (texto) {
        if (texto == null) return texto;

        let limite = Br1ConsoleLog.options.maxEntryLength;
        let str = String(texto);

        if (str.length <= limite) return str;

        Br1ConsoleLog.counters.truncated++;
        return str.substring(0, limite) + "… [+" + (str.length - limite) + " caracteres]";
    },

    /**
     * @returns {Object} Última entrada do buffer, ou null
     */
    __lastEntry: function () {
        if (Br1ConsoleLog.buffer.length === 0) return null;
        return Br1ConsoleLog.buffer[Br1ConsoleLog.buffer.length - 1];
    },

    /**
     * Insere uma entrada no buffer, aplicando limite de vazão, truncamento,
     * agrupamento de repetições e o limite de tamanho do buffer.
     * @param {Object} entry Entrada a ser inserida
     */
    __push: function (entry) {
        if (!Br1ConsoleLog.capturing) return;

        try {
            let opt = Br1ConsoleLog.options;

            if (opt.ignorePattern != null && entry.msg != null) {
                opt.ignorePattern.lastIndex = 0;
                if (opt.ignorePattern.test(entry.msg))
                    return;
            }

            if (!Br1ConsoleLog.__allowByRate()) {
                Br1ConsoleLog.counters.dropped++;
                return;
            }

            entry.i = ++Br1ConsoleLog.counters.captured;
            entry.t = new Date().toISOString();
            entry.ms = Math.round(Br1ConsoleLog.__now() - Br1ConsoleLog.__installedAt);
            entry.n = 1;

            if (entry.msg == null) entry.msg = "";
            entry.msg = Br1ConsoleLog.__truncate(entry.msg);

            if (entry.stack != null)
                entry.stack = Br1ConsoleLog.__truncate(entry.stack);

            if (Br1ConsoleLog.onCapture != null) {
                let alterada = Br1ConsoleLog.onCapture(entry);
                if (alterada === false) return;
                if (alterada != null && typeof alterada === "object") entry = alterada;
            }

            // Entradas idênticas e consecutivas viram uma só, com contador
            let ultima = Br1ConsoleLog.__lastEntry();
            if (ultima != null && ultima.level === entry.level && ultima.msg === entry.msg
                && (entry.ms - ultima.ms) < opt.dedupWindow) {
                ultima.n++;
                ultima.tLast = entry.t;
                return;
            }

            Br1ConsoleLog.buffer.push(entry);

            while (Br1ConsoleLog.buffer.length > opt.bufferSize) {
                Br1ConsoleLog.buffer.shift();
                Br1ConsoleLog.counters.dropped++;
            }
        }
        catch (e) {
            Br1ConsoleLog.__internalLog("falha em __push", e);
        }
    },

    /**
     * Insere uma entrada já montada pelo host.
     * @param {Object} entry Entrada com level, src e msg
     */
    capture: function (entry) {
        if (entry == null) return;

        Br1ConsoleLog.__push({
            level: entry.level || "mark",
            src: entry.src || "manual",
            msg: Br1ConsoleLog.redactText(String(entry.msg == null ? "" : entry.msg)),
            args: entry.args == null ? undefined : Br1ConsoleLog.serialize(entry.args),
            stack: entry.stack == null ? null : Br1ConsoleLog.redactText(String(entry.stack))
        });
    },

    /**
     * Adiciona uma marcação ao rastro, sem escrever no console. É a forma indicada de
     * anotar o andamento de um fluxo ("iniciando getPaymentToken").
     * @param {string} label Descrição da marcação
     * @param {*} data Dados adicionais, opcionais
     */
    mark: function (label, data) {
        let entrada = { level: "mark", src: "manual", msg: Br1ConsoleLog.redactText(String(label)) };

        if (data !== undefined)
            entrada.args = [Br1ConsoleLog.serialize(data)];

        Br1ConsoleLog.__push(entrada);
    },

    /**
     * Grava no rastro sem escrever no console do navegador.
     * @param {...*} args Argumentos, como em console.log
     */
    log: function () {
        Br1ConsoleLog.captureConsoleArgs("log", arguments);
    },

    /**
     * Grava um aviso no rastro sem escrever no console do navegador.
     * @param {...*} args Argumentos, como em console.warn
     */
    warn: function () {
        Br1ConsoleLog.captureConsoleArgs("warn", arguments);
    },

    /**
     * Grava um erro no rastro sem escrever no console do navegador.
     * @param {...*} args Argumentos, como em console.error
     */
    error: function () {
        Br1ConsoleLog.captureConsoleArgs("error", arguments);
        Br1ConsoleLog.scheduleAutoFlush("error");
    },

    /**
     * Substitui os dados de contexto enviados em cada lote.
     * @param {Object} obj Novo contexto
     */
    setContext: function (obj) {
        Br1ConsoleLog.options.context = obj == null ? {} : obj;
    },

    /**
     * Adiciona um dado ao contexto enviado em cada lote.
     * @param {string} chave Nome do dado
     * @param {*} valor Valor do dado
     */
    addContext: function (chave, valor) {
        if (Br1ConsoleLog.options.context == null)
            Br1ConsoleLog.options.context = {};

        Br1ConsoleLog.options.context[chave] = valor;
    },

    /**
     * @returns {Object[]} Cópia cronológica das entradas em memória
     */
    getEntries: function () {
        return Br1ConsoleLog.buffer.slice();
    },

    /**
     * @returns {Object} Contadores de captura, descarte, truncamento e envio
     */
    getCounters: function () {
        return Br1ConsoleLog.__clone(Br1ConsoleLog.counters);
    },

    /** Esvazia o buffer. */
    clear: function () {
        Br1ConsoleLog.buffer = [];
    },

    // ---------------------------------------------------------------------------
    // Montagem e envio do lote
    // ---------------------------------------------------------------------------

    /**
     * Monta o objeto que seria enviado ao servidor. Útil para testes e para quem
     * implementa o hook onBeforeSend.
     * @param {string} reason Motivo do envio
     * @returns {Object} Payload completo
     */
    buildPayload: function (reason) {
        let opt = Br1ConsoleLog.options;
        let naoEnviadas = [];

        for (let i = 0; i < Br1ConsoleLog.buffer.length; i++)
            if (Br1ConsoleLog.buffer[i].i > Br1ConsoleLog.__lastSentI)
                naoEnviadas.push(Br1ConsoleLog.buffer[i]);

        let truncado = false;

        // Se o lote passar do limite, descarta as entradas MAIS ANTIGAS: as que
        // interessam são as próximas do erro.
        while (naoEnviadas.length > 1
            && Br1ConsoleLog.stringify(naoEnviadas).length > opt.maxPayloadLength) {
            naoEnviadas.shift();
            truncado = true;
        }

        let payload = {
            schemaVersion: Br1ConsoleLog.SCHEMA_VERSION,
            traceId: Br1ConsoleLog.__traceId,
            shortCode: Br1ConsoleLog.getShortCode(),
            seq: Br1ConsoleLog.__seq + 1,
            reason: reason || "api",
            sentAt: new Date().toISOString(),
            app: opt.app,
            contexto: opt.contexto,
            helperVersion: Br1ConsoleLog.VERSAO,
            counters: Br1ConsoleLog.getCounters(),
            payloadTruncated: truncado,
            entries: naoEnviadas
        };

        if (!Br1ConsoleLog.isNullOrEmpty(opt.token))
            payload.token = opt.token;

        if (opt.context != null)
            payload.context = opt.context;

        if (typeof document !== "undefined")
            payload.page = {
                url: Br1ConsoleLog.redactText(String(location.href)),
                referrer: document.referrer || "",
                title: document.title || ""
            };

        if (opt.includeClientInfo && typeof navigator !== "undefined")
            payload.client = {
                userAgent: navigator.userAgent || "",
                language: navigator.language || "",
                platform: navigator.platform || "",
                viewport: (window.innerWidth || 0) + "x" + (window.innerHeight || 0),
                screen: typeof screen !== "undefined" ? screen.width + "x" + screen.height : "",
                devicePixelRatio: window.devicePixelRatio || 1,
                online: navigator.onLine !== false,
                timezoneOffset: new Date().getTimezoneOffset(),
                cookieEnabled: navigator.cookieEnabled !== false
            };

        return payload;
    },

    /**
     * Agenda um envio automático, respeitando o disjuntor e o intervalo mínimo. O
     * atraso agrupa uma rajada (uma exceção seguida de três console.error) em um
     * único lote.
     * @param {string} reason Motivo do envio
     */
    scheduleAutoFlush: function (reason) {
        if (!Br1ConsoleLog.sending) return;
        if (Br1ConsoleLog.unloading) return;
        if (Br1ConsoleLog.__flushTimer != null) return;

        let opt = Br1ConsoleLog.options;

        if (Br1ConsoleLog.__autoFlushes >= opt.maxAutoFlushes) {
            Br1ConsoleLog.__internalLog("limite de envios automáticos atingido");
            return;
        }

        if (Br1ConsoleLog.__failuresInARow >= 2) {
            Br1ConsoleLog.__internalLog("envios automáticos desligados após falhas consecutivas");
            return;
        }

        let desdeUltimo = Br1ConsoleLog.__now() - Br1ConsoleLog.__lastFlushAt;
        let atraso = opt.autoFlushDelay;

        if (Br1ConsoleLog.__lastFlushAt > 0 && desdeUltimo < opt.minFlushInterval)
            atraso = opt.minFlushInterval - desdeUltimo;

        Br1ConsoleLog.__flushTimer = setTimeout(function () {
            Br1ConsoleLog.__flushTimer = null;
            Br1ConsoleLog.__autoFlushes++;
            Br1ConsoleLog.flush(reason);
        }, atraso);
    },

    /** Cancela um envio automático agendado. */
    __cancelAutoFlush: function () {
        if (Br1ConsoleLog.__flushTimer != null) {
            clearTimeout(Br1ConsoleLog.__flushTimer);
            Br1ConsoleLog.__flushTimer = null;
        }
    },

    /**
     * Envia ao servidor as entradas ainda não enviadas. Nunca rejeita: em caso de
     * falha, resolve como false.
     * @param {string} reason Motivo do envio
     * @returns {Promise<boolean>} Indica se o envio foi bem sucedido
     */
    flush: function (reason) {
        if (!Br1ConsoleLog.sending)
            return Promise.resolve(false);

        if (Br1ConsoleLog.isNullOrEmpty(Br1ConsoleLog.options.endpoint)) {
            Br1ConsoleLog.__internalLog("endpoint não configurado; envio ignorado");
            return Promise.resolve(false);
        }

        if (Br1ConsoleLog.__sendingNow)
            return Promise.resolve(false);

        let payload = Br1ConsoleLog.buildPayload(reason);

        if (payload.entries.length === 0)
            return Promise.resolve(false);

        if (Br1ConsoleLog.onBeforeSend != null) {
            let alterado = Br1ConsoleLog.onBeforeSend(payload);
            if (alterado === false) return Promise.resolve(false);
            if (alterado != null && typeof alterado === "object") payload = alterado;
        }

        let corpo = Br1ConsoleLog.stringify(payload);
        let ultimoI = payload.entries[payload.entries.length - 1].i;

        Br1ConsoleLog.__sendingNow = true;
        Br1ConsoleLog.__lastFlushAt = Br1ConsoleLog.__now();

        if (Br1ConsoleLog.unloading || typeof fetch !== "function")
            return Promise.resolve(Br1ConsoleLog.__sendBeacon(corpo, ultimoI, payload));

        return Br1ConsoleLog.__sendFetch(corpo, ultimoI, payload);
    },

    /**
     * Envia de forma síncrona (sendBeacon), para uso durante o descarregamento
     * da página, quando o fetch não é garantido.
     * @param {string} reason Motivo do envio
     * @returns {boolean} Indica se o navegador aceitou o envio
     */
    flushSync: function (reason) {
        if (!Br1ConsoleLog.sending) return false;
        if (Br1ConsoleLog.isNullOrEmpty(Br1ConsoleLog.options.endpoint)) return false;

        let payload = Br1ConsoleLog.buildPayload(reason || "unload");
        if (payload.entries.length === 0) return false;

        let corpo = Br1ConsoleLog.stringify(payload);
        let ultimoI = payload.entries[payload.entries.length - 1].i;

        return Br1ConsoleLog.__sendBeacon(corpo, ultimoI, payload);
    },

    /**
     * Envia por fetch. Usa keepalive para sobreviver a uma navegação iniciada logo
     * após o erro, exceto quando o corpo passa da cota de keepalive do navegador.
     * @param {string} corpo Corpo JSON
     * @param {number} ultimoI Maior "i" contido no lote
     * @param {Object} payload Payload enviado
     * @returns {Promise<boolean>} Resultado do envio
     */
    __sendFetch: function (corpo, ultimoI, payload) {
        let opts = {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: corpo,
            credentials: Br1ConsoleLog.options.credentials
        };

        if (corpo.length <= Br1ConsoleLog.LIMITE_KEEPALIVE)
            opts.keepalive = true;

        return fetch(Br1ConsoleLog.options.endpoint, opts)
            .then(function (response) {
                return response.text().then(function (texto) {
                    return { ok: response.ok, texto: texto };
                });
            })
            .then(function (resposta) {
                if (!resposta.ok) {
                    Br1ConsoleLog.__onSendFailure("HTTP " + resposta.texto, payload);
                    return false;
                }
                return Br1ConsoleLog.__onSendSuccess(resposta.texto, ultimoI, payload);
            })
            .catch(function (erro) {
                Br1ConsoleLog.__onSendFailure(erro, payload);
                return false;
            });
    },

    /**
     * Envia por navigator.sendBeacon.
     * @param {string} corpo Corpo JSON
     * @param {number} ultimoI Maior "i" contido no lote
     * @param {Object} payload Payload enviado
     * @returns {boolean} Indica se o navegador aceitou o envio
     */
    __sendBeacon: function (corpo, ultimoI, payload) {
        let enviado = false;

        try {
            if (typeof navigator !== "undefined" && typeof navigator.sendBeacon === "function") {
                let blob = new Blob([corpo], { type: "application/json" });
                enviado = navigator.sendBeacon(Br1ConsoleLog.options.endpoint, blob);
            }
        }
        catch (e) {
            Br1ConsoleLog.__internalLog("falha no sendBeacon", e);
        }

        Br1ConsoleLog.__sendingNow = false;

        if (enviado) {
            // Não há resposta para conferir: considera-se entregue.
            Br1ConsoleLog.__lastSentI = ultimoI;
            Br1ConsoleLog.__seq++;
            Br1ConsoleLog.counters.flushes++;
            Br1ConsoleLog.__discardSent();
        }
        else if (!Br1ConsoleLog.unloading) {
            Br1ConsoleLog.__sendXhr(corpo, ultimoI, payload);
        }

        return enviado;
    },

    /**
     * Último recurso: XMLHttpRequest assíncrono, para navegadores sem fetch nem beacon.
     * @param {string} corpo Corpo JSON
     * @param {number} ultimoI Maior "i" contido no lote
     * @param {Object} payload Payload enviado
     */
    __sendXhr: function (corpo, ultimoI, payload) {
        try {
            let xhr = new XMLHttpRequest();
            xhr.open("POST", Br1ConsoleLog.options.endpoint, true);
            xhr.setRequestHeader("Content-Type", "application/json");

            xhr.onload = function () {
                if (xhr.status >= 200 && xhr.status < 300)
                    Br1ConsoleLog.__onSendSuccess(xhr.responseText, ultimoI, payload);
                else
                    Br1ConsoleLog.__onSendFailure("HTTP " + xhr.status, payload);
            };

            xhr.onerror = function () {
                Br1ConsoleLog.__onSendFailure("falha de rede", payload);
            };

            xhr.send(corpo);
        }
        catch (e) {
            Br1ConsoleLog.__onSendFailure(e, payload);
        }
    },

    /**
     * Trata a resposta de um envio bem sucedido.
     * @param {string} texto Corpo da resposta
     * @param {number} ultimoI Maior "i" contido no lote
     * @param {Object} payload Payload enviado
     * @returns {boolean} Verdadeiro se o servidor aceitou o lote
     */
    __onSendSuccess: function (texto, ultimoI, payload) {
        Br1ConsoleLog.__sendingNow = false;

        let resultado = null;

        try { resultado = JSON.parse(texto); }
        catch (e) {
            // Tolera um corpo não-JSON curto (compatível com endpoints que só ecoam um id)
            if (texto != null && texto.length <= 200)
                resultado = { success: true, id: String(texto).trim() };
            else {
                Br1ConsoleLog.__onSendFailure("resposta inesperada: "
                    + String(texto).substring(0, 200), payload);
                return false;
            }
        }

        if (resultado != null && resultado.success === false) {
            Br1ConsoleLog.__internalLog("lote recusado pelo servidor: " + resultado.motivo);
            Br1ConsoleLog.counters.failures++;

            if (resultado.parar === true)
                Br1ConsoleLog.__stopPermanently("servidor pediu para parar (" + resultado.motivo + ")");

            if (Br1ConsoleLog.onAfterSend != null)
                Br1ConsoleLog.onAfterSend(false, resultado, payload);

            return false;
        }

        Br1ConsoleLog.__lastSentI = ultimoI;
        Br1ConsoleLog.__seq++;
        Br1ConsoleLog.__failuresInARow = 0;
        Br1ConsoleLog.counters.flushes++;
        Br1ConsoleLog.__discardSent();

        Br1ConsoleLog.__internalLog("lote enviado (seq=" + Br1ConsoleLog.__seq + ")");

        if (resultado != null && resultado.parar === true)
            Br1ConsoleLog.__stopPermanently("servidor pediu para parar");

        if (Br1ConsoleLog.onAfterSend != null)
            Br1ConsoleLog.onAfterSend(true, resultado, payload);

        return true;
    },

    /**
     * Trata a falha de um envio. NUNCA usa console.error: isso geraria uma nova
     * entrada, que dispararia um novo envio, que falharia de novo.
     * @param {*} erro Erro ocorrido
     * @param {Object} payload Payload que falhou
     */
    __onSendFailure: function (erro, payload) {
        Br1ConsoleLog.__sendingNow = false;
        Br1ConsoleLog.__failuresInARow++;
        Br1ConsoleLog.counters.failures++;

        Br1ConsoleLog.__internalLog("falha ao enviar o lote", erro);

        if (Br1ConsoleLog.onAfterSend != null)
            Br1ConsoleLog.onAfterSend(false, null, payload);

        // Uma única nova tentativa; depois disso o disjuntor de scheduleAutoFlush assume.
        if (Br1ConsoleLog.__failuresInARow === 1 && !Br1ConsoleLog.unloading)
            setTimeout(function () { Br1ConsoleLog.flush("retry"); }, 2000);
    },

    /** Remove do buffer as entradas já confirmadas pelo servidor. */
    __discardSent: function () {
        if (!Br1ConsoleLog.options.clearOnFlush) return;

        let restantes = [];

        for (let i = 0; i < Br1ConsoleLog.buffer.length; i++)
            if (Br1ConsoleLog.buffer[i].i > Br1ConsoleLog.__lastSentI)
                restantes.push(Br1ConsoleLog.buffer[i]);

        Br1ConsoleLog.buffer = restantes;
    },

    /**
     * Encerra definitivamente a captura e o envio nesta página.
     * @param {string} motivo Motivo do encerramento
     */
    __stopPermanently: function (motivo) {
        Br1ConsoleLog.__internalLog("encerrando: " + motivo);
        Br1ConsoleLog.capturing = false;
        Br1ConsoleLog.sending = false;
        Br1ConsoleLog.__cancelAutoFlush();
        Br1ConsoleLog.clear();
    },

    // ---------------------------------------------------------------------------
    // Envio manual
    // ---------------------------------------------------------------------------

    /**
     * Ação voltada ao usuário: envia o rastro e mostra o código para ele informar ao
     * suporte. É o que o atalho de teclado e o link "Enviar diagnóstico" chamam.
     * @returns {Promise<boolean>} Indica se o envio foi bem sucedido
     */
    sendDiagnostic: function () {
        Br1ConsoleLog.mark("Diagnóstico solicitado pelo usuário");
        Br1ConsoleLog.__cancelAutoFlush();

        let codigo = Br1ConsoleLog.getShortCode();

        return Br1ConsoleLog.flush("manual").then(function (ok) {
            if (Br1ConsoleLog.options.showFeedback)
                Br1ConsoleLog.__showFeedback(ok, codigo, "manual");
            return ok;
        });
    },

    /**
     * Mostra o aviso de confirmação. Só é usado em envios manuais: um envio automático
     * precisa ser silencioso, porque um cliente no meio do pagamento não pode ver um
     * aviso de diagnóstico — pareceria uma segunda falha.
     * @param {boolean} ok Indica se o envio funcionou
     * @param {string} codigo Código curto da sessão
     * @param {string} motivo Motivo do envio
     */
    __showFeedback: function (ok, codigo, motivo) {
        let texto = ok
            ? String(Br1ConsoleLog.options.feedbackText).replace("{codigo}", codigo)
            : Br1ConsoleLog.options.feedbackErrorText;

        if (Br1ConsoleLog.onFeedback != null) {
            try {
                if (Br1ConsoleLog.onFeedback(texto, codigo, motivo) === true)
                    return;
            }
            catch (e) {
                Br1ConsoleLog.__internalLog("falha no onFeedback", e);
            }
        }

        try {
            let div = document.createElement("div");
            div.setAttribute("role", "status");
            div.style.cssText = "position:fixed;left:50%;bottom:24px;transform:translateX(-50%);"
                + "z-index:2147483647;max-width:90%;padding:12px 18px;border-radius:4px;"
                + "font-family:sans-serif;font-size:14px;line-height:1.4;color:#fff;"
                + "box-shadow:0 2px 8px rgba(0,0,0,.35);background:" + (ok ? "#2e7d32" : "#b71c1c");
            div.textContent = texto;

            document.body.appendChild(div);

            setTimeout(function () {
                if (div.parentNode != null)
                    div.parentNode.removeChild(div);
            }, Br1ConsoleLog.options.feedbackDuration);
        }
        catch (e) {
            Br1ConsoleLog.__internalLog("falha ao mostrar o aviso", e);
        }
    },

    // ---------------------------------------------------------------------------
    // Diagnóstico do próprio helper
    // ---------------------------------------------------------------------------

    /**
     * Registra a atividade interna usando o console ORIGINAL, para nunca reentrar na
     * própria captura. Só imprime quando a opção debug está ligada; o hook onError é
     * sempre chamado.
     * @param {string} msg Mensagem
     * @param {*} erro Erro associado, se houver
     */
    __internalLog: function (msg, erro) {
        if (Br1ConsoleLog.onError != null) {
            try { Br1ConsoleLog.onError(msg, erro); }
            catch (e) { /* ignora */ }
        }

        if (Br1ConsoleLog.options == null || !Br1ConsoleLog.options.debug) return;

        try {
            let fn = console.log;
            if (fn != null && typeof fn.__br1Original === "function")
                fn = fn.__br1Original;

            fn.call(console, "%c [CONSOLELOG] " + msg, "color: #b06000", erro || "");
        }
        catch (e) { /* ignora */ }
    }

};

// Instala a captura imediatamente, ainda sem enviar nada, para não perder os erros
// que aconteçam antes de o host chamar o init().
Br1ConsoleLog.install();
