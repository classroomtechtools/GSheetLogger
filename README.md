# GSheetLogger

Convert a simple tab in a Google spreadsheet into a logger.

![Alt text](/logger_example.png "Optional Title")


## Getting Started

Script ID: `1hCOnmzCWmR_kAl9P_naUEhHi1-eNtvfuD0E0WQJPnaA-wBOe5v7irGCM`

Initialize by either passing it the existing Spreadsheet object, or id:

```js
const ss = SpreadsheetApp.openById('...');
const logger = GSheetLogger.init(ss, 'TabName');
// or
const logger = GSheetLogger.init('...id...', 'TabName')
```

(If a tab of that name does not exist, it is created.)

You can use it manually:

```js
logger.buffer({ level: "INFO", message: "Just telling you." });
logger.buffer({ level: "ERROR", message: "Oh no!" });
// ... 
logger.write();
```

The `.buffer` method adds to queue to be written when `.write` is finally called. But note that if some error happens before calling write, the log will not be output.

If you want it to immediately output:

```js
logger.output({ level: "INFO", message: "Just telling you." });
```

But a lot of those direct output statements will bog down the execution time. While we're at it, do we have to write the level out each time? Enter this more powerful and convenient approach. Instead of passing `.output` an object, pass it a function instead:

```js
logger.output(log => {
  log.info({ message: 'Just telling you something', extra: 1234 });
  log.warning({ message: 'Take note!', extra: 5442 });
  log.error({ message: 'OH NO', extra: 336 });
  
  throw new Error("An unexpected error!");
});
```

Less typing! And check out how that runtime error! It ALSO gets logged to the spreadsheet. (Oh, and the script keeps executing, how sweet eh?)

## Features

1. The jsons you pass to be output can be nested objects.
1. Includes default headers of "timestamp", "level" and "message". Any other properties will become headers
1. Automatically marks each write with #### in each cell to indicate a new run
2. Even if you change or add properties you send it, the headers update and track across executions.
3. If you want a "----" mark to signify a write, just call `logger.mark('----')`
4. You can define the priority headers that appear first. When calling `.write`, or `.output`, just include them:
```js
// ...
logger.write('third', 'fourth');
// or
logger.output( /* */, 'third', 'fourth' );
```

(Note that "timestamp" and "level" will always be first and second.)
