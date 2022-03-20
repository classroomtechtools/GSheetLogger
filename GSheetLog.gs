(function (__global__) {
  /**
   * Keep a log:
   *   - On a spreadsheet, with attributes of each row as attributes
   *   - Sorted by most recent activity on top
   *   - Automatically adds timestamp attribute
   *   - Buffers changes until write is called
   *   - Provides context manager to ensure writes even on errors
   */
  __global__.GSLog = class {

    constructor ({id, ss, sheetName}={}) {
      Enforce.named(arguments, {id: 'string', ss: 'object', sheetName: '!string'});
      if (id == null && ss == null) throw new TypeError("Must pass either id as string or ss SpreadSheetObj");
      this.sheetName = sheetName;
      this.cache = {
        id: id,
        ss: ss,
        sheet: null
      };
      this.jsons = [];
      this.defaultHeaders = ['timestamp', 'level', 'message'];
      this.mark_text = '######';
    }

    buffer (json) {
      Enforce.positional(arguments, {json: '!object'});
      // Add timestamp:
      json.timestamp = new Date();
      if (json.level == null) json.level = 'INFO';
      // sorted by most recent activity on top
      this.jsons.push(json);
    } 

    mark (txt='###') {
      this.mark_text = txt;
    }

    error (json) {
      json.level = "ERROR";
      this.buffer(json);
    }

    warning (json) {
      json.level = 'WARN';
      this.buffer(json);
    }

    /**
     * Read in existing data, convert the rows to jsons, add to bottom of existing log,
     * and then overwrite the sheet completely
     */
    write (...headers) {
      if (this.jsons.length === 0) {
        // nothing to output, so let's make that explicit
        this.buffer({ message: "Nothing to output, array of length 0 received" });
      }
      const rows = this.getDataRangeValues();
      const jsonsToAppend = dottie.rowsToJsons(rows);

      // reverse order, append old jsons to new ones
      this.jsons.reverse();
      Array.prototype.push.apply(this.jsons, jsonsToAppend);

      // sort by timetamp
      headers.unshift(...this.defaultHeaders);
      const replaceRows = dottie.jsonsToRows(this.jsons, headers);

      // columns we have
      const total_columns = Math.max(...replaceRows.map(columns => columns.length));
      if (this.mark_text != null) {
        // put text in every cell in the first row
        const row = Array.apply(null, {length: total_columns}).map(() => this.mark_text);
        replaceRows.splice(1, 0, row);
      }
      this.sheet.getRange(1, 1, replaceRows.length, total_columns)
          .setValues(replaceRows);
      // reset
      this.jsons = [];
    }

    getDataRangeValues () {
      return this.sheet.getDataRange().getValues();
    }

    get ss () {
      // only open once
      if (this.cache.ss == null) {
        if (this.cache.id != null) {
          // make sure the imported code doesn't change the importer's manifest permissions
          this.cache.ss = __global__['Spreadsheet' + 'App'].openById(this.cache.id);
        } else {
          throw new TypeError("Either ss or id must be defined")
        }
      }
      return this.cache.ss;
    }

    get sheet () {
      // only get the sheet once
      if (this.cache.sheet == null) {
        this.cache.sheet = this.ss.getSheetByName(this.sheetName);
        if (this.cache.sheet == null) {
          // we have to create it
          this.cache.sheet = this.ss.insertSheet(this.sheetName);
        }
      }
      return this.cache.sheet;
    }

    output (body, ...params) {
      if (typeof body !== 'function') {
        this.buffer(body);  // hopefully it's an object!
        this.write(...params);
      } else {
        const context = ContextManager.create();
        const self = this;
        context.head = function () {
          // re-bind methods in case programmer wants to use this for context
          this.info = self.buffer.bind(self);
          this.error = self.error.bind(self);
          this.warning = self.warning.bind(self);
        };

        context.body = body;

        context.error = function (err) {
          console.log(err.stack);  // make sure the programmer can see it in the execution log too!
          self.buffer({unexpectedError: {message: err.toString(), stack: err.stack}});
          return null; // silence the error
        };

        if (params.length == 0 || (params.length > 0 && params[0] !== false)) {
          context.tail = function () {
            self.write(...params);
          };
        }

        // object will be sent to the the body
        return context.execute({
          info: self.buffer.bind(self),
          error: self.error.bind(self),
          warning: self.warning.bind(self)
        });
      }
    }
  }
})(this);
