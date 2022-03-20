/**
 * Handles initialization and uses sensible defaults
 * To use:
 *    const logger = SSLogger.init('adkfsjd', 'Name');
 *    logger.with(function (log) {
 *         log.add({data: 'data',  info: 'info'});
 *    });
 */
function init (id_or_ss, sheetName) {
  if (typeof id_or_ss == 'string')
    return new GSLog({id: id_or_ss, sheetName});
  return new GSLog({ss: id_or_ss, sheetName});
}

/**
 * Just returns the class, so default settings can be overwritten
 */
function module () {
  return { GSLog };
}
