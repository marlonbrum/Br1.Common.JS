class Br1CsvReader {

    constructor() {
        this.fieldDelimiter = ";";
        this.quotedChar = "\"";

        this.headers = [];
        this.currentLine = [];        
        this.headersComp = [];
    }

    textBeforeDelimiter(str, startPos, delimiter)
    {
        let endPos = str.indexOf(delimiter, startPos);
        let retorno = {
            tokenText: "",
            nextPostion: 0
        };
        if (endPos >= 0)
        {
            retorno.tokenText = str.substring(startPos, endPos);
            retorno.nextPostion = endPos + 1;
        }
        else
        {
            retorno.tokenText = str.substring(startPos);
            retorno.nextPostion = str.length;
        }

        return retorno;
    }

    getLine(str, startPos)
    {
        let endPos = str.indexOf('\n');
        if (endPos >=0 && str.substr(endPos -1, 1) == "\r") // Quebra estilo windos \r\n
            return str.substring(startPos, endPos - 2);
        else if (endPos >=0) // Quebra estilo unix \n
            return str.substring(startPos, endPos - 1);
        else // última linha
            return str.substring(startPos);        
    }

    splitFields(line) 
    {
        let i=0; 

        let fields = [];
        let delimiter = "";
        let startPos = 0;
        
        while (i < line.length)
        {               

            if (line[i] == this.quotedChar)
            {
                delimiter = this.quotedChar;
                startPos = i + 1;
            }
            else
            {
                delimiter = this.fieldDelimiter;
                startPos = i;
            }

            
            let ret = this.textBeforeDelimiter(line, startPos, delimiter);
            fields.push(ret.tokenText);
            i = ret.nextPostion;
            if (line[i] == this.fieldDelimiter)
                i++;
        }

        return fields;
    }

    /**
     * Loads the header by splitting the provided line into fields.
     *
     * @param {string} line - The line to be split into fields.
     */
    loadHeader(line) {
        this.headers = this.splitFields(line);
        this.headersComp = this.headers.map(t => t.toUpperCase().trim());
    }

    loadLine(line) {
        this.currentLine = this.splitFields(line);
    }
    
    getField(fieldName) {
        for (let i=0; i < this.headers.length; i++)
            if (this.headersComp[i] == fieldName.toUpperCase().trim())
                return this.currentLine[i];

        return null;
    }

}